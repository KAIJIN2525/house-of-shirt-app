import React, { useMemo } from "react";
import { InteractionManager, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useOrdersStore } from "@/stores/ordersStore";
import { useReturnsStore } from "@/stores/returnsStore";

import {
  TextTransformMode,
  ThemeMode,
  useThemeStore,
} from "@/stores/themeStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const Badge = ({ count }: { count: number }) => {
  if (!count) {
    return null;
  }

  return (
    <View className="min-w-[22px] items-center justify-center rounded-full bg-black px-2 py-1">
      <Text className="font-bold text-[10px] text-white">{count}</Text>
    </View>
  );
};

const themeOptions: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "SYSTEM" },
  { id: "light", label: "LIGHT" },
  { id: "dark", label: "DARK" },
];

const textTransformOptions: { id: TextTransformMode; label: string }[] = [
  { id: "lowercase", label: "aa" },
  { id: "uppercase", label: "AA" },
  { id: "capitalize", label: "Aa" },
];

const Profile = () => {
  // Navigation
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { isAdmin } = useAdminAccess();
  const { myOrders: orders, fetchMyOrders } = useOrdersStore();
  const { unreadCount: returnsUnreadCount } = useReturnsStore();

  const {
    isDark,
    themeMode,
    textTransformMode,
    setThemeMode,
    setTextTransformMode,
  } = useThemeStore();

  useFocusEffect(
    React.useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        void fetchMyOrders();
      });

      return () => task.cancel();
    }, [fetchMyOrders]),
  );

  const handleOrdersPress = () => {
    router.push("/orders" as any);
  };

  const activeOrdersCount = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== "Delivered" && order.status !== "delivered",
      ).length,
    [orders],
  );

  const totalPieces = useMemo(() => {
    return orders.reduce((sum, order) => {
      if (order.lineItems && order.lineItems.length > 0) {
        return sum + order.lineItems.reduce((q, item) => q + item.quantity, 0);
      }
      return sum + 1; // Fallback for basic orders
    }, 0);
  }, [orders]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <Ionicons name="menu" size={24} color={isDark ? "#f8fafc" : "#000"} />
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/search" as any)}>
            <Ionicons
              name="search"
              size={24}
              color={isDark ? "#f8fafc" : "#000"}
            />
          </Pressable>
        </View>

        <View className="mb-8 px-6">
          <View className="gap-4 pt-6">
            <View className="h-24 w-24 items-center justify-center bg-gray-700 dark:bg-[#17191d]">
              <Ionicons name="person" size={32} color="#fff" />
            </View>

            <View className="flex-1 justify-center">
              <Text className="font-medium text-xs text-slate-600 dark:text-white uppercase">
                MEMBER SINCE{" "}
                {user?.created_at
                  ? new Date(user.created_at).getFullYear()
                  : "2024"}
              </Text>
              <Text className="mb-1 font-bold text-5xl text-black dark:text-white">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  "Atelier Guest"}
              </Text>
              <Text className="font-normal text-sm text-gray-600 dark:text-white">
                {user?.email || "No email provided"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-8 flex-row gap-2 px-6">
          <View className="flex-1 bg-gray-50 px-6 py-8 dark:bg-[#101215]">
            <Text className="mb-2 font-medium text-xs tracking-wider text-gray-500 dark:text-white">
              ACTIVE ORDERS
            </Text>
            <Text className="font-bold text-4xl text-black dark:text-white">
              {String(activeOrdersCount).padStart(2, "0")}
            </Text>
          </View>

          <View className="flex-1 bg-black px-6 py-8 dark:bg-[#e8eaee]">
            <Text className="mb-2 font-medium text-xs tracking-wider text-white/70 dark:text-black/50">
              COLLECTION
            </Text>
            <Text className="font-bold text-4xl text-white dark:text-black">
              {String(totalPieces).padStart(2, "0")}
            </Text>
            <Text className="mt-1 font-medium text-[10px] tracking-wider text-white/50 dark:text-black/40 uppercase">
              Pieces Acquired
            </Text>
          </View>
        </View>

        <View className="mb-8 px-6">
          <View className="mb-4">
            <Text className="mb-2 font-bold text-sm tracking-wider text-black dark:text-white">
              ACCOUNT MANAGEMENT
            </Text>
            <View className="w-10 border border-black dark:border-white" />
          </View>

          <View className="gap-0">
            <Pressable
              className="border-b border-gray-100 py-4 dark:border-white/10"
              onPress={handleOrdersPress}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="bag-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="font-normal text-base text-black dark:text-white">
                    Orders
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Pressable>

            <Pressable
              className="border-b border-gray-100 py-4 dark:border-white/10"
              onPress={() => router.push("/favorites" as any)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="heart-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="font-normal text-base text-black dark:text-white">
                    Wishlist
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Pressable>

            <Pressable
              className="border-b border-gray-100 py-4 dark:border-white/10"
              onPress={() => router.push("/profile/shipping-addresses" as any)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="font-normal text-base text-black dark:text-white">
                    Saved Addresses
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Pressable>

            <Pressable
              className="border-b border-gray-100 py-4 dark:border-white/10"
              onPress={() => router.push("/profile/account-security" as any)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="font-normal text-base text-black dark:text-white">
                    Account & Privacy
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Pressable>

            <View className="border-b border-gray-100 py-4 dark:border-white/10">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name={
                      themeMode === "system"
                        ? "phone-portrait-outline"
                        : isDark
                          ? "moon-outline"
                          : "sunny-outline"
                    }
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <View>
                    <Text className="font-normal text-base text-black dark:text-white">
                      Appearance
                    </Text>
                    <Text className="font-normal text-xs text-gray-500 dark:text-white">
                      {themeMode === "system"
                        ? "Following your phone theme"
                        : isDark
                          ? "Monochrome evening mode"
                          : "Editorial daytime mode"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row overflow-hidden rounded-full border border-gray-200 dark:border-white/10">
                  {themeOptions.map((option) => {
                    const isSelected = themeMode === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => void setThemeMode(option.id)}
                        className={`px-3 py-2 ${
                          isSelected
                            ? "bg-black dark:bg-white"
                            : "bg-white dark:bg-[#101215]"
                        }`}
                      >
                        <Text
                          preserveCase
                          className={`font-bold text-[10px] tracking-[1px] ${
                            isSelected
                              ? "text-white dark:text-black"
                              : "text-black dark:text-white"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View className="border-b border-gray-100 py-4 dark:border-white/10">
              <View className="gap-4">
                <View className="flex-row items-start gap-3">
                  <Ionicons
                    name="text-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <View className="flex-1">
                    <Text className="font-normal text-base text-black dark:text-white">
                      Text Case
                    </Text>
                    <Text className="font-normal text-xs text-gray-500 dark:text-white">
                      Reloads the app after changing text case.
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2 pl-8">
                  {textTransformOptions.map((option) => {
                    const isSelected = textTransformMode === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          void setTextTransformMode(option.id);
                        }}
                        className={`rounded-full border px-4 py-2 ${
                          isSelected
                            ? "border-black bg-black dark:border-white dark:bg-white"
                            : "border-gray-200 bg-white dark:border-white/10 dark:bg-[#101215]"
                        }`}
                      >
                        <Text
                          preserveCase
                          className={`font-bold text-sm ${
                            isSelected
                              ? "text-white dark:text-black"
                              : "text-black dark:text-white"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <Pressable
              className="border-b border-gray-100 py-4 dark:border-white/10"
              onPress={() => router.push("/returns" as any)}
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="font-normal text-base text-black dark:text-white">
                    Returns & Exchanges
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Badge count={returnsUnreadCount} />
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </View>
            </Pressable>

            <Pressable
              className="py-4 dark:border-white/10"
              onPress={() => router.push("/contact" as any)}
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="font-normal text-base text-black dark:text-white">
                    Contact Support
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {isAdmin ? (
          <View className="mb-8 px-6">
            <View className="mb-4">
              <Text className="mb-2 font-bold text-sm tracking-wider text-black dark:text-white">
                ATELIER TOOLS
              </Text>
              <View className="w-10 border border-black dark:border-white" />
            </View>

            <Pressable
              className="bg-[#1f2736] px-5 py-5"
              onPress={() => router.push("/admin" as any)}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-[11px] tracking-[1.5px] text-white/50">
                    HOUSE OF SHIRTS ADMIN
                  </Text>
                  <Text className="mt-3 font-bold text-[28px] leading-8 text-white">
                    Open Atelier Dashboard
                  </Text>
                  <Text className="mt-3 font-normal text-[13px] leading-6 text-white/70">
                    Review performance, recent orders, editorial updates, and
                    workshop actions from one control room.
                  </Text>
                </View>

                <View className="h-10 w-10 items-center justify-center bg-white">
                  <Ionicons name="arrow-forward" size={18} color="#111111" />
                </View>
              </View>
            </Pressable>
          </View>
        ) : null}

        <View className="mb-16 px-6">
          <Pressable
            className="flex-row items-center gap-2"
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/login");
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="font-semibold text-base tracking-wide text-red-500">
              Logout
            </Text>
          </Pressable>
        </View>

        <View className="items-center px-6 pb-12">
          <Text className="mb-3 font-light text-xs tracking-widest text-gray-500 dark:text-white">
            CURATED EXCELLENCE
          </Text>
          <Text className="text-center font-normal text-sm italic leading-relaxed text-gray-600 dark:text-white">
            &quot;A shirt is more than a garment, it is a declaration of
            intent&quot;
          </Text>
        </View>

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
