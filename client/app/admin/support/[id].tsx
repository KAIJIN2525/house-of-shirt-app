import {
  SupportTicketStatus,
  useAdminSupportStore,
} from "@/stores/adminSupportStore";
import { useThemeStore } from "@/stores/themeStore";
import { useToastStore } from "@/stores/toastStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

const STATUSES: SupportTicketStatus[] = ["OPEN", "PENDING", "RESOLVED"];

export default function AdminSupportTicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useThemeStore();
  const showToast = useToastStore((state) => state.showToast);
  const { tickets, messages, fetchMessages, sendMessage, updateTicketStatus } =
    useAdminSupportStore();

  const ticket = tickets.find((t) => t.id === id);
  const threadMessages = messages[id ?? ""] ?? [];

  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      void fetchMessages(id);
    }
  }, [id, fetchMessages]);

  if (!ticket) {
    return (
      <SafeAreaView className="flex-1 bg-[#f7f9fb] dark:bg-[#050505] items-center justify-center px-6">
        <Text className="font-bold text-[14px] tracking-[1.4px] text-black dark:text-white uppercase">
          Ticket not found
        </Text>
        <Pressable
          onPress={() => router.navigate("/admin/support" as any)}
          className="mt-6 bg-black dark:bg-white px-6 py-4"
        >
          <Text className="font-bold text-[11px] tracking-[1.4px] text-white dark:text-black uppercase">
            Back to Support Desk
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(ticket.id, replyText.trim());
      setReplyText("");
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeStatus = async (status: SupportTicketStatus) => {
    await updateTicketStatus(ticket.id, status);
    setIsStatusModalOpen(false);
    showToast({ type: "success", message: `Ticket marked ${status.toLowerCase()}.` });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fb] dark:bg-[#050505]">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Back to support inbox" onPress={() => router.navigate("/admin/support" as any)}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
        </Pressable>
        <Text className="font-black text-[14px] tracking-[0.2em] text-black dark:text-white uppercase">
          #{ticket.ticketNumber}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Change ticket status" accessibilityState={{ expanded: isStatusModalOpen }} onPress={() => setIsStatusModalOpen(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? "#fff" : "#000"} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6 pb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="bg-[#ba1a1a]/10 px-3 py-1 rounded-sm">
              <Text className="text-[#ba1a1a] text-[9px] font-bold tracking-widest uppercase">{ticket.priority}</Text>
            </View>
            <View className="bg-[#ecedf0] dark:bg-white/10 px-3 py-1 rounded-sm">
              <Text className="text-black dark:text-white text-[9px] font-bold tracking-widest uppercase">{ticket.status}</Text>
            </View>
          </View>

          <Text className="text-2xl font-bold tracking-tight text-black dark:text-white mb-4 uppercase">
            {ticket.title}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 leading-relaxed text-[13px] mb-6">
            {ticket.description}
          </Text>

          <View className="flex-row flex-wrap gap-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <View className="w-1/2">
              <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Customer</Text>
              <Text className="text-[11px] font-bold text-black dark:text-white uppercase">{ticket.customerName}</Text>
            </View>
            <View className="w-1/2">
              <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Email</Text>
              <Text className="text-[11px] font-bold text-black dark:text-white">{ticket.customerEmail || "N/A"}</Text>
            </View>
            <View className="w-1/2">
              <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Order ID</Text>
              <Text className="text-[11px] font-bold text-black dark:text-white uppercase underline">{ticket.orderId || "N/A"}</Text>
            </View>
            <View className="w-1/2">
              <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Agent</Text>
              <Text className="text-[11px] font-bold text-black dark:text-white uppercase">{ticket.agentName || "Unassigned"}</Text>
            </View>
          </View>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase mb-4">
            THREAD
          </Text>

          {threadMessages.length === 0 ? (
            <Text className="text-[12px] text-gray-400 mb-6">
              No replies yet. Send the first message below.
            </Text>
          ) : null}

          {threadMessages.map((message) => (
            <View
              key={message.id}
              className={`mb-4 max-w-[85%] px-4 py-3 ${
                message.sender === "admin"
                  ? "self-end bg-black dark:bg-white"
                  : "self-start bg-white dark:bg-[#101215] border border-gray-200 dark:border-white/10"
              }`}
            >
              <Text
                className={`text-[9px] font-bold tracking-widest uppercase mb-1 ${
                  message.sender === "admin" ? "text-white dark:text-black" : "text-gray-400"
                }`}
              >
                {message.senderName}
              </Text>
              <Text
                className={`text-[13px] leading-5 ${
                  message.sender === "admin" ? "text-white dark:text-black" : "text-black dark:text-white"
                }`}
              >
                {message.message}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-[#f7f9fb] dark:bg-[#050505]">
        <TextInput accessibilityLabel="Type a reply..."
          value={replyText}
          onChangeText={setReplyText}
          placeholder="Type a reply..."
          placeholderTextColor="#94a3b8"
          multiline
          className="flex-1 max-h-24 border border-[#d9dde4] dark:border-neutral-800 bg-white dark:bg-[#101215] px-4 py-3 font-normal text-[13px] text-black dark:text-white"
        />
        <Pressable
          accessibilityLabel="Send reply"
          onPress={() => void handleSendReply()}
          disabled={isSending || !replyText.trim()}
          className={`items-center justify-center bg-black dark:bg-white px-5 py-4 ${
            isSending || !replyText.trim() ? "opacity-50" : ""
          }`}
        >
          <Ionicons name="send" size={16} color={isDark ? "#000" : "#fff"} />
        </Pressable>
      </View>

      {/* Status Change Modal */}
      <Modal
        visible={isStatusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStatusModalOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/55 px-6">
          <View className="w-full bg-white dark:bg-[#101215] px-5 py-5 border border-neutral-200 dark:border-white/10 shadow-2xl">
            <Text className="font-bold text-[18px] text-black dark:text-white">
              Update Ticket Status
            </Text>
            <View className="mt-5 gap-3">
              {STATUSES.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => void handleChangeStatus(status)}
                  className={`items-center justify-center py-4 border ${
                    ticket.status === status
                      ? "bg-black border-black dark:bg-white dark:border-white"
                      : "border-[#d9dde4] dark:border-neutral-800"
                  }`}
                >
                  <Text
                    className={`font-bold text-[11px] tracking-[1.4px] uppercase ${
                      ticket.status === status ? "text-white dark:text-black" : "text-black dark:text-white"
                    }`}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable accessibilityRole="button"
              onPress={() => setIsStatusModalOpen(false)}
              className="mt-3 items-center justify-center py-4"
            >
              <Text className="font-bold text-[11px] tracking-[1.4px] text-gray-400 uppercase">
                CANCEL
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
