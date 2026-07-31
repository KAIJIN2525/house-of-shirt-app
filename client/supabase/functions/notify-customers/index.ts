import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationMessageType =
  | "processing"
  | "dispatched"
  | "in_transit"
  | "arrived_at_hub"
  | "out_for_delivery"
  | "available_for_pickup"
  | "delivered"
  | "restock"
  | "custom";

interface NotifyRequest {
  customers: {
    name: string;
    email?: string;
    phone?: string;
    orderId?: string;
    requestId?: string;
    userId?: string;
    productId?: string;
    customMessage?: string;
    notificationChannels?: ("app" | "push" | "email" | "sms")[];
  }[];
  messageType: NotificationMessageType;
  customMessage?: string;
}

interface ContactDetails {
  email?: string;
  phone?: string;
  expoPushToken?: string;
  userId?: string | null;
}

interface DispatchReport {
  orderId?: string;
  requestId?: string;
  customerName: string;
  channels: {
    email: "sent" | "skipped" | "failed";
    sms: "sent" | "skipped" | "failed";
    push: "sent" | "skipped" | "failed";
    app: "sent" | "skipped" | "failed";
    admin: "sent" | "skipped" | "failed";
  };
  errors?: {
    email?: string | null;
    sms?: string | null;
    delivery?: string | null;
  };
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "House of Shirts <onboarding@resend.dev>";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");
const ADMIN_NOTIFICATION_EMAILS = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log(`Skipping email to ${to} - No RESEND_API_KEY configured`);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email send failed for ${to}`, errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (err) {
    console.error(`Fetch error in sendEmail for ${to}`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function sendSms(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.log(`Skipping SMS to ${to} - Twilio not configured`);
    return { success: false, error: "Twilio credentials or number not fully configured" };
  }

  try {
    const formattedTo = to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`;
    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("From", TWILIO_FROM_NUMBER);
    formData.append("Body", body);

    const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SMS send failed for ${formattedTo}`, errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (err) {
    console.error(`Fetch error in sendSms for ${to}`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  orderId?: string,
  targetType: "orders" | "product" = "orders",
  targetValue?: string,
) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data: {
        type: targetType,
        id: targetValue ?? orderId,
        orderId,
        productId: targetType === "product" ? targetValue : undefined,
      },
    }),
  });

  if (!response.ok) {
    console.error(`Failed to send push notification to token: ${expoPushToken}`, await response.text());
    return false;
  }

  return true;
}

function naira(value: number) {
  return `NGN ${Number(value || 0).toLocaleString()}`;
}

function getNotificationCopy(
  messageType: NotificationMessageType,
  customerName: string,
  orderId?: string,
  customMessage?: string,
) {
  if (messageType === "restock") {
    const message = customMessage ?? "An item you requested is back in stock.";
    return {
      emailSubject: "Your requested item is back in stock",
      emailHeading: "Back in stock",
      emailIntro: `Hi ${customerName}, ${message}`,
      appTitle: "Back in Stock",
      appBody: message,
      smsBody: `House of Shirts: ${message}`,
      adminTitle: "Restock notification sent",
      adminBody: `A restock notification was processed for ${customerName}.`,
    };
  }
  if (messageType === "custom") {
    const message = customMessage ?? "There is an update from House of Shirts.";
    return {
      emailSubject: `Update for order ${orderId ? `#${orderId}` : ""}`.trim(),
      emailHeading: "A message from House of Shirts",
      emailIntro: `Hi ${customerName}, ${message}`,
      appTitle: "House of Shirts Update",
      appBody: message,
      smsBody: `House of Shirts: ${message}`,
      adminTitle: `Custom update sent for #${orderId ?? "N/A"}`,
      adminBody: `A manual customer message was sent for order #${orderId ?? "N/A"}.`,
    };
  }

  const orderLabel = orderId ? `#${orderId}` : "your order";
  const copyMap: Record<
    Exclude<NotificationMessageType, "custom" | "restock">,
    {
      emailSubject: string;
      emailHeading: string;
      emailIntro: string;
      appTitle: string;
      appBody: string;
      smsBody: string;
      adminTitle: string;
      adminBody: string;
    }
  > = {
    processing: {
      emailSubject: `Order ${orderLabel} is being prepared`,
      emailHeading: "Your order is now processing",
      emailIntro: `Hi ${customerName}, your order ${orderLabel} has entered our fulfillment flow and our team is preparing it for dispatch.`,
      appTitle: "Order Processing",
      appBody: `Your order ${orderLabel} is being prepared by our atelier.`,
      smsBody: `House of Shirts: Your order ${orderLabel} is now processing and being prepared for dispatch.`,
      adminTitle: `Order ${orderLabel} moved to Processing`,
      adminBody: `Customer notification was sent for order ${orderLabel} moving into processing.`,
    },
    dispatched: {
      emailSubject: `Order ${orderLabel} has been dispatched`,
      emailHeading: "Your order has been sent",
      emailIntro: `Hi ${customerName}, great news. Your order ${orderLabel} has been dispatched and handed to the delivery team.`,
      appTitle: "Order Dispatched",
      appBody: `Great news. Your order ${orderLabel} has been dispatched.`,
      smsBody: `House of Shirts: Your order ${orderLabel} has been dispatched. Track it in the app for live updates.`,
      adminTitle: `Order ${orderLabel} dispatched`,
      adminBody: `Customer dispatch notifications were sent for order ${orderLabel}.`,
    },
    in_transit: {
      emailSubject: `Order ${orderLabel} is in transit`,
      emailHeading: "Your order is in transit",
      emailIntro: `Hi ${customerName}, your order ${orderLabel} is now moving through the courier network.`,
      appTitle: "Order In Transit",
      appBody: `Your order ${orderLabel} is on the move.`,
      smsBody: `House of Shirts: Your order ${orderLabel} is now in transit.`,
      adminTitle: `Order ${orderLabel} is in transit`,
      adminBody: `Transit notifications were sent for order ${orderLabel}.`,
    },
    arrived_at_hub: {
      emailSubject: `Order ${orderLabel} has arrived at the hub`,
      emailHeading: "Your order has reached the local hub",
      emailIntro: `Hi ${customerName}, your order ${orderLabel} has arrived at the local hub. Please stay reachable if payment or pickup confirmation is needed.`,
      appTitle: "Order Arrived at Hub",
      appBody: `Your order ${orderLabel} has arrived at the local hub.`,
      smsBody: `House of Shirts: Your order ${orderLabel} has arrived at the local hub. Please stay reachable for pickup or delivery confirmation.`,
      adminTitle: `Order ${orderLabel} arrived at hub`,
      adminBody: `Hub-arrival notifications were sent for order ${orderLabel}.`,
    },
    out_for_delivery: {
      emailSubject: `Order ${orderLabel} is out for delivery`,
      emailHeading: "Your order is out for delivery",
      emailIntro: `Hi ${customerName}, your order ${orderLabel} is out for delivery. Please keep your phone close by so the rider can reach you if needed.`,
      appTitle: "Out for Delivery",
      appBody: `Your order ${orderLabel} is out for delivery today.`,
      smsBody: `House of Shirts: Your order ${orderLabel} is out for delivery. Please stay reachable on your phone.`,
      adminTitle: `Order ${orderLabel} out for delivery`,
      adminBody: `Out-for-delivery notifications were sent for order ${orderLabel}.`,
    },
    available_for_pickup: {
      emailSubject: `Order ${orderLabel} is ready for pickup`,
      emailHeading: "Your order is ready for collection",
      emailIntro: `Hi ${customerName}, your order ${orderLabel} is now available for pickup at our GIGL location. Please bring your ID and order confirmation.`,
      appTitle: "Ready for Pickup",
      appBody: `Your order ${orderLabel} is ready for pickup at our GIGL location.`,
      smsBody: `House of Shirts: Your order ${orderLabel} is ready for pickup at our GIGL location. Please bring your ID.`,
      adminTitle: `Order ${orderLabel} ready for pickup`,
      adminBody: `Pickup availability notifications were sent for order ${orderLabel}.`,
    },
    delivered: {
      emailSubject: `Order ${orderLabel} has been delivered`,
      emailHeading: "Your order has been delivered",
      emailIntro: `Hi ${customerName}, your order ${orderLabel} has been marked as delivered. We hope it reaches you exactly as expected.`,
      appTitle: "Order Delivered",
      appBody: `Your order ${orderLabel} has been delivered.`,
      smsBody: `House of Shirts: Your order ${orderLabel} has been delivered. Thank you for shopping with us.`,
      adminTitle: `Order ${orderLabel} delivered`,
      adminBody: `Delivery notifications were sent for order ${orderLabel}.`,
    },
  };

  return copyMap[messageType];
}

function buildEmailHtml(
  customerName: string,
  orderId: string,
  orderData: Record<string, unknown> | null,
  copy: ReturnType<typeof getNotificationCopy>,
) {
  const metadata = (orderData?.metadata as Record<string, unknown> | undefined) ?? {};
  const items = Array.isArray(metadata.items) ? metadata.items : [];
  const total = Number(orderData?.total_amount ?? orderData?.total ?? 0);
  const shipping = Number(metadata.shipping ?? 0);
  const subtotal = Number(metadata.subtotal ?? Math.max(0, total - shipping));

  const itemsHtml = items
    .map((rawItem) => {
      const item = rawItem as Record<string, unknown>;
      const title = String(item.title ?? item.name ?? "House Piece");
      const quantity = Number(item.quantity ?? 1);
      const price = Number(item.price ?? 0);
      const variantTitle = String(item.variantTitle ?? item.variant_title ?? "").trim();
      const image = String(
        item.image ??
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200",
      );

      return `
        <div class="item-border" style="display:flex;align-items:flex-start;margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:12px;">
          <img src="${image}" width="60" height="60" style="object-fit:cover;border-radius:4px;margin-right:15px;" />
          <div style="flex:1;">
            <p class="text-main" style="margin:0;font-weight:bold;font-size:14px;color:#333333;">${title}</p>
            ${variantTitle ? `<p class="text-sub" style="margin:4px 0 0;font-size:12px;color:#666666;">${variantTitle}</p>` : ""}
            <p class="text-sub" style="margin:4px 0 0;font-size:12px;color:#666666;">Qty: ${quantity}</p>
          </div>
          <p class="text-main" style="margin:0;font-weight:bold;font-size:14px;color:#333333;">${naira(price * quantity)}</p>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media (prefers-color-scheme: dark) {
            body, .email-body {
              background-color: #050505 !important;
              color: #f5f6f8 !important;
            }
            .email-container {
              background-color: #050505 !important;
              color: #f5f6f8 !important;
            }
            h1, h2, h3, h4, .text-main, span {
              color: #ffffff !important;
            }
            .text-sub, .text-muted {
              color: #a3a3a3 !important;
            }
            .btn-action {
              background-color: #ffffff !important;
              color: #050505 !important;
            }
            .info-box {
              background-color: #101215 !important;
              border-color: rgba(255,255,255,0.08) !important;
            }
            .item-border, .divider-border {
              border-color: rgba(255,255,255,0.08) !important;
            }
            a {
              color: #ffffff !important;
            }
          }
        </style>
      </head>
      <body class="email-body" style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div class="email-container" style="max-width:600px;margin:0 auto;padding:20px;color:#333333;">
          <div class="divider-border" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:1px solid #eee;padding-bottom:16px;">
            <h1 class="text-main" style="margin:0;font-size:24px;font-weight:bold;color:#000000;">House of Shirts</h1>
            <p class="text-sub" style="margin:0;font-size:14px;color:#666666;">ORDER #${orderId}</p>
          </div>

          <h2 class="text-main" style="font-size:22px;margin-bottom:10px;color:#000000;">${copy.emailHeading}</h2>
          <p class="text-sub" style="font-size:14px;line-height:1.7;color:#555555;margin-bottom:26px;">
            ${copy.emailIntro}
          </p>

          <div style="margin-bottom:30px;">
            <a class="btn-action" href="https://houseofshirts.app/orders/${orderId}" style="background-color:#000000;color:#ffffff;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;display:inline-block;font-size:14px;">View your order</a>
          </div>

          <div class="info-box" style="margin-bottom:30px;background-color:#f9f9f9;padding:15px;border-radius:8px;border:1px solid #eee;">
            <h4 class="text-main" style="margin:0 0 8px 0;font-size:14px;font-weight:bold;color:#000000;">Need live updates?</h4>
            <p class="text-sub" style="margin:0 0 12px 0;font-size:12px;color:#666666;line-height:1.4;">Download our mobile app to track your package, manage your orders, and receive instant delivery updates.</p>
            <a class="text-main" href="https://houseofshirts.app/download" style="color:#000000;font-weight:bold;font-size:12px;text-decoration:underline;">Download the app</a>
          </div>

          <div class="divider-border" style="border-top:2px solid #000000;padding-top:20px;margin-bottom:40px;">
            <h3 class="text-main" style="font-size:16px;margin-bottom:20px;text-transform:uppercase;letter-spacing:1px;color:#000000;">Order summary</h3>
            ${itemsHtml || `<p class="text-sub" style="font-size:14px;color:#666666;">Hi ${customerName}, your order details are available in the app.</p>`}
            <div style="margin-left:auto;width:220px;font-size:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span class="text-sub">Subtotal</span>
                <span class="text-main" style="font-weight:bold;color:#000000;">${naira(subtotal)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span class="text-sub">Shipping</span>
                <span class="text-main" style="font-weight:bold;color:#000000;">${naira(shipping)}</span>
              </div>
              <div class="divider-border" style="display:flex;justify-content:space-between;margin-top:15px;font-weight:bold;font-size:18px;border-top:1px solid #eee;padding-top:10px;">
                <span class="text-main" style="color:#000000;">Total</span>
                <span class="text-main" style="color:#000000;">${naira(total)}</span>
              </div>
            </div>
          </div>

          <div class="divider-border" style="border-top:1px solid #eee;padding-top:20px;font-size:12px;color:#999999;text-align:center;">
            <p class="text-muted">If you have any questions, reply to this email or contact us at <a class="text-main" href="mailto:Houseofshirtsng@gmail.com" style="color:#000000;font-weight:bold;">Houseofshirtsng@gmail.com</a></p>
            <p class="text-muted" style="margin-top:20px;">© ${new Date().getFullYear()} House of Shirts Atelier</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function resolveCustomerContact(
  supabaseAdmin: ReturnType<typeof createClient>,
  customer: NotifyRequest["customers"][number],
  orderData: Record<string, unknown> | null,
): Promise<ContactDetails> {
  const metadata = (orderData?.metadata as Record<string, unknown> | undefined) ?? {};
  const fallbackEmail = String(orderData?.email ?? customer.email ?? "").trim();
  const fallbackPhone = String(metadata.phone ?? customer.phone ?? "").trim();
  const userId = customer.userId || (typeof orderData?.user_id === "string" ? String(orderData.user_id) : null);

  if (!userId) {
    return {
      email: fallbackEmail || undefined,
      phone: fallbackPhone || undefined,
      userId,
    };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, phone, expo_push_token")
    .eq("id", userId)
    .maybeSingle();

  return {
    email: fallbackEmail || profile?.email || undefined,
    phone: fallbackPhone || profile?.phone || undefined,
    expoPushToken: profile?.expo_push_token || undefined,
    userId,
  };
}

async function createAdminNotifications(
  supabaseAdmin: ReturnType<typeof createClient>,
  title: string,
  message: string,
  orderId?: string,
  targetType: "orders" | "product" = "orders",
  targetValue?: string,
) {
  const { data: admins } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("is_admin", true);

  if (admins && admins.length > 0) {
    await supabaseAdmin.from("app_notifications").insert(
      admins.map((admin) => ({
        user_id: admin.id,
        title,
        message,
        label: "ORDER UPDATE",
        icon: "notifications-outline",
        target_type: "orders",
        target_value: orderId ?? null,
      })),
    );
  }

  const adminEmails = new Set<string>(ADMIN_NOTIFICATION_EMAILS);
  admins?.forEach((admin) => {
    if (admin.email) {
      adminEmails.add(admin.email);
    }
  });

  const emailResults = await Promise.all(
    Array.from(adminEmails).map((email) =>
      sendEmail(
        email,
        title,
        `<div style="font-family:sans-serif;padding:20px;"><h2>${title}</h2><p>${message}</p></div>`,
      ),
    ),
  );

  return {
    appSent: Boolean(admins && admins.length > 0),
    emailSent: emailResults.some(Boolean),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const testBypass = req.headers.get("x-test-bypass-token");
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let isAuthorized = false;

    const testBypassSecret = Deno.env.get("TEST_BYPASS_TOKEN")?.trim();
    if (testBypass && testBypassSecret && testBypass === testBypassSecret) {
      isAuthorized = true;
    } else {
      if (!authHeader) {
        return jsonResponse({ error: "Missing Authorization header" }, 401);
      }
      const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (accessToken === supabaseServiceKey) {
        isAuthorized = true;
      } else {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(accessToken);

        if (user && !userError) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.is_admin) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return jsonResponse({ error: "Unauthorized - Admins only" }, 403);
    }

    const body: NotifyRequest = await req.json();
    const { customers, messageType, customMessage } = body;
    let successCount = 0;
    const reports: DispatchReport[] = [];

    for (const customer of customers) {
      let orderData: Record<string, unknown> | null = null;
      if (customer.orderId) {
        const { data } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", customer.orderId)
          .maybeSingle();
        orderData = data as Record<string, unknown> | null;
      }

      const copy = getNotificationCopy(
        messageType,
        customer.name,
        customer.orderId,
        customer.customMessage ?? customMessage,
      );
      const contact = await resolveCustomerContact(supabaseAdmin, customer, orderData);
      const emailHtml = buildEmailHtml(
        customer.name,
        customer.orderId ?? "N/A",
        orderData,
        copy,
      );

      const requestedChannels = new Set(
        customer.notificationChannels?.length
          ? customer.notificationChannels
          : ["app", "push", "email", "sms"],
      );
      const wantsEmail = requestedChannels.has("email");
      const wantsSms = requestedChannels.has("sms");
      const wantsApp = requestedChannels.has("app");
      const wantsPush = requestedChannels.has("push");

      const hasEmailRecipient = wantsEmail && Boolean(contact.email && contact.email.includes("@"));
      const emailResult = hasEmailRecipient
        ? await sendEmail(contact.email!, copy.emailSubject, emailHtml)
        : { success: false, error: wantsEmail ? "Skipped - no email" : "Skipped - channel disabled" };

      const hasSmsRecipient = wantsSms && Boolean(contact.phone && contact.phone.length > 7);
      const smsResult = hasSmsRecipient
        ? await sendSms(contact.phone!, copy.smsBody)
        : { success: false, error: wantsSms ? "Skipped - no phone" : "Skipped - channel disabled" };

      let appSent = false;
      if (wantsApp && contact.userId) {
        const { error: appError } = await supabaseAdmin.from("app_notifications").insert({
          user_id: contact.userId,
          title: copy.appTitle,
          message: copy.appBody,
          label: messageType === "restock" ? "RESTOCK" : "ORDER UPDATE",
          icon: messageType === "restock" ? "notifications-outline" : "cube-outline",
          target_type: messageType === "restock" ? "product" : "orders",
          target_value: messageType === "restock" ? customer.productId ?? null : customer.orderId ?? null,
        });
        appSent = !appError;
      }

      const hasPushRecipient = wantsPush && Boolean(contact.expoPushToken);
      const pushSent = hasPushRecipient
        ? await sendExpoPushNotification(
            contact.expoPushToken!,
            copy.appTitle,
            copy.appBody,
            customer.orderId,
            messageType === "restock" ? "product" : "orders",
            messageType === "restock" ? customer.productId : customer.orderId,
          )
        : false;

      const adminResult = messageType === "restock"
        ? { appSent: false, emailSent: false }
        : await createAdminNotifications(
            supabaseAdmin,
            copy.adminTitle,
            copy.adminBody,
            customer.orderId,
          );

      const channels: DispatchReport["channels"] = {
        email: hasEmailRecipient ? (emailResult.success ? "sent" : "failed") : "skipped",
        sms: hasSmsRecipient ? (smsResult.success ? "sent" : "failed") : "skipped",
        push: hasPushRecipient ? (pushSent ? "sent" : "failed") : "skipped",
        app: wantsApp && contact.userId ? (appSent ? "sent" : "failed") : "skipped",
        admin: messageType === "restock"
          ? "skipped"
          : adminResult.appSent || adminResult.emailSent
            ? "sent"
            : ADMIN_NOTIFICATION_EMAILS.length > 0
              ? "failed"
              : "skipped",
      };
      const customerDelivered = [channels.email, channels.sms, channels.push, channels.app]
        .some((status) => status === "sent");

      reports.push({
        orderId: customer.orderId,
        requestId: customer.requestId,
        customerName: customer.name,
        channels,
        errors: {
          email: emailResult.success ? null : emailResult.error,
          sms: smsResult.success ? null : smsResult.error,
          delivery: customerDelivered ? null : "No customer notification channel succeeded",
        },
      });

      if (customerDelivered) successCount += 1;
    }

    return jsonResponse({
      success: successCount > 0,
      message: `Delivered notifications to ${successCount} of ${customers.length} customers`,
      reports,
      warning:
        !RESEND_API_KEY || !TWILIO_ACCOUNT_SID
          ? "Email or SMS providers are not fully configured. App and push notifications will still proceed where possible."
          : null,
    });
  } catch (error) {
    console.error("Error in notify-customers:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown notification error" },
      500,
    );
  }
});
