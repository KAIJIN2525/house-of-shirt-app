import {
  SHOPIFY_SYNC_API_URL,
  ShopifyRunSyncResponse,
  ShopifySyncStatusResponse,
  hasShopifySyncApiConfig,
} from "@/constants/shopify";
import { supabase } from "@/lib/supabase";

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!hasShopifySyncApiConfig()) {
    throw new Error("Shopify sync API base URL is not configured.");
  }

  const { EXPO_PUBLIC_SUPABASE_ANON_KEY } = process.env;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${SHOPIFY_SYNC_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "apikey": EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      "Authorization": `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });



  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Shopify sync API request failed (${response.status}): ${body || response.statusText}`
    );
  }

  return (await response.json()) as T;
};

export const getShopifySyncStatus = async () =>
  requestJson<ShopifySyncStatusResponse>("/shopify/sync/status");

export const runRemoteShopifySync = async () =>
  requestJson<ShopifyRunSyncResponse>("/shopify/sync/run", {
    method: "POST",
  });
