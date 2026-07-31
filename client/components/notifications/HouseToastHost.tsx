import { HouseToast } from "@/components/notifications/HouseToast";
import { useToastStore } from "@/stores/toastStore";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FLOATING_TAB_CLEARANCE = 96;

export function HouseToastHost() {
  const insets = useSafeAreaInsets();
  const { visible, message, type, autoHideDuration, hideToast } = useToastStore();

  return (
    <HouseToast
      visible={visible}
      message={message}
      type={type}
      autoHideDuration={autoHideDuration}
      bottomOffset={Math.max(FLOATING_TAB_CLEARANCE, insets.bottom + 84)}
      onDismiss={hideToast}
    />
  );
}
