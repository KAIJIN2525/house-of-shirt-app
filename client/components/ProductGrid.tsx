import { formatPrice } from "@/constants";
import { Product } from "@/constants/products";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
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
        <Text className="font-semibold text-slate-900 dark:text-white mt-4">
          No products found
        </Text>
        <Text className="font-normal text-gray-500 dark:text-neutral-400 text-sm mt-2">
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
          accessibilityRole="button"
          accessibilityLabel={`${item.brand ?? "House of Shirts"}, ${item.name}, ${formatPrice(item.price)}`}
          accessibilityHint="Opens product details"
          style={{ width: "48%" }}
          className="overflow-hidden mb-4"
        >
          <Image
            source={{ uri: item.image }}
            className="w-full h-60"
            resizeMode="cover"
            accessible={false}
          />
          <View className="p-3">
            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-[1.5px]">
              {item.brand?.toUpperCase()}
            </Text>
            <Text className="font-medium text-xs mt-1 text-black dark:text-white" numberOfLines={2}>
              {item.name}
            </Text>

            <Text className="mt-2 font-semibold text-base text-black dark:text-white">
              {formatPrice(item.price)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default ProductGrid;
