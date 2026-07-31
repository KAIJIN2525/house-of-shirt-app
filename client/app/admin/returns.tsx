import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { useOrdersStore } from "@/stores/ordersStore";
import { useReturnsStore } from "@/stores/returnsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Linking,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";

const DATE_FILTERS = [
  { key: "30", label: "Last 30 Days" },
  { key: "90", label: "Last 90 Days" },
  { key: "all", label: "All Time" },
] as const;

const statusPresentation = {
  Requested: {
    label: "PENDING",
    accent: "bg-[#495468]",
    stripe: "bg-[#495468]",
    icon: "checkmark",
  },
  "In Transit": {
    label: "APPROVED",
    accent: "bg-black",
    stripe: "bg-black",
    icon: "cube-outline",
  },
  "Quality Check": {
    label: "INSPECTION",
    accent: "bg-[#818892]",
    stripe: "bg-[#818892]",
    icon: "eye-outline",
  },
  Processed: {
    label: "REFUNDED",
    accent: "bg-black",
    stripe: "bg-black",
    icon: "receipt-outline",
  },
  Rejected: {
    label: "REJECTED",
    accent: "bg-[#df3d3d]",
    stripe: "bg-[#df3d3d]",
    icon: "close",
  },
} as const;

const PAGE_SIZE = 10;

const parseUsDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export default function AdminReturnsScreen() {
  const router = useRouter();
  const {  requests, reviewRequest  } = useReturnsStore();
  const {  orders, fetchOrders  } = useOrdersStore();
  const {  customers, fetchCustomers  } = useAdminCustomersStore();
  const {  isDark  } = useThemeStore();
  const [searchValue, setSearchValue] = useState("");
  const [dateWindow, setDateWindow] = useState<(typeof DATE_FILTERS)[number]["key"]>("30");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void Promise.all([fetchOrders(), fetchCustomers()]);
  }, [fetchCustomers, fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, dateWindow]);

  const sanitizedPhone = (value?: string) => (value ?? "").replace(/[^\d+]/g, "");

  const requestRows = useMemo(() => {
    const now = new Date();
    const search = searchValue.trim().toLowerCase();

    return requests
      .map((request) => {
        const linkedOrder = orders.find((order) => order.id === request.orderId);
        const linkedCustomer = customers.find(
          (customer) =>
            customer.name.toLowerCase() ===
            (linkedOrder?.customerName ?? "").toLowerCase()
        );

        return {
          request,
          order: linkedOrder,
          customer: linkedCustomer,
          customerName:
            linkedCustomer?.name ?? linkedOrder?.customerName ?? "House Client",
          submittedDate: parseUsDate(request.submittedAt) ?? now,
        };
      })
      .filter((entry) => {
        if (dateWindow !== "all") {
          const days = Number(dateWindow);
          const threshold = new Date();
          threshold.setDate(now.getDate() - days);
          if (entry.submittedDate < threshold) {
            return false;
          }
        }

        if (!search) {
          return true;
        }

        return (
          entry.request.rmaNumber.toLowerCase().includes(search) ||
          entry.request.orderId.toLowerCase().includes(search) ||
          entry.customerName.toLowerCase().includes(search)
        );
      })
      .sort((left, right) => right.submittedDate.getTime() - left.submittedDate.getTime());
  }, [customers, dateWindow, orders, requests, searchValue]);

  const totalPages = Math.max(1, Math.ceil(requestRows.length / PAGE_SIZE));
  const paginatedRows = requestRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    const pendingReview = requests.filter((request) => request.status === "Requested").length;
    const processed = requests.filter((request) => request.status === "Processed").length;
    const successRate = requests.length === 0 ? 0 : (processed / requests.length) * 100;

    return {
      active: requests.length,
      pendingReview,
      successRate,
    };
  }, [requests]);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.navigate("/admin" as any)}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/admin/settings" as any)}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="mt-2 font-bold text-[52px] leading-[50px] text-black dark:text-white">
            Returns{"\n"}Queue
          </Text>

          <View className="mt-6 flex-row flex-wrap gap-x-8 gap-y-4">
            <View>
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                ACTIVE REQUESTS
              </Text>
              <Text className="mt-1 font-bold text-[22px] text-black">
                {stats.active}
              </Text>
            </View>
            <View>
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                PENDING REVIEW
              </Text>
              <Text className="mt-1 font-bold text-[22px] text-black">
                {stats.pendingReview}
              </Text>
            </View>
            <View>
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                SUCCESS RATE
              </Text>
              <Text className="mt-1 font-bold text-[22px] text-black">
                {stats.successRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="flex-row items-center bg-white px-4 py-4 dark:bg-[#101215]">
            <Ionicons name="search" size={18} color="#9aa2ad" />
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Search by Order ID or Customer..."
              placeholderTextColor="#9aa2ad"
              className="ml-3 flex-1 font-normal text-[13px] text-black"
            />
          </View>

          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => setIsDateFilterOpen(true)}
              className="flex-1 flex-row items-center justify-between bg-white px-4 py-4"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text className="font-normal text-[12px] text-black dark:text-white">
                  {DATE_FILTERS.find((filter) => filter.key === dateWindow)?.label}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#6b7280" />
            </Pressable>

            <Pressable
              onPress={() => {
                const currentIndex = DATE_FILTERS.findIndex(
                  (filter) => filter.key === dateWindow
                );
                const nextIndex = (currentIndex + 1) % DATE_FILTERS.length;
                setDateWindow(DATE_FILTERS[nextIndex].key);
              }}
              className="items-center justify-center bg-black px-7 py-4"
            >
              <Text className="font-bold text-[11px] tracking-[1.7px] text-white">
                EXPORT
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-8 gap-4 px-6">
          {paginatedRows.map(({ request, customerName, customer, order }) => {
            const presentation = statusPresentation[request.status];
            return (
              <Pressable
                key={request.id}
                onPress={() => router.push(`/admin/return-request/${request.id}` as any)}
                className="overflow-hidden bg-white dark:bg-[#101215]"
              >
                <View className="flex-row">
                  <View className={`w-[3px] ${presentation.stripe}`} />
                  <View className="flex-1 px-4 py-5">
                    <View className="flex-row items-center gap-3">
                      <View className={`px-2 py-1 ${presentation.accent}`}>
                        <Text className="font-bold text-[9px] tracking-[1.3px] text-white">
                          {presentation.label}
                        </Text>
                      </View>
                      <Text className="font-bold text-[10px] tracking-[1.2px] text-[#4f5560]">
                        #{request.orderId}
                      </Text>
                    </View>

                    <Text className="mt-4 font-bold text-[28px] leading-[30px] text-[#232831] dark:text-white">
                      {customerName}
                    </Text>
                    <Text className="mt-2 font-normal text-[13px] italic leading-5 text-neutral-500">
                      &quot;{request.reason}&quot;
                    </Text>

                    <View className="mt-5 flex-row items-center justify-between">
                      <Text className="font-normal text-[12px] text-neutral-500">
                        {request.submittedAt}
                      </Text>

                      <View className="flex-row items-center gap-3">
                        {request.status === "Requested" ? (
                          <Pressable
                            onPress={(event) => {
                              event.stopPropagation();
                              void reviewRequest(request.id, "approve");
                            }}
                            className="h-8 w-8 items-center justify-center bg-[#f3f4f6]"
                          >
                            <Ionicons name="checkmark" size={14} color="#111111" />
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            router.push(`/admin/orders/${request.orderId}` as any);
                          }}
                          className="h-8 w-8 items-center justify-center bg-[#f3f4f6]"
                        >
                          <Ionicons
                            name={presentation.icon as keyof typeof Ionicons.glyphMap}
                            size={14}
                            color="#111111"
                          />
                        </Pressable>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            const phone = customer?.phone ?? order?.customerPhone;
                            if (phone) {
                              const numericPhone = phone.replace(/[^0-9]/g, "");
                              Linking.openURL(`https://wa.me/${numericPhone}?text=${encodeURIComponent(`Hi ${customerName}, following up on your return request ${request.rmaNumber}.`)}`);
                            } else {
                              Linking.openURL(`mailto:support@houseofshirts.com?subject=Return Follow-up: ${request.rmaNumber}`);
                            }
                          }}
                          className="h-8 w-8 items-center justify-center bg-[#f3f4f6]"
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#111111" />
                        </Pressable>
                        {(customer?.phone ?? order?.customerPhone) ? (
                          <Pressable
                            onPress={(event) => {
                              event.stopPropagation();
                              Linking.openURL(
                                `tel:${sanitizedPhone(customer?.phone ?? order?.customerPhone)}`
                              ).catch(() => {});
                            }}
                            className="h-8 w-8 items-center justify-center bg-[#f3f4f6]"
                          >
                            <Ionicons name="call-outline" size={14} color="#111111" />
                          </Pressable>
                        ) : null}
                        <View className="h-8 w-8 items-center justify-center bg-[#f3f4f6]">
                          <Ionicons name="chevron-forward" size={14} color="#111111" />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-10 items-center px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            SHOWING {requestRows.length} OF {stats.active} REQUESTS
          </Text>
          <View className="mt-5 flex-row items-center gap-6">
            <Pressable
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 items-center justify-center bg-white"
            >
              <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#c1c7d0" : "#111111"} />
            </Pressable>
            <Text className="font-bold text-[11px] text-black">
              {currentPage} / {totalPages}
            </Text>
            <Pressable
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 items-center justify-center bg-white"
            >
              <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#c1c7d0" : "#111111"} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isDateFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDateFilterOpen(false)}
      >
        <Pressable
          onPress={() => setIsDateFilterOpen(false)}
          className="flex-1 justify-end bg-black/35"
        >
          <Pressable className="rounded-t-[30px] bg-white px-6 pb-8 pt-6 dark:bg-[#101215]">
            <View className="self-center h-1.5 w-16 rounded-full bg-[#d9dde4]" />
            <Text className="mt-5 font-bold text-[10px] tracking-[1.6px] text-neutral-400">
              FILTER RETURNS
            </Text>
            <Text className="mt-2 font-bold text-[28px] leading-8 text-black dark:text-white">
              Date Range
            </Text>

            <View className="mt-6 gap-3">
              {DATE_FILTERS.map((filter) => {
                const isActive = filter.key === dateWindow;
                return (
                  <Pressable
                    key={filter.key}
                    onPress={() => {
                      setDateWindow(filter.key);
                      setIsDateFilterOpen(false);
                    }}
                    className={`rounded-[22px] border px-5 py-4 ${
                      isActive ? "border-[#161c28] bg-[#161c28]" : "border-[#e6eaf0] bg-white"
                    }`}
                  >
                    <Text
                      className={`font-bold text-[13px] ${
                        isActive ? "text-white" : "text-black"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
