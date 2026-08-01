import { View, Pressable, StyleSheet, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@/constants/index";
import { useThemeStore } from "@/stores/themeStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const {  isDark  } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: Platform.OS === "android" ? 8 : Math.max(8, insets.bottom) }]}>
      {/* White tab bar background */}
      <View
        style={[
          styles.tabBar,
          isDark ? styles.tabBarDark : styles.tabBarLight,
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              options={options}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({ route, isFocused, onPress, options, isDark }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed ? styles.pressed : undefined]}
      accessibilityRole="tab"
      accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
      accessibilityState={{ selected: isFocused }}
    >
      <View
        style={[
          styles.iconContainer,
          isFocused && styles.activeIcon,
          isFocused && Platform.OS === "android" ? styles.activeIconAndroid : undefined,
          !isFocused && isDark ? styles.inactiveDarkIcon : undefined,
        ]}
      >
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? "#ffffff" : isDark ? "#a1a1aa" : colors.textSecondary,
          size: 24,
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 30,
    height: 65,
    paddingHorizontal: 10,
    elevation: Platform.OS === "android" ? 0 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabBarLight: {
    backgroundColor: "white",
  },
  tabBarDark: {
    backgroundColor: "#0f1115",
    shadowColor: "#000",
    shadowOpacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  inactiveDarkIcon: {
    backgroundColor: "transparent",
  },
  activeIcon: {
    backgroundColor: colors.accent,
    elevation: Platform.OS === "android" ? 0 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeIconAndroid: {
    zIndex: 1,
  },
});
