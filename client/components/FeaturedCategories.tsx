import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import "../global.css";

interface Category {
  id: string;
  name: string;
  image: string;
  filter: string;
}

const FEATURED_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    filter: "T-Shirts",
  },
  {
    id: "2",
    name: "Hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    filter: "Hoodies",
  },
  {
    id: "3",
    name: "New Arrivals",
    image: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=400",
    filter: "new",
  },
  {
    id: "4",
    name: "Sale",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    filter: "sale",
  },
];

const FeaturedCategories = () => {
  const router = useRouter();

  const handleCategoryPress = (filter: string) => {
    // Navigate to shop tab with filter parameter
    router.push({
      pathname: "/(tabs)/shop",
      params: { category: filter },
    } as any);
  };

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4 px-4">
        <Text className="font-bold text-xl text-slate-900">
          Shop by Category
        </Text>
      </View>

      <View className="flex-row flex-wrap px-4 gap-3">
        {FEATURED_CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => handleCategoryPress(category.filter)}
            className="rounded-2xl overflow-hidden"
            style={{ width: "48%", height: 140 }}
          >
            <Image
              source={{ uri: category.image }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30 justify-end p-4">
              <Text className="font-bold text-white text-lg">
                {category.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default FeaturedCategories;
