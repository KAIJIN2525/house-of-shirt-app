import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

const storeDomain = (process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");
const clientId =
  process.env.EXPO_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() ?? "";
const redirectUri =
  process.env.EXPO_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI?.trim() ??
  "shop.91713536318.app://callback";

const ACCESS_TOKEN_KEY = "shopify_customer_access_token";
const REFRESH_TOKEN_KEY = "shopify_customer_refresh_token";
const EXPIRES_AT_KEY = "shopify_customer_expires_at";
const REFRESH_MARGIN_MS = 60_000;

interface OpenIdConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

const toBase64Url = (value: string) =>
  value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const randomValue = async (byteCount = 32) => {
  const bytes = await Crypto.getRandomBytesAsync(byteCount);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return toBase64Url(globalThis.btoa(binary));
};

const getDiscovery = async (): Promise<OpenIdConfiguration> => {
  if (!storeDomain || !clientId) {
    throw new Error(
      "Shopify Customer Accounts are not configured. Add the Customer Account API client ID to the app environment.",
    );
  }
  const response = await fetch(
    `https://${storeDomain}/.well-known/openid-configuration`,
  );
  if (!response.ok) {
    throw new Error("Shopify customer sign-in configuration could not be loaded.");
  }
  return response.json();
};

const saveTokens = async (tokens: TokenResponse) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
  await SecureStore.setItemAsync(
    EXPIRES_AT_KEY,
    String(Date.now() + tokens.expires_in * 1000),
  );
  if (tokens.refresh_token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
};

const requestTokens = async (
  tokenEndpoint: string,
  parameters: Record<string, string>,
) => {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameters).toString(),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Shopify customer sign-in failed.",
    );
  }
  const tokens = payload as TokenResponse;
  await saveTokens(tokens);
  return tokens.access_token;
};

const refreshAccessToken = async (refreshToken: string) => {
  const discovery = await getDiscovery();
  return requestTokens(discovery.token_endpoint, {
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
};

export const getShopifyCustomerAccessToken = async () => {
  const [accessToken, refreshToken, expiresAtValue] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_AT_KEY),
  ]);
  const expiresAt = Number(expiresAtValue ?? 0);
  if (accessToken && expiresAt > Date.now() + REFRESH_MARGIN_MS) return accessToken;
  if (!refreshToken) return null;
  try {
    return await refreshAccessToken(refreshToken);
  } catch {
    await clearShopifyCustomerSession();
    return null;
  }
};

export const signInToShopifyCustomerAccount = async () => {
  const discovery = await getDiscovery();
  const codeVerifier = await randomValue(64);
  const codeChallenge = toBase64Url(
    await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    ),
  );
  const state = await randomValue();
  const nonce = await randomValue();
  const authorizationUrl = new URL(discovery.authorization_endpoint);
  authorizationUrl.searchParams.set("scope", "openid email customer-account-api:full");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const result = await WebBrowser.openAuthSessionAsync(
    authorizationUrl.toString(),
    redirectUri,
  );
  if (result.type !== "success") return null;
  const callback = new URL(result.url);
  if (callback.searchParams.get("state") !== state) {
    throw new Error("Shopify customer sign-in could not be verified.");
  }
  const error = callback.searchParams.get("error");
  if (error) {
    throw new Error(callback.searchParams.get("error_description") || error);
  }
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("Shopify did not return an authorization code.");

  return requestTokens(discovery.token_endpoint, {
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });
};

export const ensureShopifyCustomerAccessToken = async () =>
  (await getShopifyCustomerAccessToken()) ??
  signInToShopifyCustomerAccount();

export const clearShopifyCustomerSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
  ]);
};

export const hasShopifyCustomerAccountConfig = () =>
  Boolean(storeDomain && clientId && redirectUri);
