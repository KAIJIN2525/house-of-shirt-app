import { formatPrice } from "@/constants";
import { Product } from "@/constants/products";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import "../global.css";

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
  const router = useRouter();

  if (products.length === 0) {
    return (
      <View className="py-20 items-center justify-center">
        <Ionicons name="search-outline" size={48} color="#666" />
        <Text className="font-futura-demi text-slate-900 mt-4">
          No products found
        </Text>
        <Text className="font-futura text-gray-500 text-sm mt-2">
          Try adjusting your filters
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {products.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(`/product/${item.id}` as any)}
          style={{ width: "48%" }}
          className="overflow-hidden mb-4"
        >
          <Image
            source={{ uri: item.image }}
            className="w-full h-60"
            resizeMode="cover"
          />
          <View className="p-3">
            <Text className="text-xs text-gray-500 uppercase font-futura">
              {item.brand}
            </Text>
            <Text className="font-futura-medium text-sm mt-1" numberOfLines={2}>
              {item.name}
            </Text>

            <Text className="mt-2 font-futura-demi text-base">
              {formatPrice(item.price)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default ProductGrid;
