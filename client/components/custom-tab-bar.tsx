import { View, Pressable, StyleSheet, Animated, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@/constants/index";
import { useEffect, useRef } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isVisibleTabRoute } from "@/lib/tab-bar";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { isDark } = useThemeStore();

  const visibleRoutes = state.routes.filter((route) =>
    isVisibleTabRoute(descriptors[route.key].options),
  );

  return (
    <View style={styles.container}>
      {/* White tab bar background */}
      <View
        style={[styles.tabBar, isDark ? styles.tabBarDark : styles.tabBarLight]}
      >
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          // Focus compares against the navigator's own index, so it must use
          // the route's position in state.routes, not in the filtered list.
          const isFocused = state.routes[state.index]?.key === route.key;

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
      style={({ pressed }) => [
        styles.tab,
        pressed ? styles.pressed : undefined,
      ]}
      accessibilityRole="tab"
      accessibilityLabel={
        options.tabBarAccessibilityLabel ?? options.title ?? route.name
      }
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          isFocused && styles.activeIcon,
          isFocused && Platform.OS === "android"
            ? styles.activeIconAndroid
            : undefined,
          !isFocused && isDark ? styles.inactiveDarkIcon : undefined,
          { transform: [{ translateY }] },
        ]}
      >
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused
            ? "#ffffff"
            : isDark
              ? "#a1a1aa"
              : colors.textSecondary,
          size: 24,
        })}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Geometry follows the admin bar, which lays out the way this one should:
  // equal insets, a taller pill, and slim horizontal padding so the icons have
  // real room between them rather than being squeezed into the middle.
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: "row",
    // Anchors the first icon to the left padding edge and the last to the right
    // one, then splits what is left over into equal gaps. The icons cannot
    // bunch up at one end and leave dead space at the other, however many tabs
    // the navigator ends up handing us.
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 30,
    height: 70,
    paddingHorizontal: 10,
    elevation: Platform.OS === "android" ? 0 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
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
  // Deliberately not `flex: 1`. An equal-share slot is only equal-looking while
  // every slot holds something: anything the row renders without visible
  // content still claims its full share and shows up as a hole. Sized to its
  // icon instead, the row lays out from what is actually on screen.
  tab: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // Widen the gap between icons by lowering the pill's paddingHorizontal (more
  // room to share out) or by shrinking this. The gap works out as
  // (pill width - 2 x padding - 5 x this width) / 4.
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
