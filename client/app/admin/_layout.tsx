import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { AdminBottomTabBar } from "@/components/admin-bottom-tab-bar";
import { AdminRouteGate } from "@/components/admin/AdminRouteGate";

export default function AdminLayout() {
  return (
    <AdminRouteGate>
      <Tabs
        tabBar={(props) => <AdminBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Overview",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons size={24} name="grid-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons size={24} name="receipt-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shopify-sync"
          options={{
            title: "Shopify Sync",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons size={24} name="sync-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            title: "Customers",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons size={24} name="people-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: "Support",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={24}
                name="chatbox-ellipses-outline"
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen name="banner-editor" options={{ href: null }} />
        <Tabs.Screen name="alerts" options={{ href: null }} />
        <Tabs.Screen name="inbox" options={{ href: null }} />
        <Tabs.Screen name="export" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="scheduled" options={{ href: null }} />
        <Tabs.Screen name="customer-profile" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="brands" options={{ href: null }} />
        <Tabs.Screen name="blacklist" options={{ href: null }} />
        <Tabs.Screen name="blacklist/[id]" options={{ href: null }} />
        <Tabs.Screen name="orders/[id]" options={{ href: null }} />
        <Tabs.Screen name="returns" options={{ href: null }} />
        <Tabs.Screen name="return-request/[id]" options={{ href: null }} />
        <Tabs.Screen name="shopify-sync/history" options={{ href: null }} />
        <Tabs.Screen
          name="shopify-sync/webhook/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen name="restock-requests" options={{ href: null }} />
        <Tabs.Screen name="support/[id]" options={{ href: null }} />
        <Tabs.Screen name="staff-access" options={{ href: null }} />
      </Tabs>
    </AdminRouteGate>
  );
}
