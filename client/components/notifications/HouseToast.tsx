import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/AppText";

interface HouseToastProps {
  visible: boolean;
  message: string;
  type?: "error" | "success" | "info";
  onDismiss: () => void;
  autoHideDuration?: number;
  bottomOffset?: number;
}

export const HouseToast: React.FC<HouseToastProps> = ({
  visible,
  message,
  type = "error",
  onDismiss,
  autoHideDuration = 5000,
  bottomOffset = 108,
}) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false);
      callback?.();
    });
  };

  useEffect(() => {
    if (!visible) {
      if (isMounted) {
        animateOut();
      }
      return;
    }

    setIsMounted(true);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 55,
        friction: 9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      animateOut(onDismiss);
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [autoHideDuration, isMounted, onDismiss, opacity, translateY, visible]);

  if (!isMounted) {
    return null;
  }

  const palette =
    type === "success"
      ? { bg: "#42a85f", icon: "checkmark-circle-outline" }
      : type === "info"
        ? { bg: "#111826", icon: "information-circle-outline" }
        : { bg: "#ef6b6b", icon: "alert-circle-outline" };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: bottomOffset,
        zIndex: 1000,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: palette.bg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 8,
        }}
      >
        <Ionicons name={palette.icon as any} size={20} color="#ffffff" />
        <Text
          style={{
            color: "#ffffff",
            fontSize: 12,
            fontWeight: "700",
            marginLeft: 12,
            marginRight: 12,
            flex: 1,
            letterSpacing: 0.6,
          }}
          numberOfLines={3}
        >
          {message.toUpperCase()}
        </Text>
        <Pressable onPress={() => animateOut(onDismiss)}>
          <Ionicons name="close" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </Animated.View>
  );
};
