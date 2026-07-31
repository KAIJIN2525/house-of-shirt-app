import { AppText as Text } from "@/components/AppText";
import {
  AdminSettings,
  useAdminContentStore,
} from "@/stores/adminContentStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ToggleRow = ({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View className="flex-row items-center justify-between gap-4 border-b border-neutral-100 py-5 last:border-b-0 dark:border-white/5">
    <View className="flex-1">
      <Text className="font-bold text-[14px] text-black dark:text-white">
        {title}
      </Text>
      <Text className="mt-2 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#d9dbe1", true: "#111111" }}
      thumbColor="#ffffff"
    />
  </View>
);

const SettingsLink = ({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    className="flex-row items-center gap-4 border-b border-neutral-100 py-5 last:border-b-0 dark:border-white/5"
  >
    <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10">
      <Ionicons name={icon} size={18} color="#7b8190" />
    </View>
    <View className="flex-1">
      <Text className="font-bold text-[14px] text-black dark:text-white">
        {title}
      </Text>
      <Text className="mt-1 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={17} color="#9ca3af" />
  </Pressable>
);

export default function AdminSettingsScreen() {
  const router = useRouter();
  const isDark = useThemeStore((state) => state.isDark);
  const { settings, saveSettings } = useAdminContentStore();
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const hasChanges =
    draft.globalNotifications !== settings.globalNotifications ||
    draft.marketing !== settings.marketing;

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");
    try {
      await saveSettings(draft);
      setStatusMessage("Operational settings saved for every admin device.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Could not save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
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
              Admin Settings
            </Text>
            <Text className="mt-1 text-[10px] tracking-[1.4px] text-neutral-400">
              LIVE OPERATIONAL CONTROLS
            </Text>
          </View>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            CAMPAIGN PERMISSIONS
          </Text>
          <View className="mt-4 rounded-[28px] bg-white px-5 dark:bg-[#101215]">
            <ToggleRow
              title="Campaign sending"
              description="Master switch for manual and scheduled campaigns created in the admin notification center."
              value={draft.globalNotifications}
              onValueChange={(globalNotifications) =>
                setDraft((current) => ({ ...current, globalNotifications }))
              }
            />
            <ToggleRow
              title="Segmented marketing"
              description="Allow campaigns targeted to VIP and new-customer segments. Transactional operations remain separate."
              value={draft.marketing}
              onValueChange={(marketing) =>
                setDraft((current) => ({ ...current, marketing }))
              }
            />
          </View>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            WORKSPACE ADMINISTRATION
          </Text>
          <View className="mt-4 rounded-[28px] bg-white px-5 dark:bg-[#101215]">
            <SettingsLink
              icon="people-outline"
              title="Staff access"
              description="Grant or revoke admin access for colleagues."
              onPress={() => router.push("/admin/staff-access" as any)}
            />
            <SettingsLink
              icon="notifications-outline"
              title="Notification center"
              description="Create campaigns, templates, and scheduled messages."
              onPress={() => router.push("/admin/notifications" as any)}
            />
            <SettingsLink
              icon="sync-outline"
              title="Shopify synchronization"
              description="Review sync health, logs, webhooks, and manual refreshes."
              onPress={() => router.push("/admin/shopify-sync" as any)}
            />            <SettingsLink
              icon="shield-checkmark-outline"
              title="Audit history"
              description="Review immutable staff changes to orders, customers, content, access, and campaigns."
              onPress={() => router.push("/admin/audit-log" as any)}
            />
          </View>
        </View>

        <View className="mt-8 px-6">
          {statusMessage ? (
            <Text className="mb-4 text-[12px] leading-5 text-[#3c6a9e]">
              {statusMessage}
            </Text>
          ) : null}
          <Pressable
            onPress={() => void handleSave()}
            disabled={!hasChanges || isSaving}
            accessibilityRole="button"
            className={`py-4 ${hasChanges && !isSaving ? "bg-[#161c28]" : "bg-neutral-300 dark:bg-white/10"}`}
          >
            <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
              {isSaving
                ? "SAVING"
                : hasChanges
                  ? "SAVE SETTINGS"
                  : "SETTINGS SAVED"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
