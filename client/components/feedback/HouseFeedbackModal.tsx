import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/AppText";

import { useThemeStore } from "@/stores/themeStore";

type FeedbackType = "success" | "error" | "info" | "network";

interface FeedbackAction {
  label: string;
  onPress: () => void;
}

interface HouseFeedbackModalProps {
  visible: boolean;
  type?: FeedbackType;
  title: string;
  message?: string;
  primaryAction?: FeedbackAction;
  secondaryAction?: FeedbackAction;
  onRequestClose?: () => void;
}

const iconByType: Record<FeedbackType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark",
  error: "alert",
  info: "information",
  network: "wifi-outline",
};

export function HouseFeedbackModal({
  visible,
  type = "info",
  title,
  message,
  primaryAction,
  secondaryAction,
  onRequestClose,
}: HouseFeedbackModalProps) {
  const { isDark } = useThemeStore();
  const foreground = isDark ? "#050505" : "#ffffff";
  const background = isDark ? "#ffffff" : "#050505";
  const surfaceBackground = isDark ? "#101215" : "#ffffff";
  const secondaryBackground = isDark ? "#1f2329" : "#f3f4f6";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View
          className="w-full max-w-[360px] items-center rounded-[28px] border border-black/10 px-6 py-7 shadow-2xl dark:border-white/10"
          style={{ backgroundColor: surfaceBackground }}
        >
          <View
            className="mb-5 h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: background }}
          >
            <Ionicons name={iconByType[type]} size={30} color={foreground} />
          </View>

          <Text className="text-center text-xl font-bold text-black dark:text-white">
            {title}
          </Text>

          {message ? (
            <Text className="mt-3 text-center text-sm leading-6 text-gray-600 dark:text-white/60">
              {message}
            </Text>
          ) : null}

          {primaryAction || secondaryAction ? (
            <View className="mt-7 w-full gap-3">
              {primaryAction ? (
                <Pressable
                  onPress={primaryAction.onPress}
                  className="h-12 items-center justify-center rounded-xl bg-black dark:bg-white"
                >
                  <Text className="text-xs font-bold uppercase tracking-[1.5px] text-white dark:text-black">
                    {primaryAction.label}
                  </Text>
                </Pressable>
              ) : null}

              {secondaryAction ? (
                <Pressable
                  onPress={secondaryAction.onPress}
                  className="h-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: secondaryBackground }}
                >
                  <Text className="text-xs font-bold uppercase tracking-[1.5px] text-black dark:text-white">
                    {secondaryAction.label}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
