import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/stores/themeStore";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View, Animated, TouchableOpacity, Platform } from "react-native";
import React, { useEffect, useRef } from "react";
import { colors } from "@/constants/index";

export function AdminBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const {  isDark  } = useThemeStore();

  return (
    <View style={styles.container}>
      <View
        style={[styles.tabBar, isDark ? styles.tabBarDark : styles.tabBarLight]}
      >
        {state.routes.filter(route => descriptors[route.key].options.tabBarIcon !== undefined).map((route, index) => {
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

function AdminTabButton({ isFocused, onPress, options, isDark }: any) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused ? -35 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [isFocused, translateY]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.tab} activeOpacity={0.7}>
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
    </TouchableOpacity>
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
  tab: {
    flex: 1,
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
