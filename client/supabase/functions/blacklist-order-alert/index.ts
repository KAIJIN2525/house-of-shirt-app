import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase().trim() : "";

const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) return `0${digits.slice(3)}`;
  return digits;
};

const normalizeName = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase().trim() : "";

const formatMoney = (value: unknown) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0
    ? `NGN ${amount.toLocaleString()}`
    : "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const customerEmail = normalizeEmail(body.customerEmail ?? authData.user.email);
    const customerPhone = normalizePhone(body.customerPhone);
    const customerName = normalizeName(body.customerName);
    const orderId = String(body.orderId ?? "Blocked checkout attempt");
    const source = String(body.source ?? "app_order");
    const orderTotal = formatMoney(body.orderTotal);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: candidates, error: blacklistError } = await supabase
      .from("shopify_customers")
      .select("email, first_name, last_name, phone, blacklist_reason")
      .eq("blacklisted", true);

    if (blacklistError) throw blacklistError;

    const blacklistRecord = (candidates ?? []).find((customer: any) => {
      const candidateEmail = normalizeEmail(customer.email);
      const candidatePhone = normalizePhone(customer.phone);
      const candidateName = normalizeName(
        [customer.first_name, customer.last_name].filter(Boolean).join(" "),
      );

      const phoneMatches =
        customerPhone &&
        candidatePhone &&
        (candidatePhone === customerPhone ||
          candidatePhone.endsWith(customerPhone) ||
          customerPhone.endsWith(candidatePhone));

      return (
        (customerEmail && candidateEmail === customerEmail) ||
        phoneMatches ||
        (customerName && candidateName && candidateName === customerName)
      );
    });

    if (!blacklistRecord) {
      return jsonResponse({ ok: true, alerted: false, message: "No blacklisted customer match" });
    }

    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_admin", true);

    if (adminsError) throw adminsError;

    const displayName =
      [blacklistRecord.first_name, blacklistRecord.last_name].filter(Boolean).join(" ") ||
      body.customerName ||
      customerEmail ||
      "Restricted customer";
    const reason = blacklistRecord.blacklist_reason || "Restricted customer review required.";

    if (!admins?.length) {
      return jsonResponse({
        ok: true,
        alerted: false,
        matched: true,
        orderId,
        reason,
        message: "No admins to notify",
      });
    }
    const sourceLabel = source === "blocked_checkout" ? "attempted checkout" : "placed an app order";
    const message = `${displayName} (${customerEmail || "no email"}) ${sourceLabel} ${orderId}${orderTotal ? ` for ${orderTotal}` : ""}. Reason: ${reason}`;

    await supabase.from("app_notifications").insert(
      admins.map((admin: any) => ({
        user_id: admin.id,
        title: "Blacklisted Customer Alert",
        message,
        label: "BLACKLIST ALERT",
        icon: "warning-outline",
        target_type: "orders",
        target_value: orderId,
      })),
    );

    const pushMessages = admins
      .filter((admin: any) => admin.expo_push_token)
      .map((admin: any) => ({
        to: admin.expo_push_token,
        sound: "default",
        title: "Blacklisted Customer Alert",
        body: `${displayName} ${sourceLabel}. Reason: ${reason}`,
        data: { type: "orders", orderId, source, reason },
        priority: "high",
      }));

    if (pushMessages.length > 0) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pushMessages),
      }).catch((error) => console.warn("Push notification failed:", error));
    }

    return jsonResponse({ ok: true, alerted: true, matched: true, orderId, reason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("blacklist-order-alert error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
