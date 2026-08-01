import { formatPrice } from "@/constants";
import { Product } from "@/constants/products";
import {
  ALL_ITEMS_KEY,
  buildCategoryFilters,
  categoryKey,
} from "@/lib/catalogue";
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


const ProductItem = React.memo(({ item, viewMode, onPress }: { item: Product, viewMode: 'grid' | 'list', onPress: () => void }) => {

  if (viewMode === "list") {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.brand ?? "House of Shirts"}, ${item.name}, ${formatPrice(item.price)}`}
        accessibilityHint="Opens product details"
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
      accessibilityRole="button"
      accessibilityLabel={`${item.brand ?? "House of Shirts"}, ${item.name}, ${formatPrice(item.price)}`}
      accessibilityHint="Opens product details"
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
  const { products, fetchProducts, errorKind, errorMessage, isStale, isLoading } = useProductsStore();
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
  }, [fetchProducts]);

  const [selectedCategory, setSelectedCategory] = useState(ALL_ITEMS_KEY);
  const [selectedBrand, setSelectedBrand] = useState("All Brands");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // A link into the shop pre-selects a filter; the chips own it from then on.
  // These deliberately do not reset the selection when the param goes away,
  // because picking a chip clears the param -- resetting here would undo the
  // customer's own choice a render after they made it.
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(categoryKey(params.category as string));
    }
  }, [params.category]);

  useEffect(() => {
    if (params.brand) {
      setSelectedBrand(params.brand as string);
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

  /**
   * Built from the catalogue rather than a fixed list, so every chip is backed
   * by stock. A hardcoded rail silently returns "Collection Empty" whenever the
   * Shopify product types drift away from the labels it was written against.
   */
  const categories = useMemo(() => buildCategoryFilters(products), [products]);



  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== ALL_ITEMS_KEY) {
      filtered = filtered.filter(
        (p) => categoryKey(p.category) === selectedCategory,
      );
    }

    // Filter by brand
    if (selectedBrand && selectedBrand !== "All Brands") {
      filtered = filtered.filter((p) => p.brand?.trim().toLowerCase() === selectedBrand.trim().toLowerCase());
    }

    return filtered;
  }, [products, selectedCategory, selectedBrand]);

  // A memoised *element*, not a component. Passing FlatList a new function
  // identity for ListHeaderComponent makes it a new element type on every
  // render, so React tears the header down and rebuilds it -- which is what was
  // snapping the brand and category rails back to the start whenever a chip was
  // picked. An element reconciles in place and keeps their scroll offsets.
  const listHeader = useMemo(
    () => (
      <>
        {errorMessage ? (
          <View accessibilityRole="alert" className="mb-6 border border-amber-300 bg-amber-50 p-4 dark:border-amber-400/40 dark:bg-amber-950/30">
            <View className="flex-row items-start gap-3">
              <Ionicons name={errorKind === "offline" ? "cloud-offline-outline" : "time-outline"} size={20} color={isDark ? "#fbbf24" : "#92400e"} />
              <View className="flex-1">
                <Text className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  {isStale ? "Showing saved products" : "Catalogue unavailable"}
                </Text>
                <Text className="mt-1 text-sm text-amber-800 dark:text-amber-100/80">{errorMessage}</Text>
              </View>
              <Pressable
                onPress={() => void fetchProducts()}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Retry loading products"
                accessibilityState={{ disabled: isLoading, busy: isLoading }}
                className="min-h-11 justify-center px-2"
              >
                <Text className="font-bold text-xs uppercase text-amber-900 dark:text-amber-200">
                  {isLoading ? "Retrying" : "Retry"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
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
                accessibilityRole="button"
                accessibilityState={{ selected: selectedBrand.trim().toLowerCase() === item.trim().toLowerCase() }}
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
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedCategory(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCategory === item.key }}
                className={`flex-row items-center px-6 py-3 ${
                  selectedCategory === item.key
                    ? "bg-black dark:bg-white"
                    : "bg-gray-100 dark:bg-white/5"
                }`}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={
                    selectedCategory === item.key
                      ? isDark
                        ? "black"
                        : "white"
                      : "#94a3b8"
                  }
                />

                <Text
                  className={`ml-2 text-[10px] font-bold tracking-[1.5px] ${
                    selectedCategory === item.key
                      ? "text-white dark:text-black"
                      : "text-gray-400"
                  }`}
                >
                  {item.label}
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
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
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
      categories,
      router,
      errorKind,
      errorMessage,
      isStale,
      isLoading,
      fetchProducts,
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
          {errorMessage
            ? "Pull down or select Retry once your connection is available."
            : "Try adjusting your selection or check back later for new arrivals."}
        </Text>
      </View>
    ),
    [errorMessage],
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      {/* Top Navigation */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-gray-100 dark:border-white/10">

        <Pressable onPress={() => router.push("/search" as any)} accessibilityRole="button" accessibilityLabel="Search products">
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

        <Pressable onPress={() => router.push("/notifications" as any)} accessibilityRole="button" accessibilityLabel="Open notifications">
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
        ListHeaderComponent={listHeader}
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
