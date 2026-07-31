import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, PressableProps } from "react-native";

interface HapticPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: PressableProps["style"];
  className?: string;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export const HapticPressable = ({
  children,
  onPress,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  ...props
}: HapticPressableProps) => {
  const handlePress = (e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
    void Haptics.impactAsync(hapticStyle);
    onPress?.(e);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.75 : 1 },
        typeof props.style === "function" ? props.style({ pressed, hovered: false }) : props.style,
      ]}
    >
      {children}
    </Pressable>
  );
};
