import { View, Pressable, StyleSheet, Animated, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@/constants/index";
import { useEffect, useRef } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const {  isDark  } = useThemeStore();

  return (
    <View style={styles.container}>
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
  const translateY = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused && !reduceMotion ? -8 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [isFocused, reduceMotion, translateY]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed ? styles.pressed : undefined]}
      accessibilityRole="tab"
      accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          isFocused && styles.activeIcon,
          isFocused && Platform.OS === "android" ? styles.activeIconAndroid : undefined,
          !isFocused && isDark ? styles.inactiveDarkIcon : undefined,
          { transform: [{ translateY }] },
        ]}
      >
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? "#ffffff" : isDark ? "#a1a1aa" : colors.textSecondary,
          size: 24,
        })}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
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
