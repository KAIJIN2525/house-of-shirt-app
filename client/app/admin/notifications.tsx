import { NotificationCampaign, NotificationTargetType, useAdminContentStore, NotificationTemplate } from "@/stores/adminContentStore";
import { formatPrice } from "@/constants";

import { useOrdersStore } from "@/stores/ordersStore";
import { useProductsStore } from "@/stores/productsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";

import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";

const audienceOptions: {
  id: NotificationCampaign["audience"];
  label: string;
}[] = [
  { id: "all", label: "All Customers" },
  { id: "vip", label: "VIP Clients" },
  { id: "new", label: "New Subscribers" },
];

const targetTypeOptions: { id: NotificationTargetType; label: string }[] = [
  { id: "shop", label: "Catalog / Search" },
  { id: "product", label: "Specific Product" },
  { id: "orders", label: "Specific Order" },
];


export default function AdminNotificationsScreen() {
  const router = useRouter();
  const {  isDark  } = useThemeStore();
  const {  orders  } = useOrdersStore();
  const {  products  } = useProductsStore();
  const {
    notificationCampaigns,
    sendNotificationCampaign,
    settings,
    notificationTemplates,
    fetchTemplates,
    isLoadingTemplates,
  } = useAdminContentStore();


  const [title, setTitle] = useState("The Autumn Collection is here");
  const [message, setMessage] = useState(
    "Experience the tactile luxury of our new hand-finished silk shirting. Members get early access starting today."
  );
  const [audience, setAudience] =
    useState<NotificationCampaign["audience"]>("all");
  const [targetType, setTargetType] = useState<NotificationTargetType>("shop");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "1");
  const [targetValue, setTargetValue] = useState(products[0]?.name ?? "autumn collection");
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [statusMessage, setStatusMessage] = useState("");
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [isOrderPickerOpen, setIsOrderPickerOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const {  saveTemplate, deleteTemplate  } = useAdminContentStore();


  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);


  const scheduledFor =
    sendMode === "now" ? "Send Now" : "Apr 06, 2026 - 10:00";
  const titleCount = title.length;
  const bodyCount = message.length;
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? products[0],
    [products, selectedProductId]
  );

  const filteredProductsForPicker = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    const terms = term.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const searchStr = `${p.name} ${p.brand} ${p.category || ""}`.toLowerCase();
      return terms.every((t) => searchStr.includes(t));
    });
  }, [products, productSearch]);
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === targetValue),
    [orders, targetValue]
  );


  const applyTemplateVariables = (text: string, type: NotificationTargetType, val: string) => {
    let result = text;
    if (type === "shop") {
      result = result.replace(/\[Collection Name\]/gi, val);
    } else if (type === "product") {
      const product = products.find(p => p.id === val);
      result = result.replace(/\[Product Name\]/gi, product?.name ?? val);
    } else if (type === "orders") {
      const order = orders.find(o => o.id === val);
      result = result.replace(/\[OrderNo\]/gi, val);
      if (order?.trackingNumber) {
        result = result.replace(/\[Waybill\]/gi, order.trackingNumber);
      }
    }
    return result;
  };

  const effectiveTargetValue =
    targetType === "product"
      ? selectedProductId
      : targetType === "shop"
        ? selectedProduct?.name ?? targetValue
        : targetValue;


  const notificationBlockedReason = useMemo(() => {
    if (!settings.globalNotifications) {
      return "Global notifications are disabled in Admin Settings.";
    }

    if (audience !== "all" && !settings.marketing) {
      return "Marketing notifications are disabled in Admin Settings.";
    }

    return "";
  }, [audience, settings.globalNotifications, settings.marketing]);

  const handleSend = async () => {
    if (notificationBlockedReason) {
      setStatusMessage(notificationBlockedReason);
      return;
    }

    const finalTitle = applyTemplateVariables(title, targetType, effectiveTargetValue);
    const finalMessage = applyTemplateVariables(message, targetType, effectiveTargetValue);

    const created = await sendNotificationCampaign({
      title: finalTitle,
      message: finalMessage,
      audience,
      scheduledFor,
      mode: "send",
      targetType,
      targetValue: effectiveTargetValue,
    });

    setStatusMessage(
      created.status === "Scheduled"
        ? "Push notification scheduled locally."
        : "Push notification sent locally."
    );
  };

  const handleSaveDraft = async () => {
    const finalTitle = applyTemplateVariables(title, targetType, effectiveTargetValue);
    const finalMessage = applyTemplateVariables(message, targetType, effectiveTargetValue);

    const created = await sendNotificationCampaign({
      title: finalTitle,
      message: finalMessage,
      audience,
      scheduledFor,
      mode: "draft",
      targetType,
      targetValue: effectiveTargetValue,
    });

    setStatusMessage(`${created.title} saved as draft locally.`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Back to admin dashboard" onPress={() => router.navigate("/admin" as any)}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable accessibilityRole="button" accessibilityLabel="Open admin settings" onPress={() => router.push("/admin/settings" as any)}>
            <View className="h-7 w-7 items-center justify-center rounded-full bg-[#1f2736]">
              <Ionicons name="notifications" size={12} color="#f8f5ee" />
            </View>
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            CAMPAIGN BUILDER
          </Text>
          <Text className="mt-2 font-bold text-[44px] leading-[42px] text-black dark:text-white">
            Push{"\n"}Notification
          </Text>
          <Text className="mt-3 font-normal text-[14px] leading-6 text-neutral-400">
            Compose and schedule premium communications for your clientele.
            Review the mobile rendering in real-time.
          </Text>

          <View className="mt-6 flex-row items-center gap-4">
            <Pressable
              onPress={() => setIsTemplatePickerOpen(true)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="copy-outline" size={14} color="#3b82f6" />
              <Text className="font-bold text-[11px] tracking-[1.2px] text-blue-500">
                USE TEMPLATE
              </Text>
            </Pressable>
            <View className="h-3 w-[1px] bg-neutral-300" />
            <Pressable
              onPress={() => setIsTemplateManagerOpen(true)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="settings-outline" size={14} color="#64748b" />
              <Text className="font-bold text-[11px] tracking-[1.2px] text-slate-500">
                MANAGE TEMPLATES
              </Text>
            </Pressable>
          </View>
        </View>



        <View className="mt-8 px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            NOTIFICATION TITLE
          </Text>
          <TextInput accessibilityLabel="e.g. The Autumn Collection is here"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. The Autumn Collection is here"
            placeholderTextColor="#b0b6c0"
            className="mt-2 bg-white px-4 py-4 font-normal text-[13px] text-neutral-700 dark:bg-[#101215] dark:text-white"
          />

          <Text className="mt-6 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            MESSAGE BODY
          </Text>
          <TextInput accessibilityLabel="Craft your message with precision..."
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder="Craft your message with precision..."
            placeholderTextColor="#b0b6c0"
            className="mt-2 min-h-32 bg-white px-4 py-4 font-normal text-[13px] leading-6 text-neutral-700 dark:bg-[#101215] dark:text-white"
          />

          <Text className="mt-6 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            SEGMENT TARGETING
          </Text>
          <View className="mt-2 bg-white px-4 py-1 dark:bg-[#101215]">
            {audienceOptions.map((option) => {
              const isSelected = audience === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setAudience(option.id)}
                  className="flex-row items-center justify-between border-b border-[#f0f1f4] py-4 last:border-b-0"
                >
                  <Text
                    className={`font-normal text-[13px] ${
                      isSelected ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-300"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={16} color={isDark ? "#ffffff" : "#111111"} />
                  ) : (
                    <Ionicons name="chevron-down" size={16} color="#b0b6c0" />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-6 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            DESTINATION TARGET
          </Text>
          <View className="mt-2 flex-row overflow-hidden bg-white dark:bg-[#101215]">
            {targetTypeOptions.map((option) => {
              const isSelected = targetType === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setTargetType(option.id);
                    setTargetValue(
                      option.id === "orders"
                        ? (orders[0]?.id ?? "")
                        : (selectedProduct?.name ?? "")
                    );
                    setStatusMessage("");
                  }}
                  className={`flex-1 px-3 py-4 ${
                    isSelected ? "bg-[#161c28] dark:bg-white" : "bg-white dark:bg-[#101215]"
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-[11px] tracking-[1.1px] ${
                      isSelected ? "text-white dark:text-black" : "text-neutral-500 dark:text-neutral-300"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-6 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            {targetType === "orders" ? "TARGET ORDER ID" : targetType === "product" ? "TARGET PRODUCT" : "CATALOG SEARCH QUERY"}
          </Text>
          {targetType === "orders" ? (
            <Pressable
              onPress={() => setIsOrderPickerOpen(true)}
            className="mt-2 bg-white px-4 py-4 dark:bg-[#101215]"
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1">
                  <Text className="font-bold text-[13px] text-black dark:text-white">
                    {selectedOrder?.id ?? "Select order"}
                  </Text>
                  <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                    {selectedOrder
                      ? `${selectedOrder.customerName} • ${selectedOrder.status}`
                      : "Operational order target"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#7b8190" />
              </View>
            </Pressable>
          ) : targetType === "product" ? (
            <Pressable
              onPress={() => setIsProductPickerOpen(true)}
            className="mt-2 bg-white px-4 py-4 dark:bg-[#101215]"
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1">
                  <Text className="font-bold text-[13px] text-black dark:text-white">
                    {selectedProduct?.name ?? "Select product"}
                  </Text>
                  <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                    {selectedProduct?.category ?? "Catalog target"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#7b8190" />
              </View>
            </Pressable>
          ) : (
             <TextInput accessibilityLabel="e.g. Oxford Shirts"
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="e.g. Oxford Shirts"
              placeholderTextColor="#b0b6c0"
              className="mt-2 bg-white px-4 py-4 font-normal text-[13px] text-neutral-700 dark:bg-[#101215] dark:text-white"
            />
          )}


          <Text className="mt-6 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            SCHEDULING
          </Text>
          <View className="mt-2 flex-row overflow-hidden bg-white dark:bg-[#101215]">
            <Pressable
              onPress={() => setSendMode("now")}
              className={`flex-1 py-4 ${
                sendMode === "now" ? "bg-[#eceff3] dark:bg-white" : "bg-white dark:bg-[#101215]"
              }`}
            >
              <Text className={`text-center font-bold text-[12px] ${
                sendMode === "now" ? "text-black" : "text-black dark:text-white"
              }`}>
                Send Now
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSendMode("schedule")}
              className={`flex-1 py-4 ${
                sendMode === "schedule" ? "bg-[#eceff3] dark:bg-white" : "bg-white dark:bg-[#101215]"
              }`}
            >
              <Text className={`text-center font-bold text-[12px] ${
                sendMode === "schedule" ? "text-black" : "text-neutral-500 dark:text-neutral-300"
              }`}>
                Schedule
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-10 px-6">
          <Text className="text-center font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            REAL-TIME PREVIEW
          </Text>

          <View className="mt-5 items-center">
            <View className="w-[220px] rounded-[40px] border-[6px] border-[#0f1830] bg-[#0c1020] px-3 pb-4 pt-3 shadow-sm shadow-black/10">
              <View className="mb-4 items-center">
                <View className="h-5 w-24 rounded-full bg-black/80" />
              </View>

              <View className="min-h-[390px] rounded-[28px] bg-[#111317] px-4 py-4">
                <View className="rounded-[18px] bg-white px-4 py-4 shadow-sm shadow-black/10">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-bold text-[8px] tracking-[1.3px] text-neutral-400">
                        HOUSE OF SHIRTS
                      </Text>
                      <Text className="mt-2 font-bold text-[16px] leading-5 text-black">
                        {title || "Your notification title"}
                      </Text>
                      <Text className="mt-2 font-normal text-[11px] leading-4 text-neutral-500">
                        {message || "Your notification body will render here."}
                      </Text>
                      <Text className="mt-3 font-bold text-[9px] tracking-[1.2px] text-neutral-400">
                        {targetType === "orders"
                          ? `TRACKING ${targetValue || "ORDER ID"}`
                          : `PRODUCT: ${effectiveTargetValue || "CATALOG ITEM"}`}
                      </Text>
                    </View>
                    <Text className="font-normal text-[8px] text-neutral-400">
                      {sendMode === "schedule" ? "soon" : "now"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={16} color={isDark ? "#e5e7eb" : "#111111"} />
              <View className="flex-1">
                <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-400">
                  CHARACTER COUNT
                </Text>
                <View className="mt-4 flex-row justify-between gap-5">
                  <View>
                    <Text className="font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                      TITLE
                    </Text>
                    <Text className="mt-1 font-bold text-[28px] text-black dark:text-white">
                      {titleCount} / 50
                    </Text>
                  </View>
                  <View>
                    <Text className="font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                      BODY
                    </Text>
                    <Text className="mt-1 font-bold text-[28px] text-black dark:text-white">
                      {bodyCount} / 180
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          {notificationBlockedReason ? (
            <Text className="mb-4 font-normal text-[12px] text-[#b45309]">
              {notificationBlockedReason}
            </Text>
          ) : null}
          {statusMessage ? (
            <Text className="mb-4 font-normal text-[12px] text-[#3c6a9e]">
              {statusMessage}
            </Text>
          ) : null}

          <View className="flex-row items-end justify-between gap-4">
            <Pressable
              onPress={handleSend}
              className={`flex-1 flex-row items-center justify-between px-5 py-5 ${
                notificationBlockedReason ? "bg-[#61697a]" : "bg-[#161c28]"
              }`}
            >
              <Text className="font-bold text-[12px] text-white">
                Send{"\n"}Notification
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </Pressable>

            <Pressable accessibilityRole="button" onPress={handleSaveDraft} className="px-2 py-4">
              <Text className="font-bold text-[12px] leading-5 text-black dark:text-white">
                Save{"\n"}Draft
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-8 px-6">
          <Pressable
            onPress={() => router.push("/admin/scheduled" as any)}
            className="border border-[#d8dce3] bg-white px-5 py-4 dark:border-white/10 dark:bg-[#101215]"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-bold text-[11px] tracking-[1.4px] text-neutral-400">
                  QUEUE OVERVIEW
                </Text>
                <Text className="mt-2 font-bold text-[16px] text-black dark:text-white">
                  View Scheduled Campaigns
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={isDark ? "#ffffff" : "#111111"} />
            </View>
          </Pressable>
        </View>

        <View className="mt-10 px-6">
          <Text className="font-bold text-[16px] text-black dark:text-white">
            Recent Campaigns
          </Text>
          <View className="mt-4 gap-3">
            {notificationCampaigns.slice(0, 3).map((campaign) => (
              <View key={campaign.id} className="bg-white px-4 py-4 dark:bg-[#101215]">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-bold text-[14px] text-black dark:text-white">
                      {campaign.title}
                    </Text>
                    <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                      {campaign.status.toUpperCase()} | {campaign.scheduledFor}
                    </Text>
                    <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                      {campaign.targetType === "orders"
                        ? `Tracks ${campaign.targetValue}`
                        : `Targets "${campaign.targetValue}"`}
                    </Text>
                  </View>
                  <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-500">
                    {campaign.audience.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isProductPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProductPickerOpen(false)}
      >
        <Pressable
          onPress={() => setIsProductPickerOpen(false)}
          className="flex-1 justify-end bg-black/35"
        >
          <Pressable accessibilityViewIsModal className="max-h-[75%] rounded-t-[32px] bg-[#fbfbfc] px-6 pb-8 pt-6">
            <View className="self-center h-1.5 w-16 rounded-full bg-[#d7dbe2]" />
            <Text className="mt-5 font-bold text-[11px] tracking-[1.6px] text-neutral-400">
              PRODUCT TARGET
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-8 text-black">
              Select Catalog Item
            </Text>

            <View className="mt-4 mb-3">
              <View className="flex-row items-center rounded-2xl bg-[#eff1f4] px-4 py-3">
                <Ionicons name="search" size={18} color="#94a3b8" />
                <TextInput accessibilityLabel="Search products..."
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Search products..."
                  placeholderTextColor="#94a3b8"
                  className="ml-3 flex-1 font-medium text-[14px] text-black"
                  autoFocus={false}
                />
                {productSearch.length > 0 && (
                  <Pressable accessibilityRole="button" onPress={() => setProductSearch("")}>
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </Pressable>
                )}
              </View>
            </View>

            <FlatList
              data={filteredProductsForPicker}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item: product }) => {
                const isSelected = product.id === selectedProductId;
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedProductId(product.id);
                      setTargetValue(product.name);
                      setIsProductPickerOpen(false);
                      setProductSearch("");
                    }}
                    className={`mb-3 rounded-[22px] border px-5 py-4 ${
                      isSelected
                        ? "border-[#161c28] bg-[#161c28]"
                        : "border-[#e7eaf0] bg-white"
                    }`}
                  >
                    <View className="flex-row items-center justify-between gap-4">
                      <View className="flex-1">
                        <Text
                          className={`font-bold text-[13px] ${
                            isSelected ? "text-white" : "text-black"
                          }`}
                        >
                          {product.name}
                        </Text>
                        <Text
                          className={`mt-1 font-normal text-[11px] ${
                            isSelected ? "text-white/70" : "text-neutral-400"
                          }`}
                        >
                          {product.category} • {product.brand} • {formatPrice(product.price)}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#9ca3af"
                        />
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View className="items-center py-20">
                  <Text className="text-neutral-400 font-medium">No products match your search</Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isOrderPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOrderPickerOpen(false)}
      >
        <Pressable
          onPress={() => setIsOrderPickerOpen(false)}
          className="flex-1 justify-end bg-black/35"
        >
          <Pressable accessibilityViewIsModal className="max-h-[75%] rounded-t-[32px] bg-[#fbfbfc] px-6 pb-8 pt-6">
            <View className="self-center h-1.5 w-16 rounded-full bg-[#d7dbe2]" />
            <Text className="mt-5 font-bold text-[11px] tracking-[1.6px] text-neutral-400">
              ORDER TARGET
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-8 text-black">
              Select Active Order
            </Text>

            <ScrollView className="mt-6" showsVerticalScrollIndicator={false}>
              <View className="gap-3">
                {orders.map((order) => {
                  const isSelected = order.id === targetValue;

                  return (
                    <Pressable
                      key={order.id}
                      onPress={() => {
                        setTargetValue(order.id);
                        setIsOrderPickerOpen(false);
                      }}
                      className={`rounded-[22px] border px-5 py-4 ${
                        isSelected
                          ? "border-[#161c28] bg-[#161c28]"
                          : "border-[#e7eaf0] bg-white"
                      }`}
                    >
                      <View className="flex-row items-center justify-between gap-4">
                        <View className="flex-1">
                          <Text
                            className={`font-bold text-[13px] ${
                              isSelected ? "text-white" : "text-black"
                            }`}
                          >
                            {order.id}
                          </Text>
                          <Text
                            className={`mt-1 font-normal text-[11px] ${
                              isSelected ? "text-white/70" : "text-neutral-400"
                            }`}
                          >
                            {order.customerName} • {order.status}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={16} color="#ffffff" />
                        ) : (
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#9ca3af"
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isTemplatePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTemplatePickerOpen(false)}
      >
        <Pressable
          onPress={() => setIsTemplatePickerOpen(false)}
          className="flex-1 justify-end bg-black/35"
        >
          <Pressable accessibilityViewIsModal className="max-h-[75%] rounded-t-[32px] bg-[#fbfbfc] px-6 pb-8 pt-6">
            <View className="self-center h-1.5 w-16 rounded-full bg-[#d7dbe2]" />
            <Text className="mt-5 font-bold text-[11px] tracking-[1.6px] text-neutral-400">
              SELECT TEMPLATE
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-8 text-black">
              Saved Messages
            </Text>

            <ScrollView className="mt-6" showsVerticalScrollIndicator={false}>
              <View className="gap-3">
                {isLoadingTemplates ? (
                  <View className="py-20">
                    <ActivityIndicator color="#161c28" />
                    <Text className="mt-4 text-center font-bold text-[10px] tracking-[1.2px] text-neutral-400">
                      SYNCING WITH SUPABASE...
                    </Text>
                  </View>
                ) : notificationTemplates.length === 0 ? (
                  <View className="py-20 items-center">
                    <Ionicons name="cloud-offline-outline" size={32} color="#d1d5db" />
                    <Text className="mt-4 text-center font-bold text-[10px] tracking-[1.2px] text-neutral-400">
                      NO TEMPLATES FOUND
                    </Text>
                  </View>
                ) : (
                  notificationTemplates.map((template) => (
                    <Pressable
                      key={template.id}
                      onPress={() => {
                        const newTitle = applyTemplateVariables(template.title, targetType, targetValue);
                        const newMessage = applyTemplateVariables(template.body, targetType, targetValue);
                        setTitle(newTitle);
                        setMessage(newMessage);
                        setIsTemplatePickerOpen(false);
                      }}

                      className="rounded-[22px] border border-[#e7eaf0] bg-white px-5 py-4"
                    >
                      <View className="flex-row items-center justify-between gap-4">
                        <View className="flex-1">
                          <Text className="font-bold text-[13px] text-black">
                            {template.title}
                          </Text>
                          <Text className="mt-1 font-normal text-[11px] text-neutral-400" numberOfLines={1}>
                            {template.body}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </ScrollView>

          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isTemplateManagerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTemplateManagerOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable accessibilityRole="button" accessibilityLabel="Close template manager" onPress={() => {
              setIsTemplateManagerOpen(false);
              setEditingTemplate(null);
              setEditTitle("");
              setEditBody("");
            }}>
              <Ionicons name="close" size={24} color={isDark ? "#f8fafc" : "#111111"} />
            </Pressable>
            <Text className="font-bold text-[11px] tracking-[1.5px] text-black dark:text-white">
              TEMPLATE MANAGER
            </Text>
            <View className="w-6" />
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            <View className="mt-4">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                {editingTemplate ? "EDIT TEMPLATE" : "CREATE NEW TEMPLATE"}
              </Text>
              <TextInput accessibilityLabel="Template Title (e.g. Order Shipped!)"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Template Title (e.g. Order Shipped!)"
                placeholderTextColor="#b0b6c0"
                className="mt-2 bg-white px-4 py-4 font-normal text-[13px] text-neutral-700 dark:bg-[#101215] dark:text-white"
              />
              <TextInput accessibilityLabel="Template Body... Use [Collection Name], [OrderNo], or [Waybill] as variables."
                value={editBody}
                onChangeText={setEditBody}
                multiline
                placeholder="Template Body... Use [Collection Name], [OrderNo], or [Waybill] as variables."
                placeholderTextColor="#b0b6c0"
                className="mt-3 min-h-24 bg-white px-4 py-4 font-normal text-[13px] text-neutral-700 dark:bg-[#101215] dark:text-white"
              />
              <Pressable
                onPress={async () => {
                  if (!editTitle || !editBody) return;
                  setIsSavingTemplate(true);
                  await saveTemplate({
                    id: editingTemplate?.id || `temp-${Date.now()}`,
                    eventKey: editingTemplate?.eventKey || "custom",
                    title: editTitle,
                    body: editBody,
                  });
                  setIsSavingTemplate(false);
                  setEditingTemplate(null);
                  setEditTitle("");
                  setEditBody("");
                }}
                disabled={isSavingTemplate || !editTitle || !editBody}
                className="mt-4 items-center rounded-xl bg-blue-600 py-4"
              >
                {isSavingTemplate ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-bold text-[12px] text-white">
                    {editingTemplate ? "UPDATE TEMPLATE" : "SAVE TEMPLATE"}
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="mt-10">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                EXISTING TEMPLATES ({notificationTemplates.length})
              </Text>
              <View className="mt-4 gap-3">
                {notificationTemplates.map((template) => (
                  <View key={template.id} className="bg-white px-4 py-4 dark:bg-[#101215]">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-bold text-[14px] text-black dark:text-white">
                          {template.title}
                        </Text>
                        <Text className="mt-1 font-normal text-[12px] text-neutral-400">
                          {template.body}
                        </Text>
                      </View>
                      <View className="flex-row gap-4">
                        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${template.title}`} onPress={() => {
                          setEditingTemplate(template);
                          setEditTitle(template.title);
                          setEditBody(template.body);
                        }}>
                          <Ionicons name="create-outline" size={18} color="#3b82f6" />
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${template.title}`} onPress={() => deleteTemplate(template.id)}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

