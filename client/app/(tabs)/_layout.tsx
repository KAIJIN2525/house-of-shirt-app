import { Tabs } from "expo-router";
import React from "react";

import { Ionicons,  } from "@expo/vector-icons";
import { CustomTabBar } from "@/components/custom-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name="shirt" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name="heart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name="bag" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
