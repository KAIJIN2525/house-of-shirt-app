import { useAdminContentStore } from "@/stores/adminContentStore";
import { useAdminAlertsStore } from "@/stores/adminAlertsStore";
import { useOrdersStore } from "@/stores/ordersStore";
import { useThemeStore } from "@/stores/themeStore";
import { useProductsStore } from "@/stores/productsStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";
import { SalesTrajectoryCard } from "@/components/admin/SalesTrajectoryCard";
import { AdminArrivalFollowUpCard } from "@/components/admin/AdminArrivalFollowUpCard";
import { AdminQuickActionsGrid } from "@/components/admin/AdminQuickActionsGrid";

const quickActions = [
  {
    id: "inbox",
    label: "Admin Inbox",
    icon: "notifications-outline",
    route: "/admin/inbox",
  },
  {
    id: "0",
    label: "Customers",
    icon: "people-outline",
    route: "/admin/customers",
  },
  {
    id: "0b",
    label: "Blacklist",
    icon: "ban-outline",
    route: "/admin/blacklist",
  },
  {
    id: "1",
    label: "Operations Alerts",
    icon: "alert-circle-outline",
    route: "/admin/alerts",
  },
  {
    id: "2",
    label: "Support Desk",
    icon: "chatbox-ellipses-outline",
    route: "/admin/support",
  },
  {
    id: "3",
    label: "Send Notification",
    icon: "notifications-outline",
    route: "/admin/notifications",
  },
  {
    id: "4",
    label: "Returns",
    icon: "repeat-outline",
    route: "/admin/returns",
  },
  {
    id: "5",
    label: "Shopify Sync",
    icon: "cloud-outline",
    route: "/admin/shopify-sync",
  },
  {
    id: "5b",
    label: "Restock Requests",
    icon: "cube-outline",
    route: "/admin/restock-requests",
  },
  {
    id: "6",
    label: "Change Hero Banner",
    icon: "image-outline",
    route: "/admin/banner-editor",
  },
  {
    id: "7",
    label: "Export Inventory CSV",
    icon: "download-outline",
    route: "/admin/export",
  },
  {
    id: "8",
    label: "Manage Brands",
    icon: "grid-outline",
    route: "/admin/brands",
  },
  {
    id: "9",
    label: "Staff Access",
    icon: "person-add-outline",
    route: "/admin/staff-access",
  },
];

export default function AdminScreen() {
  const router = useRouter();
  const { banner, exportHistory } = useAdminContentStore();
  const { alerts: adminAlerts, fetchAlerts } = useAdminAlertsStore();
  const unreadAdminAlerts = adminAlerts.filter((alert) => !alert.read).length;
  const readyExports = exportHistory.filter(
    (record) => record.status === "Ready",
  );
  const { isDark } = useThemeStore();
  const {
    orders,
    fetchOrders,
    arrivalAttentionOrders,
    blacklistedOrderAlerts,
    acknowledgeArrivalAlert,
    resolveArrivalAlert,
  } = useOrdersStore();
  const { products, fetchProducts } = useProductsStore();
  const [salesView, setSalesView] = React.useState<"week" | "month">("month");

  const safeUpper = (value?: string) => (value ?? "UNKNOWN").toUpperCase();

  useEffect(() => {
    void Promise.all([fetchOrders(), fetchAlerts()]);
  }, [fetchAlerts, fetchOrders]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Use the last 30 days of non-cancelled demand so this reflects current buying behavior.
  const recentSellableOrders = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return orders.filter((order) => {
      const status = order.status.toLowerCase();
      const placedAt = new Date(order.placedOn).getTime();
      return (
        !status.includes("cancel") &&
        !status.includes("refund") &&
        !Number.isNaN(placedAt) &&
        placedAt >= cutoff
      );
    });
  }, [orders]);

  const bestSellingSizes = useMemo(() => {
    const counts: Record<string, number> = {};
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
    recentSellableOrders.forEach((order) =>
      order.lineItems?.forEach((item) => {
        const tokens = String(item.variantTitle || "")
          .toUpperCase()
          .replace(/SIZE\s*[:\-]?/g, " ")
          .split(/[\/|,\-\s]+/)
          .filter(Boolean);
        const foundSize = tokens.find((token) => sizeOrder.includes(token));
        if (foundSize)
          counts[foundSize] = (counts[foundSize] || 0) + item.quantity;
      }),
    );
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return Object.entries(counts)
      .map(([size, count]) => ({
        size,
        count,
        percentage: `${Math.round((count / total) * 100)}%`,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 3);
  }, [recentSellableOrders]);

  const variantSales = useMemo(() => {
    const sales = new Map<string, number>();
    recentSellableOrders.forEach((order) =>
      order.lineItems?.forEach((item) => {
        const productName = item.title.trim().toLowerCase();
        const variant = String(item.variantTitle || "").toUpperCase();
        products.forEach((product) =>
          product.sizeOptions?.forEach((option) => {
            if (
              product.name.trim().toLowerCase() === productName &&
              variant.includes(option.value.toUpperCase())
            ) {
              const key = `${product.id}:${option.value}`;
              sales.set(key, (sales.get(key) ?? 0) + item.quantity);
            }
          }),
        );
      }),
    );
    return sales;
  }, [products, recentSellableOrders]);

  // Dynamically compute low stock monitor alerts from actual products and sizes
  const lowStockAlerts = useMemo(() => {
    const alerts: {
      title: string;
      subtitle: string;
      level: "Critical" | "Low";
      score: number;
    }[] = [];
    products.forEach((product) =>
      product.sizeOptions?.forEach((option) => {
        if (option.inventoryQuantity < 0 || option.inventoryQuantity > 3)
          return;
        const sold = variantSales.get(`${product.id}:${option.value}`) ?? 0;
        const daysLeft =
          sold > 0
            ? Math.max(0, Math.round(option.inventoryQuantity / (sold / 30)))
            : null;
        alerts.push({
          title: `Size ${option.value} (${product.name})`,
          subtitle:
            option.inventoryQuantity === 0
              ? `Out · ${sold} sold / 30d`
              : `${option.inventoryQuantity} left${daysLeft !== null ? ` · ~${daysLeft}d` : ""}`,
          level: option.inventoryQuantity <= 1 ? "Critical" : "Low",
          score:
            (option.inventoryQuantity === 0
              ? 1000
              : 100 - option.inventoryQuantity * 10) + sold,
        });
      }),
    );
    return alerts.sort((left, right) => right.score - left.score).slice(0, 3);
  }, [products, variantSales]);

  const [pendingRestocksCount, setPendingRestocksCount] = React.useState(0);
  const [topRestockDemand, setTopRestockDemand] = React.useState("");

  useEffect(() => {
    const fetchRestockCount = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, count, error } = await supabase
          .from("back_in_stock_requests")
          .select("product_title, size", { count: "exact" })
          .eq("status", "pending");
        if (!error && count !== null) {
          setPendingRestocksCount(count);
          const grouped = new Map<string, number>();
          (data ?? []).forEach((request: any) => {
            const key = `${request.product_title} · ${request.size}`;
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
          });
          const top = [...grouped.entries()].sort(
            (left, right) => right[1] - left[1],
          )[0];
          setTopRestockDemand(top ? `${top[0]} · ${top[1]} waiting` : "");
        }
      } catch (err) {
        console.error("Failed to fetch pending restocks count", err);
      }
    };
    void fetchRestockCount();
  }, []);

  const recentOrders = useMemo(
    () =>
      orders.slice(0, 3).map((order) => ({
        id: `#${order.id}`,
        customer: order.customerName,
        product: order.title,
        status: safeUpper(order.status),
        statusColor: order.status.toLowerCase().includes("deliver")
          ? "text-[#2c8b59]"
          : order.status.toLowerCase().includes("transit") ||
              order.status.toLowerCase().includes("shipped")
            ? "text-[#3868d7]"
            : "text-[#d96a32]",
      })),
    [orders],
  );
  const bannerPreviewSource = banner.imageUri
    ? { uri: banner.imageUri }
    : require("../../assets/images/img1.jpeg");

  // Aggregate real order totals into a week (last 7 days) or month (last 8 months) view
  const salesChartData = useMemo(() => {
    const now = new Date();

    if (salesView === "week") {
      const days: { label: string; date: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        days.push({
          label: date
            .toLocaleDateString("en-US", { weekday: "short" })
            .toUpperCase(),
          date,
        });
      }
      return days.map(({ label, date }) => {
        const matching = orders.filter((order) => {
          const status = order.status.toLowerCase();
          const orderDate = new Date(order.placedOn);
          return (
            !status.includes("cancel") &&
            !status.includes("refund") &&
            !Number.isNaN(orderDate.getTime()) &&
            orderDate.toDateString() === date.toDateString()
          );
        });
        return {
          label,
          value: matching.reduce((sum, order) => sum + order.total, 0),
          orders: matching.length,
        };
      });
    }

    const months: { label: string; year: number; monthIndex: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date
          .toLocaleDateString("en-US", { month: "short" })
          .toUpperCase(),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      });
    }
    return months.map(({ label, year, monthIndex }) => {
      const matching = orders.filter((order) => {
        const status = order.status.toLowerCase();
        const orderDate = new Date(order.placedOn);
        return (
          !status.includes("cancel") &&
          !status.includes("refund") &&
          !Number.isNaN(orderDate.getTime()) &&
          orderDate.getFullYear() === year &&
          orderDate.getMonth() === monthIndex
        );
      });
      return {
        label,
        value: matching.reduce((sum, order) => sum + order.total, 0),
        orders: matching.length,
      };
    });
  }, [orders, salesView]);

  const previousSalesTotal = useMemo(() => {
    const now = new Date();
    const currentStart =
      salesView === "week"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
        : new Date(now.getFullYear(), now.getMonth() - 7, 1);
    const periodDays =
      salesView === "week"
        ? 7
        : Math.max(
            1,
            Math.ceil((now.getTime() - currentStart.getTime()) / 86400000),
          );
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - periodDays);
    return orders.reduce((sum, order) => {
      const status = order.status.toLowerCase();
      const placedAt = new Date(order.placedOn).getTime();
      if (
        status.includes("cancel") ||
        status.includes("refund") ||
        Number.isNaN(placedAt)
      )
        return sum;
      return placedAt >= previousStart.getTime() &&
        placedAt < currentStart.getTime()
        ? sum + order.total
        : sum;
    }, 0);
  }, [orders, salesView]);

  const revenueSummary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const previousStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).getTime();
    let current = 0;
    let previous = 0;
    orders.forEach((order) => {
      const status = order.status.toLowerCase();
      if (status.includes("cancel") || status.includes("refund")) return;
      const placedAt = new Date(order.placedOn).getTime();
      if (Number.isNaN(placedAt)) return;
      if (placedAt >= monthStart) current += order.total;
      else if (placedAt >= previousStart) previous += order.total;
    });
    const change =
      previous > 0 ? ((current - previous) / previous) * 100 : null;
    return { current, change };
  }, [orders]);
  const formatNaira = (value: number) =>
    `NGN ${Math.round(value).toLocaleString("en-NG")}`;
  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="relative flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons
              name="close"
              size={18}
              color={isDark ? "#f8fafc" : "#111111"}
            />
          </Pressable>

          <BrandLogo
            width={154}
            height={28}
            style={{
              position: "absolute",
              left: "50%",
              transform: [{ translateX: -77 }],
            }}
          />

          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => router.push("/admin/inbox" as any)}
              className="relative"
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={isDark ? "#f8fafc" : "#111111"}
              />
              {unreadAdminAlerts > 0 ? (
                <View className="absolute -right-2 -top-2 min-w-[16px] rounded-full bg-red-500 px-1">
                  <Text className="text-center text-[8px] font-bold text-white">
                    {Math.min(unreadAdminAlerts, 99)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => router.push("/admin/settings" as any)}>
              <Ionicons
                name="settings-outline"
                size={18}
                color={isDark ? "#f8fafc" : "#111111"}
              />
            </Pressable>
          </View>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            SYSTEM STATUS: SYNCED
          </Text>
          <Text className="mt-2 font-bold text-[42px] leading-[42px] text-black dark:text-white">
            Atelier Overview
          </Text>
          <Text className="mt-3 font-normal text-[14px] leading-6 text-neutral-400">
            Real-time performance metrics and workshop operations for the
            current seasonal cycle.
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="gap-4">
            <View className="bg-white px-5 py-6 dark:bg-[#101215]">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-300">
                TOTAL REVENUE
              </Text>
              <Text className="mt-4 font-bold text-[42px] leading-[40px] text-black dark:text-white">
                {formatNaira(revenueSummary.current)}
              </Text>
              <View className="mt-4 flex-row items-center gap-2">
                <Text
                  className={`font-bold text-[11px] ${revenueSummary.change !== null && revenueSummary.change < 0 ? "text-red-500" : "text-[#4aa972]"}`}
                >
                  {revenueSummary.change === null
                    ? "—"
                    : `${revenueSummary.change >= 0 ? "+" : ""}${revenueSummary.change.toFixed(1)}%`}
                </Text>
                <Text className="font-normal text-[11px] text-neutral-400">
                  vs last month
                </Text>
              </View>
            </View>

            <View className="bg-[#eceff3] px-5 py-6 dark:bg-[#16191d]">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-300">
                DELIVERY FOLLOW-UPS
              </Text>
              <Text className="mt-4 font-bold text-[42px] leading-[40px] text-black dark:text-white">
                {arrivalAttentionOrders.length}
              </Text>
              <View className="mt-4 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="font-normal text-[11px] text-neutral-500">
                  GIGL + pay-on-delivery arrivals needing outreach
                </Text>
              </View>
            </View>

            <View className="bg-[#1f2736] px-5 py-6">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-white/30">
                EXPORTS READY
              </Text>
              <Text className="mt-4 font-bold text-[42px] leading-[40px] text-white">
                {readyExports.length}
              </Text>
              <View className="mt-4 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-white" />
                <Text className="font-normal text-[11px] text-white/60">
                  {readyExports.length > 0
                    ? "Latest manifest ready for download"
                    : "No completed exports"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Premium Size & Stock Analytics Suite */}
        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6 dark:bg-[#101215]">
            <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 mb-4 uppercase">
              Size & Stock Analytics
            </Text>

            <View className="gap-5">
              {/* Best-selling Sizes */}
              <View>
                <Text className="font-bold text-xs text-neutral-500 mb-2 uppercase tracking-[0.8px]">
                  Best-Selling Sizes
                </Text>
                <View className="flex-row gap-2">
                  {bestSellingSizes.length === 0 ? (
                    <Text className="text-[11px] text-neutral-400">
                      No size sales recorded in the last 30 days.
                    </Text>
                  ) : (
                    bestSellingSizes.map((item, idx) => (
                      <View
                        key={item.size}
                        className={`flex-1 px-3 py-2 ${
                          idx === 0
                            ? "bg-black dark:bg-white"
                            : "bg-[#eff0f2] dark:bg-[#16191d]"
                        }`}
                      >
                        <Text
                          preserveCase
                          className={`text-center font-bold text-base uppercase ${
                            idx === 0
                              ? "text-white dark:text-black"
                              : "text-black dark:text-white"
                          }`}
                        >
                          {item.size}
                        </Text>
                        <Text
                          className={`text-center text-[9px] font-normal uppercase ${
                            idx === 0
                              ? "text-white/60 dark:text-black/60"
                              : "text-neutral-400"
                          }`}
                        >
                          {item.percentage} · {item.count} sold
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* Low Stock Alerts */}
              <View className="border-t border-gray-100 pt-4 dark:border-white/5">
                <Text className="font-bold text-xs text-neutral-500 mb-2 uppercase tracking-[0.8px]">
                  Low Stock Monitor
                </Text>
                <View className="gap-2">
                  {lowStockAlerts.length === 0 ? (
                    <View className="flex-row justify-between items-center bg-[#f5fcf5] px-4 py-2 border-l-2 border-green-500 dark:bg-[#121812]">
                      <Text className="font-bold text-[11px] text-green-600 dark:text-green-400 uppercase">
                        All Sizes & Product Items
                      </Text>
                      <Text className="font-bold text-[10px] text-green-600 dark:text-green-400 uppercase">
                        Inventory Healthy
                      </Text>
                    </View>
                  ) : (
                    lowStockAlerts.map((alert) => (
                      <View
                        key={alert.title}
                        className={`flex-row justify-between items-center px-4 py-2 border-l-2 ${
                          alert.level === "Critical"
                            ? "bg-[#fcf5f5] border-red-500 dark:bg-[#181212]"
                            : "bg-[#fcfbf5] border-amber-500 dark:bg-[#181712]"
                        }`}
                      >
                        <Text
                          className={`font-bold text-[11px] uppercase flex-1 mr-2 ${
                            alert.level === "Critical"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                          numberOfLines={1}
                        >
                          {alert.title}
                        </Text>
                        <Text
                          className={`font-bold text-[10px] uppercase ${
                            alert.level === "Critical"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {alert.subtitle}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* Restock Demand Tracker */}
              <Pressable
                onPress={() => router.push("/admin/restock-requests" as any)}
                className="flex-row justify-between items-center border-t border-gray-100 pt-4 dark:border-white/5"
              >
                <View>
                  <Text className="font-bold text-xs text-neutral-500 uppercase tracking-[0.8px]">
                    Restock Demand
                  </Text>
                  <Text className="mt-1 text-[22px] font-bold text-black dark:text-white">
                    {String(pendingRestocksCount).padStart(2, "0")} Pending
                    Requests
                  </Text>
                  {topRestockDemand ? (
                    <Text
                      preserveCase
                      className="mt-1 max-w-[260px] text-[10px] text-neutral-400"
                      numberOfLines={1}
                    >
                      {topRestockDemand}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isDark ? "#fff" : "#000"}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <SalesTrajectoryCard
            data={salesChartData}
            previousTotal={previousSalesTotal}
            view={salesView}
            onChangeView={setSalesView}
          />
        </View>
        <View className="mt-8 px-6">
          {blacklistedOrderAlerts.length > 0 ? (
            <Pressable
              onPress={() => router.push("/admin/blacklist" as any)}
              className="mb-4 flex-row items-center gap-4 border-l-[3px] border-red-500 bg-red-50 px-4 py-4 dark:bg-[#1a1212]"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={isDark ? "#f87171" : "#dc2626"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[9px] font-bold tracking-[1.3px] text-red-600 dark:text-red-400">
                  BLACKLIST RISK
                </Text>
                <Text className="mt-1 text-[14px] font-bold text-black dark:text-white">
                  {blacklistedOrderAlerts.length} restricted{" "}
                  {blacklistedOrderAlerts.length === 1 ? "order" : "orders"}{" "}
                  need review
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#ffffff" : "#111111"}
              />
            </Pressable>
          ) : null}
          <AdminArrivalFollowUpCard
            orders={arrivalAttentionOrders}
            onMarkContacted={(order) =>
              void acknowledgeArrivalAlert(
                order.id,
                `Admin marked follow-up contacted for ${order.status.toLowerCase()} order via ${order.carrier}.`,
              )
            }
            onResolve={(order) =>
              void resolveArrivalAlert(
                order.id,
                `Admin resolved alert after confirming customer pickup/payment for ${order.id}.`,
              )
            }
          />
        </View>
        <View className="mt-8 px-6">
          <AdminQuickActionsGrid
            actions={quickActions}
            badges={{
              inbox: unreadAdminAlerts,
              "5b": pendingRestocksCount,
              "1": arrivalAttentionOrders.length,
            }}
            onPress={(route) => router.navigate(route as any)}
          />
        </View>
        <View className="mt-8 px-6">
          <Pressable
            onPress={() => router.push("/admin/banner-editor" as any)}
            className="overflow-hidden bg-white dark:bg-[#101215]"
          >
            <Image
              source={bannerPreviewSource}
              className="h-72 w-full"
              resizeMode="cover"
            />
            <View className="px-4 py-4">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-300">
                {banner.isActive ? "CURRENT EDITORIAL" : "DRAFT EDITORIAL"}
              </Text>
              <Text className="mt-2 font-bold text-[18px] text-black dark:text-white">
                {banner.currentEditorialTitle}
              </Text>
              <Text className="mt-2 font-normal text-[12px] text-neutral-500">
                {banner.overlayLabel.toUpperCase()} |{" "}
                {banner.ctaText.toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="font-bold text-[24px] text-black dark:text-white">
                Recent Orders
              </Text>
              <Pressable
                onPress={() => router.navigate("/admin/orders" as any)}
              >
                <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                  View All Orders
                </Text>
              </Pressable>
            </View>

            <View className="border-b border-gray-100 pb-3">
              <View className="flex-row">
                <Text className="flex-1 font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                  ID
                </Text>
                <Text className="flex-[1.2] font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                  Customer
                </Text>
                <Text className="flex-[1.6] font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                  Product
                </Text>
                <Text className="flex-1 text-right font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                  Status
                </Text>
              </View>
            </View>

            {recentOrders.length > 0 ? (
              <View className="gap-4 pt-4">
                {recentOrders.map((order) => (
                  <View key={order.id} className="flex-row items-start">
                    <Text className="flex-1 font-normal text-[11px] leading-5 text-neutral-400">
                      {order.id}
                    </Text>
                    <Text className="flex-[1.2] font-bold text-[13px] leading-5 text-black">
                      {order.customer}
                    </Text>
                    <Text className="flex-[1.6] font-normal text-[12px] leading-5 text-neutral-500">
                      {order.product}
                    </Text>
                    <Text
                      className={`flex-1 text-right font-bold text-[10px] tracking-[1.2px] ${order.statusColor}`}
                    >
                      {order.status}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="pt-4">
                <Text className="font-normal text-[12px] leading-6 text-neutral-400">
                  No real orders have been loaded yet. Once orders exist in
                  Supabase, they will appear here automatically.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
