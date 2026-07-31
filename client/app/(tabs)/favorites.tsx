import { AppText as Text } from "@/components/AppText";
import { BrandLogo } from "@/components/BrandLogo";
import { formatPrice } from "@/constants";
import type { Product } from "@/constants/products";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useProductsStore } from "@/stores/productsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const getProductImageSource = (image: Product["image"]) =>
  typeof image === "string" ? { uri: image } : image;

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
  <Text className="font-normal text-[11px] tracking-[2.4px] text-neutral-400 dark:text-neutral-500">
    {children}
  </Text>
);

const Favorites = () => {
  const { favorites, removeFromFavorites, clearFavorites } = useFavoritesStore();
  const router = useRouter();
  const { products, fetchProducts } = useProductsStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const favoriteProducts = useMemo(
    () => products.filter((product) => favorites.includes(product.id)),
    [favorites, products],
  );
  const recommendedProducts = useMemo(
    () => products.filter((product) => !favorites.includes(product.id)).slice(0, 4),
    [favorites, products],
  );

  const handleClearAll = () => {
    Alert.alert(
      "Clear wishlist?",
      "This will remove every saved item from your edit.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => void clearFavorites(),
        },
      ],
    );
  };

  const renderProductTile = (product: Product, compact = false) => (
    <Pressable
      key={product.id}
      onPress={() => router.push(`/product/${product.id}` as any)}
      className="flex-1"
    >
      <View className="overflow-hidden rounded-lg bg-gray-50 dark:bg-[#101215]">
        <View className={`${compact ? "h-48" : "h-64"} bg-neutral-100 dark:bg-[#181a1f]`}>
          <Image
            source={getProductImageSource(product.image)}
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>
        <View className="px-4 pb-4 pt-3">
          <Text className="font-normal text-[10px] tracking-[1.7px] text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
            {product.brand}
          </Text>
          <Text className="mt-1 font-bold text-[13px] leading-5 text-black dark:text-white" numberOfLines={2}>
            {product.name}
          </Text>
          <Text className="mt-3 font-bold text-[14px] text-black dark:text-white">
            {formatPrice(product.price)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <Ionicons name="menu" size={24} color={isDark ? "#ffffff" : "#000000"} />
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/search" as any)}>
            <Ionicons name="search" size={24} color={isDark ? "#ffffff" : "#000000"} />
          </Pressable>
        </View>

        <View className="px-6 pb-2 pt-3">
          <Text className="mb-2 font-light text-xs tracking-widest text-gray-400 dark:text-gray-500">
            SAVED EDIT
          </Text>
          <Text className="font-bold text-4xl tracking-tight text-black dark:text-white">
            Wishlist
          </Text>
        </View>

        <View className="px-6 pt-6">
          <View className="bg-black px-6 py-6 dark:bg-[#e8eaee]">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-normal text-[11px] tracking-[2.4px] text-white/45 dark:text-black/45">
                  YOUR SELECTION
                </Text>
                <Text className="mt-3 font-bold text-[34px] leading-9 text-white dark:text-black">
                  {favoriteProducts.length}
                </Text>
                <Text className="mt-1 font-bold text-[13px] tracking-[2px] text-white dark:text-black">
                  CURATED ITEM{favoriteProducts.length === 1 ? "" : "S"}
                </Text>
              </View>
              <View className="h-16 w-16 items-center justify-center bg-white/10 dark:bg-black/10">
                <Ionicons name="heart" size={28} color={isDark ? "#050505" : "#ffffff"} />
              </View>
            </View>
            <View className="mt-5 h-px bg-white/10 dark:bg-black/10" />
            <View className="mt-4 flex-row items-center justify-between">
              <Text className="flex-1 pr-4 font-normal text-[12px] leading-5 text-white/60 dark:text-black/55">
                Build a private edit of pieces you want to revisit, compare, or style later.
              </Text>
              {favoriteProducts.length > 0 ? (
                <Pressable onPress={handleClearAll} className="bg-white px-4 py-3 dark:bg-black">
                  <Text className="font-bold text-[10px] tracking-[1.4px] text-black dark:text-white">
                    CLEAR
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {favoriteProducts.length > 0 ? (
          <View className="px-6 pt-7">
            <SectionEyebrow>SAVED PIECES</SectionEyebrow>
            <View className="mt-4 gap-5">
              {favoriteProducts.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                >
                  <View className="flex-row border-b border-gray-100 pb-5 dark:border-white/10">
                    <View className="h-36 w-32 bg-gray-100 dark:bg-[#101215]">
                      <Image
                        source={getProductImageSource(product.image)}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 py-1 pl-4">
                      <View className="flex-row items-start justify-between gap-3">
                        <Text className="flex-1 font-normal text-[10px] tracking-[1.8px] text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
                          {product.brand}
                        </Text>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            void removeFromFavorites(product.id);
                          }}
                          className="h-8 w-8 items-center justify-center"
                        >
                          <Ionicons name="close" size={17} color={isDark ? "#ffffff" : "#050505"} />
                        </Pressable>
                      </View>
                      <Text className="mt-2 font-bold text-[16px] leading-6 text-black dark:text-white" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="mt-2 font-normal text-[12px] text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                        {product.category}
                      </Text>
                      <Text className="mt-auto pt-4 font-bold text-[17px] text-black dark:text-white">
                        {formatPrice(product.price)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View className="px-6 pt-7">
            <View className="items-center border-t border-gray-100 px-6 py-10 dark:border-white/10">
              <View className="h-20 w-20 items-center justify-center bg-gray-100 dark:bg-[#101215]">
                <Ionicons name="heart-outline" size={46} color={isDark ? "#ffffff" : "#050505"} />
              </View>
              <Text className="mt-7 text-center font-bold text-[24px] leading-8 text-black dark:text-white">
                Your wishlist is waiting
              </Text>
              <Text className="mt-3 max-w-[280px] text-center font-normal text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
                Tap the heart on any product to build a clean shortlist of pieces worth coming back to.
              </Text>
              <Pressable
                onPress={() => router.push("/shop" as any)}
                className="mt-7 w-full rounded-lg bg-black px-6 py-4 dark:bg-white"
              >
                <Text className="font-bold text-[11px] tracking-[1.6px] text-white dark:text-black">
                  START BROWSING
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="px-6 pt-10">
          <View className="mb-5 flex-row items-end justify-between">
            <View className="flex-1 pr-4">
              <SectionEyebrow>RECOMMENDED FOR YOU</SectionEyebrow>
              <Text className="mt-2 font-bold text-xl tracking-wide text-black dark:text-white uppercase">
                More to discover
              </Text>
              <Text className="mt-2 font-normal text-[11px] tracking-[2px] text-neutral-400 dark:text-neutral-500">
                WEAR COLLECTION
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/shop" as any)}
              className="border border-gray-200 px-4 py-3 dark:border-white/15"
            >
              <Text className="font-bold text-[10px] tracking-[1.4px] text-black dark:text-white">
                VIEW ALL
              </Text>
            </Pressable>
          </View>

          <View className="gap-4">
            {[0, 2].map((startIndex) => {
              const row = recommendedProducts.slice(startIndex, startIndex + 2);
              if (row.length === 0) return null;

              return (
                <View key={startIndex} className="flex-row gap-4">
                  {row.map((product) => renderProductTile(product, true))}
                  {row.length === 1 ? <View className="flex-1" /> : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Favorites;
