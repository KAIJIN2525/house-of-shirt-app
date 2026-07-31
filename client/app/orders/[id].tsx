import { formatPrice } from "@/constants";
import { useOrdersStore } from "@/stores/ordersStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, Linking, Pressable, ScrollView, Share, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const formatOrderReference = (id: string) => id.startsWith("#") ? id : `#${id}`;

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {  orders, getOrderById  } = useOrdersStore();
  const {  isDark  } = useThemeStore();

  const order =
    getOrderById(id) ??
    orders.find((item) => item.id === "HS-89201")!;
  const summaryItems =
    order.lineItems && order.lineItems.length > 0
      ? order.lineItems
      : [
          {
            id: order.id,
            title: order.title,
            variantTitle: order.subtitle,
            quantity: 1,
            price: order.subtotal,
            image: order.image,
          },
        ];
  const supportParams = (extraNote: string) =>
    ({
      pathname: "/support/chat",
      params: {
        topic: "order",
        orderId: order.id,
        extraNote,
      },
    }) as any;

  const handleShareOrder = () => {
    void Share.share({
      message: `Order ${formatOrderReference(order.id)} — ${order.title}\nEstimated arrival: ${order.estimatedArrival}`,
    });
  };

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
            Order Details
          </Text>
          <Pressable onPress={handleShareOrder}>
            <Ionicons name="ellipsis-vertical" size={16} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
        </View>

        <View className="flex-row justify-between px-6">
          <View>
            <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
              ORDER REFERENCE
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-7 text-black dark:text-white">
              {formatOrderReference(order.id)}
            </Text>
          </View>

          <View className="items-end">
            <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
              PLACED ON
            </Text>
            <Text className="mt-2 font-bold text-[16px] text-black dark:text-white">
              {order.placedOn}
            </Text>
          </View>
        </View>

        <View className="mt-6 px-6">
          <View className="bg-white px-5 py-5 dark:bg-[#101215]">
            <Text className="mt-3 font-bold text-[34px] leading-[38px] text-black dark:text-white">
              {order.estimatedArrival}
            </Text>

            <View className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400 mb-2 uppercase">
                LOGISTICS PARTNER
              </Text>
              <Text className="font-bold text-[15px] text-black dark:text-white">
                {order.deliveryRegion === "Nigeria" && !order.estimatedArrival.includes("3-5") 
                  ? "Atelier Dispatch" 
                  : order.carrier}
              </Text>
              <Text className="mt-1 font-normal text-[13px] leading-5 text-neutral-400">
                {order.deliveryRegion === "Nigeria" && !order.estimatedArrival.includes("3-5")
                  ? "Dispatch window: 12:00 PM - 5:00 PM"
                  : order.deliveryRegion === "Nigeria" 
                    ? "Delivery window: 3-5 Business Days"
                    : `Tracking: ${order.trackingNumber}`}
              </Text>

            </View>

            <Text className="mt-4 font-normal text-[13px] leading-5 text-neutral-400">
              Payment: {order.paymentMethod} | Fulfillment: {order.fulfillmentMethod}
            </Text>

            <View className="mt-5 gap-2">
              <Text className="font-bold text-[10px] uppercase tracking-[1.4px] text-neutral-400">
                Order quick actions
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => Linking.openURL("tel:+2349069120288").catch(() => {})}
                  className="flex-1 border border-black/10 px-3 py-3 dark:border-white/10"
                >
                  <Text className="text-center font-bold text-[10px] uppercase tracking-[1.1px] text-black dark:text-white">
                    Call rider
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push(
                      supportParams(
                        `I want to report a delivery delay for order ${order.id}. Current status: ${order.status}.`,
                      ),
                    )
                  }
                  className="flex-1 border border-black/10 px-3 py-3 dark:border-white/10"
                >
                  <Text className="text-center font-bold text-[10px] uppercase tracking-[1.1px] text-black dark:text-white">
                    Report delay
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() =>
                  router.push(
                    supportParams(
                      `I want to change delivery details for order ${order.id}.`,
                    ),
                  )
                }
                className="border border-black bg-black px-3 py-3 dark:border-white dark:bg-white"
              >
                <Text className="text-center font-bold text-[10px] uppercase tracking-[1.2px] text-white dark:text-black">
                  Change delivery details
                </Text>
              </Pressable>
            </View>

          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="rounded-[32px] bg-white px-6 py-6 dark:bg-[#101215]">
            <Text className="text-center font-bold text-[11px] tracking-[3px] text-neutral-300">
              LIVE TRACKING
            </Text>

            <View className="mt-8">
              {/* For Lagos same-day/next-day, hide inter-state GIGL steps */}
              {(order.deliveryRegion === "Nigeria" && !order.estimatedArrival?.includes("3-5")
                ? order.timeline.filter(e => !["In Transit", "Arrived at Hub"].includes(e.title))
                : order.timeline
              ).map((event, index, displayTimeline) => (
                <View key={event.id} className="flex-row">
                  <View className="mr-4 items-center">
                    <View
                      className={`h-3 w-3 rounded-full ${
                        event.active ? "bg-[#44546a]" : "bg-[#e5e7eb]"
                      }`}
                    />
                    {index !== displayTimeline.length - 1 ? (
                      <View
                        className={`h-16 w-[1px] ${
                          event.active && displayTimeline[index + 1]?.active
                            ? "bg-[#44546a]"
                            : "bg-[#ececec]"
                        }`}
                      />
                    ) : null}
                  </View>

                  <View className="flex-1 pb-8">
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1">
                        <Text className="font-bold text-[16px] text-black dark:text-white">
                          {event.title}
                        </Text>
                        <Text className="mt-1 font-normal text-[13px] leading-5 text-neutral-400">
                          {event.description}
                        </Text>
                      </View>
                      <Text className="font-bold text-[10px] tracking-[1.2px] text-neutral-300">
                        {event.date}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          {order.outreachNotes.length > 0 ? (
            <View className="mb-8 rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="font-bold text-[10px] tracking-[1.6px] text-[#b45309]">
                  OUTREACH LOG
                </Text>
                <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-400">
                  {order.followUpStatus.toUpperCase()}
                </Text>
              </View>

              <View className="gap-4">
                {order.outreachNotes.map((note) => (
                  <View key={note.id} className="rounded-[20px] bg-[#fbf7ef] px-4 py-4">
                    <Text className="font-normal text-[12px] leading-5 text-neutral-600">
                      {note.text}
                    </Text>
                    <Text className="mt-2 font-bold text-[10px] tracking-[1.3px] text-[#b45309]">
                      {note.timestamp}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <Text className="mb-4 font-bold text-[18px] tracking-[1.3px] text-neutral-400">
            ORDER SUMMARY
          </Text>

          <View className="gap-5">
            {summaryItems.map((item, index) => (
              <View key={`${item.id}-${index}`} className="flex-row gap-4 border-b border-gray-100 dark:border-white/5 pb-4 last:border-b-0 last:pb-0">
                <Image
                  source={{ uri: item.image || order.image }}
                  className="h-20 w-16 bg-gray-100 rounded-lg"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    className="font-bold text-[16px] text-black dark:text-white"
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="mt-1 font-bold text-[10px] tracking-[1.4px] text-neutral-400 uppercase"
                  >
                    {item.variantTitle ?? "STANDARD FIT"} | Qty {item.quantity}
                  </Text>
                  <Text className="mt-2 font-bold text-[16px] text-black dark:text-white">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-8 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-normal text-[13px] text-neutral-400">
                Subtotal
              </Text>
              <Text className="font-bold text-[13px] text-neutral-500">
                {formatPrice(order.subtotal)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="font-normal text-[13px] text-neutral-400">
                Express Shipping
              </Text>
              <Text className="font-bold text-[13px] text-neutral-500">
                {formatPrice(order.shipping)}
              </Text>
            </View>

            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-bold text-[20px] text-black dark:text-white">
                Total Paid
              </Text>
              <Text className="font-bold text-[28px] text-black dark:text-white">
                {formatPrice(order.total)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/support/chat",
                params: {
                  topic: "order",
                  orderId: order.id,
                },
              } as any)
            }
            className="bg-[#1f2736] py-4"
          >
            <Text className="text-center font-bold text-[12px] tracking-[2px] text-white">
              CONTACT SUPPORT
            </Text>
          </Pressable>

          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/returns/initiate/${order.id}`,
                  params: { type: "return" },
                } as any)
              }
              className="flex-1 border border-gray-200 bg-white py-4 dark:border-white/10 dark:bg-[#101215]"
            >
              <Text className="text-center font-bold text-[12px] tracking-[2px] text-neutral-700 dark:text-white">
                REQUEST RETURN
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/returns/initiate/${order.id}`,
                  params: { type: "exchange" },
                } as any)
              }
              className="flex-1 border border-gray-200 bg-white py-4 dark:border-white/10 dark:bg-[#101215]"
            >
              <Text className="text-center font-bold text-[12px] tracking-[2px] text-neutral-700 dark:text-white">
                EXCHANGE ITEM
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
