import { createClient } from "supabase";

const verifyWebhookSignature = async (
  rawBody: string,
  signature: string | null,
  secret: string,
): Promise<boolean> => {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  return computed === signature;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase().trim() : "";

const getOrderStatus = (order: any) => {
  if (order.cancelled_at) return "Cancelled";
  if (order.fulfillment_status === "fulfilled") return "Delivered";
  if (order.fulfillment_status === "partial") return "Shipped";
  if (order.financial_status === "paid") return "Processing";
  return "Processing";
};

const getLogisticsMilestone = (order: any) => {
  if (order.cancelled_at) return "Cancelled";
  if (order.fulfillment_status === "fulfilled") return "Delivered";
  if (order.fulfillment_status === "partial") return "Shipped";
  return "Processing";
};

const getCustomerName = (order: any) => {
  const fromCustomer = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fromCustomer ||
    order.shipping_address?.name ||
    order.billing_address?.name ||
    order.email ||
    "Shopify Customer"
  );
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

const getShippingCharge = (order: any) => {
  const shippingSetAmount = order.total_shipping_price_set?.shop_money?.amount;
  const shippingLineAmount = Array.isArray(order.shipping_lines)
    ? order.shipping_lines[0]?.price
    : undefined;
  return toNumber(shippingSetAmount ?? shippingLineAmount);
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

  if (existingError) throw existingError;
  if (!existing) return true;

  const existingMetadata = existing.metadata && typeof existing.metadata === "object"
    ? existing.metadata
    : {};

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shopify_order_id: shopifyOrderId,
      status: getOrderStatus(order),
      logistics_milestone: getLogisticsMilestone(order),
      updated_at: new Date().toISOString(),
      metadata: {
        ...existingMetadata,
        shopify_order_id: shopifyOrderId,
        shopify_order_name: order.name || `#${order.order_number ?? shopifyOrderId}`,
        shopify_order_number: order.order_number ?? existingMetadata.shopify_order_number ?? null,
        financial_status: order.financial_status ?? existingMetadata.financial_status ?? null,
        fulfillment_status: order.fulfillment_status ?? existingMetadata.fulfillment_status ?? null,
        shipping: getShippingCharge(order),
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
  return true;
};

const upsertShopifyOrder = async (
  supabase: ReturnType<typeof createClient>,
  order: any,
) => {
  const shopifyOrderId = String(order.id ?? "").trim();
  if (!shopifyOrderId) return null;

  if (isAppMirroredShopifyOrder(order)) {
    const linked = await linkMirroredShopifyOrderToAppOrder(supabase, order);
    if (linked) {
      return order.name || `#${order.order_number ?? shopifyOrderId}`;
    }
  }

  const email = normalizeEmail(order.email || order.customer?.email);
  const orderName = order.name || `#${order.order_number ?? shopifyOrderId}`;
  const phone =
    order.phone ||
    order.customer?.phone ||
    order.shipping_address?.phone ||
    order.billing_address?.phone ||
    "";
  const shippingAddress = order.shipping_address || order.billing_address || {};
  const lineItems = mapLineItems(order);
  const total = toNumber(order.total_price);
  const subtotal = toNumber(order.subtotal_price);
  const shipping = getShippingCharge(order);

  let userId: string | null = null;
  if (email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  const row = {
    id: `shopify-${shopifyOrderId}`,
    shopify_order_id: shopifyOrderId,
    user_id: userId,
    email: email || null,
    customer_name: getCustomerName(order),
    title: `Order ${orderName}`,
    subtitle: lineItems[0]?.name ?? "Shopify order",
    total,
    total_amount: total,
    order_number: orderName,
    status: getOrderStatus(order),
    logistics_milestone: getLogisticsMilestone(order),
    delivery_region:
      shippingAddress?.province || shippingAddress?.city || shippingAddress?.country || null,
    shipping_address: shippingAddress,
    payment_method: getPaymentMethod(order),
    created_at: order.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      source: "shopify_webhook",
      shopify_order_id: shopifyOrderId,
      shopify_order_name: orderName,
      shopify_order_number: order.order_number ?? null,
      financial_status: order.financial_status ?? null,
      fulfillment_status: order.fulfillment_status ?? null,
      payment_method: getPaymentMethod(order),
      phone,
      subtotal,
      shipping,
      shipping_title: order.shipping_lines?.[0]?.title ?? null,
      shipping_lines: order.shipping_lines ?? [],
      items: lineItems,
    },
  };

  const { error } = await supabase
    .from("orders")
    .upsert(row, { onConflict: "shopify_order_id" });

  if (error) throw error;
  return orderName;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET")?.trim();
    if (!webhookSecret) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Webhook verification is not configured" }), { status: 503 });
    }

    const rawBody = await req.text();

    const signature = req.headers.get("X-Shopify-Hmac-Sha256");
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn("Invalid webhook signature - request rejected");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const topic = req.headers.get("X-Shopify-Topic") ?? "";
    const order = JSON.parse(rawBody);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let syncedOrderName: string | null = null;
    if (topic.startsWith("orders/")) {
      syncedOrderName = await upsertShopifyOrder(supabase, order);
      console.log(`Synced Shopify order ${syncedOrderName ?? order.id} from ${topic}`);

      // Updates/cancellations should keep Supabase fresh but must not resend blacklist alerts.
      if (topic !== "orders/create") {
        return new Response(JSON.stringify({ ok: true, synced: true, order: syncedOrderName }), { status: 200 });
      }

      const isAppOrder =
        String(order.tags ?? "").toLowerCase().includes("app-order") ||
        String(order.note ?? "").toLowerCase().includes("app order");
      if (isAppOrder) {
        return new Response(JSON.stringify({ ok: true, synced: true, order: syncedOrderName, skippedDuplicateAppAlert: true }), { status: 200 });
      }
    }

    const customerEmail = normalizeEmail(order.email || order.customer?.email);
    const customerPhone = String(
      order.phone || order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || "",
    ).replace(/\D/g, "");

    // Check email and phone so guest website orders cannot bypass the restricted list.
    const { data: blacklistCandidates, error: blacklistError } = await supabase
      .from("shopify_customers")
      .select("email, phone, blacklisted, blacklist_reason, first_name, last_name")
      .eq("blacklisted", true);

    if (blacklistError) throw blacklistError;
    const blacklistRecord = (blacklistCandidates ?? []).find((candidate: any) => {
      const sameEmail = customerEmail && normalizeEmail(candidate.email) === customerEmail;
      const candidatePhone = String(candidate.phone ?? "").replace(/\D/g, "");
      const samePhone = customerPhone && candidatePhone === customerPhone;
      return sameEmail || samePhone;
    });

    if (!blacklistRecord) {
      return new Response(JSON.stringify({ ok: true, synced: Boolean(syncedOrderName), message: "Customer is not blacklisted" }), { status: 200 });
    }

    // Fetch all admin users and their push tokens
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_admin", true);

    if (!admins?.length) {
      console.warn("Blacklisted customer ordered but no admins to notify");
      return new Response(JSON.stringify({ ok: true, synced: Boolean(syncedOrderName), message: "No admins to notify" }), { status: 200 });
    }

    const customerName =
      [blacklistRecord.first_name, blacklistRecord.last_name].filter(Boolean).join(" ") ||
      customerEmail || blacklistRecord.phone || "Restricted customer";
    const orderName = syncedOrderName || order.name || `#${order.order_number}`;
    const orderTotal = order.total_price
      ? `NGN ${Number(order.total_price).toLocaleString()}`
      : "";
    const reasonText = blacklistRecord.blacklist_reason || "Restricted customer review required.";
    const reason = ` Reason: ${reasonText}`;

    const notificationMessage =
      `${customerName} (${customerEmail}) placed order ${orderName}${orderTotal ? ` for ${orderTotal}` : ""}. This customer is on the restricted list.${reason}`;

    // Insert in-app notification for every admin
    await supabase.from("app_notifications").insert(
      admins.map((admin: any) => ({
        user_id: admin.id,
        title: "Blacklisted Customer Alert",
        message: notificationMessage,
        label: "BLACKLIST ALERT",
        icon: "warning-outline",
        target_type: "orders",
        target_value: orderName,
      })),
    );

    // Send push notifications to admins who have a push token
    const pushMessages = admins
      .filter((a: any) => a.expo_push_token)
      .map((a: any) => ({
        to: a.expo_push_token,
        sound: "default",
        title: "Blacklisted Customer Alert",
        body: `${customerName} placed order ${orderName}. Reason: ${reasonText}`,
        data: { type: "orders", orderId: orderName, reason: reasonText },
        priority: "high",
      }));

    if (pushMessages.length > 0) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pushMessages),
      }).catch((err) => console.warn("Push notification failed:", err));
    }

    console.log(`Blacklist alert sent: ${customerEmail} placed ${orderName}`);

    return new Response(
      JSON.stringify({ ok: true, synced: Boolean(syncedOrderName), alerted: true, order: orderName, customer: customerEmail }),
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Shopify webhook error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
