import { useColorScheme as useSystemColorScheme } from "react-native";

import { useThemeStore } from "@/stores/themeStore";

export function useColorScheme() {
  const theme = useThemeStore();
  const systemColorScheme = useSystemColorScheme();

  return theme.colorScheme ?? (systemColorScheme === "dark" ? "dark" : "light");
}
