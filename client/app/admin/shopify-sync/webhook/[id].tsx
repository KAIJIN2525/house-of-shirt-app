import {
  normalizeShopifySyncState,
  useAdminContentStore,
} from "@/stores/adminContentStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../../global.css";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminShopifyWebhookDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {  shopifySync  } = useAdminContentStore();
  const { isDark } = useThemeStore();
  const safeShopifySync = normalizeShopifySyncState(shopifySync);
  const webhook = safeShopifySync.webhooks.find((item) => item.id === id);

  if (!webhook) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f4f5f7] px-6 dark:bg-[#050505]">
        <Text className="font-bold text-[24px] text-black dark:text-white">
          Webhook not found
        </Text>
        <Text className="mt-3 text-center font-normal text-[12px] leading-5 text-neutral-500">
          No webhook data yet. Run a Shopify sync or return to the sync
          dashboard.
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} className="mt-6 bg-black px-6 py-4 dark:bg-white">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-white dark:text-black">
            GO BACK
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <View className="w-4" />
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            WEBHOOK DIAGNOSTICS
          </Text>
          <Text className="mt-2 font-bold text-[42px] leading-[40px] text-black dark:text-white">
            {webhook.topic}
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="gap-4">
            <View className="bg-white px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-300">
                DELIVERY HEALTH
              </Text>
              <Text className="mt-4 font-bold text-[30px] text-black">
                {webhook.successRate.toFixed(1)}%
              </Text>
              <Text className="mt-2 font-normal text-[12px] text-neutral-500">
                Successful webhook deliveries across the latest sync window.
              </Text>
            </View>

            <View className="bg-white px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-300">
                LATENCY
              </Text>
              <Text className="mt-4 font-bold text-[30px] text-black">
                {webhook.latencyMs}ms
              </Text>
              <Text className="mt-2 font-normal text-[12px] text-neutral-500">
                Average webhook processing delay observed by the admin sync monitor.
              </Text>
            </View>

            <View className="bg-white px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-300">
                CURRENT STATUS
              </Text>
              <Text
                className={`mt-4 font-bold text-[24px] ${
                  webhook.status === "Healthy"
                    ? "text-[#42a85f]"
                    : webhook.status === "Warning"
                      ? "text-[#c98a24]"
                      : "text-[#ef6b6b]"
                }`}
              >
                {webhook.status.toUpperCase()}
              </Text>
              <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                {webhook.status === "Delayed"
                  ? "This endpoint is currently outside the normal delivery window and may cause stale collection or catalog data."
                  : webhook.status === "Warning"
                    ? "This endpoint is slower than ideal and should be watched during the next sync cycle."
                    : "This endpoint is healthy and processing within expected thresholds."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
