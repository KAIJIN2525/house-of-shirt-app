import { AppText as Text } from "@/components/AppText";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Pressable, View } from "react-native";

export interface AdminQuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
}

interface AdminQuickActionsGridProps {
  actions: AdminQuickAction[];
  badges?: Record<string, number>;
  onPress: (route: string) => void;
}

export const AdminQuickActionsGrid = memo(function AdminQuickActionsGrid({
  actions,
  badges = {},
  onPress,
}: AdminQuickActionsGridProps) {
  const { isDark } = useThemeStore();

  return (
    <View
      className="overflow-hidden px-5 py-6"
      style={{ backgroundColor: isDark ? "#101114" : "#ffffff" }}
    >
      {/* Header */}
      <View className="mb-6 flex-row items-end justify-between">
        <View>
          <Text className="text-[10px] font-bold tracking-[1.5px] text-neutral-400">
            ADMIN TOOLKIT
          </Text>
          <Text
            className="mt-2 text-[22px] font-bold"
            style={{ color: isDark ? "#ffffff" : "#000000" }}
          >
            Quick Actions
          </Text>
        </View>
        <Text className="text-[9px] font-bold tracking-[1.2px] text-neutral-400">
          {actions.length} TOOLS
        </Text>
      </View>

      {/* Self-wrapping 4-column grid */}
      <View className="flex-row flex-wrap">
        {actions.map((action) => {
          const badge = badges[action.id] ?? 0;
          return (
            <Pressable
              key={action.id}
              onPress={() => onPress(action.route)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              className="mb-5 w-1/4 items-center px-1 active:opacity-60"
            >
              <View
                className="h-[52px] w-[52px] items-center justify-center rounded-2xl"
                style={{ backgroundColor: isDark ? "#ffffff" : "#000000" }}
              >
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={isDark ? "#000000" : "#ffffff"}
                />
                {badge > 0 ? (
                  <View
                    className="absolute -right-1.5 -top-1.5 h-[18px] min-w-[18px] items-center justify-center rounded-full border px-1"
                    style={{
                      backgroundColor: isDark ? "#000000" : "#ffffff",
                      borderColor: isDark ? "#ffffff" : "#000000",
                    }}
                  >
                    <Text
                      className={
                        isDark
                          ? "text-[8px] font-bold text-white"
                          : "text-[8px] font-bold text-black"
                      }
                    >
                      {Math.min(badge, 99)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                preserveCase
                className="mt-2.5 text-center text-[9px] font-bold leading-[12px]"
                style={{ color: isDark ? "#ffffff" : "#000000" }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
