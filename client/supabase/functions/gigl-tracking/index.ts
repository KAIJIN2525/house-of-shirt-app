import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const waybillNumber = url.searchParams.get("waybill");

    if (!waybillNumber) {
      throw new Error("Missing waybill parameter.");
    }

    // Placeholder response simulating GIGL API
    return new Response(
      JSON.stringify({
        waybill: waybillNumber,
        status: "In Transit",
        history: [
          { date: new Date().toISOString(), location: "Lagos Hub", status: "Arrived at Hub" },
          { date: new Date().toISOString(), location: "Abuja Hub", status: "Departed" },
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
