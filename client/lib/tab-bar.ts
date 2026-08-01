import { StyleSheet } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

/**
 * Whether a registered route should occupy a slot in a custom tab bar.
 *
 * Expo Router registers every file under a tabs layout as a route and hides the
 * ones that should not be shown. The default tab bar honours that; a custom bar
 * replaces the default, so it has to re-apply the same test or a hidden route
 * still claims a flex slot and leaves a blank gap at the end of the pill.
 *
 * The marker is `tabBarItemStyle.display`, not `href`: Expo Router strips `href`
 * off the options before React Navigation sees them and rewrites it as
 * `tabBarItemStyle: { display: "none" }` (it does the same for internally
 * generated routes such as `_sitemap`), so checking `options.href` here would
 * never match anything.
 */
export const isVisibleTabRoute = (options: BottomTabNavigationOptions) => {
  const itemStyle = StyleSheet.flatten(options.tabBarItemStyle);
  return options.tabBarIcon != null && itemStyle?.display !== "none";
};
