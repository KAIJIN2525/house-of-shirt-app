import { useThemeStore } from "@/stores/themeStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isVisibleTabRoute } from "@/lib/tab-bar";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View, Animated, Platform } from "react-native";
import React, { useEffect, useRef } from "react";

export function AdminBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const {  isDark  } = useThemeStore();

  return (
    <View style={styles.container}>
      <View
        style={[styles.tabBar, isDark ? styles.tabBarDark : styles.tabBarLight]}
      >
        {state.routes.filter(route => isVisibleTabRoute(descriptors[route.key].options)).map((route) => {
          const { options } = descriptors[route.key];
          
          // Note: state.index refers to the index in the FULL routes array.
          // Since we filtered, we need to check if the CURRENT route is the one focused.
          const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);

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
            <AdminTabButton
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

function AdminTabButton({ route, isFocused, onPress, options, isDark }: any) {
  const translateY = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused && !reduceMotion ? -35 : 0,
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
          styles.iconWrap,
          isFocused && styles.activeIconWrap,
          isFocused && Platform.OS === "android" ? styles.activeIconWrapAndroid : undefined,
          !isFocused && isDark ? styles.iconWrapDark : null,
          { transform: [{ translateY }] },
        ]}
      >
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? "#ffffff" : isDark ? "#c7cbd2" : "#6b7280",
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
    justifyContent: "space-between",
    borderRadius: 30,
    height: 70,
    paddingHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: Platform.OS === "android" ? 0 : 12,
  },
  tabBarLight: {
    backgroundColor: "#ffffff",
  },
  tabBarDark: {
    backgroundColor: "#111317",
  },
  pressed: {
    opacity: 0.7,
  },
  // Sized to its icon rather than an equal share, so the bar's space-between
  // actually distributes: a flex:1 slot claims its share even when it has
  // nothing visible in it, which reads as a hole at the end of the pill.
  tab: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconWrap: {
    backgroundColor: "#111111",
    elevation: Platform.OS === "android" ? 0 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeIconWrapAndroid: {
    zIndex: 1,
  },
  iconWrapDark: {
    backgroundColor: "transparent",
  },
});
