import { SkeletonBlock } from "@/components/loading/Skeleton";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AdminOrderDetailSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <View className="flex-row items-center justify-between border-b border-neutral-100 bg-white px-6 pb-4 pt-4 dark:border-white/5 dark:bg-[#0c0d0f]">
        <SkeletonBlock className="h-6 w-6 rounded-full" />
        <SkeletonBlock className="h-3 w-40 rounded-full" />
        <SkeletonBlock className="h-6 w-6 rounded-full" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mt-7 flex-row justify-between px-6">
          <View>
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="mt-3 h-8 w-40 rounded-lg" />
          </View>
          <View className="items-end">
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="mt-3 h-5 w-28 rounded-lg" />
          </View>
        </View>

        {[0, 1, 2].map((item) => (
          <View
            key={item}
            className="mx-6 mt-6 border border-neutral-100 bg-white p-5 dark:border-white/5 dark:bg-[#101215]"
          >
            <SkeletonBlock className="h-3 w-32 rounded-full" />
            <SkeletonBlock className="mt-5 h-7 w-3/4 rounded-lg" />
            <SkeletonBlock className="mt-4 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-full" />
            {item === 2 ? (
              <View className="mt-6 flex-row gap-3">
                <SkeletonBlock className="h-11 flex-1 rounded-lg" />
                <SkeletonBlock className="h-11 flex-1 rounded-lg" />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
