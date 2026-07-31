import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { useOrdersStore } from "@/stores/ordersStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminBlacklistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {  getCustomerById, recordBlacklistDecision  } = useAdminCustomersStore();
  const {  isDark  } = useThemeStore();
  const {  blacklistedOrderAlerts  } = useOrdersStore();
  const customer = getCustomerById(id);

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f4f5f7] px-6">
        <Text className="font-bold text-[24px] text-black">
          Blacklist record not found
        </Text>
      </SafeAreaView>
    );
  }

  const riskOrder = blacklistedOrderAlerts.find(
    (order) => order.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase()
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Back to blacklist" onPress={() => router.navigate("/admin/blacklist" as any)}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable accessibilityRole="button" accessibilityLabel="Open admin dashboard" onPress={() => router.push("/admin" as any)}>
            <Ionicons name="log-out-outline" size={18} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            BLACKLIST REVIEW
          </Text>
          <Text className="mt-2 font-bold text-[44px] leading-[42px] text-black dark:text-white">
            {customer.name}
          </Text>
          <Text className="mt-4 font-normal text-[14px] leading-6 text-neutral-500">
            Review this restricted customer, confirm whether they should remain blocked,
            or restore them if the issue has been resolved.
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
              ACTIVE RESTRICTION
            </Text>
            <Text className="mt-4 font-bold text-[26px] leading-8 text-[#232831]">
              {customer.blacklistReason ?? "Restricted customer review required."}
            </Text>

            {riskOrder ? (
              <View className="mt-5 bg-[#fff4f4] px-4 py-4">
                <Text className="font-bold text-[10px] tracking-[1.4px] text-[#d43c3c]">
                  LIVE ORDER TRIGGER
                </Text>
                <Text className="mt-2 font-normal text-[13px] leading-6 text-[#5f3030]">
                  {riskOrder.id} is currently flagged because this customer placed a new order while restricted.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mt-6 px-6">
          <View className="gap-3">
            <Pressable
              onPress={async () => {
                await recordBlacklistDecision(customer.id, "whitelist");
                router.replace("/admin/blacklist" as any);
              }}
              className="bg-[#171d28] px-5 py-4"
            >
              <Text className="text-center font-bold text-[11px] tracking-[1.7px] text-white">
                WHITELIST CUSTOMER
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await recordBlacklistDecision(customer.id, "keep");
                router.replace("/admin/blacklist" as any);
              }}
              className="border border-[#dce1e7] bg-white px-5 py-4"
            >
              <Text className="text-center font-bold text-[11px] tracking-[1.7px] text-[#232831]">
                KEEP RESTRICTED
              </Text>
            </Pressable>

            <Pressable accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/admin/customer-profile",
                  params: { customerId: customer.id },
                } as any)
              }
              className="border border-[#dce1e7] bg-white px-5 py-4"
            >
              <Text className="text-center font-bold text-[11px] tracking-[1.7px] text-[#232831]">
                OPEN CUSTOMER HISTORY
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
