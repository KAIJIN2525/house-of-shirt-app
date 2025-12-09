import { formatPrice } from "@/constants";
import { Product, products } from "@/constants/products";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const CATEGORIES = [
  { id: "1", name: "All Items", icon: "apps" },
  { id: "2", name: "T-Shirts", icon: "shirt-outline" },
  { id: "3", name: "Hoodies", icon: "fitness-outline" },
  { id: "4", name: "Long Sleeve", icon: "shirt-outline" },
  { id: "5", name: "Sweatshirts", icon: "fitness-outline" },
  { id: "6", name: "Accessories", icon: "watch-outline" },
];

const Shop = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedCategory, setSelectedCategory] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Handle category filter from params
  React.useEffect(() => {
    if (params.category) {
      const category = CATEGORIES.find(
        (c) =>
          c.name.toLowerCase() === (params.category as string).toLowerCase()
      );
      if (category) {
        setSelectedCategory(category.id);
      }
    }
  }, [params.category]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "1") {
      const categoryName = CATEGORIES.find(
        (c) => c.id === selectedCategory
      )?.name;
      filtered = filtered.filter((p) => p.category === categoryName);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, searchTerm]);

  const renderHeader = useCallback(
    () => (
      <>
        {/* Search Bar */}
        <View className="flex-row items-center gap-2 mb-4">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-4 h-12">
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search products..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 font-futura text-slate-900"
            />
          </View>

          <Pressable
            className="bg-slate-900 h-12 w-12 rounded-lg items-center justify-center"
            onPress={() => {}}
          >
            <Ionicons name="options-outline" size={22} color="white" />
          </Pressable>

          <Pressable
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="bg-gray-100 h-12 w-12 rounded-lg items-center justify-center"
          >
            <Ionicons
              name={viewMode === "grid" ? "grid-outline" : "list-outline"}
              size={22}
              color="#0f172a"
            />
          </Pressable>
        </View>

        {/* Categories */}
        <View className="mb-4">
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                className={`flex-row items-center px-4 py-2.5 rounded-full ${
                  selectedCategory === item.id ? "bg-slate-900" : "bg-gray-100"
                }`}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={selectedCategory === item.id ? "white" : "#475569"}
                />
                <Text
                  className={`ml-2 text-sm font-futura-medium ${
                    selectedCategory === item.id
                      ? "text-white"
                      : "text-slate-700"
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {/* Results Count */}
        <Text className="font-futura text-gray-600 text-sm mb-4">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"} found
        </Text>
      </>
    ),
    [searchTerm, selectedCategory, filteredProducts.length, viewMode]
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      if (viewMode === "list") {
        return (
          <Pressable
            onPress={() => router.push(`/product/${item.id}` as any)}
            className="flex-row bg-white rounded-xl overflow-hidden mb-3 border border-gray-200"
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 120, height: 120 }}
              resizeMode="cover"
            />
            <View className="flex-1 p-4">
              <Text className="text-xs text-gray-500 uppercase font-futura">
                {item.brand}
              </Text>
              <Text
                className="font-futura-medium text-base mt-1"
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <View className="flex-row items-center mt-2">
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text className="font-futura text-sm text-gray-600 ml-1">
                  {item.rating}
                </Text>
              </View>
              <Text className="mt-2 font-futura-demi text-lg text-slate-900">
                {formatPrice(item.price)}
              </Text>
            </View>
          </Pressable>
        );
      }

      return (
        <Pressable
          onPress={() => router.push(`/product/${item.id}` as any)}
          className="flex-1 overflow-hidden mb-3"
        >
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: 200 }}
            resizeMode="cover"
          />
          <View className="p-3">
            <Text className="text-xs text-gray-500 uppercase font-futura">
              {item.brand}
            </Text>
            <Text className="font-futura-medium text-sm mt-1" numberOfLines={2}>
              {item.name}
            </Text>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="font-futura-demi text-base text-slate-900">
                {formatPrice(item.price)}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [router, viewMode]
  );

  const renderEmpty = useCallback(
    () => (
      <View className="py-20 items-center justify-center">
        <Ionicons name="search-outline" size={64} color="#cbd5e1" />
        <Text className="font-futura-demi text-lg text-slate-900 mt-4">
          No products found
        </Text>
        <Text className="font-futura text-gray-500 text-sm mt-2 text-center">
          Try adjusting your search or filters
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 border-b border-gray-200">
        <Text className="font-futura-bold text-2xl text-slate-900">Shop</Text>
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 20,
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        columnWrapperStyle={viewMode === "grid" ? { gap: 12 } : undefined}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
      />
    </SafeAreaView>
  );
};

export default Shop;
