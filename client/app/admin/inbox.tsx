import { AppText as Text } from "@/components/AppText";
import { BrandLogo } from "@/components/BrandLogo";
import { AdminAlertRecord, useAdminAlertsStore } from "@/stores/adminAlertsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = "all" | "unread" | "risk" | "restock";
const filters: Filter[] = ["all", "unread", "risk", "restock"];
const searchText = (alert: AdminAlertRecord) => `${alert.label} ${alert.title}`.toLowerCase();
const isRisk = (alert: AdminAlertRecord) => searchText(alert).includes("blacklist") || searchText(alert).includes("risk");
const isRestock = (alert: AdminAlertRecord) => searchText(alert).includes("restock");
const relativeTime = (value: string) => {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return "NOW";
  if (minutes < 60) return `${minutes}M AGO`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}H AGO`;
  return `${Math.floor(minutes / 1440)}D AGO`;
};

const AlertRow = memo(function AlertRow({ alert, isDark, onPress }: {
  alert: AdminAlertRecord;
  isDark: boolean;
  onPress: (alert: AdminAlertRecord) => void;
}) {
  const risk = isRisk(alert);
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(alert)} className={`mb-3 border-l-[3px] px-5 py-5 ${risk ? "border-red-500 bg-[#fff7f7] dark:bg-[#1a1212]" : alert.read ? "border-neutral-200 bg-white dark:border-white/10 dark:bg-[#101215]" : "border-black bg-white dark:border-white dark:bg-[#101215]"}`}>
      <View className="flex-row items-start gap-4">
        <View className={`h-10 w-10 items-center justify-center rounded-full ${risk ? "bg-red-100 dark:bg-red-950" : "bg-[#eff0f2] dark:bg-[#1b1e23]"}`}>
          <Ionicons name={(alert.icon || "notifications-outline") as any} size={19} color={risk ? "#dc2626" : isDark ? "#fff" : "#111"} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className={`text-[9px] font-bold tracking-[1.4px] ${risk ? "text-red-600" : "text-neutral-400"}`}>{alert.label.toUpperCase()}</Text>
            <Text className="text-[9px] font-bold text-neutral-400">{relativeTime(alert.createdAt)}</Text>
          </View>
          <Text className="mt-2 text-[17px] font-bold text-black dark:text-white">{alert.title}</Text>
          <Text className="mt-2 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">{alert.message}</Text>
          {alert.targetType ? <Text className="mt-3 text-[10px] font-bold tracking-[1.2px] text-black dark:text-white">OPEN {alert.targetType.toUpperCase()} →</Text> : null}
        </View>
        {!alert.read ? <View className="mt-1 h-2 w-2 rounded-full bg-red-500" /> : null}
      </View>
    </Pressable>
  );
});

export default function AdminInboxScreen() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { alerts, isLoading, fetchAlerts, markRead, markAllRead } = useAdminAlertsStore();
  const [filter, setFilter] = useState<Filter>("all");
  useFocusEffect(useCallback(() => { void fetchAlerts(); }, [fetchAlerts]));
  const visible = useMemo(() => alerts.filter((alert) => {
    if (filter === "unread") return !alert.read;
    if (filter === "risk") return isRisk(alert);
    if (filter === "restock") return isRestock(alert);
    return true;
  }), [alerts, filter]);
  const unread = alerts.filter((alert) => !alert.read).length;
  const openAlert = useCallback(async (alert: AdminAlertRecord) => {
    if (!alert.read) await markRead(alert.id).catch(() => undefined);
    if (isRisk(alert)) {
      router.push(alert.targetValue ? (`/admin/orders/${encodeURIComponent(alert.targetValue)}` as any) : ("/admin/blacklist" as any));
    } else if (isRestock(alert) || alert.targetType === "product") {
      router.push("/admin/restock-requests" as any);
    } else if (alert.targetType === "orders" && alert.targetValue) {
      router.push(`/admin/orders/${encodeURIComponent(alert.targetValue)}` as any);
    }
  }, [markRead, router]);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlertRow alert={item} isDark={isDark} onPress={openAlert} />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAlerts} tintColor="#888" />}
        ListHeaderComponent={<>
          <View className="flex-row items-center justify-between pb-5 pt-4">
            <Pressable accessibilityRole="button" accessibilityLabel="Back to admin dashboard" hitSlop={10} onPress={() => router.navigate("/admin" as any)}><Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111"} /></Pressable>
            <BrandLogo width={154} height={28} />
            <Pressable accessibilityRole="button" accessibilityLabel="Mark all alerts read" hitSlop={10} onPress={() => void markAllRead()}><Ionicons name="checkmark-done-outline" size={22} color={isDark ? "#f8fafc" : "#111"} /></Pressable>
          </View>
          <Text className="text-[10px] font-bold tracking-[1.5px] text-neutral-400">OPERATIONS CENTER</Text>
          <Text className="mt-2 text-[42px] font-bold leading-[42px] text-black dark:text-white">Admin Inbox</Text>
          <Text className="mt-3 text-[13px] leading-6 text-neutral-500">Blacklist risk, stock demand, fulfillment alerts, and other events that need an admin decision.</Text>
          <View className="my-6 flex-row flex-wrap gap-2">
            {filters.map((item) => <Pressable accessibilityRole="button" accessibilityLabel={`${item} alerts`} accessibilityState={{ selected: filter === item }} key={item} onPress={() => setFilter(item)} className={`px-4 py-3 ${filter === item ? "bg-black dark:bg-white" : "bg-white dark:bg-[#101215]"}`}>
              <Text className={`text-[9px] font-bold tracking-[1.3px] ${filter === item ? "text-white dark:text-black" : "text-neutral-500"}`}>{item.toUpperCase()}{item === "unread" ? ` ${unread}` : ""}</Text>
            </Pressable>)}
          </View>
        </>}
        ListEmptyComponent={isLoading ? <ActivityIndicator color={isDark ? "#fff" : "#111"} /> : <View className="bg-white px-6 py-12 dark:bg-[#101215]"><Ionicons name="checkmark-circle-outline" size={34} color={isDark ? "#fff" : "#111"} /><Text className="mt-4 text-[20px] font-bold text-black dark:text-white">Nothing needs attention</Text><Text className="mt-2 text-[12px] leading-5 text-neutral-500">New operational notifications will appear here automatically.</Text></View>}
      />
    </SafeAreaView>
  );
}
