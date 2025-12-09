import { formatPrice } from "@/constants";
import { products } from "@/constants/products";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import "../global.css";

const TrendingProducts = () => {
  const router = useRouter();

  // Get top rated products as trending
  const trendingProducts = products.filter((p) => p.rating >= 4.5).slice(0, 6);

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4 px-4">
        <Text className="font-futura-bold text-xl text-slate-900">
          Trending Now
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/shop" as any)}>
          <Text className="font-futura-medium text-slate-600 text-sm">
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
            className="bg-white rounded-xl overflow-hidden"
            style={{ width: 160 }}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 160, height: 180 }}
              resizeMode="cover"
            />
            <View className="p-3">
              <Text className="text-xs text-gray-500 uppercase font-futura">
                {item.brand}
              </Text>
              <Text
                className="font-futura-medium text-sm mt-1"
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <View className="flex-row items-center justify-between mt-2">
                <Text className="font-futura-demi text-slate-900">
                  {formatPrice(item.price)}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={12} color="#fbbf24" />
                  <Text className="font-futura text-xs text-gray-600 ml-1">
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
