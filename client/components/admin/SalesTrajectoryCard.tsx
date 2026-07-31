import { AppText as Text } from "@/components/AppText";
import { useThemeStore } from "@/stores/themeStore";
import React, { memo, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export interface SalesTrajectoryPoint {
  label: string;
  value: number;
  orders: number;
}

interface SalesTrajectoryCardProps {
  data: SalesTrajectoryPoint[];
  previousTotal: number;
  view: "week" | "month";
  onChangeView: (view: "week" | "month") => void;
}

const formatMoney = (value: number, compact = false) => {
  if (compact && value >= 1_000_000) {
    return `NGN ${(value / 1_000_000).toFixed(1)}m`;
  }
  if (compact && value >= 1_000) {
    return `NGN ${(value / 1_000).toFixed(0)}k`;
  }
  return `NGN ${Math.round(value).toLocaleString("en-NG")}`;
};

const Stat = memo(function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Text className="text-[9px] font-bold tracking-[1.2px] text-neutral-400">
        {label}
      </Text>
      <Text
        preserveCase
        className="mt-1 text-[13px] font-bold text-black dark:text-white"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
});

export const SalesTrajectoryCard = memo(function SalesTrajectoryCard({
  data,
  previousTotal,
  view,
  onChangeView,
}: SalesTrajectoryCardProps) {
  const { isDark } = useThemeStore();
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

  useEffect(() => {
    setSelectedIndex(data.length - 1);
  }, [data.length, view]);

  const summary = useMemo(() => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const orders = data.reduce((sum, point) => sum + point.orders, 0);
    const average = orders > 0 ? total / orders : 0;
    const change =
      previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null;
    const max = Math.max(...data.map((point) => point.value), 0);
    return { total, orders, average, change, max };
  }, [data, previousTotal]);

  const selected = data[selectedIndex];
  const hasSales = summary.total > 0;

  return (
    <View className="bg-white px-5 py-6 dark:bg-[#101215]">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-[10px] font-bold tracking-[1.5px] text-neutral-400">
            SALES PERFORMANCE
          </Text>
          <Text className="mt-2 text-[26px] font-bold text-black dark:text-white">
            Sales Trajectory
          </Text>
        </View>
        <View className="flex-row bg-[#f1f2f4] p-1 dark:bg-[#191c20]">
          {(["week", "month"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => onChangeView(option)}
              className={`px-3 py-2 ${
                view === option ? "bg-black dark:bg-white" : ""
              }`}
            >
              <Text
                className={`text-[9px] font-bold tracking-[1.2px] ${
                  view === option
                    ? "text-white dark:text-black"
                    : "text-neutral-400"
                }`}
              >
                {option.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-6">
        <Text
          preserveCase
          className="text-[28px] font-bold text-black dark:text-white"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatMoney(summary.total)}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <View
            className={`px-2 py-1 ${
              summary.change === null
                ? "bg-neutral-100 dark:bg-white/5"
                : summary.change >= 0
                  ? "bg-green-50 dark:bg-green-950"
                  : "bg-red-50 dark:bg-red-950"
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                summary.change === null
                  ? "text-neutral-400"
                  : summary.change >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {summary.change === null
                ? "NO PRIOR DATA"
                : `${summary.change >= 0 ? "+" : ""}${summary.change.toFixed(1)}%`}
            </Text>
          </View>
          <Text className="text-[10px] text-neutral-400">
            vs previous comparable period
          </Text>
        </View>
      </View>

      <View className="mt-6 flex-row gap-2">
        <Stat label="ORDERS" value={String(summary.orders)} />
        <Stat label="AVG. ORDER" value={formatMoney(summary.average, true)} />
        <Stat
          label="BEST PERIOD"
          value={
            summary.max > 0
              ? data.find((point) => point.value === summary.max)?.label ?? "—"
              : "—"
          }
        />
      </View>

      {hasSales ? (
        <>
          <View className="mt-7 min-h-[52px] border-l-2 border-black bg-[#f5f6f7] px-4 py-3 dark:border-white dark:bg-[#171a1e]">
            <Text className="text-[9px] font-bold tracking-[1.2px] text-neutral-400">
              {selected?.label ?? "PERIOD"}
            </Text>
            <View className="mt-1 flex-row items-end justify-between gap-3">
              <Text
                preserveCase
                className="flex-1 text-[16px] font-bold text-black dark:text-white"
                numberOfLines={1}
              >
                {formatMoney(selected?.value ?? 0)}
              </Text>
              <Text className="text-[10px] font-bold text-neutral-500">
                {selected?.orders ?? 0} ORDERS
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            <View pointerEvents="none" style={[styles.gridLine, styles.gridTop]} />
            <View pointerEvents="none" style={[styles.gridLine, styles.gridMiddle]} />
            <View pointerEvents="none" style={[styles.gridLine, styles.gridBottom]} />
            {data.map((point, index) => {
              const selectedBar = index === selectedIndex;
              const height =
                point.value === 0
                  ? 4
                  : Math.max(12, Math.round((point.value / summary.max) * 112));
              return (
                <Pressable
                  key={`${point.label}-${index}`}
                  onPress={() => setSelectedIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${point.label}, ${formatMoney(point.value)}, ${point.orders} orders`}
                  style={styles.barColumn}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: selectedBar
                          ? isDark
                            ? "#ffffff"
                            : "#111111"
                          : isDark
                            ? "#343940"
                            : "#dfe2e6",
                      },
                    ]}
                  />
                  <Text
                    className={`mt-3 text-[9px] font-bold tracking-[1px] ${
                      selectedBar
                        ? "text-black dark:text-white"
                        : "text-neutral-400"
                    }`}
                  >
                    {point.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <View className="mt-7 border border-dashed border-neutral-200 px-5 py-9 dark:border-white/10">
          <Text className="text-[17px] font-bold text-black dark:text-white">
            No sales in this period
          </Text>
          <Text className="mt-2 text-[11px] leading-5 text-neutral-400">
            The chart will populate when paid, non-cancelled orders are recorded.
            Try the other date range for historical activity.
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    minWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d7d9dc",
    paddingTop: 12,
  },
  chart: {
    height: 170,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#c8ccd1",
    opacity: 0.35,
  },
  gridTop: { top: 12 },
  gridMiddle: { top: 67 },
  gridBottom: { top: 122 },
  barColumn: {
    zIndex: 1,
    height: 155,
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "48%",
    maxWidth: 28,
    minWidth: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
