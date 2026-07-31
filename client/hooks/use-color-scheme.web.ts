import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { useThemeStore } from "@/stores/themeStore";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const theme = useThemeStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (theme.colorScheme) {
    return theme.colorScheme;
  }

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
