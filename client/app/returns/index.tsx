import { formatPrice } from "@/constants";
import { useReturnsStore } from "@/stores/returnsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

export default function ReturnsHistoryScreen() {
  const router = useRouter();
  const {  requests, markAllRequestsRead  } = useReturnsStore();
  const {  isDark  } = useThemeStore();

  useEffect(() => {
    void markAllRequestsRead();
  }, [markAllRequestsRead]);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
          <Text className="font-bold text-[11px] tracking-[1.8px] text-black dark:text-white">
            RETURNS
          </Text>
          <View className="w-6" />
        </View>

        <View className="px-6">
          <Text className="font-light text-[10px] tracking-[1.5px] text-neutral-400">
            POST-PURCHASE CARE
          </Text>
          <Text className="mt-2 font-bold text-[38px] leading-[40px] text-black dark:text-white">
            Returns &{"\n"}Exchanges
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="gap-4">
            {requests.map((request) => (
              <Pressable
                key={request.id}
                onPress={() => router.push(`/returns/status/${request.id}` as any)}
                className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]"
              >
                <View className="flex-row items-start justify-between">
                  <View>
                    <Text className="font-bold text-[16px] text-black dark:text-white">
                      {request.type === "exchange" ? "Exchange" : "Return"} #{request.rmaNumber}
                    </Text>
                    <Text className="mt-1 font-normal text-[12px] text-neutral-500">
                      Linked to order #{request.orderId}
                    </Text>
                  </View>

                  <View className="bg-[#eef2f7] px-3 py-1">
                    <Text className="font-bold text-[10px] tracking-[1.2px] text-[#44546a]">
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row gap-3 border-t border-gray-100 pt-4">
                  <Image
                    source={{ uri: request.itemImage }}
                    className="h-16 w-16 rounded-lg bg-gray-100"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="font-bold text-[15px] text-black">
                      {request.itemTitle}
                    </Text>
                    <Text className="mt-1 font-normal text-[12px] text-neutral-400">
                      {request.itemSubtitle}
                    </Text>
                    <Text className="mt-2 font-bold text-[14px] text-black dark:text-white">
                      {formatPrice(request.itemPrice)}
                    </Text>
                  </View>
                </View>

                <Text className="mt-4 font-normal text-[12px] leading-5 text-neutral-400">
                  Reason: {request.reason}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
