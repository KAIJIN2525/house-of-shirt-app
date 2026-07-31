import { formatPrice } from "@/constants";
import { useProductsStore } from "@/stores/productsStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import "../global.css";

const TrendingProducts = () => {
  const router = useRouter();
  const {  products  } = useProductsStore();

  // Get top rated products as trending
  const trendingProducts = products.filter((p) => p.rating >= 4.5).slice(0, 6);

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4 px-4">
        <Text className="font-bold text-xl text-slate-900 dark:text-white">
          Trending Now
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/shop" as any)} accessibilityRole="button" accessibilityLabel="See all trending products">
          <Text className="font-medium text-slate-600 dark:text-neutral-400 text-sm">
            See All →
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={trendingProducts}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/product/${item.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={`${item.brand ?? "House of Shirts"}, ${item.name}, ${formatPrice(item.price)}, rated ${item.rating} out of 5`}
            accessibilityHint="Opens product details"
            className="bg-white dark:bg-transparent rounded-xl overflow-hidden"
            style={{ width: 160 }}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 160, height: 180 }}
              resizeMode="cover"
              accessible={false}
            />
            <View className="p-3 dark:bg-transparent">
              <Text className="text-xs text-gray-500 uppercase font-normal">
                {item.brand?.toUpperCase()}
              </Text>
              <Text
                className="font-medium text-xs mt-1 text-black dark:text-white"
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <View className="flex-row items-center justify-between mt-2">
                <Text className="font-semibold text-slate-900 dark:text-white">
                  {formatPrice(item.price)}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={12} color="#fbbf24" />
                  <Text className="font-normal text-xs text-gray-600 dark:text-neutral-400 ml-1">
                    {item.rating}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

export default TrendingProducts;
