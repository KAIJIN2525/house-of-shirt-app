import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";

type RegistryFilter =
  | "all"
  | "vip"
  | "new-arrivals"
  | "high-value"
  | "recent-activity";

const filterOptions: { id: RegistryFilter; label: string }[] = [
  { id: "all", label: "ALL PATRONS" },
  { id: "vip", label: "VIP" },
  { id: "new-arrivals", label: "NEW ARRIVALS" },
  { id: "high-value", label: "HIGH-VALUE" },
  { id: "recent-activity", label: "RECENT ACTIVITY" },
];

const PAGE_SIZE = 10;

const getPageNumbers = (
  currentPage: number,
  totalPages: number,
): (number | "...")[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("...");
    }
    result.push(page);
  });
  return result;
};

export default function AdminCustomersScreen() {
  const router = useRouter();
  const { customers, fetchCustomers } = useAdminCustomersStore();
  const { isDark } = useThemeStore();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<RegistryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, activeFilter]);

  const filteredCustomers = customers.filter((customer) => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (activeFilter === "vip" && customer.badge !== "VIP") {
      return false;
    }

    if (activeFilter === "new-arrivals" && customer.badge !== "NEW") {
      return false;
    }

    if (activeFilter === "high-value" && customer.lifetimeValue < 8000) {
      return false;
    }

    if (
      activeFilter === "recent-activity" &&
      !["Just Now", "Oct 24, 2023", "Nov 12, 2023"].includes(
        customer.lastActivity,
      )
    ) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.email.toLowerCase().includes(normalizedSearch) ||
      customer.phone.toLowerCase().includes(normalizedSearch)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.navigate("/admin" as any)}>
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/admin" as any)}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            ADMINISTRATION
          </Text>
          <Text className="mt-2 font-bold text-[48px] leading-[46px] text-black dark:text-white">
            Client{"\n"}Registry
          </Text>
          <Text className="mt-4 font-normal text-[14px] leading-6 text-neutral-400">
            Manage your atelier&apos;s most valued patrons. Search through
            names, emails, and transaction history with editorial precision.
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="flex-row items-center border border-[#d5d9e0] bg-white px-4 py-4 dark:border-white/10 dark:bg-[#101215]">
            <Ionicons name="search" size={18} color="#9aa1ad" />
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Search by name, email or phone..."
              placeholderTextColor="#9aa1ad"
              className="ml-3 flex-1 font-normal text-[13px] text-black"
            />
          </View>
        </View>

        <View className="mt-6 flex-row flex-wrap gap-3 px-6">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setActiveFilter(option.id)}
                className={`px-4 py-3 ${
                  isActive ? "bg-black" : "bg-[#eef1f5]"
                }`}
              >
                <Text
                  className={`font-bold text-[10px] tracking-[1.4px] ${
                    isActive ? "text-white" : "text-black"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-8 px-6">
          <View className="gap-5">
            {paginatedCustomers.map((customer) => (
              <Pressable
                key={customer.id}
                onPress={() =>
                  router.push({
                    pathname: "/admin/customer-profile",
                    params: { customerId: customer.id },
                  } as any)
                }
                className="bg-white px-5 py-5 dark:bg-[#101215]"
              >
                <View className="flex-row gap-4">
                  {!customer.avatar ||
                  customer.avatar.includes(
                    "photo-1500648767791-00dcc994a43e",
                  ) ? (
                    <View className="h-16 w-12 bg-neutral-200 dark:bg-neutral-800 items-center justify-center border border-neutral-300 dark:border-neutral-700">
                      <Ionicons
                        name="person"
                        size={28}
                        color={isDark ? "#d4d4d4" : "#525252"}
                      />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: customer.avatar }}
                      className="h-16 w-12 bg-[#eceff3]"
                      resizeMode="cover"
                    />
                  )}

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-bold text-[16px] text-black dark:text-white">
                          {customer.name}
                        </Text>
                        <Text className="mt-1 font-normal text-[12px] text-neutral-400">
                          {customer.email}
                        </Text>
                        <Text className="mt-1 font-normal text-[11px] tracking-[1.2px] text-neutral-300">
                          {customer.phone || "No phone on file"}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="font-bold text-[12px] text-neutral-500">
                          {customer.lastActivity}
                        </Text>
                        <Text className="mt-1 font-normal text-[10px] tracking-[1.2px] text-neutral-300">
                          {customer.featuredPurchase}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-5 flex-row items-center">
                      <View
                        className={`px-3 py-1 ${
                          customer.statusTone === "dark"
                            ? "bg-black"
                            : "bg-[#eef1f5]"
                        }`}
                      >
                        <Text
                          className={`font-bold text-[9px] tracking-[1.3px] ${
                            customer.statusTone === "dark"
                              ? "text-white"
                              : "text-black"
                          }`}
                        >
                          {customer.blacklisted
                            ? "BLACKLISTED"
                            : customer.badge}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-10 items-center px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            SHOWING {filteredCustomers.length} OF {customers.length} CURATED
            PATRONS
          </Text>

          <View className="mt-5 flex-row items-center gap-3">
            <Pressable
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 items-center justify-center bg-white"
              style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              <Ionicons name="chevron-back" size={16} color="#111111" />
            </Pressable>

            {getPageNumbers(currentPage, totalPages).map((page, index) =>
              page === "..." ? (
                <Text
                  key={`ellipsis-${index}`}
                  className="font-bold text-[14px] text-neutral-400"
                >
                  ...
                </Text>
              ) : (
                <Pressable
                  key={page}
                  onPress={() => setCurrentPage(page)}
                  className={`h-10 w-10 items-center justify-center ${
                    page === currentPage ? "bg-black" : "bg-white"
                  }`}
                >
                  <Text
                    className={`font-bold text-[11px] ${
                      page === currentPage ? "text-white" : "text-black"
                    }`}
                  >
                    {page}
                  </Text>
                </Pressable>
              ),
            )}

            <Pressable
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 items-center justify-center bg-white"
              style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              <Ionicons name="chevron-forward" size={16} color="#111111" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
