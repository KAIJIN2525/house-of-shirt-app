import { AppText as Text } from "@/components/AppText";
import type { ManagedMediaAsset } from "@/services/managed-content";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/stores/themeStore";
import { Image } from "expo-image";
import React, { memo } from "react";
import { FlatList, Pressable, View } from "react-native";

interface ManagedMediaLibraryProps {
  assets: ManagedMediaAsset[];
  allowedTypes: ("image" | "video")[];
  selectedUrl?: string;
  onSelect: (asset: ManagedMediaAsset) => void;
  emptyMessage?: string;
}

const MediaTile = memo(function MediaTile({
  asset,
  selected,
  onPress,
}: {
  asset: ManagedMediaAsset;
  selected: boolean;
  onPress: () => void;
}) {
  const { isDark } = useThemeStore();
  return (
    <Pressable accessibilityRole="button"
      onPress={onPress}
      className={`mr-3 w-28 overflow-hidden border ${
        selected
          ? "border-black dark:border-white"
          : "border-neutral-200 dark:border-white/10"
      }`}
    >
      <View className="h-24 bg-neutral-100 dark:bg-[#17191d]">
        {asset.mediaType === "image" ? (
          <Image
            source={{ uri: asset.publicUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-[#17191d]">
            <Ionicons name="play-circle-outline" size={30} color="#ffffff" />
          </View>
        )}
        {selected ? (
          <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-black dark:bg-white">
            <Ionicons
              name="checkmark"
              size={14}
              color={isDark ? "#111111" : "#ffffff"}
            />
          </View>
        ) : null}
      </View>
      <View className="bg-white px-2 py-2 dark:bg-[#101215]">
        <Text
          preserveCase
          className="text-[9px] font-bold text-black dark:text-white"
          numberOfLines={1}
        >
          {asset.originalFilename || asset.folder}
        </Text>
        <Text className="mt-1 text-[8px] font-bold tracking-[1px] text-neutral-400">
          {asset.mediaType.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
});

export const ManagedMediaLibrary = memo(function ManagedMediaLibrary({
  assets,
  allowedTypes,
  selectedUrl,
  onSelect,
  emptyMessage = "Upload media to start your reusable library.",
}: ManagedMediaLibraryProps) {
  const visible = assets.filter((asset) => allowedTypes.includes(asset.mediaType));

  return (
    <View className="mt-5 border-t border-neutral-200 pt-5 dark:border-white/10">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[10px] font-bold tracking-[1.5px] text-black dark:text-white">
          MEDIA LIBRARY
        </Text>
        <Text className="text-[9px] font-bold text-neutral-400">
          {visible.length} ASSETS
        </Text>
      </View>
      {visible.length > 0 ? (
        <FlatList
          horizontal
          data={visible}
          keyExtractor={(asset) => asset.id}
          renderItem={({ item }) => (
            <MediaTile
              asset={item}
              selected={item.publicUrl === selectedUrl}
              onPress={() => onSelect(item)}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View className="border border-dashed border-neutral-200 px-4 py-5 dark:border-white/10">
          <Text
            preserveCase
            className="text-[10px] leading-5 text-neutral-400"
          >
            {emptyMessage}
          </Text>
        </View>
      )}
    </View>
  );
});
