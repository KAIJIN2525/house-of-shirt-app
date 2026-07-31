Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "This legacy OAuth callback is disabled. Configure Shopify app credentials as Supabase secrets instead.",
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    },
  ),
);
