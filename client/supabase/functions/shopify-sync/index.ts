import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SHOPIFY_API_VERSION = "2026-07";
const SHOPIFY_PAGE_SIZE = 250;
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "House of Shirts <onboarding@resend.dev>";

interface ShopifyImage {
  src?: string | null;
}

interface ShopifyVariant {
  price?: string | null;
  compare_at_price?: string | null;
  inventory_quantity?: number | null;
  [key: string]: unknown;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html?: string | null;
  handle: string;
  vendor?: string | null;
  product_type?: string | null;
  status?: string | null;
  tags?: string | null;
  image?: ShopifyImage | null;
  images?: ShopifyImage[] | null;
  options?: unknown[] | null;
  variants?: ShopifyVariant[] | null;
  updated_at?: string | null;
}

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  default_address?: {
    address1?: string | null;
    city?: string | null;
    country?: string | null;
  };
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  total_price: string;
  financial_status: string;
  fulfillment_status: string;
  created_at: string;
  email: string;
  customer?: ShopifyCustomer | null;
  shipping_address?: any;
  line_items?: {
    id?: number | null;
    product_id?: number | null;
    variant_id?: number | null;
    title?: string | null;
    name?: string | null;
    variant_title?: string | null;
    sku?: string | null;
    quantity?: number;
    price?: string | null;
  }[];
  subtotal_price?: string | null;
  total_shipping_price_set?: { shop_money?: { amount?: string | null } } | null;
  shipping_lines?: { price?: string | null; title?: string | null }[];
  tags?: string | null;
  note?: string | null;
  payment_gateway_names?: string[] | null;
  phone?: string | null;
  billing_address?: any;
}

interface ShopifyProductsResponse {
  products?: ShopifyProduct[];
}

interface ShopifyCustomersResponse {
  customers?: ShopifyCustomer[];
}

interface ShopifyOrdersResponse {
  orders?: ShopifyOrder[];
}


const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const getEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const toNumber = (value: string | null | undefined) => {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAppOrderIdFromShopifyOrder = (order: ShopifyOrder) => {
  const note = String(order.note ?? "");
  const match = note.match(/App order\s+([A-Z]+-\d+)/i);
  return match?.[1] ?? null;
};

const isAppMirroredShopifyOrder = (order: ShopifyOrder) =>
  Boolean(getAppOrderIdFromShopifyOrder(order)) ||
  String(order.tags ?? "").toLowerCase().includes("app-order") ||
  String(order.note ?? "").toLowerCase().includes("app order");

const getPrimaryImageUrl = (product: ShopifyProduct) =>
  product.image?.src ?? product.images?.[0]?.src ?? null;

const getRequestPath = (req: Request) => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  if (segments.includes("run")) return "run";
  return segments.at(-1) ?? "";
};

const fetchAllProducts = async (
  storeDomain: string,
  accessToken: string,
): Promise<ShopifyProduct[]> => {
  const products: ShopifyProduct[] = [];
  let sinceId: number | undefined;

  while (true) {
    const shopifyUrl = new URL(
      `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
    );
    shopifyUrl.searchParams.set("limit", String(SHOPIFY_PAGE_SIZE));
    shopifyUrl.searchParams.set("status", "active");

    if (sinceId !== undefined) {
      shopifyUrl.searchParams.set("since_id", String(sinceId));
    }

    const response = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Shopify API error (products) (${response.status}): ${body || response.statusText}`,
      );
    }

    const data = (await response.json()) as ShopifyProductsResponse;
    const batch = Array.isArray(data.products) ? data.products : [];

    if (batch.length === 0) {
      break;
    }

    products.push(...batch);

    if (batch.length < SHOPIFY_PAGE_SIZE) {
      break;
    }

    sinceId = batch[batch.length - 1].id;
  }

  return products;
};

const fetchAllCustomers = async (
  storeDomain: string,
  accessToken: string,
): Promise<ShopifyCustomer[]> => {
  const customers: ShopifyCustomer[] = [];
  let sinceId: number | undefined;

  while (true) {
    const shopifyUrl = new URL(
      `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/customers.json`,
    );
    shopifyUrl.searchParams.set("limit", String(SHOPIFY_PAGE_SIZE));

    if (sinceId !== undefined) {
      shopifyUrl.searchParams.set("since_id", String(sinceId));
    }

    const response = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Shopify API error (customers) (${response.status}): ${body || response.statusText}`,
      );
    }

    const data = (await response.json()) as ShopifyCustomersResponse;
    const batch = Array.isArray(data.customers) ? data.customers : [];

    if (batch.length === 0) {
      break;
    }

    customers.push(...batch);

    if (batch.length < SHOPIFY_PAGE_SIZE) {
      break;
    }

    sinceId = batch[batch.length - 1].id;
  }

  return customers;
};

const fetchAllOrders = async (
  storeDomain: string,
  accessToken: string,
): Promise<ShopifyOrder[]> => {
  const orders: ShopifyOrder[] = [];
  let sinceId: number | undefined;

  while (true) {
    const shopifyUrl = new URL(
      `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/orders.json`,
    );
    shopifyUrl.searchParams.set("limit", String(SHOPIFY_PAGE_SIZE));
    shopifyUrl.searchParams.set("status", "any"); // Fetch all orders (open, closed, cancelled)

    if (sinceId !== undefined) {
      shopifyUrl.searchParams.set("since_id", String(sinceId));
    }

    const response = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Shopify API error (orders) (${response.status}): ${body || response.statusText}`,
      );
    }

    const data = (await response.json()) as ShopifyOrdersResponse;
    const batch = Array.isArray(data.orders) ? data.orders : [];

    if (batch.length === 0) {
      break;
    }

    orders.push(...batch);

    if (batch.length < SHOPIFY_PAGE_SIZE) {
      break;
    }

    sinceId = batch[batch.length - 1].id;
  }

  return orders;
};


const dedupeProducts = (products: ShopifyProduct[]) => {
  const deduped = new Map<string, ShopifyProduct>();

  for (const product of products) {
    // Defensive guard: only ever persist products tagged active, even if a
    // caller passes in products fetched without the status=active filter.
    if (product.status && product.status !== "active") {
      continue;
    }
    deduped.set(String(product.id), product);
  }

  return Array.from(deduped.values());
};

const insertSyncLog = async (
  supabase: ReturnType<typeof createClient>,
  productsImported: number,
  customersImported: number,
  ordersImported: number,
  summary: string,
) => {
  const { error } = await supabase.from("sync_logs").insert({
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    status: "Success",
    products_imported: productsImported,
    customers_imported: customersImported,
    orders_imported: ordersImported,
    summary,
  });

  if (error) {
    console.warn("Unable to write sync log:", error.message);
  }
};

const getProductOption = (product: ShopifyProduct, optionNames: string[]) => {
  const normalizedNames = optionNames.map((name) => name.toLowerCase());
  const options = Array.isArray(product.options) ? product.options : [];

  return options.find((option: any) =>
    typeof option?.name === "string" &&
    normalizedNames.includes(option.name.toLowerCase())
  ) as { name?: string; position?: number; values?: string[] } | undefined;
};

const getVariantInventory = (variant: ShopifyVariant) => {
  const parsed = Number(variant.inventory_quantity ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isRequestedSizeAvailable = (product: ShopifyProduct, size: string) => {
  const sizeOption = getProductOption(product, [
    "size",
    "shoe size",
    "eu size",
    "us size",
    "uk size",
  ]);
  const position = Number(sizeOption?.position ?? 1);
  const variants = Array.isArray(product.variants) ? product.variants : [];

  return variants.some((variant: any) => {
    const variantSize = String(variant?.[`option${position}`] ?? "").toLowerCase();
    return variantSize === size.toLowerCase() && getVariantInventory(variant) > 0;
  });
};

const sendRestockEmail = async (
  to: string | null | undefined,
  productTitle: string,
  size: string,
) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey || !to) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject: `${productTitle} is back in stock`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
          <h1 style="font-size:24px;margin:0 0 12px;">House of Shirts</h1>
          <p style="font-size:15px;line-height:1.7;">Good news. <strong>${productTitle}</strong> in size <strong>${size}</strong> is available again.</p>
          <p style="font-size:14px;line-height:1.7;color:#555;">Open the app to secure it before it sells out again.</p>
        </div>
      `,
    }),
  });

  return response.ok;
};

const sendRestockPush = async (
  expoPushToken: string | null | undefined,
  productId: string,
  productTitle: string,
  size: string,
) => {
  if (!expoPushToken) {
    return false;
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: expoPushToken,
      sound: "default",
      title: "Back in stock",
      body: `${productTitle} in size ${size} is available again.`,
      data: {
        type: "product",
        productId,
        id: productId,
      },
    }),
  });

  return response.ok;
};

const notifyBackInStockRequests = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  products: ShopifyProduct[],
) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: requests, error } = await supabase
    .from("back_in_stock_requests")
    .select("id, user_id, product_id, product_title, size, email")
    .eq("status", "pending");

  if (error) {
    console.warn("Unable to fetch back-in-stock requests:", error.message);
    return 0;
  }

  if (!requests?.length) {
    return 0;
  }

  let notifiedCount = 0;
  const productMap = new Map(products.map((product) => [String(product.id), product]));

  for (const request of requests) {
    const product = productMap.get(String(request.product_id));
    if (!product || !isRequestedSizeAvailable(product, String(request.size))) {
      continue;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, expo_push_token")
      .eq("id", request.user_id)
      .maybeSingle();

    const productTitle = request.product_title ?? product.title;
    const productId = String(product.id);
    const size = String(request.size);

    await supabase.from("app_notifications").insert({
      user_id: request.user_id,
      title: "Back in stock",
      message: `${productTitle} in size ${size} is available again.`,
      label: "RESTOCK",
      icon: "cube-outline",
      target_type: "product",
      target_value: productId,
    });

    await Promise.allSettled([
      sendRestockPush(profile?.expo_push_token, productId, productTitle, size),
      sendRestockEmail(request.email ?? profile?.email, productTitle, size),
    ]);

    await supabase
      .from("back_in_stock_requests")
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    notifiedCount += 1;
  }

  return notifiedCount;
};


const upsertOrders = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  orders: ShopifyOrder[],
) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date().toISOString();
  const CHUNK_SIZE = 50;

  // Fetch existing profiles to link user_ids
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email");

  const profileMap = new Map(profiles?.map((p: any) => [p.email.toLowerCase(), p.id]));

  console.log(`Upserting ${orders.length} orders in chunks of ${CHUNK_SIZE}...`);

  for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
    const chunk = orders.slice(i, i + CHUNK_SIZE);
    const regularOrders: ShopifyOrder[] = [];

    for (const order of chunk) {
      const appOrderId = getAppOrderIdFromShopifyOrder(order);
      if (isAppMirroredShopifyOrder(order) && appOrderId) {
        const shopifyOrderId = String(order.id);
        const { data: existing, error: existingError } = await supabase
          .from("orders")
          .select("id, metadata")
          .eq("id", appOrderId)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) {
          const existingMetadata = existing.metadata && typeof existing.metadata === "object"
            ? existing.metadata
            : {};
          const isDelivered = order.fulfillment_status === "fulfilled";
          const shipping = toNumber(
            order.total_shipping_price_set?.shop_money?.amount ?? order.shipping_lines?.[0]?.price,
          );

          const { error: updateError } = await supabase
            .from("orders")
            .update({
              shopify_order_id: shopifyOrderId,
              status: isDelivered ? "Delivered" : "Processing",
              logistics_milestone: isDelivered ? "Delivered" : "Processing",
              updated_at: now,
              metadata: {
                ...existingMetadata,
                shopify_order_id: shopifyOrderId,
                shopify_order_name: order.name || `#${order.order_number || order.id}`,
                shopify_order_number: order.order_number,
                financial_status: order.financial_status,
                fulfillment_status: order.fulfillment_status,
                shipping,
                shipping_title: order.shipping_lines?.[0]?.title ?? existingMetadata.shipping_title ?? null,
                shipping_lines: order.shipping_lines ?? existingMetadata.shipping_lines ?? [],
              },
            })
            .eq("id", appOrderId);

          if (updateError) throw updateError;

          const { error: deleteError } = await supabase
            .from("orders")
            .delete()
            .eq("id", `shopify-${shopifyOrderId}`);

          if (deleteError) throw deleteError;
          continue;
        }
      }

      if (!isAppMirroredShopifyOrder(order)) regularOrders.push(order);
    }

    const orderRows = regularOrders.map((order) => {
      const email = order.email?.toLowerCase() || order.customer?.email?.toLowerCase();
      const userId = email ? profileMap.get(email) : null;
      const orderName = order.name || `#${order.order_number || order.id}`;
      const customerName = order.customer
        ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
        : "";
      const lineItems = Array.isArray(order.line_items)
        ? order.line_items.map((item) => ({
            id: String(item.id ?? item.variant_id ?? item.product_id ?? item.title),
            product_id: item.product_id ? String(item.product_id) : undefined,
            variant_id: item.variant_id ? String(item.variant_id) : undefined,
            name: item.title ?? item.name ?? "Shopify item",
            variant: item.variant_title ?? item.sku ?? "Default",
            quantity: Number(item.quantity ?? 1),
            price: toNumber(item.price),
          }))
        : [];
      const gateways = Array.isArray(order.payment_gateway_names)
        ? order.payment_gateway_names.filter(Boolean).join(", ")
        : "";
      const paymentMethod = gateways || order.financial_status || "Shopify";
      const shipping = toNumber(
        order.total_shipping_price_set?.shop_money?.amount ?? order.shipping_lines?.[0]?.price,
      );
      const isDelivered = order.fulfillment_status === "fulfilled";

      return {
        id: `shopify-${order.id}`,
        shopify_order_id: String(order.id),
        user_id: userId,
        email: email || null,
        customer_name: customerName || order.shipping_address?.name || order.billing_address?.name || "Guest",
        title: `Order ${orderName}`,
        subtitle: lineItems[0]?.name ?? "Shopify order",
        total: toNumber(order.total_price),
        total_amount: toNumber(order.total_price),
        order_number: orderName,
        status: isDelivered ? "Delivered" : "Processing",
        logistics_milestone: isDelivered ? "Delivered" : "Processing",
        shipping_address: order.shipping_address || order.billing_address || {},
        payment_method: paymentMethod,
        created_at: order.created_at,
        updated_at: now,
        metadata: {
          source: "shopify_sync",
          shopify_order_id: String(order.id),
          shopify_order_name: orderName,
          shopify_order_number: order.order_number,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          payment_method: paymentMethod,
          phone: order.phone || order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || "",
          subtotal: toNumber(order.subtotal_price),
          shipping,
          shipping_title: order.shipping_lines?.[0]?.title ?? null,
          shipping_lines: order.shipping_lines ?? [],
          items: lineItems,
        },
      };
    });

    if (orderRows.length > 0) {
      const { error } = await supabase
        .from("orders")
        .upsert(orderRows, { onConflict: "shopify_order_id" });

      if (error) {
        console.error(`Error upserting order chunk ${i / CHUNK_SIZE}:`, error.message);
        throw error;
      }
    }
  }

  return orders.length;
};


const upsertCustomers = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  customers: ShopifyCustomer[],
) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const CHUNK_SIZE = 100;
  const now = new Date().toISOString();

  // 1. Update existing app profiles that match a Shopify customer email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email");

  const profileMap = new Map(profiles?.map((p: any) => [p.email.toLowerCase(), p.id]));
  const profilesToUpdate = [];

  for (const customer of customers) {
    const email = customer.email?.toLowerCase();
    const profileId = email ? profileMap.get(email) : null;
    if (profileId) {
      profilesToUpdate.push({
        id: profileId,
        full_name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        phone: customer.phone || null,
        updated_at: now,
      });
    }
  }

  console.log(`Updating ${profilesToUpdate.length} app profiles...`);
  for (let i = 0; i < profilesToUpdate.length; i += CHUNK_SIZE) {
    const chunk = profilesToUpdate.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("profiles").upsert(chunk);
    if (error) console.warn(`Error updating profile chunk:`, error.message);
  }

  // 2. Upsert ALL customers to shopify_customers.
  // Omit blacklisted/blacklist_reason/blacklisted_at so existing values are never overwritten.
  const customerRows = customers
    .filter((c) => c.email)
    .map((c) => ({
      shopify_id: String(c.id),
      email: c.email.toLowerCase(),
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      phone: c.phone || null,
      city: c.default_address?.city || null,
      country: c.default_address?.country || null,
      updated_at: now,
    }));

  console.log(`Upserting ${customerRows.length} customers to shopify_customers...`);
  for (let i = 0; i < customerRows.length; i += CHUNK_SIZE) {
    const chunk = customerRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("shopify_customers")
      .upsert(chunk, { onConflict: "shopify_id" });
    if (error) console.warn(`Error upserting shopify_customers chunk:`, error.message);
  }

  return profilesToUpdate.length;
};


const upsertProducts = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  products: ShopifyProduct[],
  salesTally: Record<string, number>,
) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const dedupedProducts = dedupeProducts(products);
  const now = new Date().toISOString();
  const CHUNK_SIZE = 100;

  console.log(`Upserting ${dedupedProducts.length} products in chunks of ${CHUNK_SIZE}...`);

  for (let i = 0; i < dedupedProducts.length; i += CHUNK_SIZE) {
    const chunk = dedupedProducts.slice(i, i + CHUNK_SIZE);
    
    const currentRows = chunk.map((product) => {
      const firstVariant = product.variants?.[0];
      const rawImages = Array.isArray(product.images) ? product.images : [];
      const images = [
        product.image?.src,
        ...rawImages.map((img: any) => img?.src),
      ].filter(Boolean);
      const uniqueImages = Array.from(new Set(images));

      return {
        shopify_id: String(product.id),
        id: String(product.id), // Ensure id is also set for legacy compatibility
        title: product.title,
        description: product.body_html ?? null,
        handle: product.handle,
        vendor: product.vendor ?? null,
        product_type: product.product_type ?? null,
        status: product.status ?? null,
        image_url: getPrimaryImageUrl(product),
        images: uniqueImages,
        price: toNumber(firstVariant?.price),
        compare_at_price: toNumber(firstVariant?.compare_at_price),
        inventory_quantity: firstVariant?.inventory_quantity ?? 0,
        options: product.options ?? [],
        variants: product.variants ?? [],
        sales_count: salesTally[String(product.id)] || 0,
        metadata: {
          tags: product.tags ?? "",
          body_html: product.body_html ?? null,
          shopify_updated_at: product.updated_at ?? null,
        },
        updated_at: now,
      };
    });

    const { error } = await supabase
      .from("products")
      .upsert(currentRows, { onConflict: "id" });

    if (error) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE}:`, error.message);
      // Try with shopify_id if id fails
      const { error: error2 } = await supabase
        .from("products")
        .upsert(currentRows, { onConflict: "shopify_id" });
      
      if (error2) throw new Error(`Upsert failed for chunk starting at ${i}: ${error2.message}`);
    }
  }

  return "hybrid_chunked";
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const path = getRequestPath(req);
  if (path === "status" && req.method === "GET") {
    return jsonResponse({ 
      status: "online", 
      message: "Shopify sync service is healthy",
      syncState: { syncingInRealtime: true } 
    });
  }

  if (!["", "run", "shopify-sync"].includes(path)) {
    return jsonResponse({ error: `Not found: ${path}` }, 404);
  }

  try {
    const storeDomain = getEnv("SHOPIFY_STORE_DOMAIN");
    const accessToken = getEnv("SHOPIFY_ACCESS_TOKEN");
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    console.log(`Starting Full Shopify sync for ${storeDomain}`);

    let productsCount = 0;
    let customersCount = 0;
    let ordersCount = 0;
    let productSchemaUsed = "none";
    const logDetails: string[] = [];

    // 1. Fetch Orders and Compute Sales Tally
    let orders: ShopifyOrder[] = [];
    const salesTally: Record<string, number> = {};
    try {
      orders = await fetchAllOrders(storeDomain, accessToken);
      for (const order of orders) {
        if (order.line_items) {
          for (const item of order.line_items) {
            if (item.product_id) {
              const pid = String(item.product_id);
              salesTally[pid] = (salesTally[pid] || 0) + (item.quantity || 1);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Order fetch failed:", e.message);
      logDetails.push(`Orders fetch failed: ${e.message}`);
    }

    // 2. Sync Products
    try {
      const products = await fetchAllProducts(storeDomain, accessToken);
      productSchemaUsed = await upsertProducts(supabaseUrl, serviceRoleKey, products, salesTally);
      productsCount = products.length;
      logDetails.push(`${productsCount} products synced`);

      try {
        const notifiedCount = await notifyBackInStockRequests(
          supabaseUrl,
          serviceRoleKey,
          products,
        );
        if (notifiedCount > 0) {
          logDetails.push(`${notifiedCount} restock requests notified`);
        }
      } catch (notifyError) {
        const message =
          notifyError instanceof Error ? notifyError.message : "Unknown restock notification error";
        console.warn("Back-in-stock notification check failed:", message);
        logDetails.push(`Restock notifications failed: ${message}`);
      }
    } catch (e) {
      console.warn("Product sync failed:", e.message);
      logDetails.push(`Products failed: ${e.message}`);
    }

    // 3. Sync Customers
    try {
      const customers = await fetchAllCustomers(storeDomain, accessToken);
      customersCount = await upsertCustomers(supabaseUrl, serviceRoleKey, customers);
      logDetails.push(`${customersCount} customers updated`);
    } catch (e) {
      console.warn("Customer sync failed:", e.message);
      logDetails.push(`Customers failed: ${e.message}`);
    }

    // 4. Upsert Orders
    if (orders.length > 0) {
      try {
        ordersCount = await upsertOrders(supabaseUrl, serviceRoleKey, orders);
        logDetails.push(`${ordersCount} orders synced`);
      } catch (e) {
        console.warn("Order sync failed:", e.message);
        logDetails.push(`Orders failed: ${e.message}`);
      }
    }

    // 4. Log the result
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const summary = logDetails.join(", ");
    await insertSyncLog(
      supabase,
      productsCount,
      customersCount,
      ordersCount,
      `Sync result: ${summary}`
    );

    console.log(`Sync complete: ${summary}`);

    return jsonResponse({
      success: true,
      counts: {
        products: productsCount,
        customers: customersCount,
        orders: ordersCount,
      },
      productSchemaUsed,
      message: `Sync finished. ${summary}. Check sync logs for details.`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    console.error("Shopify sync failed:", message);
    return jsonResponse({ error: message }, 400);
  }
});
