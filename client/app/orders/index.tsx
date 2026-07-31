import { formatPrice } from "@/constants";
import { useOrdersStore } from "@/stores/ordersStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, InteractionManager, RefreshControl, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { HapticPressable } from "@/components/HapticPressable";

import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

function OrderSkeleton() {
  return (
    <View className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215] gap-4">
      <View className="flex-row items-start justify-between">
        <View className="gap-2">
          <View className="h-4 w-28 rounded bg-gray-100 dark:bg-white/10" />
          <View className="h-3 w-40 rounded bg-gray-100 dark:bg-white/10" />
        </View>
        <View className="h-6 w-20 rounded bg-gray-100 dark:bg-white/10" />
      </View>
      <View className="flex-row gap-3 border-t border-gray-100 pt-4">
        <View className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-white/10" />
        <View className="flex-1 gap-2 justify-center">
          <View className="h-4 w-3/4 rounded bg-gray-100 dark:bg-white/10" />
          <View className="h-3 w-1/2 rounded bg-gray-100 dark:bg-white/10" />
          <View className="h-4 w-1/3 rounded bg-gray-100 dark:bg-white/10" />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1 h-10 rounded bg-gray-200 dark:bg-white/10" />
        <View className="flex-1 h-10 rounded bg-gray-100 dark:bg-white/5" />
      </View>
    </View>
  );
}

const formatOrderReference = (id: string) => id.startsWith("#") ? id : `#${id}`;

function getOrderDisplayTitle(order: { title?: string; lineItems?: Array<{ title?: string; quantity?: number }> }) {
  const items = order.lineItems ?? [];
  if (items.length === 0) return order.title ?? "Order";

  const first = items[0].title;
  if (!first || first === "House Piece") return order.title ?? "Order";

  if (items.length === 1) return first;
  return `${first} +${items.length - 1} more`;
}

function getOrderSubtitle(order: { lineItems?: Array<{ quantity?: number }> }) {
  const items = order.lineItems ?? [];
  if (items.length === 0) return null;
  const totalQty = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);
  return `${totalQty} item${totalQty === 1 ? "" : "s"}`;
}

const isFallbackOrderImage = (image?: string) =>
  !image ||
  image.includes("images.unsplash.com/photo-1595777457583") ||
  image.includes("images.unsplash.com/photo-1521572163474") ||
  image.includes("images.unsplash.com/photo-1603252109303");

function OrderImageFallback({ isDark }: { isDark: boolean }) {
  return (
    <View className="h-16 w-16 items-center justify-center rounded-lg bg-white dark:bg-[#0b0d10] border border-white/10">
      <Ionicons name="bag-handle-outline" size={26} color={isDark ? "#f8fafc" : "#111111"} />
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { myOrders: orders, fetchMyOrders } = useOrdersStore();
  const { isDark } = useThemeStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  const loadOrders = React.useCallback(async () => {
    try {
      await fetchMyOrders();
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchMyOrders]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void loadOrders();
    });

    return () => task.cancel();
  }, [loadOrders]);

  const showSkeleton = isInitialLoading;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#ffffff" : "#111111"}
          />
        }
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <HapticPressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#ffffff" : "#111111"} />
          </HapticPressable>
          <Text className="font-bold text-[11px] tracking-[1.8px] text-black dark:text-white">
            ORDERS
          </Text>
          <View className="w-6" />
        </View>

        <View className="px-6">
          <Text className="font-light text-[10px] tracking-[1.5px] text-neutral-400">
            ORDER HISTORY
          </Text>
          <Text className="mt-2 font-bold text-[38px] leading-[40px] text-black dark:text-white">
            Track Your{"\n"}Editorial Orders
          </Text>
        </View>

        {isInitialLoading ? (
          <View className="mx-6 mt-6 rounded-[28px] border border-black/5 bg-white px-5 py-5 dark:border-white/10 dark:bg-[#101215]">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#111111"} />
              <View className="flex-1">
                <Text className="font-bold text-[11px] tracking-[1.4px] text-black dark:text-white">
                  LOADING ORDERS
                </Text>
                <Text className="mt-1 font-normal text-[12px] text-neutral-500 dark:text-neutral-400">
                  Fetching your latest order history...
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className="mt-8 px-6">
          <View className="gap-4">
            {showSkeleton ? (
              <>
                <OrderSkeleton />
                <OrderSkeleton />
                <OrderSkeleton />
              </>
            ) : orders.length === 0 ? (
              <View className="items-center justify-center py-20 px-10">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 mb-6">
                  <Ionicons name="cart-outline" size={32} color={isDark ? "#555" : "#ccc"} />
                </View>
                <Text className="text-center font-bold text-[18px] text-black dark:text-white mb-2">
                  No orders yet.
                </Text>
                <Text className="text-center font-normal text-[14px] text-neutral-400 mb-8">
                  Your tailored journey hasn&apos;t started yet. Browse our curated selection and find your first masterpiece.
                </Text>
                <HapticPressable
                  onPress={() => router.push("/(tabs)/shop")}
                  className="bg-black dark:bg-white px-8 py-4 rounded-full"
                >
                  <Text className="font-bold text-[12px] tracking-[1.5px] text-white dark:text-black">
                    START SHOPPING
                  </Text>
                </HapticPressable>
              </View>
            ) : (
              orders.map((order) => {
                const displayTitle = getOrderDisplayTitle(order);
                const subtitle = getOrderSubtitle(order);

                return (
                  <View key={order.id} className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
                    <View className="flex-row items-start justify-between">
                      <View>
                        <Text className="font-bold text-[16px] text-black dark:text-white">
                          {formatOrderReference(order.id)}
                        </Text>
                        <Text className="mt-1 font-normal text-[12px] text-neutral-500">
                          Expected / delivered {order.estimatedArrival}
                        </Text>
                      </View>

                      <View
                        className={`px-3 py-1 ${
                          order.status === "Delivered" ? "bg-[#eaf5ef]" : order.status === "Cancelled" ? "bg-[#fef2f2]" : "bg-[#eef2f7]"
                        }`}
                      >
                        <Text
                          className={`font-bold text-[10px] tracking-[1.2px] ${
                            order.status === "Delivered" ? "text-[#2c6b46]" : order.status === "Cancelled" ? "text-[#b91c1c]" : "text-[#44546a]"
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-4 flex-row gap-3 border-t border-gray-100 pt-4">
                      {isFallbackOrderImage(order.image) ? (
                        <OrderImageFallback isDark={isDark} />
                      ) : (
                        <Image
                          source={{ uri: order.image }}
                          className="h-16 w-16 rounded-lg bg-gray-100"
                          resizeMode="cover"
                        />
                      )}
                      <View className="flex-1">
                        <Text numberOfLines={2} className="font-bold text-[15px] text-black dark:text-white">
                          {displayTitle}
                        </Text>
                        {subtitle ? (
                          <Text className="mt-1 font-normal text-[12px] text-neutral-400">
                            {subtitle}
                          </Text>
                        ) : null}
                        <Text className="mt-3 font-bold text-[14px] text-black dark:text-white">
                          {formatPrice(order.total)}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-4 flex-row gap-3">
                      <HapticPressable
                        onPress={() => router.push(`/orders/${order.id}` as any)}
                        className="flex-1 bg-black py-3"
                      >
                        <Text className="text-center font-bold text-[11px] tracking-[1.9px] text-white">
                          TRACK ORDER
                        </Text>
                      </HapticPressable>
                      <HapticPressable
                        onPress={() => router.push(`/orders/${order.id}` as any)}
                        className="flex-1 border border-black py-3 dark:border-white"
                      >
                        <Text className="text-center font-bold text-[11px] tracking-[1.9px] text-black dark:text-white">
                          VIEW DETAILS
                        </Text>
                      </HapticPressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
