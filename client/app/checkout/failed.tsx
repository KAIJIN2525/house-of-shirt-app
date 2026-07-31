import { formatPrice } from "@/constants";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

export default function CheckoutFailedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {  isDark  } = useThemeStore();

  const orderNumber = (params.orderNumber as string) ?? "#HS-89201";
  const total = Number(params.total ?? 230000);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-5 pt-4">
          <Text className="font-bold text-[11px] tracking-[1.6px] text-black dark:text-white">
            THE EDITORIAL TAILOR
          </Text>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={18} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
        </View>

        <View className="items-center px-8 pt-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-white dark:border-red-900/40 dark:bg-[#101215]">
            <Ionicons name="close" size={28} color="#dc2626" />
          </View>

          <Text className="mt-8 text-center font-bold text-[48px] leading-[52px] text-black dark:text-white">
            Payment{"\n"}could not{"\n"}be completed.
          </Text>
          <Text className="mt-4 text-center font-normal text-[15px] text-neutral-400">
            Your card was not charged. Please review your details and try again.
          </Text>
        </View>

        <View className="mt-8 px-4">
          <View className="rounded-[32px] bg-white px-6 py-6 dark:bg-[#101215]">
            <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-400">
              ATTEMPTED ORDER
            </Text>
            <Text className="mt-2 font-bold text-[22px] leading-6 text-black dark:text-white">
              {orderNumber}
            </Text>

            <View className="mt-6 rounded-[22px] bg-[#f7f7f7] px-5 py-5 dark:bg-[#17191d]">
              <Text className="font-bold text-[12px] tracking-[1.4px] text-neutral-500">
                POSSIBLE REASONS
              </Text>
              <View className="mt-4 gap-3">
                <Text className="font-normal text-[14px] leading-5 text-neutral-500">
                  Card verification was declined by your provider.
                </Text>
                <Text className="font-normal text-[14px] leading-5 text-neutral-500">
                  Billing information may not match the saved card details.
                </Text>
                <Text className="font-normal text-[14px] leading-5 text-neutral-500">
                  Temporary network interruption during authorization.
                </Text>
              </View>
            </View>

            <View className="mt-6 flex-row items-center justify-between border-t border-gray-100 pt-5">
              <Text className="font-bold text-[18px] text-black dark:text-white">
                Total Attempted
              </Text>
              <Text className="font-bold text-[28px] text-black dark:text-white">
                {formatPrice(total)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <Pressable
            onPress={() => router.replace("/checkout/payment" as any)}
            className="bg-black py-4"
          >
            <Text className="text-center font-bold text-[12px] tracking-[1.8px] text-white">
              Try Again
            </Text>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
