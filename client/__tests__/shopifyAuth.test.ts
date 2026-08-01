import {
  clearShopifyTokenCache,
  getShopifyAdminToken,
} from "@/supabase/functions/_shared/shopify-auth";

const DOMAIN = "house-of-shirts.myshopify.com";

const envOf = (values: Record<string, string>) => ({
  get: (name: string) => values[name],
});

const tokenResponse = (body: unknown, ok = true, status = 200) =>
  jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });

beforeEach(() => clearShopifyTokenCache());

describe("getShopifyAdminToken", () => {
  it("mints a token from client credentials", async () => {
    const fetchFn = tokenResponse({ access_token: "shpat_fresh", expires_in: 86400 });

    const token = await getShopifyAdminToken(DOMAIN, {
      env: envOf({ SHOPIFY_CLIENT_ID: "id", SHOPIFY_CLIENT_SECRET: "secret" }),
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    expect(token).toBe("shpat_fresh");
    expect(fetchFn).toHaveBeenCalledWith(
      `https://${DOMAIN}/admin/oauth/access_token`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("prefers freshly minted credentials over a hand-pasted static token", async () => {
    const token = await getShopifyAdminToken(DOMAIN, {
      env: envOf({
        SHOPIFY_ACCESS_TOKEN: "shpat_stale",
        SHOPIFY_CLIENT_ID: "id",
        SHOPIFY_CLIENT_SECRET: "secret",
      }),
      fetchFn: tokenResponse({ access_token: "shpat_fresh" }) as unknown as typeof fetch,
    });

    expect(token).toBe("shpat_fresh");
  });

  it("reuses a cached token until it is close to expiring", async () => {
    const fetchFn = tokenResponse({ access_token: "shpat_fresh", expires_in: 86400 });
    const env = envOf({ SHOPIFY_CLIENT_ID: "id", SHOPIFY_CLIENT_SECRET: "secret" });
    const options = { env, fetchFn: fetchFn as unknown as typeof fetch, now: () => 0 };

    await getShopifyAdminToken(DOMAIN, options);
    await getShopifyAdminToken(DOMAIN, options);

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("renews rather than handing back a token about to expire", async () => {
    const fetchFn = tokenResponse({ access_token: "shpat_fresh", expires_in: 30 });
    const env = envOf({ SHOPIFY_CLIENT_ID: "id", SHOPIFY_CLIENT_SECRET: "secret" });

    await getShopifyAdminToken(DOMAIN, {
      env,
      fetchFn: fetchFn as unknown as typeof fetch,
      now: () => 0,
    });
    await getShopifyAdminToken(DOMAIN, {
      env,
      fetchFn: fetchFn as unknown as typeof fetch,
      now: () => 0,
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("falls back to a static token when credentials are not configured", async () => {
    const fetchFn = jest.fn();

    const token = await getShopifyAdminToken(DOMAIN, {
      env: envOf({ SHOPIFY_ACCESS_TOKEN: "shpat_static" }),
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    expect(token).toBe("shpat_static");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("names the missing configuration when there is nothing to authenticate with", async () => {
    await expect(
      getShopifyAdminToken(DOMAIN, { env: envOf({}) }),
    ).rejects.toThrow(/SHOPIFY_CLIENT_ID/);
  });

  it("explains a rejected credential rather than failing anonymously", async () => {
    await expect(
      getShopifyAdminToken(DOMAIN, {
        env: envOf({ SHOPIFY_CLIENT_ID: "id", SHOPIFY_CLIENT_SECRET: "wrong" }),
        fetchFn: tokenResponse(
          { errors: "invalid_client" },
          false,
          401,
        ) as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/invalid_client/);
  });
});
