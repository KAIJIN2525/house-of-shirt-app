import { formatPrice } from "@/constants";
import { Product } from "@/constants/products";
import { useAdminContentStore } from "@/stores/adminContentStore";
import { useProductsStore } from "@/stores/productsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, View } from "react-native";
import { AppText as Text } from "@/components/AppText";

import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const CATEGORIES = [
  {
    id: "1",
    name: "All Items",
    icon: "view-grid",
    type: "MaterialCommunityIcons",
  },
  {
    id: "2",
    name: "T-Shirts",
    icon: "tshirt-crew",
    type: "MaterialCommunityIcons",
  },
  { id: "3", name: "Hoodies", icon: "hanger", type: "MaterialCommunityIcons" },
  {
    id: "4",
    name: "Long Sleeve",
    icon: "tshirt-v",
    type: "MaterialCommunityIcons",
  },
  {
    id: "5",
    name: "Sweatshirts",
    icon: "hanger",
    type: "MaterialCommunityIcons",
  },
  {
    id: "6",
    name: "Accessories",
    icon: "glasses",
    type: "MaterialCommunityIcons",
  },
];

const ProductItem = React.memo(({ item, viewMode, onPress }: { item: Product, viewMode: 'grid' | 'list', onPress: () => void }) => {

  if (viewMode === "list") {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row bg-white dark:bg-[#101215] rounded-xl overflow-hidden mb-3 border border-gray-200 dark:border-white/10"
      >
        <Image
          source={{ uri: item.image }}
          style={{ width: 120, height: 120 }}
          resizeMode="cover"
        />
        <View className="flex-1 p-4">
          <Text className="text-[11px] text-gray-400 uppercase font-bold tracking-[1.5px]">
            {item.brand?.toUpperCase()}
          </Text>
          <Text
            className="font-bold text-base mt-1 text-black dark:text-white"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text className="mt-2 font-bold text-lg text-slate-900 dark:text-white">
            {formatPrice(item.price)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 overflow-hidden mb-6"
    >
      <View className="bg-gray-100 dark:bg-white/5 aspect-[3/4] overflow-hidden">
        <Image
          source={{ uri: item.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="mt-3">
        <Text className="text-[11px] text-gray-400 uppercase font-bold tracking-[1.5px]">
          {item.brand?.toUpperCase()}
        </Text>
        <Text
          className="font-bold text-sm mt-1 text-black dark:text-white"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="mt-1 font-bold text-sm text-slate-900 dark:text-white">
          {formatPrice(item.price)}
        </Text>
      </View>
    </Pressable>
  );
});
ProductItem.displayName = "ProductItem";

const Shop = () => {

  const router = useRouter();
  const params = useLocalSearchParams();
  const { products, fetchProducts, isLoading, getBestSellingProducts } = useProductsStore();
  const { brands: collectiveBrands } = useAdminContentStore();
  const { isDark } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);


  useEffect(() => {
    fetchProducts();
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("1");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Handle category filter from params
  useEffect(() => {
    if (params.category) {
      const category = CATEGORIES.find(
        (c) =>
          c.name.toLowerCase() === (params.category as string).toLowerCase(),
      );
      if (category) {
        setSelectedCategory(category.id);
      }
    } else {
      setSelectedCategory("1"); // Reset to 'All Items'
    }
  }, [params.category]);

  useEffect(() => {
    if (params.brand) {
      setSelectedBrand(params.brand as string);
    } else {
      setSelectedBrand("All Brands"); // Reset to 'All Brands'
    }
  }, [params.brand]);

  const brands = useMemo(() => {
    const productBrands = products.map((p) => p.brand);
    const collectiveNames = collectiveBrands.map((b) => b.name);
    const combined = Array.from(
      new Set([...collectiveNames, ...productBrands]),
    );
    return ["All Brands", ...combined.sort()];
  }, [products, collectiveBrands]);



  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "1") {
      const categoryName = CATEGORIES.find(
        (c) => c.id === selectedCategory,
      )?.name;
      filtered = filtered.filter((p) => p.category === categoryName);
    }

    // Filter by brand
    if (selectedBrand && selectedBrand !== "All Brands") {
      filtered = filtered.filter((p) => p.brand?.trim().toLowerCase() === selectedBrand.trim().toLowerCase());
    }

    return filtered;
  }, [products, selectedCategory, selectedBrand]);

  const renderHeader = useCallback(
    () => (
      <>
        <View className="mb-8">
          <Text className="font-light text-[10px] tracking-[4px] text-gray-400 mb-2 uppercase">
            THE ATELIER
          </Text>
          <Text className="font-bold text-[32px] leading-[36px] text-black dark:text-white uppercase">
            Curated{"\n"}Selection
          </Text>
        </View>



        {/* Brand Filter */}
        <View className="mb-6">
          <Text className="font-bold text-[10px] tracking-[2.5px] text-gray-400 mb-4 uppercase">
            SELECT BRAND
          </Text>
          <FlatList
            data={brands}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedBrand(item);
                  // Optionally clean up router search params if they exist
                  router.setParams({ brand: "" });
                }}
                className={`px-6 py-3 border ${
                  selectedBrand.trim().toLowerCase() === item.trim().toLowerCase()
                    ? "bg-black border-black dark:bg-white dark:border-white"
                    : "bg-transparent border-gray-200 dark:border-white/10"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold tracking-[2px] ${
                    selectedBrand.trim().toLowerCase() === item.trim().toLowerCase()
                      ? "text-white dark:text-black"
                      : "text-gray-400"
                  }`}
                >
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {/* Categories */}
        <View className="mb-8">
          <Text className="font-bold text-[10px] tracking-[2.5px] text-gray-400 mb-4 uppercase">
            CATEGORY
          </Text>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                className={`flex-row items-center px-6 py-3 ${
                  selectedCategory === item.id
                    ? "bg-black dark:bg-white"
                    : "bg-gray-100 dark:bg-white/5"
                }`}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={
                    selectedCategory === item.id
                      ? isDark
                        ? "black"
                        : "white"
                      : "#94a3b8"
                  }
                />

                <Text
                  className={`ml-2 text-[10px] font-bold tracking-[1.5px] ${
                    selectedCategory === item.id
                      ? "text-white dark:text-black"
                      : "text-gray-400"
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="font-bold text-[10px] tracking-[2px] text-gray-400 uppercase">
              {filteredProducts.length} PIECES FOUND
            </Text>
          </View>

          <Pressable
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="h-10 w-10 items-center justify-center border border-gray-100 dark:border-white/10"
          >
            <Ionicons
              name={viewMode === "grid" ? "grid-outline" : "list-outline"}
              size={18}
              color={isDark ? "white" : "black"}
            />
          </Pressable>
        </View>
      </>
    ),
    [
      selectedBrand,
      selectedCategory,
      filteredProducts.length,
      viewMode,
      isDark,
      brands,
      router,
    ],
  );



  const renderEmpty = useCallback(
    () => (
      <View className="py-20 items-center justify-center">
        <Ionicons name="basket-outline" size={64} color="#cbd5e1" />
        <Text className="font-bold text-lg text-slate-900 dark:text-white mt-4 uppercase tracking-[2px]">
          Collection Empty
        </Text>
        <Text className="font-normal text-gray-500 text-sm mt-2 text-center px-10">
          Try adjusting your selection or check back later for new arrivals.
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      {/* Top Navigation */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-gray-100 dark:border-white/10">

        <Pressable onPress={() => router.push("/search" as any)}>
          <Ionicons
            name="search"
            size={16}
            color={isDark ? "#ffffff" : "#000"}
          />
        </Pressable>

        <View className="flex-row items-end gap-2">
          <Text className="font-bold text-[14px] tracking-[2.5px] text-black dark:text-white uppercase">
            Atelier Boutique
          </Text>
        </View>

        <Pressable onPress={() => router.push("/notifications" as any)}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={isDark ? "#ffffff" : "#000"}
          />
        </Pressable>
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#ffffff" : "#000000"}
          />
        }

        columnWrapperStyle={viewMode === "grid" ? { gap: 20 } : undefined}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductItem
            item={item}
            viewMode={viewMode}
            onPress={() => router.push(`/product/${item.id}` as any)}
          />
        )}
      />

    </SafeAreaView>
  );
};

export default Shop;
