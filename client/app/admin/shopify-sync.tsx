import {
  SHOPIFY_STORE_DOMAIN,
  hasShopifySyncApiConfig,
  type ShopifyRunSyncResponse,
  type ShopifySyncStatusResponse,
} from "@/constants/shopify";
import {
  normalizeShopifySyncLogs,
  normalizeShopifySyncState,
  useAdminContentStore,
} from "@/stores/adminContentStore";
import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { HouseLoader } from "@/components/loading/HouseLoader";
import { useOrdersStore } from "@/stores/ordersStore";
import { useProductsStore } from "@/stores/productsStore";
import {
  getShopifySyncStatus,
  runRemoteShopifySync,
} from "@/services/shopify-sync";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { useToastStore } from "@/stores/toastStore";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminShopifySyncScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const showToast = useToastStore((state) => state.showToast);
  const { customers, importShopifyCustomers, fetchCustomers } = useAdminCustomersStore();
  const { orders, importShopifyOrders, fetchOrders } = useOrdersStore();
  const { products, importShopifyProducts, fetchProducts } = useProductsStore();
  const {
    shopifySync,
    shopifySyncLogs,
    hydrateShopifySync,
    dismissShopifyWarning,
    fetchSyncLogs,
  } = useAdminContentStore();

  const safeShopifySync = useMemo(
    () => normalizeShopifySyncState(shopifySync),
    [shopifySync]
  );
  const safeShopifySyncLogs = useMemo(
    () => normalizeShopifySyncLogs(shopifySyncLogs),
    [shopifySyncLogs]
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncModeMessage, setSyncModeMessage] = useState(
    hasShopifySyncApiConfig()
      ? "Backend endpoint detected. Live sync mode is ready."
      : "Using local sync mode until EXPO_PUBLIC_SHOPIFY_SYNC_API_URL is configured."
  );

  const hydrateRemoteStatus = useCallback(
    async (status: ShopifySyncStatusResponse) => {
      await hydrateShopifySync({
        syncState: {
          ...status.syncState,
          storeDomain: status.syncState.storeDomain || SHOPIFY_STORE_DOMAIN,
        },
        logs: status.logs,
      });
    },
    [hydrateShopifySync]
  );

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchCustomers(),
      fetchOrders(),
      fetchProducts(),
      fetchSyncLogs(),
    ]);
  }, [fetchCustomers, fetchOrders, fetchProducts, fetchSyncLogs]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAllData()]);
    if (hasShopifySyncApiConfig()) {
      try {
        const status = await getShopifySyncStatus();
        await hydrateRemoteStatus(status);
      } catch (e) {}
    }
    setRefreshing(false);
  }, [fetchAllData, hydrateRemoteStatus]);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const syncStatusFromBackend = async () => {
      if (!hasShopifySyncApiConfig()) {
        return;
      }

      try {
        const status = await getShopifySyncStatus();
        await hydrateRemoteStatus(status);
        setSyncModeMessage("Connected to Shopify sync backend.");
      } catch (error) {
        setSyncModeMessage(
          error instanceof Error
            ? `Backend unavailable. ${error.message}`
            : "Backend unavailable."
        );
      }
    };

    void syncStatusFromBackend();
  }, [hydrateRemoteStatus]);

  const bars = useMemo(
    () =>
      safeShopifySync.webhooks.map((webhook) => ({
        id: webhook.id,
        topic: webhook.topic,
        height: Math.max(36, Math.round(webhook.successRate)),
        delayed: webhook.status !== "Healthy",
      })),
    [safeShopifySync.webhooks]
  );

  const applySyncResult = async (result: ShopifyRunSyncResponse | any) => {
    const remoteCustomers = Array.isArray(result?.customers) ? result.customers : [];
    const remoteOrders = Array.isArray(result?.orders) ? result.orders : [];
    const remoteProducts = Array.isArray(result?.products) ? result.products : [];

    const importedCustomerCount =
      remoteCustomers.length > 0
        ? await importShopifyCustomers(remoteCustomers)
        : 0;
    const importedOrderCount =
      remoteOrders.length > 0 ? await importShopifyOrders(remoteOrders) : 0;
    const importedProductCount =
      remoteProducts.length > 0
        ? await importShopifyProducts(remoteProducts)
        : 0;

    await Promise.all([fetchCustomers(), fetchOrders(), fetchProducts()]);

    if (!result?.syncState || !result?.log) {
      const timestamp = result?.timestamp
        ? new Date(result.timestamp).toLocaleString()
        : new Date().toLocaleString();

      await hydrateShopifySync({
        syncState: {
          ...safeShopifySync,
          lastSuccessfulSync: timestamp,
          syncedOrders: Math.max(
            safeShopifySync.syncedOrders,
            orders.length + importedOrderCount
          ),
          syncedCustomers: Math.max(
            safeShopifySync.syncedCustomers,
            customers.length + importedCustomerCount
          ),
          syncedProducts: Math.max(
            safeShopifySync.syncedProducts,
            products.length + importedProductCount
          ),
        },
        logs: safeShopifySyncLogs,
      });

      setSyncModeMessage(
        result?.message ||
          "Shopify sync completed. Refreshed live catalog and admin data from Supabase."
      );
      return;
    }

    await hydrateShopifySync({
      syncState: {
        ...result.syncState,
        storeDomain: result.syncState.storeDomain || SHOPIFY_STORE_DOMAIN,
        syncedOrders: Math.max(
          result.syncState.syncedOrders,
          orders.length + importedOrderCount
        ),
        syncedCustomers: Math.max(
          result.syncState.syncedCustomers,
          customers.length + importedCustomerCount
        ),
        syncedProducts: Math.max(
          result.syncState.syncedProducts,
          products.length + importedProductCount
        ),
      },
      logs: [result.log, ...safeShopifySyncLogs],
    });
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      if (hasShopifySyncApiConfig()) {
        const remoteResult = await runRemoteShopifySync();
        await applySyncResult(remoteResult);
        showToast({
          message: "Live Shopify sync completed successfully.",
          type: "success",
        });
        setSyncModeMessage("Connected to Shopify sync backend.");
        return;
      }
      throw new Error("Shopify sync backend is not configured.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      setSyncModeMessage(`Backend unavailable. ${message}`);
      showToast({
        message,
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Determine active status configurations
  const isFailed =
    syncModeMessage.includes("failed") ||
    syncModeMessage.includes("unavailable") ||
    syncModeMessage.includes("Invalid JWT") ||
    syncModeMessage.includes("UNAUTHORIZED");

  const statusColor = isFailed
    ? "bg-red-500"
    : isSyncing
    ? "bg-amber-500"
    : "bg-[#10b981]";

  const statusText = isFailed
    ? "DESYNCED"
    : isSyncing
    ? "SYNCING"
    : "CONNECTED";

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      {isSyncing ? (
        <View className="absolute inset-0 z-50 items-center justify-center bg-white/90 dark:bg-black/90">
          <HouseLoader label="SYNCING SHOPIFY" />
        </View>
      ) : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Navigation Header */}
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.navigate("/admin" as any)}>
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/admin/settings" as any)}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>
        </View>

        {/* Actionable warnings */}
        {safeShopifySync.warningActive ? (
          <View className="px-6 mb-6">
            <View className="border-l-2 border-[#ef6b6b] bg-[#fff8f8] dark:bg-red-950/10 px-4 py-4 border border-l-2 border-neutral-100 dark:border-white/5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row gap-3">
                  <Ionicons name="warning-outline" size={18} color="#ef6b6b" />
                  <View className="flex-1">
                    <Text className="font-bold text-[11px] tracking-[1.5px] text-[#ef6b6b]">
                      {safeShopifySync.warningTitle}
                    </Text>
                    <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                      {safeShopifySync.warningMessage}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => void dismissShopifyWarning()}>
                  <Ionicons name="close" size={16} color="#a0a7b3" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {/* CONNECTION STATUS - REDESIGNED PREMIUM FLUID CARD */}
        <View className="px-6">
          <View className="bg-white dark:bg-[#101215] px-6 py-6 border border-neutral-100 dark:border-white/5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-3 py-1 border border-neutral-100 dark:border-white/5">
                <View className={`h-2 w-2 rounded-full ${statusColor}`} />
                <Text
                  className={`font-bold text-[9px] tracking-[1px] ${
                    isFailed
                      ? "text-red-500"
                      : isSyncing
                      ? "text-amber-500"
                      : "text-[#10b981]"
                  }`}
                >
                  {statusText}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-[9px] tracking-[1.5px] text-neutral-400">
                  LAST RUN TIME
                </Text>
              </View>
            </View>

            <Text className="mt-4 font-bold text-[36px] leading-[40px] text-black dark:text-white">
              Shopify Sync
            </Text>
            <Text className="mt-1 font-bold text-[18px] text-[#44618e] dark:text-[#6a87b5]">
              {safeShopifySync.lastSuccessfulSync || "Never Completed"}
            </Text>

            {/* Force Sync Action Button */}
            <Pressable
              disabled={isSyncing}
              onPress={handleForceSync}
              className="mt-6 bg-black dark:bg-white py-4 items-center justify-center"
            >
              <Text className="font-bold text-[11px] tracking-[2px] text-white dark:text-black uppercase">
                {isSyncing ? "SYNCHRONIZING..." : "FORCE CATALOG RE-SYNC"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* DETAILED DIAGNOSTIC REPORT / MESSAGES - SHIFTED BELOW THE MAIN CARD */}
        <View className="mt-4 px-6">
          <View
            className={`p-5 border shadow-sm ${
              isFailed
                ? "bg-red-50/30 dark:bg-red-950/10 border-red-100/80 dark:border-red-900/20"
                : "bg-white dark:bg-[#101215] border-neutral-100 dark:border-white/5"
            }`}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons
                name={isFailed ? "alert-circle" : "checkmark-circle"}
                size={16}
                color={isFailed ? "#ef4444" : "#10b981"}
              />
              <Text className={`font-bold text-[10px] tracking-[1.2px] ${isFailed ? "text-red-500" : "text-neutral-400"}`}>
                {isFailed ? "SYNC DIAGNOSTIC REPORT" : "SYSTEM MESSAGE"}
              </Text>
            </View>

            <Text
              className={`font-semibold text-xs leading-5 ${
                isFailed
                  ? "text-red-700 dark:text-red-300"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {syncModeMessage}
            </Text>
          </View>
        </View>

        {/* WEBHOOK HEALTH TRENDS */}
        <View className="mt-6 px-6">
          <View className="bg-white dark:bg-[#101215] border border-neutral-100 dark:border-white/5 px-5 py-5 shadow-sm">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 uppercase">
                WEBHOOK HEALTH TRENDS
              </Text>
              <Pressable
                onPress={() =>
                  router.push("/admin/shopify-sync/history" as any)
                }
              >
                <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500 uppercase">
                  VIEW LOGS
                </Text>
              </Pressable>
            </View>

            <View className="h-44 flex-row items-end justify-between gap-3">
              {bars.map((bar) => (
                <View key={bar.id} className="flex-1 items-center">
                  <View
                    style={{ height: bar.height }}
                    className={`w-full ${
                      bar.delayed ? "bg-[#ef6b6b]" : "bg-black dark:bg-white"
                    }`}
                  />
                  <Text className="mt-3 text-center font-bold text-[8px] tracking-[1.1px] text-neutral-400 uppercase">
                    {bar.topic.split("/")[0].toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SNAPSHOT & DOMAIN INFO */}
        <View className="mt-6 px-6">
          <View className="gap-4">
            <View className="bg-white dark:bg-[#101215] border border-neutral-100 dark:border-white/5 px-5 py-5 shadow-sm">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 uppercase">
                STORE DOMAIN
              </Text>
              <Text className="mt-3 font-bold text-[24px] leading-8 text-black dark:text-white">
                {safeShopifySync.storeDomain}
              </Text>
            </View>

            <View className="bg-white dark:bg-[#101215] border border-neutral-100 dark:border-white/5 px-5 py-5 shadow-sm">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 uppercase">
                SYNC SNAPSHOT
              </Text>
              <View className="mt-5 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-normal text-[13px] text-neutral-500 dark:text-neutral-400">
                    Orders Synced
                  </Text>
                  <Text className="font-bold text-[14px] text-black dark:text-white">
                    {orders.length}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="font-normal text-[13px] text-neutral-500 dark:text-neutral-400">
                    Customers Synced
                  </Text>
                  <Text className="font-bold text-[14px] text-black dark:text-white">
                    {customers.length}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="font-normal text-[13px] text-neutral-500 dark:text-neutral-400">
                    Products Synced
                  </Text>
                  <Text className="font-bold text-[14px] text-black dark:text-white">
                    {products.length}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="font-normal text-[13px] text-neutral-500 dark:text-neutral-400">
                    Collection Delay
                  </Text>
                  <Text className="font-bold text-[14px] text-black dark:text-white">
                    {safeShopifySync.collectionDelayHours > 0
                      ? `${safeShopifySync.collectionDelayHours}h`
                      : "None"}
                  </Text>
                </View>
              </View>
            </View>

            {/* ENDPOINT STATUS */}
            <View className="bg-white dark:bg-[#101215] border border-neutral-100 dark:border-white/5 px-5 py-5 shadow-sm">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 uppercase">
                ENDPOINT STATUS
              </Text>
              <View className="mt-5 gap-3">
                {safeShopifySync.webhooks.length > 0 ? (
                  safeShopifySync.webhooks.map((webhook) => (
                    <View
                      key={webhook.id}
                      className="flex-row items-center justify-between bg-neutral-50 dark:bg-neutral-900/60 px-4 py-4 border border-neutral-100 dark:border-white/5"
                    >
                      <View className="flex-1">
                        <Text className="font-bold text-[12px] text-black dark:text-white">
                          {webhook.topic}
                        </Text>
                        <Text className="mt-1 font-normal text-[11px] text-neutral-400 dark:text-neutral-500">
                          {webhook.successRate.toFixed(1)}% success |{" "}
                          {webhook.latencyMs}ms latency
                        </Text>
                      </View>
                      <Text
                        className={`font-bold text-[10px] tracking-[1.3px] ${
                          webhook.status === "Healthy"
                            ? "text-[#42a85f]"
                            : webhook.status === "Warning"
                            ? "text-[#c98a24]"
                            : "text-[#ef6b6b]"
                        }`}
                      >
                        {webhook.status.toUpperCase()}
                      </Text>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/admin/shopify-sync/webhook/[id]",
                            params: { id: webhook.id },
                          } as any)
                        }
                        className="ml-4"
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={isDark ? "#ffffff" : "#111111"}
                        />
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <View className="bg-neutral-50 dark:bg-neutral-900/60 px-4 py-5 border border-neutral-100 dark:border-white/5">
                    <Text className="font-bold text-[12px] text-black dark:text-white">
                      No webhook data yet
                    </Text>
                    <Text className="mt-2 font-normal text-[11px] leading-5 text-neutral-400 dark:text-neutral-500">
                      Run a Shopify sync or connect the backend endpoint to
                      populate endpoint health.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* RECENT SYNC LOG */}
            <View className="bg-white dark:bg-[#101215] border border-neutral-100 dark:border-white/5 px-5 py-5 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 uppercase">
                  RECENT SYNC LOG
                </Text>
                <Pressable
                  onPress={() =>
                    router.push("/admin/shopify-sync/history" as any)
                  }
                >
                  <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500 uppercase">
                    FULL HISTORY
                  </Text>
                </Pressable>
              </View>
              {safeShopifySyncLogs.length > 0 ? (
                safeShopifySyncLogs.slice(0, 2).map((log) => (
                  <View
                    key={log.id}
                    className="mt-4 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-4 border border-neutral-100 dark:border-white/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-bold text-[12px] text-black dark:text-white">
                        {log.status.toUpperCase()}
                      </Text>
                      <Text className="font-normal text-[11px] text-neutral-400 dark:text-neutral-500">
                        {log.completedAt}
                      </Text>
                    </View>
                    <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                      {log.summary}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="mt-4 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-4 border border-neutral-100 dark:border-white/5">
                  <Text className="font-bold text-[12px] text-black dark:text-white">
                    No sync logs yet
                  </Text>
                  <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                    Force a sync to create the first audit entry.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
