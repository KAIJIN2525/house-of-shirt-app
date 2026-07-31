import { AppText as Text } from "@/components/AppText";
import { useThemeStore } from "@/stores/themeStore";
import React from "react";
import { StyleProp, TextStyle } from "react-native";

interface BrandLogoProps {
  style?: StyleProp<TextStyle>;
  width?: number;
  height?: number;
  /** Force a specific variant regardless of theme */
  variant?: "light" | "dark";
}

export const BrandLogo = ({
  style,
  width = 160,
  height = 32,
  variant,
}: BrandLogoProps) => {
  const { isDark } = useThemeStore();
  const useDark = variant ? variant === "dark" : isDark;
  const fontSize = Math.max(14, Math.round(height * 0.64));

  return (
    <Text
      preserveCase
      numberOfLines={1}
      adjustsFontSizeToFit
      allowFontScaling={false}
      style={[
        {
          width,
          height,
          color: useDark ? "#ffffff" : "#050505",
          fontFamily: "Lexend-Bold",
          fontSize,
          letterSpacing: -1.05,
          lineHeight: height,
          textAlign: "center",
          includeFontPadding: false,
          textAlignVertical: "center",
        },
        style,
      ]}
    >
      Houseofshirts.
    </Text>
  );
};
