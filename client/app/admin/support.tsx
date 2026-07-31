import { useThemeStore } from "@/stores/themeStore";
import {
  SupportTicketPriority,
  useAdminSupportStore,
} from "@/stores/adminSupportStore";
import { useToastStore } from "@/stores/toastStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
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

const PRIORITIES: SupportTicketPriority[] = ["URGENT", "HIGH", "STANDARD"];

export default function AdminSupportScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const showToast = useToastStore((state) => state.showToast);
  const { tickets, isLoading, isSubmitting, fetchTickets, createTicket } =
    useAdminSupportStore();

  const [activeTab, setActiveTab] = useState("ALL TICKETS");
  const [searchValue, setSearchValue] = useState("");
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newOrderId, setNewOrderId] = useState("");
  const [newPriority, setNewPriority] = useState<SupportTicketPriority>("STANDARD");

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const tabs = useMemo(
    () => [
      { label: "ALL TICKETS", count: tickets.length },
      { label: "OPEN", count: tickets.filter((t) => t.status === "OPEN").length },
      { label: "PENDING", count: tickets.filter((t) => t.status === "PENDING").length },
      { label: "RESOLVED", count: tickets.filter((t) => t.status === "RESOLVED").length },
    ],
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesTab =
        activeTab === "ALL TICKETS" || ticket.status === activeTab;
      const matchesQuery =
        !query ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.customerName.toLowerCase().includes(query) ||
        ticket.ticketNumber.toLowerCase().includes(query);
      return matchesTab && matchesQuery;
    });
  }, [tickets, activeTab, searchValue]);

  const resetNewTicketForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewOrderId("");
    setNewPriority("STANDARD");
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim() || !newDescription.trim() || !newCustomerName.trim()) {
      showToast({ type: "error", message: "Title, description, and customer name are required." });
      return;
    }

    const ticket = await createTicket({
      title: newTitle.trim(),
      description: newDescription.trim(),
      customerName: newCustomerName.trim(),
      customerEmail: newCustomerEmail.trim() || undefined,
      orderId: newOrderId.trim() || undefined,
      priority: newPriority,
    });

    if (!ticket) {
      showToast({ type: "error", message: "Could not create the ticket. Please try again." });
      return;
    }

    setIsNewTicketOpen(false);
    resetNewTicketForm();
    showToast({ type: "success", message: `Ticket ${ticket.ticketNumber} created.` });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fb] dark:bg-[#050505]">
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Pressable onPress={() => router.navigate("/admin" as any)}>
          <Ionicons name="menu-outline" size={26} color={isDark ? "#fff" : "#000"} />
        </Pressable>
        <BrandLogo width={154} height={28} />
        <Pressable onPress={() => router.back()}>
          <Ionicons name="log-out-outline" size={24} color={isDark ? "#fff" : "#000"} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Title Section */}
        <View className="px-6 pt-8 pb-10">
          <Text className="font-bold text-[10px] tracking-[0.2em] text-gray-400 uppercase mb-2">SERVICE ATELIER</Text>
          <Text className="font-bold text-[48px] leading-[44px] tracking-[-0.04em] text-black dark:text-white uppercase">Support{"\n"}Desk</Text>
        </View>

        {/* Search & Actions */}
        <View className="px-6 mb-10">
          <View className="flex-row items-center bg-[#ecedf0] dark:bg-[#17191d] px-4 h-14 rounded-sm mb-4">
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="SEARCH TICKETS..."
              placeholderTextColor="#94a3b8"
              className="flex-1 font-bold text-[10px] tracking-widest text-black dark:text-white"
            />
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
          </View>
          <Pressable
            onPress={() => setIsNewTicketOpen(true)}
            className="bg-black dark:bg-white py-5 items-center rounded-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="add" size={18} color={isDark ? "#000" : "#fff"} />
              <Text className="ml-2 font-bold text-[11px] tracking-[0.2em] text-white dark:text-black">NEW TICKET</Text>
            </View>
          </Pressable>
        </View>

        {/* Tabs Row */}
        <View className="px-6 border-b border-gray-200 dark:border-white/10 mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-8">
              {tabs.map((tab) => (
                <Pressable
                  key={tab.label}
                  onPress={() => setActiveTab(tab.label)}
                  className={`pb-4 ${activeTab === tab.label ? "border-b-2 border-black dark:border-white" : ""}`}
                >
                  <Text className={`font-bold text-[10px] tracking-[1px] text-center uppercase ${activeTab === tab.label ? "text-black dark:text-white" : "text-gray-400"}`}>
                    {tab.label}{"\n"}({tab.count})
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tickets List */}
        <View className="px-6 space-y-6">
          {!isLoading && filteredTickets.length === 0 ? (
            <View className="items-center py-16">
              <Text className="font-bold text-[11px] tracking-[1.4px] text-gray-400 uppercase">
                NO TICKETS FOUND
              </Text>
            </View>
          ) : null}

          {filteredTickets.map((ticket) => (
            <View key={ticket.id} className="bg-white dark:bg-[#101215] p-8 relative overflow-hidden shadow-sm">
              {/* Priority Bar */}
              <View
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: ticket.priority === "URGENT" ? "#ba1a1a" : "#ecedf0" }}
              />

              <View className="flex-row justify-between items-start mb-8">
                <View className="bg-[#ba1a1a]/10 px-3 py-1 rounded-sm">
                  <Text className="text-[#ba1a1a] text-[9px] font-bold tracking-widest uppercase">{ticket.priority}</Text>
                </View>
                <Text className="text-gray-400 text-[10px] tracking-widest uppercase">#{ticket.ticketNumber}</Text>
              </View>

              <Text className="text-2xl font-bold tracking-tight text-black dark:text-white mb-4 uppercase">
                {ticket.title}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 leading-relaxed text-[13px] mb-10">
                {ticket.description}
              </Text>

              {/* Metadata Grid */}
              <View className="flex-row flex-wrap gap-y-6 pt-6 border-t border-gray-50 dark:border-white/5">
                <View className="w-1/2">
                  <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Agent</Text>
                  <Text className="text-[11px] font-bold text-black dark:text-white uppercase">{ticket.agentName || "Unassigned"}</Text>
                </View>

                <View className="w-1/2">
                  <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Customer</Text>
                  <Text className="text-[11px] font-bold text-black dark:text-white uppercase">{ticket.customerName}</Text>
                </View>

                <View className="w-1/2">
                  <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Order ID</Text>
                  <Text className="text-[11px] font-bold text-black dark:text-white uppercase underline">{ticket.orderId || "N/A"}</Text>
                </View>

                <Pressable
                  onPress={() => router.push(`/admin/support/${ticket.id}` as any)}
                  className="w-1/2 items-end justify-end"
                >
                  <View className="flex-row items-center">
                    <Text className="text-[9px] font-bold tracking-[2px] text-black dark:text-white uppercase">VIEW THREAD</Text>
                    <Ionicons name="arrow-forward" size={14} color={isDark ? "#fff" : "#000"} className="ml-1" />
                  </View>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal
        visible={isNewTicketOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNewTicketOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/55 px-6">
          <ScrollView
            className="w-full max-h-[85%] bg-white dark:bg-[#101215] border border-neutral-200 dark:border-white/10 shadow-2xl"
            contentContainerStyle={{ padding: 20 }}
          >
            <Text className="font-bold text-[18px] text-black dark:text-white">
              New Support Ticket
            </Text>
            <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-400">
              Log a new customer service issue for atelier follow-up.
            </Text>

            <Text className="mt-5 font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase">Title</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Sleeve length discrepancy"
              placeholderTextColor="#a0a7b3"
              className="mt-2 border border-[#d9dde4] dark:border-neutral-800 px-4 py-3 font-normal text-[13px] text-black dark:text-white"
            />

            <Text className="mt-4 font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase">Description</Text>
            <TextInput
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              placeholder="Describe the issue..."
              placeholderTextColor="#a0a7b3"
              textAlignVertical="top"
              className="mt-2 min-h-[100px] border border-[#d9dde4] dark:border-neutral-800 px-4 py-3 font-normal text-[13px] text-black dark:text-white"
            />

            <Text className="mt-4 font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase">Customer Name</Text>
            <TextInput
              value={newCustomerName}
              onChangeText={setNewCustomerName}
              placeholder="e.g. Julian Vane"
              placeholderTextColor="#a0a7b3"
              className="mt-2 border border-[#d9dde4] dark:border-neutral-800 px-4 py-3 font-normal text-[13px] text-black dark:text-white"
            />

            <Text className="mt-4 font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase">Customer Email (optional)</Text>
            <TextInput
              value={newCustomerEmail}
              onChangeText={setNewCustomerEmail}
              placeholder="e.g. julian@example.com"
              placeholderTextColor="#a0a7b3"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mt-2 border border-[#d9dde4] dark:border-neutral-800 px-4 py-3 font-normal text-[13px] text-black dark:text-white"
            />

            <Text className="mt-4 font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase">Order ID (optional)</Text>
            <TextInput
              value={newOrderId}
              onChangeText={setNewOrderId}
              placeholder="e.g. HS-2024-998"
              placeholderTextColor="#a0a7b3"
              autoCapitalize="characters"
              className="mt-2 border border-[#d9dde4] dark:border-neutral-800 px-4 py-3 font-normal text-[13px] text-black dark:text-white"
            />

            <Text className="mt-4 font-bold text-[10px] tracking-[1.4px] text-gray-400 uppercase">Priority</Text>
            <View className="mt-2 flex-row gap-2">
              {PRIORITIES.map((priority) => (
                <Pressable
                  key={priority}
                  onPress={() => setNewPriority(priority)}
                  className={`flex-1 items-center py-3 border ${newPriority === priority ? "bg-black border-black dark:bg-white dark:border-white" : "border-[#d9dde4] dark:border-neutral-800"}`}
                >
                  <Text className={`font-bold text-[10px] tracking-[1px] uppercase ${newPriority === priority ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                    {priority}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setIsNewTicketOpen(false);
                  resetNewTicketForm();
                }}
                className="flex-1 items-center justify-center border border-[#d9dde4] dark:border-neutral-800 py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-black dark:text-white">
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleCreateTicket()}
                disabled={isSubmitting}
                className={`flex-1 items-center justify-center bg-[#111826] dark:bg-white py-4 ${isSubmitting ? "opacity-50" : ""}`}
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-white dark:text-black">
                  {isSubmitting ? "CREATING..." : "CREATE TICKET"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
