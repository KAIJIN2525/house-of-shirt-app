import { formatPrice } from "@/constants";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {  isDark  } = useThemeStore();

  const orderNumber = (params.orderNumber as string) ?? "#HS-89201";
  const expectedDate = (params.expectedDate as string) ?? "Oct 12 - Oct 14";
  const itemName = (params.itemName as string) ?? "The Essential Oxford Shirt";
  const itemPrice = Number(params.itemPrice ?? 185000);
  const tailoringFee = Number(params.tailoringFee ?? 45000);
  const total = Number(params.total ?? itemPrice + tailoringFee);

  const items: Array<{
    name: string;
    price: number;
    quantity: number;
    variantTitle?: string;
  }> = React.useMemo(() => {
    if (params.items) {
      try {
        return JSON.parse(params.items as string);
      } catch (e) {
        console.error("Failed to parse checkout items:", e);
      }
    }
    return [{ name: itemName, price: itemPrice, quantity: 1 }];
  }, [params.items, itemName, itemPrice]);

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
          <Pressable onPress={() => router.replace("/(tabs)" as any)}>
            <Ionicons name="close" size={18} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
        </View>

        <View className="items-center px-8 pt-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-black/20 bg-white dark:border-white/15 dark:bg-[#101215]">
            <Ionicons name="checkmark" size={28} color="#6b7280" />
          </View>

          <Text className="mt-8 text-center font-bold text-[52px] leading-[56px] text-black dark:text-white">
            Thank you{"\n"}for your{"\n"}order.
          </Text>
          <Text className="mt-4 text-center font-normal text-[15px] text-neutral-400">
            Your sartorial journey continues.
          </Text>
        </View>

        <View className="mt-8 px-4">
          <View className="rounded-[32px] bg-white px-6 py-6 dark:bg-[#101215]">
            <View className="flex-row items-start justify-between border-b border-gray-100 pb-5">
              <View>
                <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-400">
                  CONFIRMATION
                </Text>
                <Text className="mt-2 font-bold text-[22px] leading-6 text-black dark:text-white">
                  {orderNumber}
                </Text>
              </View>
              <View className="flex-1 ml-4 items-end">
                <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-400">
                  EXPECTED
                </Text>
                <Text 
                  numberOfLines={1}
                  className="mt-2 font-bold text-[14px] text-black dark:text-white"
                >
                  {expectedDate}
                </Text>
              </View>

            </View>

            <View className="py-5">
              <Text className="font-bold text-[10px] tracking-[1.2px] uppercase text-neutral-400">
                SARTORIAL COLLECTION
              </Text>

              <View className="mt-5 gap-4">
                {items.map((item, index) => (
                  <View key={`${item.name}-${index}`} className="flex-row items-start justify-between gap-4">
                    <View className="flex-1 pr-2">
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        className="font-normal text-[15px] text-neutral-500 dark:text-neutral-400"
                      >
                        {item.name}
                        {item.quantity > 1 ? ` x${item.quantity}` : ""}
                      </Text>
                      {item.variantTitle ? (
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          className="mt-1 font-bold text-[10px] tracking-[1.2px] uppercase text-neutral-400"
                        >
                          {item.variantTitle}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="font-bold text-[16px] text-neutral-500 dark:text-neutral-400">
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}

                <View className="flex-row items-center justify-between">
                  <Text className="font-normal text-[15px] text-neutral-500 dark:text-neutral-400">
                    Delivery Fee
                  </Text>
                  <Text className="font-bold text-[16px] text-neutral-500 dark:text-neutral-400">
                    {formatPrice(tailoringFee)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-100 pt-5">
              <Text className="font-bold text-[20px] text-black dark:text-white">
                TOTAL
              </Text>
              <Text className="font-bold text-[28px] text-black dark:text-white">
                {formatPrice(total)}
              </Text>
            </View>
          </View>
        </View>
        <View className="mt-8 px-6">
          <Pressable
            onPress={() => router.push(`/orders/${orderNumber.replace("#", "")}` as any)}
            className="bg-black py-4"
          >
            <Text className="text-center font-bold text-[12px] tracking-[1.8px] text-white">
              Track Order
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)" as any)}
            className="mt-3 border border-gray-200 bg-white py-4 dark:border-white/10 dark:bg-[#101215]"
          >
            <Text className="text-center font-bold text-[12px] tracking-[1.8px] text-neutral-700 dark:text-white">
              Continue Shopping
            </Text>
          </Pressable>
        </View>

        <View className="mt-12 px-6">
          <Image
            source={require("../../assets/images/img1.jpeg")}
            className="h-32 w-full"
            resizeMode="cover"
          />
          <Text className="mt-4 text-center font-bold text-[10px] tracking-[2.6px] text-neutral-400">
            HANDCRAFTED IN OUR LONDON ATELIER
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
