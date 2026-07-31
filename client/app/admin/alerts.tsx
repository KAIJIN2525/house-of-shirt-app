import { useOrdersStore } from "@/stores/ordersStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { BrandLogo } from "@/components/BrandLogo";

type AlertTab = "active" | "contacted";

const tabs: { id: AlertTab; label: string }[] = [
  { id: "active", label: "ACTIVE ALERTS" },
  { id: "contacted", label: "CONTACTED" },
];

export default function AdminAlertsScreen() {
  const router = useRouter();
  const { 
    orders,
    arrivalAttentionOrders,
    acknowledgeArrivalAlert,
    resolveArrivalAlert,
    updateOrderLogisticsStatus,
   } = useOrdersStore();
  const {  isDark  } = useThemeStore();
  const [activeTab, setActiveTab] = useState<AlertTab>("active");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const safeUpper = (value?: string) => (value ?? "UNKNOWN").toUpperCase();
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const openChat = (order: any) => {
    if (order.customerPhone) {
      const phone = sanitizedPhone(order.customerPhone).replace(/^\+/, "");
      Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${order.customerName}, following up on your order ${order.id}.`)}`);
    } else {
      Linking.openURL(`mailto:${order.id}`); // This is just a fallback, maybe add order.customerEmail if it exists
    }
  };
  const sanitizedPhone = (value?: string) => (value ?? "").replace(/[^\d+]/g, "");

  const contactedOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.followUpStatus === "Contacted" &&
          order.deliveryRegion === "Nigeria" &&
          order.paymentMethod === "Pay on Delivery"
      ),
    [orders]
  );

  const visibleAlerts =
    activeTab === "active" ? arrivalAttentionOrders : contactedOrders;

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.navigate("/admin" as any)}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/admin" as any)}>
            <Ionicons name="grid-outline" size={18} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            ADMIN NOTIFICATIONS
          </Text>
          <Text className="mt-2 font-bold text-[44px] leading-[42px] text-black dark:text-white">
            Operations{"\n"}Alerts
          </Text>
          <Text className="mt-3 font-normal text-[14px] leading-6 text-neutral-400">
            Monitor GIGL arrival risks, pay-on-delivery exposure, and customer
            outreach before orders go unclaimed.
          </Text>
        </View>

        <View className="mt-6 flex-row gap-3 px-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const count =
              tab.id === "active"
                ? arrivalAttentionOrders.length
                : contactedOrders.length;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-row items-center gap-2 rounded-full px-4 py-3 ${
                  isActive ? "bg-[#161c28]" : "bg-white"
                }`}
              >
                <Text
                  className={`font-bold text-[10px] tracking-[1.5px] ${
                    isActive ? "text-white" : "text-neutral-500"
                  }`}
                >
                  {tab.label}
                </Text>
                <View
                  className={`min-w-[18px] rounded-full px-1 ${
                    isActive ? "bg-white/15" : "bg-[#eceff3]"
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-[9px] ${
                      isActive ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 px-6">
          <View className="gap-4">
            {visibleAlerts.length > 0 ? (
              visibleAlerts.map((order) => (
                <View key={order.id} className="rounded-[28px] bg-white px-5 py-5">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-bold text-[10px] tracking-[1.4px] text-[#b45309]">
                        {safeUpper(order.carrier)} | {safeUpper(order.paymentMethod)}
                      </Text>
                      <Text className="mt-2 font-bold text-[24px] leading-7 text-black">
                        {order.customerName}
                      </Text>
                      <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                        {order.id} is currently {order.status.toLowerCase()} via{" "}
                        {order.fulfillmentMethod.toLowerCase()}. Availability follow-up
                        should happen before the order becomes unclaimed.
                      </Text>
                    </View>
                    <View className="rounded-full bg-[#161c28] px-3 py-1">
                      <Text className="font-bold text-[9px] tracking-[1.2px] text-white">
                        {safeUpper(order.followUpStatus)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-2">
                    <View className="bg-[#f3f4f6] px-3 py-2">
                      <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500">
                        {order.trackingNumber}
                      </Text>
                    </View>
                    <View className="bg-[#f3f4f6] px-3 py-2">
                      <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500">
                        {safeUpper(order.logisticsMilestone)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setSelectedOrderId(order.id)}
                      className="bg-[#161c28] px-3 py-2"
                    >
                      <Text className="font-bold text-[9px] tracking-[1.1px] text-white">
                        UPDATE STATUS
                      </Text>
                    </Pressable>
                  </View>

                  <View className="mt-5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                      <Pressable
                        onPress={() => openChat(order)}
                      >
                        <Text className="font-bold text-[10px] tracking-[1.4px] text-[#161c28]">
                          CHAT
                        </Text>
                      </Pressable>
                      {order.customerPhone ? (
                        <Pressable
                          onPress={() =>
                            Linking.openURL(`tel:${sanitizedPhone(order.customerPhone)}`).catch(() => {})
                          }
                        >
                          <Text className="font-bold text-[10px] tracking-[1.4px] text-[#161c28]">
                            CALL
                          </Text>
                        </Pressable>
                      ) : null}
                      {order.customerPhone ? (
                        <Pressable
                          onPress={() =>
                            Linking.openURL(`sms:${sanitizedPhone(order.customerPhone)}`).catch(() => {})
                          }
                        >
                          <Text className="font-bold text-[10px] tracking-[1.4px] text-[#161c28]">
                            SMS
                          </Text>
                        </Pressable>
                      ) : null}
                      {order.customerPhone ? (
                        <Pressable
                          onPress={() =>
                            Linking.openURL(`https://wa.me/${sanitizedPhone(order.customerPhone).replace(/^\+/, "")}`).catch(() => {})
                          }
                        >
                          <Text className="font-bold text-[10px] tracking-[1.4px] text-[#161c28]">
                            WHATSAPP
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    <View className="flex-row items-center gap-4">
                      {activeTab === "active" ? (
                        <Pressable
                          onPress={() =>
                            void acknowledgeArrivalAlert(
                              order.id,
                              `Admin marked follow-up contacted for ${order.status.toLowerCase()} order via ${order.carrier}.`
                            )
                          }
                        >
                          <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-500">
                            MARK CONTACTED
                          </Text>
                        </Pressable>
                      ) : null}
                      {order.followUpStatus !== "Resolved" ? (
                        <Pressable
                          onPress={() =>
                            void resolveArrivalAlert(
                              order.id,
                              `Admin resolved alert after confirming customer pickup/payment for ${order.id}.`
                            )
                          }
                        >
                          <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-500">
                            RESOLVE ALERT
                          </Text>
                        </Pressable>
                      ) : null}

                      <Pressable
                        onPress={() => router.push(`/orders/${order.id}` as any)}
                      >
                        <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-700">
                          VIEW ORDER
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="rounded-[28px] bg-white px-6 py-10">
                <Text className="text-center font-bold text-[20px] text-black">
                  No alerts in this queue
                </Text>
                <Text className="mt-2 text-center font-normal text-[12px] leading-5 text-neutral-400">
                  New GIGL pay-on-delivery arrival alerts will appear here as soon as
                  they need action.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={Boolean(selectedOrder)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrderId(null)}
      >
        <Pressable
          onPress={() => setSelectedOrderId(null)}
          className="flex-1 justify-end bg-black/35"
        >
          <Pressable className="rounded-t-[32px] bg-[#fbfbfc] px-6 pb-8 pt-6">
            <View className="self-center h-1.5 w-16 rounded-full bg-[#d7dbe2]" />
            <Text className="mt-5 font-bold text-[11px] tracking-[1.6px] text-neutral-400">
              ORDER ACTIONS
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-8 text-black">
              Update Status
            </Text>
            {selectedOrder ? (
              <View className="mt-6 gap-3">
                {(["Arrived at Hub", "Out for Delivery", "Delivered"] as const).map(
                  (milestone) => (
                    <Pressable
                      key={milestone}
                      onPress={() => {
                        void updateOrderLogisticsStatus(selectedOrder.id, milestone);
                        setSelectedOrderId(null);
                      }}
                      className={`rounded-[22px] border px-5 py-4 ${
                        selectedOrder.logisticsMilestone === milestone
                          ? "border-[#161c28] bg-[#161c28]"
                          : "border-[#e7eaf0] bg-white"
                      }`}
                    >
                      <Text
                        className={`font-bold text-[13px] ${
                          selectedOrder.logisticsMilestone === milestone
                            ? "text-white"
                            : "text-black"
                        }`}
                      >
                        {milestone}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
