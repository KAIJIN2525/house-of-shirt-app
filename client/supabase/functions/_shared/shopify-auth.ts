/**
 * Resolving an Admin API token for the shop.
 *
 * Prefers minting one from the app's client credentials, because those tokens
 * are short-lived: a token pasted into SHOPIFY_ACCESS_TOKEN by hand works for a
 * day and then returns 401 on every request forever after. A static token is
 * still honoured as a fallback for setups configured that way.
 */

type Env = { get: (name: string) => string | undefined };

export interface ShopifyTokenSource {
  env?: Env;
  fetchFn?: typeof fetch;
  now?: () => number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, CachedToken>();

/** Exposed for tests; the cache is otherwise process-lifetime. */
export const clearShopifyTokenCache = () => cache.clear();

export class ShopifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyAuthError";
  }
}

// Read off globalThis rather than the Deno global directly: this module is also
// imported by the app's Jest suite, which has no Deno types.
const denoEnv = () => (globalThis as { Deno?: { env: Env } }).Deno?.env;

export const getShopifyAdminToken = async (
  storeDomain: string,
  { env, fetchFn = fetch, now = Date.now }: ShopifyTokenSource = {},
): Promise<string> => {
  const source = env ?? denoEnv();
  if (!source) {
    throw new ShopifyAuthError("No environment available to read secrets from");
  }

  const staticToken = source.get("SHOPIFY_ACCESS_TOKEN")?.trim();
  const clientId = source.get("SHOPIFY_CLIENT_ID")?.trim();
  const clientSecret = source.get("SHOPIFY_CLIENT_SECRET")?.trim();

  if (!clientId || !clientSecret) {
    if (staticToken) return staticToken;
    throw new ShopifyAuthError(
      "No Shopify Admin credentials configured. Set SHOPIFY_CLIENT_ID and " +
        "SHOPIFY_CLIENT_SECRET, or a SHOPIFY_ACCESS_TOKEN.",
    );
  }

  // Renewed a minute early so a token cannot expire mid-sync.
  const cached = cache.get(storeDomain);
  if (cached && cached.expiresAt > now() + 60_000) {
    return cached.token;
  }

  const response = await fetchFn(
    `https://${storeDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  const data = await response.json().catch(() => ({}));
  const token = typeof data?.access_token === "string" ? data.access_token : "";

  if (response.ok && token) {
    cache.set(storeDomain, {
      token,
      expiresAt: now() + Number(data.expires_in ?? 0) * 1000,
    });
    return token;
  }

  const detail = data?.errors
    ? JSON.stringify(data.errors)
    : `HTTP ${response.status}`;

  if (staticToken) {
    console.warn(
      `Shopify token request failed (${detail}); falling back to SHOPIFY_ACCESS_TOKEN`,
    );
    return staticToken;
  }

  throw new ShopifyAuthError(
    `Could not obtain a Shopify Admin token for ${storeDomain} (${detail}). ` +
      "Check SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET and that the app is " +
      "installed on this shop.",
  );
};
