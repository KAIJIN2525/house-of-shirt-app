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

const getEnv = (name: string) => Deno.env.get(name)?.trim() ?? "";

const safeRows = (result: { data: unknown[] | null; error: { message: string } | null }, label: string) => {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data ?? [];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return jsonResponse({ error: "Authentication required" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";
    const user = authData.user;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "export") {
      const [profile, addresses, favorites, cart, orders, returns, restock, notifications, threads] =
        await Promise.all([
          admin.from("profiles").select("id,email,full_name,phone,avatar_url,created_at,updated_at").eq("id", user.id),
          admin.from("addresses").select("id,label,full_name,phone,address_line1,address_line2,city,state,country,is_default,created_at").eq("user_id", user.id),
          admin.from("favorites").select("id,product_id,created_at").eq("user_id", user.id),
          admin.from("cart_items").select("id,product_id,name,image,price,quantity,size,color,created_at").eq("user_id", user.id),
          admin.from("orders").select("id,customer_name,title,subtitle,total,status,tracking_number,carrier,delivery_region,shipping_address,payment_method,created_at,updated_at").eq("user_id", user.id),
          admin.from("return_requests").select("id,order_id,type,status,reason,comments,rma_number,created_at,updated_at").eq("user_id", user.id),
          admin.from("back_in_stock_requests").select("id,product_id,product_title,size,email,phone,notification_channels,status,notified_at,created_at,updated_at").eq("user_id", user.id),
          admin.from("app_notifications").select("id,title,message,label,target_type,target_value,read,archived,created_at,updated_at").eq("user_id", user.id),
          admin.from("support_threads").select("id,title,topic,has_unread,created_at,updated_at").eq("user_id", user.id),
        ]);

      const threadRows = safeRows(threads, "Support threads");
      const threadIds = threadRows.map((row: any) => row.id);
      const messages = threadIds.length
        ? await admin.from("support_messages").select("id,thread_id,sender,text,created_at").in("thread_id", threadIds)
        : { data: [], error: null };

      return jsonResponse({
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email ?? null,
          phone: user.phone ?? null,
          emailConfirmedAt: user.email_confirmed_at ?? null,
          createdAt: user.created_at,
          profile: safeRows(profile, "Profile")[0] ?? null,
        },
        addresses: safeRows(addresses, "Addresses"),
        favorites: safeRows(favorites, "Favorites"),
        cartItems: safeRows(cart, "Cart"),
        orders: safeRows(orders, "Orders"),
        returnRequests: safeRows(returns, "Returns"),
        restockRequests: safeRows(restock, "Restock requests"),
        notifications: safeRows(notifications, "Notifications"),
        support: { threads: threadRows, messages: safeRows(messages, "Support messages") },
      });
    }

    if (action === "delete") {
      if (body?.confirmation !== "DELETE") {
        return jsonResponse({ error: "Type DELETE to confirm account deletion" }, 400);
      }

      const lastSignIn = Date.parse(user.last_sign_in_at ?? "");
      if (!Number.isFinite(lastSignIn) || Date.now() - lastSignIn > 10 * 60 * 1000) {
        return jsonResponse({ error: "Please sign in again before deleting your account", code: "reauthentication_required" }, 403);
      }

      const { data: orders, error: ordersError } = await admin
        .from("orders")
        .select("id,metadata")
        .eq("user_id", user.id);
      if (ordersError) throw new Error(`Load orders for anonymization: ${ordersError.message}`);

      for (const order of orders ?? []) {
        const metadata = order.metadata && typeof order.metadata === "object" ? { ...order.metadata } : {};
        for (const key of ["phone", "email", "customer_phone", "customer_email"]) delete metadata[key];
        const { error } = await admin.from("orders").update({
          user_id: null,
          email: null,
          customer_name: "Deleted customer",
          shipping_address: null,
          metadata,
          updated_at: new Date().toISOString(),
        }).eq("id", order.id).eq("user_id", user.id);
        if (error) throw new Error(`Anonymize order: ${error.message}`);
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
      if (deleteError) throw new Error(`Delete account: ${deleteError.message}`);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error("account-self-service error", error);
    return jsonResponse({ error: "Account request could not be completed" }, 500);
  }
});
