import { formatPrice } from "@/constants";
import { useReturnsStore } from "@/stores/returnsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

export default function ReturnStatusScreen() {
  const router = useRouter();
  const {  getRequestById, markRequestRead  } = useReturnsStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {  isDark  } = useThemeStore();
  const request = getRequestById(id);

  useEffect(() => {
    if (id) {
      markRequestRead(id);
    }
  }, [id, markRequestRead]);

  if (!request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f6f8] px-6 dark:bg-[#050505]">
        <Text className="text-center font-bold text-[24px] text-black dark:text-white">
          Return request not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
          <Text className="font-bold text-[14px] text-black dark:text-white">
            Return Status
          </Text>
          <View className="w-6" />
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            RMA #{request.rmaNumber}
          </Text>
          <Text className="mt-2 font-bold text-[34px] leading-9 text-black dark:text-white">
            {request.status}
          </Text>
          <Text className="mt-4 font-normal text-[16px] leading-7 text-neutral-500">
            {request.type === "exchange"
              ? `Your exchange was created on ${request.submittedAt} and our Atelier is preparing the next step for your replacement piece.`
              : `Your return was received on ${request.submittedAt} and is being handled by our Atelier team with the same care as your order.`}
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-4 py-4 dark:bg-[#101215]">
            <View className="flex-row gap-4">
              <Image
                source={{ uri: request.itemImage }}
                className="h-24 w-20 bg-gray-100"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="font-bold text-[22px] leading-6 text-black dark:text-white">
                  {request.itemTitle}
                </Text>
                <Text className="mt-2 font-bold text-[11px] tracking-[1.4px] text-neutral-400">
                  {request.itemSubtitle.toUpperCase()}
                </Text>
                <Text className="mt-4 font-bold text-[18px] text-black dark:text-white">
                  {formatPrice(request.itemPrice)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="rounded-[30px] bg-white px-5 py-5 dark:bg-[#101215]">
            {request.timeline.map((event, index) => (
              <View key={event.id} className="flex-row">
                <View className="mr-4 items-center">
                  <View
                    className={`h-3 w-3 rounded-full ${
                      event.active ? "bg-black dark:bg-white" : "border border-gray-300 bg-white dark:border-white/15 dark:bg-[#101215]"
                    }`}
                  />
                  {index !== request.timeline.length - 1 ? (
                    <View className="h-16 w-[1px] bg-[#ececec]" />
                  ) : null}
                </View>

                <View className="flex-1 pb-8">
                  <Text
                    className={`font-bold text-[16px] ${
                      event.active ? "text-black dark:text-white" : "text-neutral-300 dark:text-white"
                    }`}
                  >
                    {event.title}
                  </Text>
                  <Text
                    className={`mt-1 font-normal text-[13px] leading-5 ${
                      event.active ? "text-neutral-400 dark:text-white" : "text-neutral-300 dark:text-white"
                    }`}
                  >
                    {event.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-10 px-6">
          <View className="rounded-[30px] bg-white px-5 py-6 dark:bg-[#101215]">
            <Text className="font-bold text-[26px] text-neutral-700">
              Something not right?
            </Text>
            <Text className="mt-4 font-normal text-[15px] leading-7 text-neutral-400">
              Our concierge team is available to help you with size adjustments
              or exchange queries.
            </Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/support/chat",
                  params: {
                    topic: "returns",
                    orderId: request.orderId || request.id,
                    extraNote: `RMA #${request.rmaNumber} - ${request.status}`,
                  },
                } as any)
              }
              className="mt-8 bg-[#131926] py-4"
            >
              <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
                NEED HELP?
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
