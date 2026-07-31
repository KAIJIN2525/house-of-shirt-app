const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  id?: string;
  productId?: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface ShippingAddress {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface CreateShopifyOrderPayload {
  appOrderId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: ShippingAddress;
  lineItems: LineItem[];
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  shippingTitle?: string;
  total: number;
  paymentMethod: string;
  shippingState?: string;
}

const SHOPIFY_API_VERSION = "2026-07";

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

async function getShopifyAccessToken(shopDomain: string) {
  const staticToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN")?.trim();
  const clientId = Deno.env.get("SHOPIFY_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET")?.trim();

  if (!clientId || !clientSecret) {
    if (!staticToken) {
      throw new Error("Shopify credentials not configured");
    }

    return staticToken;
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 60_000) {
    return cachedAccessToken;
  }

  const tokenRes = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    const errMsg = tokenData.errors ? JSON.stringify(tokenData.errors) : "Shopify token creation failed";
    throw new Error(errMsg);
  }

  cachedAccessToken = String(tokenData.access_token);
  cachedAccessTokenExpiresAt = now + Number(tokenData.expires_in ?? 0) * 1000;

  return cachedAccessToken;
}


async function findShopifyCustomerId(shopDomain: string, token: string, customerEmail?: string, customerPhone?: string) {
  const queries = [
    customerEmail ? `email:${customerEmail}` : null,
    customerPhone ? `phone:${customerPhone}` : null,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    const searchUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        "X-Shopify-Access-Token": token,
      },
    });

    if (!searchRes.ok) {
      continue;
    }

    const searchData = await searchRes.json();
    const customer = Array.isArray(searchData.customers) ? searchData.customers[0] : null;
    if (customer?.id) {
      return customer.id;
    }
  }

  return null;
}
function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || "-",
  };
}

// Converts local Nigerian numbers (e.g. 08012345678) to E.164 (+2348012345678)
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return digits ? `+${digits}` : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const domain = Deno.env.get("SHOPIFY_STORE_DOMAIN")?.trim();
    if (!domain) {
      throw new Error("Shopify credentials not configured");
    }

    const shopDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const token = await getShopifyAccessToken(shopDomain);

    const body: CreateShopifyOrderPayload = await req.json();
    const {
      appOrderId,
      customerName,
      lineItems,
      paymentMethod,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingState,
    } = body;
    const shipping = Number(body.shipping ?? 0);
    const tax = Number(body.tax ?? 0);
    const discount = Number(body.discount ?? 0);

    const { firstName, lastName } = splitName(customerName);
    const shopifyLineItems = (lineItems ?? []).map((item) => {
      const variantId = String(item.variantId ?? "").replace(/\D/g, "");
      if (!variantId) {
        throw new Error(`Missing Shopify variant ID for ${item.title}`);
      }
      return {
        variant_id: Number(variantId),
        quantity: item.quantity,
        requires_shipping: true,
        taxable: tax > 0,
      };
    });

    const addressName = shippingAddress?.fullName?.trim() || customerName;
    const addressParts = splitName(addressName);
    const addressCountry = shippingAddress?.country?.trim() || "Nigeria";
    const rawPhone = shippingAddress?.phoneNumber ?? customerPhone ?? "";
    const addressPhone = rawPhone ? toE164(rawPhone) : "";
    const shopifyAddress = {
      first_name: addressParts.firstName,
      last_name: addressParts.lastName,
      address1: shippingAddress?.address ?? "",
      address2: shippingAddress?.apartment ?? "",
      city: shippingAddress?.city ?? shippingState ?? "Lagos",
      province: shippingAddress?.state ?? shippingState ?? "",
      zip: shippingAddress?.zipCode ?? "",
      country: addressCountry,
      country_code: addressCountry.toLowerCase() === "nigeria" ? "NG" : undefined,
      phone: addressPhone,
    };

    const shippingLines = shipping > 0
      ? [{
          title: body.shippingTitle || "Shipping",
          code: body.shippingTitle || "Shipping",
          price: shipping.toFixed(2),
        }]
      : [];
    const taxLines = tax > 0
      ? [{
          title: "Estimated tax",
          price: tax.toFixed(2),
          rate: 0.035,
        }]
      : [];

    const shopifyCustomerId = await findShopifyCustomerId(shopDomain, token, customerEmail, rawPhone ? toE164(rawPhone) : undefined);
    const shopifyCustomer = shopifyCustomerId
      ? { id: shopifyCustomerId }
      : customerEmail
        ? {
            first_name: firstName,
            last_name: lastName,
            email: customerEmail,
          }
        : undefined;

    const orderPayload = {
      order: {
        line_items: shopifyLineItems,
        email: customerEmail,
        ...(shopifyCustomer ? { customer: shopifyCustomer } : {}),
        shipping_address: shopifyAddress,
        billing_address: shopifyAddress,
        shipping_lines: shippingLines,
        tax_lines: taxLines,
        discount_codes: discount > 0
          ? [{ code: "APP_DISCOUNT", amount: discount.toFixed(2), type: "fixed_amount" }]
          : [],
        financial_status: "pending",
        currency: "NGN",
        note: `App order ${appOrderId} | Payment: ${paymentMethod}`,
        tags: "app-order,house-of-shirts",
        send_receipt: false,
        send_fulfillment_receipt: false,
      },
    };

    const shopifyUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/orders.json`;
    const shopifyRes = await fetch(shopifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify(orderPayload),
    });

    const shopifyData = await shopifyRes.json();

    if (!shopifyRes.ok) {
      const errMsg = shopifyData.errors ? JSON.stringify(shopifyData.errors) : "Shopify order creation failed";
      throw new Error(`${errMsg} | URL: ${shopifyUrl}`);
    }

    const shopifyOrder = shopifyData.order;

    return new Response(
      JSON.stringify({
        success: true,
        shopifyOrderId: shopifyOrder.id,
        shopifyOrderNumber: shopifyOrder.order_number,
        shopifyOrderName: shopifyOrder.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-shopify-order error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
