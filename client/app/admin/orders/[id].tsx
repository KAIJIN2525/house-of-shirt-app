import { formatPrice } from "@/constants";
import { useOrdersStore } from "@/stores/ordersStore";
import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { useThemeStore } from "@/stores/themeStore";
import { useToastStore } from "@/stores/toastStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { AdminOrderDetailSkeleton } from "@/components/loading/AdminOrderDetailSkeleton";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

const formatOrderReference = (id: string) =>
  id.startsWith("#") ? id : `#${id}`;

const normalizePhone = (value?: string) =>
  (value ?? "").replace(/\D/g, "").replace(/^234/, "0");

const milestoneOptions: {
  label: string;
  value: import("@/constants/orders").OrderRecord["logisticsMilestone"];
}[] = [
  { label: "PROCESSING", value: "Processing" },
  { label: "SHIPPED", value: "Shipped" },
  { label: "IN TRANSIT", value: "In Transit" },
  { label: "ARRIVED AT HUB", value: "Arrived at Hub" },
  { label: "OUT FOR DELIVERY", value: "Out for Delivery" },
  { label: "AVAILABLE FOR PICKUP", value: "Available for Pickup" },
  { label: "DELIVERED", value: "Delivered" },
];

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useThemeStore();
  const showToast = useToastStore((state) => state.showToast);
  const {
    orders,
    isLoading,
    fetchOrders,
    bulkDispatchOrders,
    updateOrderLogisticsStatus,
    addOutreachNote,
  } = useOrdersStore();
  const { customers, fetchCustomers } = useAdminCustomersStore();

  const order = orders.find((orderItem) => orderItem.id === id);
  const [hasRequestedOrder, setHasRequestedOrder] = useState(false);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (!order && !hasRequestedOrder && !isLoading) {
      setHasRequestedOrder(true);
      void fetchOrders();
    }
  }, [fetchOrders, hasRequestedOrder, isLoading, order]);

  const matchedBlacklistedCustomer = useMemo(() => {
    if (!order) return undefined;

    const orderName = order.customerName.trim().toLowerCase();
    const orderPhone = normalizePhone(order.customerPhone);

    return customers.find((customer) => {
      if (!customer.blacklisted) return false;

      const customerName = customer.name.trim().toLowerCase();
      const customerPhone = normalizePhone(customer.phone);

      return (
        (orderName.length > 0 && customerName === orderName) ||
        (orderPhone.length >= 7 &&
          customerPhone.endsWith(orderPhone.slice(-7))) ||
        (customerPhone.length >= 7 &&
          orderPhone.endsWith(customerPhone.slice(-7)))
      );
    });
  }, [customers, order]);

  const isBlacklistedOrder =
    order?.customerRiskStatus === "Blacklisted" ||
    Boolean(matchedBlacklistedCustomer);
  const blacklistReason =
    order?.customerRiskReason ||
    matchedBlacklistedCustomer?.blacklistReason ||
    "Restricted customer review required before fulfillment continues.";

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  // Custom modal states replacing native alerts
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<
    (typeof milestoneOptions)[number]["value"] | null
  >(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const summarizeChannels = (channels: {
    email: string;
    sms: string;
    push: string;
    app: string;
    admin: string;
  }) =>
    [
      channels.email === "sent"
        ? "email"
        : channels.email === "failed"
          ? "email failed"
          : null,
      channels.push === "sent"
        ? "push"
        : channels.push === "failed"
          ? "push failed"
          : null,
      channels.app === "sent"
        ? "in-app"
        : channels.app === "failed"
          ? "in-app failed"
          : null,
      channels.admin === "sent"
        ? "admin"
        : channels.admin === "failed"
          ? "admin failed"
          : null,
      channels.sms === "sent"
        ? "sms"
        : channels.sms === "failed"
          ? "sms failed"
          : null,
    ]
      .filter(Boolean)
      .join(", ");

  if (!order && (!hasRequestedOrder || isLoading)) {
    return <AdminOrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505] items-center justify-center">
        <Text className="text-gray-500">Order not found.</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-[#111] px-4 py-2"
        >
          <Text className="text-white font-bold text-xs">BACK</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const showCustomAlert = (title: string, message: string) => {
    setCustomAlert({ title, message });
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const reports = await bulkDispatchOrders([order.id]);
      const firstReport = reports[0];
      showCustomAlert(
        "Order Dispatched",
        `Order ${formatOrderReference(order.id)} is now marked as Shipped.`,
      );
      if (firstReport) {
        showToast({
          type: "success",
          message: `${firstReport.customerName}: ${summarizeChannels(firstReport.channels) || "no live channels"}`,
        });
      }
    } catch {
      showCustomAlert("Fulfillment Error", "Failed to dispatch order.");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSaveOutreachLog = () => {
    if (!newNote.trim()) {
      showCustomAlert("Empty Log Entry", "Please write a comment first.");
      return;
    }
    addOutreachNote(order.id, newNote.trim());
    setNewNote("");
    setIsNoteModalOpen(false);
    showCustomAlert(
      "Comment Recorded",
      "Private outreach log has been recorded.",
    );
  };

  const handleContactCustomer = () => {
    setIsContactModalOpen(true);
  };

  const handleStatusChange = (
    milestone: (typeof milestoneOptions)[number]["value"],
  ) => {
    setSelectedMilestone(milestone);
    setIsStatusModalOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4 border-b border-neutral-100 dark:border-white/5 bg-white dark:bg-[#0c0d0f]">
        <Pressable onPress={() => router.navigate("/admin/orders" as any)}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#f8fafc" : "#111111"}
          />
        </Pressable>
        <Text className="font-bold text-[11px] tracking-[1.5px] text-black dark:text-white uppercase">
          ADMIN ORDER CONSOLE
        </Text>
        <Pressable onPress={handleContactCustomer}>
          <Ionicons
            name="call-outline"
            size={20}
            color={isDark ? "#f8fafc" : "#111111"}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Risk Status Indicator */}
        {isBlacklistedOrder && (
          <View className="mx-6 mt-6 overflow-hidden rounded-[28px] border border-[#ffb4b4] bg-[#fff1f1] dark:border-[#7f1d1d] dark:bg-[#220b0b]">
            <View className="flex-row gap-4 px-5 py-5">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#dc2626]">
                <Ionicons name="warning" size={22} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[10px] tracking-[1.6px] text-[#dc2626] dark:text-[#fca5a5] uppercase">
                  BLACKLISTED CUSTOMER ORDER
                </Text>
                <Text className="mt-2 font-bold text-[20px] leading-6 text-[#290808] dark:text-white">
                  Hold fulfillment for manual review
                </Text>
                <Text className="mt-2 font-normal text-[13px] leading-6 text-[#7f1d1d] dark:text-[#fecaca]">
                  {order.customerName} is blacklisted. Reason: {blacklistReason}
                </Text>
                <Pressable
                  onPress={() => router.push("/admin/blacklist" as any)}
                  className="mt-4 self-start bg-[#dc2626] px-4 py-3"
                >
                  <Text className="font-bold text-[10px] tracking-[1.5px] text-white">
                    OPEN BLACKLIST ALERTS
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Order Reference Details */}
        <View className="flex-row justify-between px-6 mt-6">
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

        {/* Client Delivery details block */}
        <View className="mt-6 px-6">
          <View className="bg-white px-5 py-5 dark:bg-[#101215] border border-neutral-100 dark:border-white/5">
            <View className="flex-row justify-between items-center">
              <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400 uppercase">
                CUSTOMER INFO
              </Text>
              {order.followUpStatus !== "None" && (
                <View className="bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1">
                  <Text className="font-bold text-[8px] tracking-[1px] text-amber-700 dark:text-amber-300 uppercase">
                    FOLLOW-UP: {order.followUpStatus}
                  </Text>
                </View>
              )}
            </View>

            <Text className="mt-3 font-bold text-[22px] text-black dark:text-white">
              {order.customerName}
            </Text>
            {isBlacklistedOrder ? (
              <View className="mt-3 rounded-[18px] border border-[#fecaca] bg-[#fff7f7] px-4 py-3 dark:border-[#7f1d1d] dark:bg-[#2a0f0f]">
                <Text className="font-bold text-[10px] tracking-[1.4px] text-[#dc2626] dark:text-[#fca5a5] uppercase">
                  CUSTOMER BLACKLISTED
                </Text>
                <Text className="mt-1 font-normal text-[12px] leading-5 text-[#7f1d1d] dark:text-[#fecaca]">
                  {blacklistReason}
                </Text>
              </View>
            ) : null}
            <Text className="mt-3 font-normal text-[13px] text-neutral-500">
              Phone: {order.customerPhone || "N/A"}
            </Text>
            <Text className="mt-1 font-normal text-[13px] text-neutral-500">
              Region: {order.deliveryRegion} | Pay Method: {order.paymentMethod}
            </Text>

            <View className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400 mb-2 uppercase">
                ESTIMATED ARRIVAL & LOGISTICS
              </Text>
              <Text className="font-bold text-[15px] text-black dark:text-white">
                {order.carrier}
              </Text>
              <Text className="mt-1 font-normal text-[13px] leading-5 text-neutral-400">
                Tracking #: {order.trackingNumber || "Not assigned"}
              </Text>
            </View>
          </View>
        </View>

        {/* LOGISTICS INTERACTIVE ACTION STATIONS */}
        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6 dark:bg-[#101215] border border-neutral-100 dark:border-white/5">
            <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400 uppercase mb-4">
              STAGE CONTROL PANEL
            </Text>
            <Text className="text-[11px] text-neutral-400 mb-6">
              Transition this order through stages:
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {milestoneOptions.map((milestone) => {
                const isActive = order.logisticsMilestone === milestone.value;
                return (
                  <Pressable
                    key={milestone.value}
                    onPress={() => handleStatusChange(milestone.value)}
                    className={`px-4 py-3 border ${
                      isActive
                        ? "bg-black border-black dark:bg-white dark:border-white"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <Text
                      className={`font-bold text-[9px] tracking-[1px] ${
                        isActive
                          ? "text-white dark:text-black"
                          : "text-neutral-500"
                      }`}
                    >
                      {milestone.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Live Timeline Display */}
        <View className="mt-8 px-6">
          <View className="bg-white px-6 py-6 dark:bg-[#101215] border border-neutral-100 dark:border-white/5">
            <Text className="text-center font-bold text-[11px] tracking-[3px] text-neutral-400 uppercase">
              LIVE TIMELINE PREVIEW
            </Text>

            <View className="mt-8">
              {order.timeline.map((event, index) => (
                <View key={event.id} className="flex-row">
                  <View className="mr-4 items-center">
                    <View
                      className={`h-3 w-3 rounded-full ${
                        event.active ? "bg-[#44546a]" : "bg-[#e5e7eb]"
                      }`}
                    />
                    {index !== order.timeline.length - 1 ? (
                      <View
                        className={`h-16 w-[1px] ${
                          event.active && order.timeline[index + 1]?.active
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

        {/* Outreach and Private Logs */}
        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6 dark:bg-[#101215] border border-neutral-100 dark:border-white/5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
                PRIVATE ATELIER & OUTREACH LOGS
              </Text>
              <Pressable
                onPress={() => setIsNoteModalOpen(true)}
                className="bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5"
              >
                <Text className="font-bold text-[9px] tracking-[1px] text-black dark:text-white uppercase">
                  + LOG NOTE
                </Text>
              </Pressable>
            </View>

            {order.outreachNotes.length === 0 ? (
              <Text className="text-neutral-400 font-normal text-[12px] py-4 text-center">
                No custom notes registered for this order yet.
              </Text>
            ) : (
              <View className="mt-4 gap-4">
                {order.outreachNotes.map((note) => (
                  <View
                    key={note.id}
                    className="bg-neutral-50 dark:bg-neutral-900/60 p-4 border border-neutral-100 dark:border-white/5"
                  >
                    <Text className="font-normal text-[13px] leading-5 text-neutral-700 dark:text-neutral-300">
                      {note.text}
                    </Text>
                    <Text className="mt-2 font-bold text-[10px] tracking-[1.2px] text-neutral-400">
                      {note.timestamp}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Order Items Breakdown */}
        <View className="mt-8 px-6">
          <Text className="mb-4 font-bold text-[11px] tracking-[1.5px] text-neutral-400 uppercase">
            ORDER SUMMARY
          </Text>

          <View className="gap-5">
            {order.lineItems && order.lineItems.length > 0 ? (
              order.lineItems.map((item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  className="flex-row gap-4 bg-white p-4 border border-neutral-100 dark:border-white/5 dark:bg-[#101215]"
                >
                  <Image
                    source={{ uri: item.image || order.image }}
                    className="h-20 w-16 bg-gray-100"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      className="font-bold text-[18px] text-black dark:text-white"
                    >
                      {item.title}
                    </Text>
                    <Text className="mt-1 font-bold text-[10px] tracking-[1.4px] text-neutral-400 uppercase">
                      {item.variantTitle ?? "STANDARD FIT"} | Qty{" "}
                      {item.quantity}
                    </Text>
                    <Text className="mt-3 font-bold text-[18px] text-black dark:text-white">
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="flex-row gap-4 bg-white p-4 border border-neutral-100 dark:border-white/5 dark:bg-[#101215]">
                <Image
                  source={{ uri: order.image }}
                  className="h-20 w-16 bg-gray-100"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    className="font-bold text-[18px] text-black dark:text-white"
                  >
                    {order.title}
                  </Text>
                  <Text className="mt-1 font-bold text-[10px] tracking-[1.4px] text-neutral-400 uppercase">
                    {order.subtitle}
                  </Text>
                  <Text className="mt-3 font-bold text-[18px] text-black dark:text-white">
                    {formatPrice(order.subtotal)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Pricing Ledger */}
          <View className="mt-6 gap-3">
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

            <View className="mt-2 flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-3">
              <Text className="font-bold text-[20px] text-black dark:text-white">
                Total Paid
              </Text>
              <Text className="font-bold text-[28px] text-black dark:text-white">
                {formatPrice(order.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* PRIMARY TRANSACTION ACTIONS */}
        {(order.status === "Pending" || order.status === "Processing") && (
          <View className="mt-8 px-6">
            <Pressable
              disabled={isDispatching}
              onPress={handleDispatch}
              className="bg-[#1f2736] py-4 items-center justify-center"
            >
              <Text className="text-center font-bold text-[12px] tracking-[2px] text-white">
                {isDispatching
                  ? "NOTIFYING CUSTOMER..."
                  : "DISPATCH & NOTIFY PATRON"}
              </Text>
            </Pressable>
          </View>
        )}

        <View className="mt-8 px-6">
          <Pressable
            onPress={() =>
              router.push(
                `/admin/customer-profile?id=${order.customerName}` as any,
              )
            }
            className="bg-[#1f2736] py-4 items-center justify-center"
          >
            <Text className="text-center font-bold text-[12px] tracking-[2px] text-white">
              VIEW CUSTOMER PROFILE
            </Text>
          </Pressable>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Outreach log modal */}
      <Modal
        visible={isNoteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNoteModalOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/55 px-6">
          <View className="w-full bg-white dark:bg-[#101215] px-5 py-5 border border-neutral-200 dark:border-white/10 shadow-2xl">
            <Text className="font-bold text-[18px] text-black dark:text-white">
              Log Private Atelier Comment
            </Text>
            <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-400">
              Record a service outreach note or logistics update for internal
              staff review.
            </Text>

            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              multiline
              placeholder="e.g. Courier picked up package, but customer requested change in delivery window."
              placeholderTextColor="#a0a7b3"
              textAlignVertical="top"
              className="mt-5 min-h-[120px] border border-[#d9dde4] dark:border-neutral-800 px-4 py-4 font-normal text-[13px] leading-6 text-black dark:text-white"
            />

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setIsNoteModalOpen(false);
                  setNewNote("");
                }}
                className="flex-1 items-center justify-center border border-[#d9dde4] dark:border-neutral-800 py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-black dark:text-white">
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveOutreachLog}
                className="flex-1 items-center justify-center bg-[#111826] dark:bg-white py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-white dark:text-black">
                  SAVE LOG
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Status Transition Confirmation Modal */}
      <Modal
        visible={isStatusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsStatusModalOpen(false);
          setSelectedMilestone(null);
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full bg-white dark:bg-[#101215] px-6 py-6 border border-neutral-200 dark:border-white/10 shadow-2xl">
            <View className="flex-row items-center gap-2">
              <Ionicons name="git-network-outline" size={18} color="#44618e" />
              <Text className="font-bold text-[11px] tracking-[2px] text-neutral-400 dark:text-neutral-500 uppercase">
                STAGE TRANSITION
              </Text>
            </View>

            <Text className="mt-4 font-bold text-[20px] text-black dark:text-white leading-6">
              Update Order Status?
            </Text>
            <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
              Are you sure you want to transition order{" "}
              {formatOrderReference(order.id)} status to{" "}
              <Text className="font-bold text-black dark:text-white">
                &apos;{selectedMilestone}&apos;
              </Text>
              ? This will update the customer&apos;s live tracking timeline and
              flag any necessary operational follow-ups.
            </Text>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setIsStatusModalOpen(false);
                  setSelectedMilestone(null);
                }}
                className="flex-1 items-center justify-center border border-[#d9dde4] dark:border-neutral-800 py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-black dark:text-white uppercase">
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (selectedMilestone) {
                    const report = await updateOrderLogisticsStatus(
                      order.id,
                      selectedMilestone,
                    );
                    if (report) {
                      showToast({
                        type: "success",
                        message: `${selectedMilestone}: ${summarizeChannels(report.channels) || "no live channels"}`,
                      });
                    }
                  }
                  setIsStatusModalOpen(false);
                  setSelectedMilestone(null);
                  showCustomAlert(
                    "Fulfillment Updated",
                    `Order stage successfully transitioned to '${selectedMilestone}'.`,
                  );
                }}
                className="flex-1 items-center justify-center bg-black dark:bg-white py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-white dark:text-black uppercase">
                  CONFIRM UPDATE
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Contact Options Panel Modal */}
      <Modal
        visible={isContactModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsContactModalOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full bg-white dark:bg-[#101215] px-6 py-6 border border-neutral-200 dark:border-white/10 shadow-2xl">
            <Text className="font-bold text-[11px] tracking-[2px] text-neutral-400 dark:text-neutral-500 uppercase">
              CUSTOMER COMMUNICATIONS
            </Text>
            <Text className="mt-3 font-bold text-[20px] text-black dark:text-white">
              Contact {order.customerName}
            </Text>
            <Text className="mt-1 text-xs text-neutral-400">
              Select a channel to reach out regarding order{" "}
              {formatOrderReference(order.id)}:
            </Text>

            <View className="mt-6 gap-3">
              {order.customerPhone ? (
                <Pressable
                  onPress={() => {
                    if (!order.customerPhone) return;
                    setIsContactModalOpen(false);
                    void Linking.openURL(`tel:${order.customerPhone}`);
                  }}
                  className="flex-row items-center gap-4 bg-neutral-50 dark:bg-neutral-900/60 p-4 border border-neutral-100 dark:border-white/5"
                >
                  <Ionicons name="call" size={20} color="#10b981" />
                  <View>
                    <Text className="font-bold text-xs text-black dark:text-white">
                      Voice Call Customer
                    </Text>
                    <Text className="text-[10px] text-neutral-400 mt-0.5">
                      Direct dial: {order.customerPhone}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              {order.customerPhone ? (
                <Pressable
                  onPress={() => {
                    if (!order.customerPhone) return;
                    setIsContactModalOpen(false);
                    const sanitized = order.customerPhone.replace(
                      /[^\d+]/g,
                      "",
                    );
                    void Linking.openURL(
                      `https://wa.me/${sanitized.replace(/^\+/, "")}?text=${encodeURIComponent(`Hi ${order.customerName}, following up on your order #${order.id}.`)}`,
                    );
                  }}
                  className="flex-row items-center gap-4 bg-neutral-50 dark:bg-neutral-900/60 p-4 border border-neutral-100 dark:border-white/5"
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25d366" />
                  <View>
                    <Text className="font-bold text-xs text-black dark:text-white">
                      WhatsApp Messaging
                    </Text>
                    <Text className="text-[10px] text-neutral-400 mt-0.5">
                      Secure, case-sensitive support channel
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => {
                  setIsContactModalOpen(false);
                  void Linking.openURL(
                    `mailto:?subject=Atelier Order #${order.id} Update`,
                  );
                }}
                className="flex-row items-center gap-4 bg-neutral-50 dark:bg-neutral-900/60 p-4 border border-neutral-100 dark:border-white/5"
              >
                <Ionicons name="mail" size={20} color="#3b82f6" />
                <View>
                  <Text className="font-bold text-xs text-black dark:text-white">
                    Send Email Outreach
                  </Text>
                  <Text className="text-[10px] text-neutral-400 mt-0.5">
                    Includes automatic transaction details
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setIsContactModalOpen(false)}
              className="mt-6 border border-neutral-200 dark:border-neutral-800 py-4 items-center justify-center"
            >
              <Text className="font-bold text-[11px] tracking-[1.5px] text-black dark:text-white uppercase">
                CANCEL
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Reusable Premium Alert Modal */}
      <Modal
        visible={customAlert !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full bg-white dark:bg-[#101215] px-6 py-6 border border-neutral-200 dark:border-white/10 shadow-2xl">
            <Text className="font-bold text-[11px] tracking-[2px] text-neutral-400 dark:text-neutral-500 uppercase">
              SYSTEM REPORT
            </Text>
            <Text className="mt-3 font-bold text-[18px] text-black dark:text-white leading-6">
              {customAlert?.title}
            </Text>
            <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
              {customAlert?.message}
            </Text>
            <Pressable
              onPress={() => setCustomAlert(null)}
              className="mt-6 bg-black dark:bg-white py-4 items-center justify-center"
            >
              <Text className="font-bold text-[11px] tracking-[1.5px] text-white dark:text-black uppercase">
                ACKNOWLEDGE
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
