type RateLimitClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export async function consumeRateLimit(
  client: RateLimitClient,
  input: { scope: string; identifier: string; limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const keyHash = await sha256(`${input.scope}:${input.identifier}`);
  const { data, error } = await client.rpc("consume_edge_rate_limit", {
    p_key_hash: keyHash,
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });
  if (error) throw new Error(`Rate limiter unavailable: ${error.message ?? "unknown database error"}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new Error("Rate limiter returned an invalid response");
  const result = row as Record<string, unknown>;
  return {
    allowed: result.allowed === true,
    remaining: Number(result.remaining ?? 0),
    retryAfterSeconds: Number(result.retry_after_seconds ?? 0),
    limit: input.limit,
  };
}

export const rateLimitHeaders = (result: RateLimitResult) => ({
  "RateLimit-Limit": String(result.limit),
  "RateLimit-Remaining": String(result.remaining),
  ...(result.retryAfterSeconds > 0 ? { "Retry-After": String(result.retryAfterSeconds) } : {}),
});

export const rateLimitResponse = (
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
) => new Response(
  JSON.stringify({
    error: "Too many requests. Please wait before trying again.",
    code: "rate_limited",
    retryAfterSeconds: result.retryAfterSeconds,
  }),
  {
    status: 429,
    headers: { ...corsHeaders, ...rateLimitHeaders(result), "Content-Type": "application/json" },
  },
);
