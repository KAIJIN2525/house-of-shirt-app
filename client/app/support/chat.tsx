import { formatPrice } from "@/constants";
import { useOrdersStore } from "@/stores/ordersStore";
import { useSupportHistoryStore } from "@/stores/supportHistoryStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const WHATSAPP_NUMBER = "2349069120288";

type TopicId =
  | "order"
  | "product"
  | "returns"
  | "availability"
  | "payment"
  | "general";

interface Topic {
  id: TopicId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
}

const TOPICS: Topic[] = [
  {
    id: "order",
    icon: "bag-handle-outline",
    label: "Order Issue",
    sublabel: "Tracking, delays, missing items",
  },
  {
    id: "product",
    icon: "shirt-outline",
    label: "Product Enquiry",
    sublabel: "Questions about a specific item",
  },
  {
    id: "returns",
    icon: "return-down-back-outline",
    label: "Returns & Refunds",
    sublabel: "Exchange or return a purchase",
  },
  {
    id: "availability",
    icon: "search-outline",
    label: "Availability Check",
    sublabel: "Size, colour, stock enquiry",
  },
  {
    id: "payment",
    icon: "card-outline",
    label: "Payment Support",
    sublabel: "Payment issues, bank declines",
  },
  {
    id: "general",
    icon: "chatbubble-ellipses-outline",
    label: "General Enquiry",
    sublabel: "Anything else on your mind",
  },
];

function buildMessage(
  topicId: TopicId,
  extra: string,
  order?: {
    id: string;
    title: string;
    status: string;
    placedOn: string;
    total: number;
    carrier: string;
  } | null,
  productName?: string,
): string {
  const greeting = "Hello House of Shirts,\n\n";
  const sign = extra.trim() ? `\n\nAdditional context:\n${extra.trim()}` : "";
  const footer = "\n\nThank you.";

  switch (topicId) {
    case "order":
      if (order) {
        return (
          greeting +
          "I need help with my order.\n\n" +
          `Order ID: ${order.id}\n` +
          `Item: ${order.title}\n` +
          `Status: ${order.status}\n` +
          `Placed: ${order.placedOn}\n` +
          `Carrier: ${order.carrier}\n` +
          `Total: ${formatPrice(order.total)}` +
          sign +
          footer
        );
      }
      return greeting + "I have an issue with one of my orders." + sign + footer;

    case "product":
      return (
        greeting +
        "I have a question about a product." +
        (productName ? `\n\nProduct: ${productName}` : "") +
        sign +
        footer
      );

    case "returns":
      return (
        greeting +
        "I would like to initiate a return or exchange." +
        (order ? `\n\nOrder ID: ${order.id}\nItem: ${order.title}` : "") +
        sign +
        footer
      );

    case "availability":
      return (
        greeting +
        "I'd like to check availability for an item." +
        (productName ? `\n\nItem: ${productName}` : "") +
        sign +
        footer
      );

    case "payment":
      return greeting + "I'm experiencing an issue with a payment." + sign + footer;

    case "general":
    default:
      return greeting + (extra.trim() || "I have a general enquiry.") + footer;
  }
}

function openWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encoded}`);
  });
}

export default function SupportChatScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { orders } = useOrdersStore();
  const { addThread, threads } = useSupportHistoryStore();
  const params = useLocalSearchParams<{
    threadId?: string;
    topic?: string;
    title?: string;
    orderId?: string;
    productName?: string;
    extraNote?: string;
  }>();

  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(
    params.threadId?.startsWith("availability-")
      ? "availability"
      : (params.topic as TopicId | undefined) ?? null,
  );
  const [extraNote, setExtraNote] = useState(params.extraNote ?? "");

  const contextOrder =
    params.orderId
      ? orders.find((order) => order.id === params.orderId) ?? orders[0] ?? null
      : selectedTopic === "order" || selectedTopic === "returns"
        ? orders[0] ?? null
        : null;

  const contextProductName = params.productName ?? undefined;
  const activeTopic = TOPICS.find((topic) => topic.id === selectedTopic);

  const handleSend = () => {
    if (!selectedTopic) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const message = buildMessage(
      selectedTopic,
      extraNote,
      contextOrder
        ? {
            id: contextOrder.id,
            title: contextOrder.title,
            status: contextOrder.status,
            placedOn: contextOrder.placedOn,
            total: contextOrder.total,
            carrier: contextOrder.carrier,
          }
        : null,
      contextProductName,
    );
    addThread({
      topic: selectedTopic,
      label: activeTopic?.label ?? "Support",
      messagePreview: message.split("\n").find(Boolean) ?? "Support request",
      orderId: contextOrder?.id,
      productName: contextProductName,
    });
    openWhatsApp(message);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <View className="flex-row items-center justify-between border-b border-black/5 bg-white px-6 pb-4 pt-4 dark:border-white/10 dark:bg-[#101215]">
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#ffffff" : "#111111"}
          />
        </Pressable>

        <View className="items-center">
          <Text className="font-bold text-[12px] tracking-[1.4px] text-black dark:text-white">
            CONCIERGE
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <View className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
            <Text className="font-normal text-[10px] tracking-[1.3px] text-neutral-400">
              VIA WHATSAPP
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pb-2 pt-8">
          <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400">
            HOW CAN WE HELP?
          </Text>
          <Text className="mt-2 font-bold text-[28px] leading-[32px] text-black dark:text-white">
            Select a topic
          </Text>
          <Text className="mt-2 font-normal text-[13px] leading-5 text-neutral-500">
            We&apos;ll open WhatsApp with a pre-filled message so our team can help
            you faster.
          </Text>
        </View>

        <View className="mt-6 px-6">
          <View className="gap-3">
            {TOPICS.map((topic) => {
              const isActive = selectedTopic === topic.id;
              return (
                <Pressable
                  key={topic.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedTopic(isActive ? null : topic.id);
                  }}
                  className={`flex-row items-center gap-4 border px-5 py-4 ${
                    isActive
                      ? "border-black bg-black dark:border-white dark:bg-white"
                      : "border-black/5 bg-white dark:border-white/10 dark:bg-[#101215]"
                  }`}
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      isActive
                        ? "bg-white/15 dark:bg-black/10"
                        : "bg-neutral-100 dark:bg-white/10"
                    }`}
                  >
                    <Ionicons
                      name={topic.icon}
                      size={18}
                      color={
                        isActive
                          ? isDark
                            ? "#000000"
                            : "#ffffff"
                          : isDark
                            ? "#ffffff"
                            : "#111111"
                      }
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`font-bold text-[14px] ${
                        isActive
                          ? "text-white dark:text-black"
                          : "text-black dark:text-white"
                      }`}
                    >
                      {topic.label}
                    </Text>
                    <Text
                      className={`mt-0.5 font-normal text-[11px] ${
                        isActive
                          ? "text-white/60 dark:text-black/60"
                          : "text-neutral-400"
                      }`}
                    >
                      {topic.sublabel}
                    </Text>
                  </View>

                  {isActive ? (
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-white/20 dark:bg-black/10">
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={isDark ? "#000000" : "#ffffff"}
                      />
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#94a3b8"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedTopic && (contextOrder || contextProductName) ? (
          <View className="mx-6 mt-6 border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#101215]">
            <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
              AUTO-ATTACHED CONTEXT
            </Text>
            {contextOrder ? (
              <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                {contextOrder.id} | {contextOrder.title} | {contextOrder.status}
              </Text>
            ) : null}
            {contextProductName ? (
              <Text className="mt-1 font-normal text-[12px] text-neutral-500 dark:text-neutral-400">
                {contextProductName}
              </Text>
            ) : null}
            <Text className="mt-2 font-normal text-[10px] text-neutral-400">
              This will be included in your WhatsApp message automatically.
            </Text>
          </View>
        ) : null}

        {selectedTopic ? (
          <View className="mx-6 mt-6">
            <Text className="mb-2 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
              {selectedTopic === "general"
                ? "YOUR MESSAGE"
                : "ADDITIONAL DETAILS (OPTIONAL)"}
            </Text>
            <TextInput
              value={extraNote}
              onChangeText={setExtraNote}
              multiline
              numberOfLines={4}
              placeholder={
                selectedTopic === "general"
                  ? "Write your message here..."
                  : "Any extra details that may help us assist you faster..."
              }
              placeholderTextColor="#9ca3af"
              className="bg-white px-4 py-4 font-normal text-[14px] leading-6 text-neutral-700 dark:bg-[#101215] dark:text-white"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>
        ) : null}

        <View className="mx-6 mt-6">
          <Pressable
            onPress={handleSend}
            disabled={!selectedTopic}
            className={`flex-row items-center justify-center gap-3 border py-5 ${
              selectedTopic
                ? "border-black bg-black dark:border-white dark:bg-white"
                : "border-neutral-200 bg-neutral-200 dark:border-white/10 dark:bg-white/10"
            }`}
          >
            <Ionicons
              name="logo-whatsapp"
              size={20}
              color={selectedTopic ? "#25D366" : "#9ca3af"}
            />
            <Text
              className={`font-bold text-[12px] tracking-[2px] ${
                selectedTopic ? "text-[#25D366]" : "text-neutral-400"
              }`}
            >
              {selectedTopic
                ? `OPEN WHATSAPP | ${activeTopic?.label.toUpperCase()}`
                : "SELECT A TOPIC ABOVE"}
            </Text>
          </Pressable>

          <Text className="mt-4 text-center font-normal text-[11px] leading-5 text-neutral-400">
            Tapping above will open WhatsApp with a pre-filled message.{"\n"}
            Our team typically responds within a few hours.
          </Text>
        </View>

        {threads.length > 0 ? (
          <View className="mx-6 mt-8">
            <Text className="mb-3 font-bold text-[10px] tracking-[1.5px] text-neutral-400">
              RECENT SUPPORT HISTORY
            </Text>
            <View className="gap-3">
              {threads.slice(0, 4).map((thread) => (
                <View
                  key={thread.id}
                  className="border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#101215]"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="font-bold text-[13px] text-black dark:text-white">
                      {thread.label}
                    </Text>
                    <Text className="font-bold text-[9px] tracking-[1.2px] text-neutral-400">
                      {thread.createdAt.toUpperCase()}
                    </Text>
                  </View>
                  <Text className="mt-2 text-[12px] leading-5 text-neutral-500">
                    {thread.orderId ? `${thread.orderId} | ` : ""}
                    {thread.productName ? `${thread.productName} | ` : ""}
                    {thread.messagePreview}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
