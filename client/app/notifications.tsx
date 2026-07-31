import { CustomerNotification, useAdminContentStore } from "@/stores/adminContentStore";
import { useOrdersStore } from "@/stores/ordersStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Animated, FlatList, Pressable, RefreshControl, View } from "react-native";
import { AppText as Text } from "@/components/AppText";

import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

type NotificationFilter =
  | "all"
  | "unread"
  | "orders"
  | "promotions"
  | "archived";

const filterOptions: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "promotions", label: "Promotions" },
  { id: "archived", label: "Archived" },
];

const NotificationCard = ({
  item,
  onOpen,
  onActionPress,
  onToggleRead,
  onArchive,
  onRestore,
}: {
  item: CustomerNotification;
  onOpen: (item: CustomerNotification) => void;
  onActionPress: (item: CustomerNotification) => void;
  onToggleRead: (item: CustomerNotification) => void;
  onArchive: (item: CustomerNotification) => void;
  onRestore: (item: CustomerNotification) => void;
}) => (
  <Swipeable
    overshootRight={false}
    onSwipeableOpen={() => {
      void Haptics.selectionAsync();
    }}
    renderRightActions={(_, dragX) => {
      const translateX = dragX.interpolate({
        inputRange: [-160, 0],
        outputRange: [0, 160],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={{ transform: [{ translateX }] }}
          className="mb-4 flex-row overflow-hidden rounded-[28px]"
        >
          {item.archived ? (
            <Pressable
              onPress={() => onRestore(item)}
              accessibilityRole="button"
              accessibilityLabel={`Restore ${item.title}`}
              className="w-28 items-center justify-center bg-[#d6dde7]"
            >
              <Text className="text-center font-bold text-[10px] tracking-[1.2px] text-[#161c28]">
                RESTORE
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => onToggleRead(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.read ? "Mark unread" : "Mark read"}: ${item.title}`}
                className="w-24 items-center justify-center bg-[#d6dde7]"
              >
                <Text className="text-center font-bold text-[10px] tracking-[1.2px] text-[#161c28]">
                  {item.read ? "MARK\nUNREAD" : "MARK\nREAD"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onArchive(item)}
                accessibilityRole="button"
                accessibilityLabel={`Archive ${item.title}`}
                className="w-24 items-center justify-center bg-[#161c28]"
              >
                <Text className="text-center font-bold text-[10px] tracking-[1.2px] text-white">
                  ARCHIVE
                </Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      );
    }}
  >
    <Pressable
      onPress={() => onOpen(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.message}. ${item.read ? "Read" : "Unread"}${item.archived ? ", archived" : ""}`}
      accessibilityHint="Opens notification"
      className={`mb-4 rounded-[28px] px-4 py-4 ${
        item.archived ? "bg-[#f0f2f5]" : item.read ? "bg-white" : "bg-[#fdfcf9]"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-1 h-10 w-10 items-center justify-center bg-black">
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color="#ffffff"
          />
        </View>

        <View className="flex-1">
          <View className="mb-1 flex-row items-start justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="font-bold text-[10px] tracking-[1.8px] text-neutral-400">
                {item.archived ? `ARCHIVED · ${item.label}` : item.label}
              </Text>
              {!item.read && !item.archived ? (
                <View className="h-2.5 w-2.5 rounded-full bg-[#161c28]" />
              ) : null}
            </View>
            <Text className="font-normal text-[10px] text-neutral-400">
              {item.time}
            </Text>
          </View>

          <Text className="mb-1 font-bold text-[17px] text-neutral-900">
            {item.title}
          </Text>
          <Text className="font-normal text-[12px] leading-5 text-neutral-500">
            {item.message}
          </Text>

          {item.action && !item.archived ? (
            <Pressable onPress={() => onActionPress(item)} className="mt-3 self-start">
              <Text className="font-bold text-[11px] tracking-[1.3px] text-neutral-900">
                {item.action}
              </Text>
              <View className="mt-1 h-[1px] w-full bg-neutral-900" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  </Swipeable>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const { 
    customerNotifications,
    markNotificationRead,
    unreadNotificationCount,
    toggleNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
    restoreNotification,
    fetchCustomerNotifications,
   } = useAdminContentStore();
  const {  orders, fetchOrders  } = useOrdersStore();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchCustomerNotifications()]);
    setRefreshing(false);
  }, [fetchOrders, fetchCustomerNotifications]);


  useEffect(() => {
    void fetchOrders();
    void fetchCustomerNotifications();
  }, [fetchOrders, fetchCustomerNotifications]);

  const inboxItems = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return customerNotifications.filter((item) => !item.read && !item.archived);
      case "orders":
        return customerNotifications.filter(
          (item) => item.targetType === "orders" && !item.archived
        );
      case "promotions":
        return customerNotifications.filter(
          (item) => item.targetType === "shop" && !item.archived
        );
      case "archived":
        return customerNotifications.filter((item) => item.archived);
      default:
        return customerNotifications.filter((item) => !item.archived);
    }
  }, [activeFilter, customerNotifications]);

  const openNotification = (item: CustomerNotification) => {
    void Haptics.selectionAsync();
    if (!item.archived) {
      void markNotificationRead(item.id);
    }

    if (item.targetType === "product") {
      if (item.targetValue) {
        router.push(`/product/${item.targetValue}` as any);
        return;
      }
    }

    if (item.targetType === "orders") {
      const targetOrderId =
        item.targetValue && orders.some((order) => order.id === item.targetValue)
          ? item.targetValue
          : orders[0]?.id;

      if (targetOrderId) {
        router.push(`/orders/${targetOrderId}` as any);
        return;
      }

      router.push("/orders" as any);
      return;
    }

    if (item.targetType === "shop") {
      router.push({
        pathname: "/(tabs)/shop",
        params: item.targetValue ? { search: item.targetValue } : undefined,
      } as any);
    }


  };

  const filterCount = inboxItems.length;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f1]">
      <View className="border-b border-black/5 bg-white px-4 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#111111" />
          </Pressable>

          <Text className="font-bold text-[10px] tracking-[2.5px] text-neutral-700">
            NOTIFICATIONS
          </Text>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              if (unreadNotificationCount > 0) {
                void markAllNotificationsRead();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Mark all notifications read${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ""}`}
            accessibilityState={{ disabled: unreadNotificationCount === 0 }}
            className="relative min-w-[40px] items-center justify-center"
          >
            <Ionicons name="mail-open-outline" size={18} color="#111111" />
            {unreadNotificationCount > 0 ? (
              <View className="absolute -right-1 top-0 min-w-[16px] rounded-full bg-[#161c28] px-1">
                <Text className="text-center font-bold text-[10px] leading-4 text-white">
                  {unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#161c28"
          />
        }

        ListHeaderComponent={
          <View className="mb-5">
            <Text className="mb-2 font-bold text-[10px] tracking-[2.2px] text-neutral-400">
              INBOX
            </Text>
            <Text className="font-light text-[34px] leading-9 text-neutral-700">
              Recent Updates
            </Text>
            <View className="mt-3 flex-row items-center justify-between gap-4">
              <Text className="font-normal text-[12px] text-neutral-400">
                {unreadNotificationCount} unread update
                {unreadNotificationCount === 1 ? "" : "s"}
              </Text>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  void markAllNotificationsRead();
                }}
                className="px-3 py-2"
              >
                <Text className="font-bold text-[10px] tracking-[1.8px] text-[#161c28]">
                  MARK ALL READ
                </Text>
              </Pressable>
            </View>

            <View className="mt-5 flex-row flex-wrap gap-2">
              {filterOptions.map((option) => {
                const isActive = activeFilter === option.id;

                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${option.label} notifications`}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setActiveFilter(option.id);
                    }}
                    className={`rounded-full px-4 py-2 ${
                      isActive ? "bg-[#161c28]" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`font-bold text-[10px] tracking-[1.6px] ${
                        isActive ? "text-white" : "text-neutral-500"
                      }`}
                    >
                      {option.label.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onOpen={openNotification}
            onActionPress={openNotification}
            onToggleRead={(notification) => {
              void Haptics.selectionAsync();
              void toggleNotificationRead(notification.id);
            }}
            onArchive={(notification) => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              void archiveNotification(notification.id);
            }}
            onRestore={(notification) => {
              void Haptics.selectionAsync();
              void restoreNotification(notification.id);
            }}
          />
        )}
        ListEmptyComponent={
          <View className="rounded-[28px] bg-white px-6 py-10">
            <Text className="text-center font-bold text-[18px] text-black">
              No notifications here yet
            </Text>
            <Text className="mt-2 text-center font-normal text-[12px] leading-5 text-neutral-400">
              Try another filter or send a fresh campaign from the admin side.
            </Text>
          </View>
        }
        ListFooterComponent={
          filterCount > 0 ? (
            <View className="pt-6">
              <Text className="text-center font-bold text-[10px] tracking-[3px] text-neutral-400">
                YOU&apos;RE ALL CAUGHT UP
              </Text>
              <Text className="mt-3 text-center font-normal text-[11px] text-neutral-400">
                Swipe left on a card for quick actions and recovery.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
