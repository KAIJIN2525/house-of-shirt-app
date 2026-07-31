import { AppText as Text } from "@/components/AppText";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuditEvent {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  resource_type: string;
  resource_id: string | null;
  changed_fields: string[];
}

const actionColor: Record<AuditEvent["action"], string> = {
  INSERT: "#16a34a",
  UPDATE: "#d97706",
  DELETE: "#dc2626",
};

const AuditRow = memo(({ event }: { event: AuditEvent }) => (
  <View className="mx-6 mb-3 rounded-[22px] bg-white px-5 py-5 dark:bg-[#101215]">
    <View className="flex-row items-center justify-between gap-3">
      <Text
        className="font-bold text-[10px] tracking-[1.4px]"
        style={{ color: actionColor[event.action] }}
      >
        {event.action}
      </Text>
      <Text className="text-[10px] text-neutral-400">
        {new Date(event.occurred_at).toLocaleString()}
      </Text>
    </View>
    <Text className="mt-3 font-bold text-[14px] text-black dark:text-white">
      {event.resource_type.replaceAll("_", " ")}
    </Text>
    <Text className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
      Record: {event.resource_id ?? "Generated record"}
    </Text>
    <Text className="mt-3 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
      Changed: {event.changed_fields.length ? event.changed_fields.join(", ") : "No fields recorded"}
    </Text>
    <Text className="mt-2 text-[10px] text-neutral-400">
      Actor: {event.actor_id ? event.actor_id.slice(0, 8) : "System"}
    </Text>
  </View>
));

AuditRow.displayName = "AuditRow";

export default function AdminAuditLogScreen() {
  const router = useRouter();
  const isDark = useThemeStore((state) => state.isDark);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchEvents = useCallback(async () => {
    setErrorMessage("");
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select(
        "id, occurred_at, actor_id, action, resource_type, resource_id, changed_fields",
      )
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setEvents((data ?? []) as AuditEvent[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const renderItem = useCallback(
    ({ item }: { item: AuditEvent }) => <AuditRow event={item} />,
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <View className="flex-row items-center gap-4 px-6 pb-5 pt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#f8fafc" : "#111111"}
          />
        </Pressable>
        <View className="flex-1">
          <Text className="font-bold text-[16px] text-black dark:text-white">
            Audit History
          </Text>
          <Text className="mt-1 text-[10px] tracking-[1.4px] text-neutral-400">
            IMMUTABLE ADMIN ACTIVITY
          </Text>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchEvents} />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        ListEmptyComponent={
          <View className="mx-6 mt-8 rounded-[24px] bg-white px-6 py-10 dark:bg-[#101215]">
            <Text className="text-center text-[13px] text-neutral-500 dark:text-neutral-400">
              {errorMessage || "No administrator changes have been recorded yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
