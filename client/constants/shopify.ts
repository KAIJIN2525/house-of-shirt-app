import { Product } from "@/constants/products";

export interface ShopifyImportedCustomer {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  tag?: string;
}

export interface ShopifyImportedOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  title: string;
  subtitle: string;
  total: number;
  image: string;
  placedOn: string;
  paymentMethod?: "Card" | "Pay on Delivery";
}

export interface ShopifyImportedProduct extends Product {
  handle?: string;
  status?: "active" | "draft" | "archived";
}

export interface ShopifyRemoteWebhookHealth {
  id: string;
  topic: string;
  successRate: number;
  latencyMs: number;
  status: "Healthy" | "Warning" | "Delayed";
}

export interface ShopifyRemoteSyncState {
  storeDomain: string;
  warningActive: boolean;
  warningTitle: string;
  warningMessage: string;
  syncingInRealtime: boolean;
  lastSuccessfulSync: string;
  lastForceSync: string;
  syncedOrders: number;
  syncedCustomers: number;
  syncedProducts: number;
  collectionDelayHours: number;
  webhooks: ShopifyRemoteWebhookHealth[];
}

export interface ShopifyRemoteSyncLog {
  id: string;
  startedAt: string;
  completedAt: string;
  status: "Success" | "Warning" | "Failed";
  ordersImported: number;
  customersImported: number;
  productsImported: number;
  summary: string;
}

export interface ShopifySyncStatusResponse {
  syncState: ShopifyRemoteSyncState;
  logs: ShopifyRemoteSyncLog[];
}

export interface ShopifyRunSyncResponse {
  success?: boolean;
  status?: "Success" | "Warning" | "Failed";
  message?: string;
  timestamp?: string;
  counts?: {
    products: number;
    customers: number;
    orders: number;
  };
  syncState?: ShopifyRemoteSyncState;
  log?: ShopifyRemoteSyncLog;
  customers?: ShopifyImportedCustomer[];
  orders?: ShopifyImportedOrder[];
  products?: ShopifyImportedProduct[];
}

export const SHOPIFY_SYNC_API_URL =
  process.env.EXPO_PUBLIC_SHOPIFY_SYNC_API_URL?.trim() ?? "";

export const SHOPIFY_STORE_DOMAIN =
  process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() ??
  "houseofshirtsx.com";

export const hasShopifySyncApiConfig = () => Boolean(SHOPIFY_SYNC_API_URL);
