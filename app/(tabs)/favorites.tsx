import ProductGrid from "@/components/ProductGrid";
import { products } from "@/constants/products";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const Favorites = () => {
  const { favorites } = useFavorites();
  const router = useRouter();

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4">
        <Text className="font-futura-bold text-3xl text-slate-900">
          Wishlist
        </Text>
        <Text className="font-futura text-gray-500 mt-1">
          {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
        </Text>
      </View>

      <ScrollView
        className="flex-1 mt-6 px-4"
        showsVerticalScrollIndicator={false}
      >
        {favoriteProducts.length > 0 ? (
          <ProductGrid products={favoriteProducts} />
        ) : (
          <View>
            <Ionicons name="heart-outline" size={64} color="#cbd5e1" />
            <Text className="font-futura-demi text-xl text-slate-900 mt-6">
              No favorite items yet.
            </Text>
            <Text className="font-futura text-gray-500 text-center mt-2 px-8">
              Tap the heart icon on products you love to add them here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Favorites;
