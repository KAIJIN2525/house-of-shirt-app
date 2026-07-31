import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SHOPIFY_API_VERSION = "2026-07";
const LATEST_ORDER_LIMIT = 50;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getEnv = (name: string) => Deno.env.get(name)?.trim() ?? "";

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase().trim() : "";

const formatError = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter(Boolean)
      .map(String);
    if (parts.length > 0) return parts.join(" | ");
    try {
      return JSON.stringify(error);
    } catch {
      return "Unserializable error object";
    }
  }
  return "Latest Shopify refresh failed";
};

const throwStageError = (stage: string, error: unknown): never => {
  throw new Error(`${stage}: ${formatError(error)}`);
};

const getShopifyToken = async () => {
  const storeDomain = getEnv("SHOPIFY_STORE_DOMAIN");
  const clientId = getEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getEnv("SHOPIFY_CLIENT_SECRET");

  if (storeDomain && clientId && clientSecret) {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.access_token) {
      return String(data.access_token);
    }

    console.warn(`Shopify token request failed (${response.status}): ${JSON.stringify(data)}; falling back to SHOPIFY_ACCESS_TOKEN if configured`);
  }

  const existingToken = getEnv("SHOPIFY_ACCESS_TOKEN");
  if (existingToken) return existingToken;

  throw new Error("Missing Shopify credentials for admin order refresh");
};

const fetchLatestShopifyOrders = async () => {
  const storeDomain = getEnv("SHOPIFY_STORE_DOMAIN");
  if (!storeDomain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");

  const accessToken = await getShopifyToken();
  const shopifyUrl = new URL(
    `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/orders.json`,
  );
  shopifyUrl.searchParams.set("limit", String(LATEST_ORDER_LIMIT));
  shopifyUrl.searchParams.set("status", "any");
  shopifyUrl.searchParams.set("order", "created_at desc");

  const response = await fetch(shopifyUrl, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify latest orders failed (${response.status}): ${body || response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data.orders) ? data.orders : [];
};

const mapLineItems = (order: any) =>
  Array.isArray(order.line_items)
    ? order.line_items.map((item: any) => ({
        id: String(item.id ?? item.variant_id ?? item.product_id ?? item.title),
        product_id: item.product_id ? String(item.product_id) : undefined,
        variant_id: item.variant_id ? String(item.variant_id) : undefined,
        name: item.title ?? item.name ?? "Shopify item",
        variant: item.variant_title ?? item.sku ?? "Default",
        quantity: Number(item.quantity ?? 1),
        price: toNumber(item.price),
      }))
    : [];

const getCustomerName = (order: any) => {
  const customerName = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return customerName || order.shipping_address?.name || order.billing_address?.name || order.email || "Shopify Customer";
};

const getPaymentMethod = (order: any) => {
  const gateways = Array.isArray(order.payment_gateway_names)
    ? order.payment_gateway_names.filter(Boolean).join(", ")
    : "";

  if (gateways) return gateways;
  if (order.financial_status === "pending") return "Payment pending";
  if (order.financial_status === "paid") return "Paid";
  return order.financial_status || "Shopify";
};

const getStatus = (order: any) => {
  if (order.cancelled_at) return "Cancelled";
  if (order.fulfillment_status === "fulfilled") return "Delivered";
  if (order.fulfillment_status === "partial") return "Shipped";
  return "Processing";
};

const getMilestone = (order: any) => {
  if (order.cancelled_at) return "Cancelled";
  if (order.fulfillment_status === "fulfilled") return "Delivered";
  if (order.fulfillment_status === "partial") return "Shipped";
  return "Processing";
};

const getShipping = (order: any) =>
  toNumber(order.total_shipping_price_set?.shop_money?.amount ?? order.shipping_lines?.[0]?.price);

const getAppOrderIdFromShopifyOrder = (order: any) => {
  const note = String(order.note ?? "");
  const match = note.match(/App order\s+([A-Z]+-\d+)/i);
  return match?.[1] ?? null;
};

const isAppMirroredShopifyOrder = (order: any) =>
  Boolean(getAppOrderIdFromShopifyOrder(order)) ||
  String(order.tags ?? "").toLowerCase().includes("app-order") ||
  String(order.note ?? "").toLowerCase().includes("app order");

const linkMirroredShopifyOrderToAppOrder = async (
  supabase: ReturnType<typeof createClient>,
  order: any,
) => {
  const appOrderId = getAppOrderIdFromShopifyOrder(order);
  const shopifyOrderId = String(order.id ?? "").trim();
  if (!appOrderId || !shopifyOrderId) return false;

  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id, metadata")
    .eq("id", appOrderId)
    .maybeSingle();

  if (existingError) throwStageError(`Link mirrored order ${appOrderId}: load existing order`, existingError);
  if (!existing) return true;

  const shipping = getShipping(order);
  const existingMetadata = existing.metadata && typeof existing.metadata === "object"
    ? existing.metadata
    : {};

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shopify_order_id: shopifyOrderId,
      status: getStatus(order),
      logistics_milestone: getMilestone(order),
      updated_at: new Date().toISOString(),
      metadata: {
        ...existingMetadata,
        shopify_order_id: shopifyOrderId,
        shopify_order_name: order.name || `#${order.order_number ?? shopifyOrderId}`,
        shopify_order_number: order.order_number ?? existingMetadata.shopify_order_number ?? null,
        financial_status: order.financial_status ?? existingMetadata.financial_status ?? null,
        fulfillment_status: order.fulfillment_status ?? existingMetadata.fulfillment_status ?? null,
        shipping,
        shipping_title: order.shipping_lines?.[0]?.title ?? existingMetadata.shipping_title ?? null,
        shipping_lines: order.shipping_lines ?? existingMetadata.shipping_lines ?? [],
      },
    })
    .eq("id", appOrderId);

  if (updateError) throwStageError(`Link mirrored order ${appOrderId}: update original order`, updateError);

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", `shopify-${shopifyOrderId}`);

  if (deleteError) throwStageError(`Link mirrored order ${appOrderId}: remove duplicate Shopify row`, deleteError);
  return true;
};

const upsertLatestShopifyOrders = async (
  supabase: ReturnType<typeof createClient>,
  orders: any[],
) => {
  if (orders.length === 0) return { syncedCount: 0, warnings: [] as string[] };

  const emails = Array.from(
    new Set(
      orders
        .map((order) => normalizeEmail(order.email || order.customer?.email))
        .filter(Boolean),
    ),
  );

  const profileMap = new Map<string, string>();
  if (emails.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", emails);

    if (profilesError) throwStageError("Load profiles for latest Shopify orders", profilesError);

    for (const profile of profiles ?? []) {
      profileMap.set(normalizeEmail(profile.email), profile.id);
    }
  }

  const { data: restrictedCustomers, error: restrictedError } = await supabase
    .from("shopify_customers")
    .select("email, phone, blacklist_reason")
    .eq("blacklisted", true);

  if (restrictedError) throwStageError("Load restricted customers for latest Shopify orders", restrictedError);

  const normalizePhone = (value: unknown) => String(value ?? "").replace(/\D/g, "");
  const restrictedByEmail = new Map(
    (restrictedCustomers ?? []).filter((customer: any) => customer.email).map((customer: any) => [normalizeEmail(customer.email), customer]),
  );
  const restrictedByPhone = new Map(
    (restrictedCustomers ?? []).filter((customer: any) => normalizePhone(customer.phone)).map((customer: any) => [normalizePhone(customer.phone), customer]),
  );
  let linkedMirrors = 0;
  const regularOrders: any[] = [];
  const warnings: string[] = [];

  for (const order of orders) {
    const orderName = order.name || `#${order.order_number ?? order.id ?? "unknown"}`;
    if (isAppMirroredShopifyOrder(order)) {
      try {
        const linked = await linkMirroredShopifyOrderToAppOrder(supabase, order);
        if (linked) {
          linkedMirrors += 1;
          continue;
        }
      } catch (error) {
        warnings.push(`${orderName}: ${formatError(error)}`);
        continue;
      }
    }

    regularOrders.push(order);
  }

  const rows = regularOrders.map((order) => {
    const shopifyOrderId = String(order.id);
    const email = normalizeEmail(order.email || order.customer?.email);
    const orderName = order.name || `#${order.order_number ?? shopifyOrderId}`;
    const shippingAddress = order.shipping_address || order.billing_address || {};
    const lineItems = mapLineItems(order);
    const paymentMethod = getPaymentMethod(order);
    const shipping = getShipping(order);    const customerPhone = order.phone || order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || "";
    const restrictedCustomer = restrictedByEmail.get(email) || restrictedByPhone.get(normalizePhone(customerPhone));

    return {
      id: `shopify-${shopifyOrderId}`,
      shopify_order_id: shopifyOrderId,
      user_id: email ? profileMap.get(email) ?? null : null,
      email: email || null,
      customer_name: getCustomerName(order),
      title: `Order ${orderName}`,
      subtitle: lineItems[0]?.name ?? "Shopify order",
      total: toNumber(order.total_price),
      total_amount: toNumber(order.total_price),
      order_number: orderName,
      status: getStatus(order),
      logistics_milestone: getMilestone(order),
      delivery_region: shippingAddress?.province || shippingAddress?.city || shippingAddress?.country || null,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      created_at: order.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        source: "admin_orders_latest_refresh",
        shopify_order_id: shopifyOrderId,
        shopify_order_name: orderName,
        shopify_order_number: order.order_number ?? null,
        financial_status: order.financial_status ?? null,
        fulfillment_status: order.fulfillment_status ?? null,
        payment_method: paymentMethod,
        phone: customerPhone,
        risk_status: restrictedCustomer ? "Blacklisted" : "None",
        risk_reason: restrictedCustomer?.blacklist_reason ?? "",
        subtotal: toNumber(order.subtotal_price),
        shipping,
        shipping_title: order.shipping_lines?.[0]?.title ?? null,
        shipping_lines: order.shipping_lines ?? [],
        items: lineItems,
      },
    };
  });

  let upsertedRows = 0;
  for (const row of rows) {
    const { error } = await supabase
      .from("orders")
      .upsert(row, { onConflict: "shopify_order_id" });

    if (error) {
      warnings.push(`${row.order_number}: ${formatError(error)}`);
      continue;
    }

    upsertedRows += 1;

    if (row.metadata.risk_status === "Blacklisted") {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true);
      for (const admin of admins ?? []) {
        const { data: existingAlert } = await supabase
          .from("app_notifications")
          .select("id")
          .eq("user_id", admin.id)
          .eq("label", "BLACKLIST ALERT")
          .eq("target_value", row.order_number)
          .maybeSingle();
        if (!existingAlert) {
          await supabase.from("app_notifications").insert({
            user_id: admin.id,
            title: "Blacklisted Customer Alert",
            message: `${row.customer_name} placed website order ${row.order_number}. Reason: ${row.metadata.risk_reason || "Restricted customer review required."}`,
            label: "BLACKLIST ALERT",
            icon: "warning-outline",
            target_type: "orders",
            target_value: row.order_number,
          });
        }
      }
    }
  }

  return { syncedCount: upsertedRows + linkedMirrors, warnings };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!["GET", "POST"].includes(req.method)) return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return jsonResponse({ error: "Authentication required" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) throwStageError("Load admin profile", profileError);
    if (!profile?.is_admin) return jsonResponse({ error: "Admin access required" }, 403);

    let syncedLatestOrders = 0;
    let syncWarning: string | null = null;

    try {
      const latestShopifyOrders = await fetchLatestShopifyOrders();
      const latestSyncResult = await upsertLatestShopifyOrders(supabase, latestShopifyOrders);
      syncedLatestOrders = latestSyncResult.syncedCount;
      if (latestSyncResult.warnings.length > 0) {
        syncWarning = latestSyncResult.warnings.slice(0, 3).join(" || ");
      }
    } catch (syncError) {
      syncWarning = formatError(syncError);
      console.warn("Admin latest Shopify order refresh failed:", syncWarning);
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) throwStageError("Load admin orders", ordersError);

    return jsonResponse({
      ok: true,
      orders: orders ?? [],
      syncedLatestOrders,
      syncWarning,
    });
  } catch (error) {
    const message = formatError(error);
    console.error("admin-orders error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
