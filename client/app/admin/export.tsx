import { useAdminContentStore } from "@/stores/adminContentStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { BrandLogo } from "@/components/BrandLogo";

const exportColumns = [
  "SKU",
  "Product Title",
  "Category",
  "Size Matrix",
  "Available Stock",
  "Warehouse Location",
  "Restock ETA",
];

export default function AdminExportScreen() {
  const router = useRouter();
  const {  isDark  } = useThemeStore();
  const {  exportHistory, generateInventoryExport  } = useAdminContentStore();
  const [statusMessage, setStatusMessage] = useState("");

  const handleExport = async () => {
    const generated = await generateInventoryExport();
    setStatusMessage(`${generated.fileName} generated and ready locally.`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Back to admin dashboard" onPress={() => router.navigate("/admin" as any)}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <View className="w-6" />
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            OPERATIONS EXPORT
          </Text>
          <Text className="mt-2 font-bold text-[42px] leading-[42px] text-black dark:text-white">
            Inventory Export
          </Text>
        </View>

        <View className="mt-7 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[18px] text-black">
              Manifest Overview
            </Text>
            <View className="mt-5 flex-row gap-4">
              <View className="flex-1 bg-[#eef1f4] px-4 py-4">
                <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                  READY EXPORTS
                </Text>
                <Text className="mt-3 font-bold text-[30px] text-black">
                  {exportHistory.length}
                </Text>
              </View>
              <View className="flex-1 bg-[#161c28] px-4 py-4">
                <Text className="font-bold text-[10px] tracking-[1.4px] text-white/40">
                  INVENTORY LINES
                </Text>
                <Text className="mt-3 font-bold text-[30px] text-white">
                  248
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-7 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[18px] text-black">
              Included Columns
            </Text>
            <View className="mt-5 gap-3">
              {exportColumns.map((column) => (
                <View key={column} className="flex-row items-center gap-3">
                  <View className="h-2 w-2 rounded-full bg-black" />
                  <Text className="font-normal text-[13px] text-neutral-600">
                    {column}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-7 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[18px] text-black">
              Export History
            </Text>
            <View className="mt-5 gap-4">
              {exportHistory.map((entry) => (
                <View key={entry.id} className="border border-[#eceff3] px-4 py-4">
                  <View className="flex-row items-center justify-between gap-4">
                    <View className="flex-1">
                      <Text className="font-bold text-[15px] text-black">
                        {entry.fileName}
                      </Text>
                      <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                        {entry.createdAt} | {entry.rowCount} rows
                      </Text>
                    </View>
                    <Text className="font-bold text-[10px] tracking-[1.3px] text-[#3ca168]">
                      {entry.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          {statusMessage ? (
            <Text className="mb-4 font-normal text-[12px] text-[#3c6a9e]">
              {statusMessage}
            </Text>
          ) : null}
          <Pressable accessibilityRole="button" onPress={handleExport} className="bg-[#161c28] py-4">
            <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
              GENERATE CSV EXPORT
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
