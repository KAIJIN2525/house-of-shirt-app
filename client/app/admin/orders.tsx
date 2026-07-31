import { formatPrice } from "@/constants";
import { useOrdersStore } from "@/stores/ordersStore";
import { useThemeStore } from "@/stores/themeStore";
import { useToastStore } from "@/stores/toastStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";
import { HouseLoader } from "@/components/loading/HouseLoader";

const formatOrderReference = (id: string) =>
  id.startsWith("#") ? id : `#${id}`;

const FILTER_TABS = [
  { key: "all", label: "ALL ORDERS" },
  { key: "pending", label: "PENDING" },
  { key: "follow-up", label: "FOLLOW-UP" },
] as const;

const stageColors: Record<
  string,
  { badge: string; text: string; action: string }
> = {
  Pending: {
    badge: "bg-[#efefef]",
    text: "text-[#5f6067]",
    action: "REVIEW ORDER",
  },
  "Quality Check": {
    badge: "bg-[#25314b]",
    text: "text-white",
    action: "APPROVE",
  },
  Personalization: {
    badge: "bg-[#efefef]",
    text: "text-[#7a7b80]",
    action: "VIEW DETAILS",
  },
  Shipped: {
    badge: "bg-[#dde8ff]",
    text: "text-[#3868d7]",
    action: "TRACK",
  },
  Delivered: {
    badge: "bg-[#e8f4eb]",
    text: "text-[#2c8b59]",
    action: "VIEW DETAILS",
  },
};

const formatDateLabel = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const showToast = useToastStore((state) => state.showToast);
  const {
    orders,
    arrivalAttentionOrders,
    fetchOrders,
    acknowledgeArrivalAlert,
    resolveArrivalAlert,
    updateOrderLogisticsStatus,
    bulkDispatchOrders,
    dispatchExternalOrder,
  } = useOrdersStore();
  const [activeTab, setActiveTab] =
    useState<(typeof FILTER_TABS)[number]["key"]>("all");
  const [searchValue, setSearchValue] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [navigatingOrderId, setNavigatingOrderId] = useState<string | null>(
    null,
  );

  // Bulk & External Dispatch State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set(),
  );
  const [externalModalVisible, setExternalModalVisible] = useState(false);
  const [extName, setExtName] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extTitle, setExtTitle] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  const summarizeChannels = (report: {
    channels: {
      email: string;
      sms: string;
      push: string;
      app: string;
      admin: string;
    };
  }) =>
    [
      report.channels.email === "sent"
        ? "email"
        : report.channels.email === "failed"
          ? "email failed"
          : null,
      report.channels.push === "sent"
        ? "push"
        : report.channels.push === "failed"
          ? "push failed"
          : null,
      report.channels.app === "sent"
        ? "in-app"
        : report.channels.app === "failed"
          ? "in-app failed"
          : null,
      report.channels.admin === "sent"
        ? "admin"
        : report.channels.admin === "failed"
          ? "admin failed"
          : null,
      report.channels.sms === "sent"
        ? "sms"
        : report.channels.sms === "failed"
          ? "sms failed"
          : null,
    ]
      .filter(Boolean)
      .join(", ");

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDispatch = async () => {
    if (selectedOrderIds.size === 0) return;
    setIsDispatching(true);
    const reports = await bulkDispatchOrders(Array.from(selectedOrderIds));
    setSelectMode(false);
    setSelectedOrderIds(new Set());
    setIsDispatching(false);

    if (reports.length > 0) {
      const firstReport = reports[0];
      const sentChannels = summarizeChannels(firstReport);
      showToast({
        type: "success",
        message:
          reports.length === 1
            ? `${firstReport.customerName}: ${sentChannels || "no live channels"}`
            : `${reports.length} orders updated. First report: ${firstReport.customerName} via ${sentChannels || "no live channels"}`,
      });
      return;
    }

    showToast({
      type: "error",
      message: "Dispatch completed without a notification report.",
    });
  };

  const handleExternalDispatch = async () => {
    if (!extName.trim() || !extTitle.trim()) return;
    setIsDispatching(true);
    const reports = await dispatchExternalOrder({
      customerName: extName,
      customerPhone: extPhone,
      customerEmail: extEmail,
      orderTitle: extTitle,
    });
    setExternalModalVisible(false);
    setExtName("");
    setExtPhone("");
    setExtEmail("");
    setExtTitle("");
    setIsDispatching(false);

    if (reports.length > 0) {
      showToast({
        type: "success",
        message: `${reports[0].customerName}: ${summarizeChannels(reports[0]) || "no live channels"}`,
      });
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.atelierStage === "Pending")
        .length,
      "follow-up": arrivalAttentionOrders.length,
    }),
    [arrivalAttentionOrders.length, orders],
  );

  const hasActiveRefinements = Boolean(
    searchValue.trim() || fromDate || toDate,
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const arrivalAttentionIds = new Set(
      arrivalAttentionOrders.map((alertOrder) => alertOrder.id),
    );

    return orders.filter((order) => {
      if (activeTab === "pending" && order.atelierStage !== "Pending") {
        return false;
      }

      if (activeTab === "follow-up" && !arrivalAttentionIds.has(order.id)) {
        return false;
      }

      if (
        normalizedSearch &&
        !order.id.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      const placedOn = new Date(order.placedOn);
      if (fromDate && placedOn < fromDate) {
        return false;
      }

      if (toDate && placedOn > toDate) {
        return false;
      }

      return true;
    });
  }, [
    activeTab,
    arrivalAttentionOrders,
    fromDate,
    orders,
    searchValue,
    toDate,
  ]);

  const clearRefinements = () => {
    setSearchValue("");
    setFromDate(null);
    setToDate(null);
    setVisibleCount(4);
  };

  const openOrderDetails = useCallback(
    (orderId: string) => {
      setNavigatingOrderId(orderId);
      requestAnimationFrame(() => {
        router.push({
          pathname: "/admin/orders/[id]",
          params: { id: orderId },
        } as any);
      });
    },
    [router],
  );

  useEffect(() => {
    if (!navigatingOrderId) return;
    const timer = setTimeout(() => setNavigatingOrderId(null), 2000);
    return () => clearTimeout(timer);
  }, [navigatingOrderId]);

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(4);
  }, [activeTab, fromDate, searchValue, toDate]);

  const handleOrdersScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom <= 240) {
        setVisibleCount((count) => Math.min(count + 4, filteredOrders.length));
      }
    },
    [filteredOrders.length],
  );
  const safeUpper = (value?: string) => (value ?? "UNKNOWN").toUpperCase();
  const isFallbackOrderImage = (image?: string) =>
    !image ||
    image.includes("images.unsplash.com/photo-1595777457583") ||
    image.includes("images.unsplash.com/photo-1521572163474") ||
    image.includes("images.unsplash.com/photo-1603252109303");

  const handleExportManifest = async () => {
    if (filteredOrders.length === 0) {
      showToast({
        type: "error",
        message: "No orders to export for the current filters.",
      });
      return;
    }

    try {
      const FileSystem = await import("expo-file-system");
      const Sharing = await import("expo-sharing");

      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const header = ["Order ID", "Customer", "Stage", "Placed On", "Total"];
      const rows = filteredOrders.map((order) => [
        order.id,
        order.customerName,
        order.atelierStage,
        order.placedOn,
        formatPrice(order.total),
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => escapeCsv(String(cell))).join(","))
        .join("\n");

      const file = new FileSystem.File(
        FileSystem.Paths.cache,
        `order_manifest_${Date.now()}.csv`,
      );
      file.create({ overwrite: true });
      file.write(csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Order Manifest",
        });
      } else {
        showToast({ type: "success", message: `Manifest saved: ${file.name}` });
      }
    } catch (error) {
      console.error("Error exporting manifest:", error);
      showToast({
        type: "error",
        message: "Could not export the order manifest.",
      });
    }
  };
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const sanitizedPhone = (value?: string) =>
    (value ?? "").replace(/[^\d+]/g, "");
  const openChat = (
    orderId: string,
    orderStatus: string,
    customerName: string,
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (order?.customerPhone) {
      const phone = sanitizedPhone(order.customerPhone).replace(/^\+/, "");
      Linking.openURL(
        `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${customerName}, following up on your order ${orderId}.`)}`,
      );
    } else {
      Linking.openURL(
        `mailto:support@houseofshirts.com?subject=Order Follow-up: ${orderId}`,
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f3f4f6] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleOrdersScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Back to admin dashboard" onPress={() => router.navigate("/admin" as any)}>
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>

          <BrandLogo width={154} height={28} />

          <Pressable accessibilityRole="button" accessibilityLabel="Open admin dashboard" onPress={() => router.push("/admin" as any)}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            MANAGE ATELIER
          </Text>
          <Text className="mt-2 font-bold text-[46px] leading-[44px] text-black dark:text-white">
            Active Orders
          </Text>
        </View>

        <View className="mt-6 border-b border-[#e4e7eb] px-6 pb-4 dark:border-white/10">
          <View className="flex-row items-center gap-5">
            {FILTER_TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    setActiveTab(tab.key);
                    setVisibleCount(4);
                  }}
                  className="flex-row items-center gap-2"
                >
                  <Text
                    className={`font-bold text-[10px] tracking-[1.4px] ${
                      isActive
                        ? "text-black dark:text-white"
                        : "text-neutral-400"
                    }`}
                  >
                    {tab.label}
                  </Text>
                  <View
                    className={`h-5 min-w-[20px] items-center justify-center rounded-full px-1 ${
                      isActive
                        ? "bg-[#25314b]"
                        : "bg-[#eceff3] dark:bg-white/10"
                    }`}
                  >
                    <Text
                      className={`font-bold text-[9px] ${
                        isActive
                          ? "text-white"
                          : "text-neutral-500 dark:text-white/60"
                      }`}
                    >
                      {counts[tab.key]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6 px-6">
          <View className="bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                REFINE RESULTS
              </Text>
              {hasActiveRefinements ? (
                <Pressable accessibilityRole="button" onPress={clearRefinements}>
                  <Text className="font-bold text-[10px] tracking-[1.4px] text-[#b45309]">
                    CLEAR
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View className="mt-4 flex-row items-center border border-[#bfc3ca] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0a0c0e]">
              <Ionicons name="search" size={18} color="#6b7280" />
              <TextInput
                value={searchValue}
                onChangeText={(value) => {
                  setSearchValue(value);
                  setVisibleCount(4);
                }}
                placeholder="Search by order ID"
                placeholderTextColor="#9ca3af"
                className="ml-3 flex-1 font-normal text-[14px] text-black dark:text-white"
              />
              {searchValue ? (
                <Pressable accessibilityRole="button" onPress={() => setSearchValue("")}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              ) : null}
            </View>

            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPress={() => setShowFromPicker(true)}
                className="flex-1 flex-row items-center border border-[#bfc3ca] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0a0c0e]"
              >
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text
                  className={`ml-3 flex-1 font-normal text-[13px] ${
                    fromDate ? "text-black dark:text-white" : "text-[#9ca3af]"
                  }`}
                >
                  {fromDate ? formatDateLabel(fromDate) : "From"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowToPicker(true)}
                className="flex-1 flex-row items-center border border-[#bfc3ca] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0a0c0e]"
              >
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text
                  className={`ml-3 flex-1 font-normal text-[13px] ${
                    toDate ? "text-black dark:text-white" : "text-[#9ca3af]"
                  }`}
                >
                  {toDate ? formatDateLabel(toDate) : "To"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mt-5 px-6 flex-row flex-wrap gap-3">
          <Pressable
            onPress={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedOrderIds(new Set());
            }}
            className={`px-4 py-3 border ${selectMode ? "bg-black border-black dark:bg-white dark:border-white" : "border-gray-300 dark:border-white/20"}`}
          >
            <Text
              className={`font-bold text-[10px] tracking-[1.5px] ${selectMode ? "text-white dark:text-black" : "text-black dark:text-white"}`}
            >
              {selectMode ? "CANCEL SELECTION" : "BULK DISPATCH"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setExternalModalVisible(true)}
            className="px-4 py-3 border border-gray-300 dark:border-white/20"
          >
            <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
              + MANUAL ORDER
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleExportManifest()}
            className="bg-black px-6 py-3"
          >
            <Text className="font-bold text-[10px] tracking-[1.5px] text-white">
              EXPORT MANIFEST
            </Text>
          </Pressable>
        </View>

        {arrivalAttentionOrders.length > 0 ? (
          <View className="mt-6 px-6">
            <View className="rounded-[24px] bg-[#fbf7ef] px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-[#b45309]">
                ARRIVAL WATCHLIST
              </Text>
              <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-600">
                {arrivalAttentionOrders.length} GIGL pay-on-delivery order
                {arrivalAttentionOrders.length === 1 ? "" : "s"} need
                availability outreach before pickup or doorstep delivery.
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mt-6 px-6">
          <View className="gap-5">
            {visibleOrders.map((order) => {
              const stageConfig =
                stageColors[order.atelierStage] ?? stageColors.Pending;

              return (
                <Pressable
                  key={order.id}
                  onPress={() =>
                    selectMode
                      ? toggleSelectOrder(order.id)
                      : openOrderDetails(order.id)
                  }
                  className={`bg-white px-5 py-5 dark:bg-[#101215] ${selectMode && selectedOrderIds.has(order.id) ? "border-2 border-black dark:border-white" : ""}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-2">
                      {selectMode && (
                        <View
                          className={`w-4 h-4 rounded-full border ${selectedOrderIds.has(order.id) ? "bg-black border-black dark:bg-white dark:border-white" : "border-gray-300 dark:border-gray-600"} items-center justify-center`}
                        >
                          {selectedOrderIds.has(order.id) && (
                            <Ionicons
                              name="checkmark"
                              size={10}
                              color={isDark ? "black" : "white"}
                            />
                          )}
                        </View>
                      )}
                      <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-400">
                        {formatOrderReference(order.id)}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 ${stageConfig.badge}`}>
                      <Text
                        className={`font-bold text-[9px] tracking-[1.4px] ${stageConfig.text}`}
                      >
                        {safeUpper(order.atelierStage)}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-3 font-bold text-[31px] leading-[31px] text-black dark:text-white">
                    {order.customerName}
                  </Text>

                  <View className="mt-5 flex-row gap-4">
                    {isFallbackOrderImage(order.image) ? (
                      <View className="h-20 w-16 items-center justify-center bg-[#f1f2f4] dark:bg-[#0b0d10] border border-black/5 dark:border-white/10">
                        <Ionicons
                          name="receipt-outline"
                          size={28}
                          color={isDark ? "#f8fafc" : "#111111"}
                        />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: order.image }}
                        className="h-20 w-16 bg-[#f1f2f4]"
                        resizeMode="cover"
                      />
                    )}

                    <View className="flex-1 justify-between">
                      <View>
                        <Text className="font-bold text-[16px] leading-5 text-black dark:text-white">
                          {order.title}
                        </Text>
                        <Text className="mt-1 font-normal text-[10px] tracking-[1.1px] text-neutral-400">
                          {order.subtitle}
                        </Text>
                      </View>

                      <View className="mt-4">
                        <Text className="font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                          TOTAL AMOUNT
                        </Text>
                        <Text className="mt-2 font-bold text-[28px] leading-7 text-black dark:text-white">
                          {formatPrice(order.total)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-2">
                    {order.customerRiskStatus === "Blacklisted" ? (
                      <View className="bg-[#e04040] px-3 py-2">
                        <Text className="font-bold text-[9px] tracking-[1.2px] text-white">
                          RISK: BLACKLISTED
                        </Text>
                      </View>
                    ) : null}
                    <View className="bg-[#f3f4f6] px-3 py-2">
                      <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500">
                        {safeUpper(order.carrier)}
                      </Text>
                    </View>
                    <View className="bg-[#f3f4f6] px-3 py-2">
                      <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500">
                        {safeUpper(order.paymentMethod)}
                      </Text>
                    </View>
                    <View className="bg-[#f3f4f6] px-3 py-2">
                      <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-500">
                        {safeUpper(order.fulfillmentMethod)}
                      </Text>
                    </View>
                  </View>

                  {arrivalAttentionOrders.some(
                    (alertOrder) => alertOrder.id === order.id,
                  ) ? (
                    <View className="mt-4 rounded-[20px] bg-[#fbf7ef] px-4 py-4">
                      <Text className="font-bold text-[10px] tracking-[1.3px] text-[#b45309]">
                        CUSTOMER AVAILABILITY ALERT
                      </Text>
                      <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-600">
                        This GIGL pay-on-delivery order has reached{" "}
                        {order.status.toLowerCase()}. Reach the customer now so
                        the package is not left unclaimed.
                      </Text>
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
                      <View className="mt-3 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4">
                          <Pressable
                            onPress={() =>
                              openChat(
                                order.id,
                                order.status,
                                order.customerName,
                              )
                            }
                          >
                            <Text className="font-bold text-[10px] tracking-[1.4px] text-[#161c28]">
                              CHAT
                            </Text>
                          </Pressable>
                          {order.customerPhone ? (
                            <Pressable
                              onPress={() =>
                                Linking.openURL(
                                  `tel:${sanitizedPhone(order.customerPhone)}`,
                                ).catch(() => {})
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
                                Linking.openURL(
                                  `sms:${sanitizedPhone(order.customerPhone)}`,
                                ).catch(() => {})
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
                                Linking.openURL(
                                  `https://wa.me/${sanitizedPhone(order.customerPhone).replace(/^\+/, "")}`,
                                ).catch(() => {})
                              }
                            >
                              <Text className="font-bold text-[10px] tracking-[1.4px] text-[#161c28]">
                                WHATSAPP
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                        <View className="flex-row items-center gap-4">
                          {order.followUpStatus === "Pending" ? (
                            <Pressable
                              onPress={() =>
                                void acknowledgeArrivalAlert(
                                  order.id,
                                  `Admin marked follow-up contacted for ${order.status.toLowerCase()} order via ${order.carrier}.`,
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
                                  `Admin resolved alert after confirming customer pickup/payment for ${order.id}.`,
                                )
                              }
                            >
                              <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-500">
                                RESOLVE ALERT
                              </Text>
                            </Pressable>
                          ) : (
                            <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                              {safeUpper(order.followUpStatus)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {order.customerRiskStatus === "Blacklisted" ? (
                    <View className="mt-4 rounded-[20px] bg-[#fff4f4] px-4 py-4">
                      <Text className="font-bold text-[10px] tracking-[1.3px] text-[#d43c3c]">
                        BLACKLIST RISK ALERT
                      </Text>
                      <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-600">
                        {order.customerRiskReason ||
                          "This customer is restricted and the order should remain under manual review."}
                      </Text>
                      <Pressable
                        onPress={() => router.push("/admin/blacklist" as any)}
                        className="mt-4 self-start bg-black px-4 py-3"
                      >
                        <Text className="font-bold text-[9px] tracking-[1.3px] text-white">
                          REVIEW BLACKLIST
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View className="mt-5 flex-row items-center justify-end">
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        openOrderDetails(order.id);
                      }}
                    >
                      <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-700">
                        {stageConfig.action}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-10 items-center px-6">
          <Text className="font-bold text-[28px] leading-none text-neutral-400">
            ...
          </Text>
          <Text className="mt-2 font-normal text-[11px] text-neutral-400">
            Displaying {visibleOrders.length} of {filteredOrders.length} active
            orders
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(navigatingOrderId)}
        transparent
        animationType="fade"
      >
        <View className="flex-1 items-center justify-center bg-black/35 px-8">
          <View className="w-full max-w-sm rounded-[28px] bg-white dark:bg-[#101215]">
            <HouseLoader label="OPENING ORDER" />
          </View>
        </View>
      </Modal>

      {/* External Order Modal */}
      <Modal visible={externalModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-[#101215] p-6 rounded-t-[24px]">
            <Text className="font-bold text-xl mb-4 dark:text-white">
              Quick Dispatch External Order
            </Text>
            <TextInput accessibilityLabel="Customer Name (Required)"
              value={extName}
              onChangeText={setExtName}
              placeholder="Customer Name (Required)"
              className="bg-gray-100 dark:bg-white/10 p-4 mb-3 rounded-xl dark:text-white"
              placeholderTextColor="#9ca3af"
            />
            <TextInput accessibilityLabel="Phone Number (Required for SMS)"
              value={extPhone}
              onChangeText={setExtPhone}
              placeholder="Phone Number (Required for SMS)"
              keyboardType="phone-pad"
              className="bg-gray-100 dark:bg-white/10 p-4 mb-3 rounded-xl dark:text-white"
              placeholderTextColor="#9ca3af"
            />
            <TextInput accessibilityLabel="Email (Optional)"
              value={extEmail}
              onChangeText={setExtEmail}
              placeholder="Email (Optional)"
              keyboardType="email-address"
              className="bg-gray-100 dark:bg-white/10 p-4 mb-3 rounded-xl dark:text-white"
              placeholderTextColor="#9ca3af"
            />
            <TextInput accessibilityLabel="Order Title/Description (Required)"
              value={extTitle}
              onChangeText={setExtTitle}
              placeholder="Order Title/Description (Required)"
              className="bg-gray-100 dark:bg-white/10 p-4 mb-5 rounded-xl dark:text-white"
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setExternalModalVisible(false)}
                className="flex-1 p-4 items-center bg-gray-200 dark:bg-white/10 rounded-xl"
              >
                <Text className="font-bold dark:text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleExternalDispatch}
                className="flex-1 p-4 items-center bg-black dark:bg-white rounded-xl"
              >
                <Text className="font-bold text-white dark:text-black">
                  {isDispatching ? "Dispatching..." : "Dispatch & Notify"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fixed Action Bar for Bulk Dispatch */}
      {selectMode && selectedOrderIds.size > 0 && (
        <View className="absolute bottom-[90px] left-0 right-0 p-6 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/10 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
          <Pressable
            onPress={handleBulkDispatch}
            disabled={isDispatching}
            className="bg-black dark:bg-white w-full py-4 items-center rounded-[8px]"
          >
            <Text className="font-bold text-[12px] tracking-[2px] text-white dark:text-black">
              {isDispatching
                ? "DISPATCHING..."
                : `MARK DISPATCHED (${selectedOrderIds.size})`}
            </Text>
          </Pressable>
        </View>
      )}

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
          <Pressable accessibilityViewIsModal className="rounded-t-[32px] bg-[#fbfbfc] px-6 pb-8 pt-6 dark:bg-[#101215]">
            <View className="self-center h-1.5 w-16 rounded-full bg-[#d7dbe2]" />
            <Text className="mt-5 font-bold text-[11px] tracking-[1.6px] text-neutral-400">
              ORDER ACTIONS
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-8 text-black dark:text-white">
              Update Status
            </Text>
            {selectedOrder ? (
              <View className="mt-6 gap-3">
                {(
                  ["Arrived at Hub", "Out for Delivery", "Delivered"] as const
                ).map((milestone) => (
                  <Pressable accessibilityRole="button"
                    key={milestone}
                    onPress={async () => {
                      const report = await updateOrderLogisticsStatus(
                        selectedOrder.id,
                        milestone,
                      );
                      setSelectedOrderId(null);
                      if (report) {
                        showToast({
                          type: "success",
                          message: `${milestone}: ${summarizeChannels(report) || "no live channels"}`,
                        });
                      }
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
                ))}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate ?? new Date()}
          mode="date"
          display="default"
          maximumDate={toDate ?? undefined}
          onChange={(_event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) {
              setFromDate(selectedDate);
              setVisibleCount(4);
            }
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate ?? new Date()}
          mode="date"
          display="default"
          minimumDate={fromDate ?? undefined}
          onChange={(_event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) {
              setToDate(selectedDate);
              setVisibleCount(4);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
