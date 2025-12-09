import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "@/constants/index";
import { useEffect, useRef } from "react";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {/* White tab bar background */}
      <View style={styles.tabBar}>
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
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({ route, isFocused, onPress, options }: any) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused ? -35 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [isFocused]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.tab} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.iconContainer,
          isFocused && styles.activeIcon,
          { transform: [{ translateY }] },
        ]}
      >
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? "#ffffff" : colors.textSecondary,
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
    backgroundColor: "white",
    borderRadius: 30,
    height: 65,
    paddingHorizontal: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
  activeIcon: {
    backgroundColor: colors.accent,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
