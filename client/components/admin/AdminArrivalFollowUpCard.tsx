import { AppText as Text } from "@/components/AppText";
import { OrderRecord } from "@/constants/orders";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useMemo } from "react";
import { Linking, Pressable, View } from "react-native";

interface AdminArrivalFollowUpCardProps {
  orders: OrderRecord[];
  onMarkContacted: (order: OrderRecord) => void;
  onResolve: (order: OrderRecord) => void;
}

const formatMoney = (value: number) =>
  `NGN ${Math.round(value).toLocaleString("en-NG")}`;

export const AdminArrivalFollowUpCard = memo(
  function AdminArrivalFollowUpCard({
    orders,
    onMarkContacted,
    onResolve,
  }: AdminArrivalFollowUpCardProps) {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const contacted = orders.filter(
      (order) => order.followUpStatus === "Contacted",
    ).length;
    const exposure = useMemo(
      () => orders.reduce((sum, order) => sum + order.total, 0),
      [orders],
    );

    const contact = (order: OrderRecord) => {
      if (order.customerPhone) {
        const phone = order.customerPhone.replace(/[^0-9]/g, "");
        void Linking.openURL(
          `https://wa.me/${phone}?text=${encodeURIComponent(
            `Hi ${order.customerName}, following up on your order ${order.id}.`,
          )}`,
        );
        return;
      }
      router.push({
        pathname: "/support/chat",
        params: { topic: "order", orderId: order.id },
      } as any);
    };

    return (
      <View className="bg-white px-5 py-6 dark:bg-[#101215]">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[10px] font-bold tracking-[1.5px] text-[#b45309] dark:text-[#f0a35b]">
              OPERATIONS PULSE
            </Text>
            <Text className="mt-2 text-[26px] font-bold text-black dark:text-white">
              Arrival Follow-Up
            </Text>
            <Text className="mt-2 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
              Pay-on-delivery orders at hub arrival or rider dispatch.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/admin/alerts" as any)}
            className="h-10 w-10 items-center justify-center bg-black dark:bg-white"
          >
            <Ionicons
              name="arrow-forward"
              size={17}
              color={isDark ? "#111111" : "#ffffff"}
            />
          </Pressable>
        </View>

        <View className="mt-6 flex-row gap-2">
          <View className="flex-1 bg-[#f3f4f6] px-3 py-3 dark:bg-[#1a1d21]">
            <Text className="text-[9px] font-bold tracking-[1.1px] text-neutral-400">
              NEEDS ACTION
            </Text>
            <Text className="mt-1 text-[20px] font-bold text-black dark:text-white">
              {orders.length}
            </Text>
          </View>
          <View className="flex-1 bg-[#f3f4f6] px-3 py-3 dark:bg-[#1a1d21]">
            <Text className="text-[9px] font-bold tracking-[1.1px] text-neutral-400">
              CONTACTED
            </Text>
            <Text className="mt-1 text-[20px] font-bold text-black dark:text-white">
              {contacted}
            </Text>
          </View>
          <View className="flex-[1.35] bg-[#f3f4f6] px-3 py-3 dark:bg-[#1a1d21]">
            <Text className="text-[9px] font-bold tracking-[1.1px] text-neutral-400">
              POD EXPOSURE
            </Text>
            <Text
              preserveCase
              className="mt-1 text-[13px] font-bold text-black dark:text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatMoney(exposure)}
            </Text>
          </View>
        </View>

        {orders.length === 0 ? (
          <View className="mt-5 flex-row items-center gap-4 border border-dashed border-neutral-200 px-4 py-5 dark:border-white/10">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <Ionicons
                name="checkmark"
                size={21}
                color={isDark ? "#4ade80" : "#16a34a"}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-black dark:text-white">
                Arrival queue is clear
              </Text>
              <Text className="mt-1 text-[10px] leading-4 text-neutral-400">
                New hub arrivals and rider dispatches will appear here.
              </Text>
            </View>
          </View>
        ) : (
          <View className="mt-5 gap-3">
            {orders.slice(0, 2).map((order) => (
              <View
                key={order.id}
                className="border-l-[3px] border-[#b45309] bg-[#fbf7ef] px-4 py-4 dark:bg-[#1b1712]"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[9px] font-bold tracking-[1.2px] text-[#b45309] dark:text-[#f0a35b]">
                      {order.id} · {order.logisticsMilestone.toUpperCase()}
                    </Text>
                    <Text className="mt-2 text-[16px] font-bold text-black dark:text-white">
                      {order.customerName}
                    </Text>
                    <Text className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                      {order.carrier} · {formatMoney(order.total)}
                    </Text>
                  </View>
                  <View className="bg-black px-2 py-1 dark:bg-white">
                    <Text className="text-[8px] font-bold text-white dark:text-black">
                      {order.followUpStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View className="mt-4 flex-row flex-wrap gap-2">
                  <Pressable
                    onPress={() => contact(order)}
                    className="flex-row items-center gap-2 bg-black px-3 py-2 dark:bg-white"
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={13}
                      color={isDark ? "#111111" : "#ffffff"}
                    />
                    <Text className="text-[9px] font-bold text-white dark:text-black">
                      CONTACT
                    </Text>
                  </Pressable>
                  {order.followUpStatus === "Pending" ? (
                    <Pressable
                      onPress={() => onMarkContacted(order)}
                      className="border border-neutral-200 px-3 py-2 dark:border-white/15"
                    >
                      <Text className="text-[9px] font-bold text-black dark:text-white">
                        MARK CONTACTED
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => onResolve(order)}
                    className="border border-neutral-200 px-3 py-2 dark:border-white/15"
                  >
                    <Text className="text-[9px] font-bold text-black dark:text-white">
                      RESOLVE
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
);
