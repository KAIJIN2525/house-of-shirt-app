import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { useOrdersStore } from "@/stores/ordersStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminBlacklistScreen() {
  const router = useRouter();
  const {  customers, toggleBlacklist, fetchCustomers  } = useAdminCustomersStore();
  const {  blacklistedOrderAlerts, fetchOrders  } = useOrdersStore();
  const {  isDark  } = useThemeStore();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    void Promise.all([fetchCustomers(), fetchOrders()]);
  }, [fetchCustomers, fetchOrders]);

  const blacklistedCustomers = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return customers.filter((customer) => {
      if (!customer.blacklisted) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        (customer.blacklistOrderId ?? "").toLowerCase().includes(search)
      );
    });
  }, [customers, searchValue]);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.navigate("/admin" as any)}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/admin/settings" as any)}>
            <Ionicons name="log-out-outline" size={18} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[52px] leading-[50px] text-black dark:text-white">
            Blacklist{"\n"}Management
          </Text>
          <Text className="mt-2 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            MANAGE RESTRICTED PATRONS
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="flex-row items-center bg-white px-4 py-4">
            <Ionicons name="search" size={18} color="#98a1ad" />
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Search by order, email, or name..."
              placeholderTextColor="#98a1ad"
              className="ml-3 flex-1 font-normal text-[13px] text-black"
            />
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-[26px] leading-8 text-[#232831]">
              Flag for{"\n"}Review
            </Text>
            <Text className="font-bold text-[18px] tracking-[1.4px] text-[#e04040]">
              CRITICAL{"\n"}ATTENTION
            </Text>
          </View>
        </View>

        <View className="mt-6 gap-5 px-6">
          {blacklistedCustomers.map((customer) => {
            const relatedRiskOrder = blacklistedOrderAlerts.find(
              (order) =>
                order.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase()
            );

            return (
              <View key={customer.id} className="overflow-hidden bg-white">
                <View className="flex-row">
                  <View className="w-[3px] bg-black" />
                  <View className="flex-1 px-5 py-5">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="font-bold text-[22px] leading-7 text-[#232831]">
                        {customer.name}
                      </Text>
                      <Text className="font-bold text-[10px] tracking-[1.2px] text-[#a3adb9]">
                        #{relatedRiskOrder?.id ?? customer.blacklistOrderId ?? "HS-0000"}
                      </Text>
                    </View>

                    <Text className="mt-5 font-bold text-[10px] tracking-[1.6px] text-[#b7c0cb]">
                      REASON
                    </Text>
                    <Text className="mt-2 font-normal text-[15px] leading-6 text-[#2d333d]">
                      {relatedRiskOrder?.customerRiskReason ??
                        customer.blacklistReason ??
                        "Restricted customer review required before order approval."}
                    </Text>

                    {relatedRiskOrder ? (
                      <View className="mt-4 bg-[#faf4e8] px-4 py-3">
                        <Text className="font-bold text-[10px] tracking-[1.4px] text-[#a16207]">
                          NEW ORDER TRIGGERED
                        </Text>
                        <Text className="mt-2 font-normal text-[12px] leading-5 text-[#5b4c31]">
                          {relatedRiskOrder.id} was placed by a blacklisted customer and needs manual admin review before fulfillment continues.
                        </Text>
                      </View>
                    ) : null}

                    <View className="mt-5 flex-row gap-3">
                      <Pressable
                        onPress={() => void toggleBlacklist(customer.id)}
                        className="bg-black px-6 py-4"
                      >
                        <Text className="font-bold text-[11px] tracking-[1.8px] text-white">
                          BLACKLISTED
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/admin/blacklist/[id]",
                            params: { id: customer.id },
                          } as any)
                        }
                        className="border border-[#dce1e7] bg-white px-5 py-4"
                      >
                        <Text className="font-bold text-[11px] tracking-[1.6px] text-[#232831]">
                          REVIEW
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
