import { consumeRateLimit, rateLimitHeaders } from "@/supabase/functions/_shared/rate-limit";

describe("Edge Function rate limiter", () => {
  it("hashes identifiers before calling the server-only RPC", async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ allowed: true, remaining: 4, retry_after_seconds: 0 }],
      error: null,
    });

    const result = await consumeRateLimit({ rpc }, {
      scope: "notifications",
      identifier: "customer@example.com",
      limit: 5,
      windowSeconds: 60,
    });

    expect(result).toEqual({ allowed: true, remaining: 4, retryAfterSeconds: 0, limit: 5 });
    const args = rpc.mock.calls[0][1];
    expect(args.p_key_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(args.p_key_hash).not.toContain("customer@example.com");
  });

  it("returns retry metadata for blocked requests", async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ allowed: false, remaining: 0, retry_after_seconds: 42 }],
      error: null,
    });

    const result = await consumeRateLimit({ rpc }, {
      scope: "account-export",
      identifier: "user-id",
      limit: 3,
      windowSeconds: 3600,
    });

    expect(result.allowed).toBe(false);
    expect(rateLimitHeaders(result)).toMatchObject({
      "RateLimit-Limit": "3",
      "RateLimit-Remaining": "0",
      "Retry-After": "42",
    });
  });

  it("fails closed when the database limiter is unavailable", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(consumeRateLimit({ rpc }, {
      scope: "test",
      identifier: "user-id",
      limit: 1,
      windowSeconds: 60,
    })).rejects.toThrow("Rate limiter unavailable");
  });
});
