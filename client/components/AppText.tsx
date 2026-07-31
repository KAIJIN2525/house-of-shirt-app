import { forwardRef } from "react";
import { Text as RNText, type Text as RNTextInstance, type TextProps } from "react-native";

import { useThemeStore } from "@/stores/themeStore";

export interface AppTextProps extends TextProps {
  /** Opt out of the global text-case setting (e.g. size labels like "XL" that must always render as typed). */
  preserveCase?: boolean;
}

export const AppText = forwardRef<RNTextInstance, AppTextProps>(
  ({ preserveCase, ...props }, ref) => {
    const textTransformMode = useThemeStore((state) => state.textTransformMode);
    const shouldTransform = !preserveCase && textTransformMode !== "none";

    return (
      <RNText
        ref={ref}
        {...props}
        style={[props.style, shouldTransform ? { textTransform: textTransformMode } : null]}
      />
    );
  },
);

AppText.displayName = "AppText";
