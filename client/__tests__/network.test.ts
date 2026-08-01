import {
  classifyNetworkError,
  fetchJsonWithRetry,
  NetworkRequestError,
  parseRetryAfterMilliseconds,
} from "@/services/network";

const jsonResponse = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), { status, headers });

describe("network retry handling", () => {
  it("honours Retry-After and succeeds after an HTTP 429", async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleepFn = jest.fn().mockResolvedValue(undefined);

    await expect(
      fetchJsonWithRetry<{ ok: boolean }>("https://example.test", {}, { fetchFn, sleepFn }),
    ).resolves.toEqual({ ok: true });
    expect(sleepFn).toHaveBeenCalledWith(2000);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("retries a throttled GraphQL payload", async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ errors: [{ extensions: { code: "THROTTLED" } }] }))
      .mockResolvedValueOnce(jsonResponse({ data: { cart: true } }));

    const result = await fetchJsonWithRetry<{ data?: { cart: boolean }; errors?: { extensions?: { code?: string } }[] }>(
      "https://example.test",
      {},
      {
        fetchFn,
        sleepFn: jest.fn().mockResolvedValue(undefined),
        shouldRetryPayload: (payload) => payload.errors?.some((error) => error.extensions?.code === "THROTTLED") === true,
      },
    );

    expect(result.data?.cart).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("classifies exhausted connection failures as offline", async () => {
    const request = fetchJsonWithRetry("https://example.test", {}, {
      fetchFn: jest.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      sleepFn: jest.fn().mockResolvedValue(undefined),
      maxAttempts: 2,
    });

    await expect(request).rejects.toMatchObject({ kind: "offline" });
  });

  it("classifies common rate-limit errors", () => {
    expect(classifyNetworkError({ status: 429 })).toBe("rate_limited");
    expect(classifyNetworkError(new Error("Request was throttled"))).toBe("rate_limited");
    expect(classifyNetworkError(new NetworkRequestError("Offline", "offline"))).toBe("offline");
  });

  it("parses Retry-After seconds", () => {
    expect(parseRetryAfterMilliseconds("3")).toBe(3000);
    expect(parseRetryAfterMilliseconds(null)).toBeNull();
  });
});
