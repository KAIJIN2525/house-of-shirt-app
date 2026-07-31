import {
  normalizeShopifySyncLogs,
  useAdminContentStore,
} from "@/stores/adminContentStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminShopifySyncHistoryScreen() {
  const router = useRouter();
  const {  isDark  } = useThemeStore();
  const {  shopifySyncLogs  } = useAdminContentStore();
  const safeShopifySyncLogs = normalizeShopifySyncLogs(shopifySyncLogs);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <View className="w-4" />
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            SHOPIFY AUDIT LOG
          </Text>
          <Text className="mt-2 font-bold text-[42px] leading-[40px] text-black dark:text-white">
            Sync History
          </Text>
        </View>

        <View className="mt-8 gap-4 px-6">
          {safeShopifySyncLogs.length > 0 ? (
            safeShopifySyncLogs.map((log) => (
              <View key={log.id} className="bg-white px-5 py-5">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`font-bold text-[11px] tracking-[1.4px] ${
                    log.status === "Success"
                      ? "text-[#42a85f]"
                      : log.status === "Failed"
                        ? "text-[#ef4444]"
                        : "text-[#c98a24]"
                  }`}
                >
                  {log.status.toUpperCase()}
                </Text>
                <Text className="font-normal text-[11px] text-neutral-400">
                  {log.completedAt}
                </Text>
              </View>

              <Text className="mt-4 font-normal text-[13px] leading-6 text-neutral-600">
                {log.summary}
              </Text>

              <View className="mt-5 flex-row flex-wrap gap-x-8 gap-y-3">
                <View>
                  <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-300">
                    ORDERS
                  </Text>
                  <Text className="mt-1 font-bold text-[16px] text-black">
                    {log.ordersImported}
                  </Text>
                </View>
                <View>
                  <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-300">
                    CUSTOMERS
                  </Text>
                  <Text className="mt-1 font-bold text-[16px] text-black">
                    {log.customersImported}
                  </Text>
                </View>
                <View>
                  <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-300">
                    PRODUCTS
                  </Text>
                  <Text className="mt-1 font-bold text-[16px] text-black">
                    {log.productsImported}
                  </Text>
                </View>
              </View>
              </View>
            ))
          ) : (
            <View className="bg-white px-5 py-6">
              <Text className="font-bold text-[14px] text-black">
                No sync logs yet
              </Text>
              <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                Force a Shopify sync from the dashboard to create the first
                audit entry.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
