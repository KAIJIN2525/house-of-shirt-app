import { formatPrice } from "@/constants";
import { AppText as Text } from "@/components/AppText";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandTileSkeleton } from "@/components/loading/Skeleton";
import {
  getPersonalizedProducts,
  getTrendingProducts,
} from "@/lib/recommendations";
import { useAdminContentStore } from "@/stores/adminContentStore";
import { useAuthStore } from "@/stores/authStore";
// The base store, not the wrapper: it takes a selector, so the home screen
// subscribes to the orders it needs rather than re-rendering on every change.
import { useOrdersStoreBase } from "@/stores/ordersStore";
import { useProductsStore } from "@/stores/productsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Contrast, Grayscale } from "react-native-color-matrix-image-filters";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const Home = () => {
  const router = useRouter();
  const trendingFlatListRef = useRef<FlatList>(null);
  const [atelierEmail, setAtelierEmail] = useState("");
  const { banner, unreadNotificationCount, brands } = useAdminContentStore();
  const products = useProductsStore((state) => state.products);
  const fetchProducts = useProductsStore((state) => state.fetchProducts);
  const productError = useProductsStore((state) => state.errorMessage);
  const productsAreStale = useProductsStore((state) => state.isStale);
  const productsLoading = useProductsStore((state) => state.isLoading);
  const { isDark } = useThemeStore();
  const [loadedBrandLogos, setLoadedBrandLogos] = useState<
    Record<string, boolean>
  >({});

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const myOrders = useOrdersStoreBase((state) => state.myOrders);
  const fetchMyOrders = useOrdersStoreBase((state) => state.fetchMyOrders);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Past orders are what "Personalized for You" is built from.
  useEffect(() => {
    if (isAuthenticated) {
      void fetchMyOrders();
    }
  }, [isAuthenticated, fetchMyOrders]);

  // Trending is real sales: `salesCount` is tallied from Shopify orders during
  // the sync and rides along with every product fetch, so this rail follows
  // what is actually selling without a feed of its own to keep in step.
  const trendingProducts = useMemo(
    () => getTrendingProducts(products, 10),
    [products],
  );

  const purchasedItems = useMemo(
    () => myOrders.flatMap((order) => order.lineItems ?? []),
    [myOrders],
  );

  // Drawn from the brands and categories this customer has bought before,
  // minus what they already own. Falls back to best sellers for a new account.
  const personalizedProducts = useMemo(
    () => getPersonalizedProducts(products, purchasedItems, 4),
    [products, purchasedItems],
  );
  const heroContent = useMemo(
    () => ({
      overlayLabel: banner.isActive ? banner.overlayLabel : "Limited Edition",
      headline: banner.isActive ? banner.headline : "The Monochrome Collection",
      ctaText: banner.isActive ? banner.ctaText : "Shop the Look",
      targetUrl: banner.targetUrl,
    }),
    [banner],
  );
  const heroImageSource = banner.imageUri
    ? { uri: banner.imageUri }
    : require("../../assets/images/img1.jpeg");

  const handleTrendingScroll = (direction: "left" | "right") => {
    if (trendingFlatListRef.current) {
      const scrollAmount = 300;
      trendingFlatListRef.current.scrollToOffset({
        offset: direction === "right" ? scrollAmount : -scrollAmount,
        animated: true,
      });
    }
  };

  const handleHeroPress = () => {
    if (heroContent.targetUrl?.toLowerCase().includes("white")) {
      // Free text belongs to the search screen -- the shop filters on brand and
      // category only, so pushing `search` at it did nothing but open the shop
      // unfiltered.
      router.push({
        pathname: "/search",
        params: { search: "white shirt" },
      } as any);
      return;
    }

    router.push((heroContent.targetUrl || "/(tabs)/shop") as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-6 pb-4 pt-4">
          <Pressable
            onPress={() => router.push("/search" as any)}
            accessibilityRole="button"
            accessibilityLabel="Search products"
            className="w-10 items-start"
          >
            <Ionicons
              name="search"
              size={24}
              color={isDark ? "#ffffff" : "#000"}
            />
          </Pressable>
          <BrandLogo width={190} height={36} style={{ flex: 1 }} />
          <Pressable
            onPress={() => router.push("/notifications" as any)}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ""}`}
            className="relative w-10 items-end"
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={isDark ? "#ffffff" : "#000"}
            />
            {unreadNotificationCount > 0 ? (
              <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-800 px-1">
                <Text className="font-bold text-[10px] leading-3 text-white">
                  {unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {productError ? (
          <View accessibilityRole="alert" className="mx-6 mb-4 flex-row items-center border border-amber-300 bg-amber-50 p-3 dark:border-amber-400/40 dark:bg-amber-950/30">
            <Ionicons name="cloud-offline-outline" size={18} color={isDark ? "#fbbf24" : "#92400e"} />
            <Text className="ml-3 flex-1 text-sm text-amber-900 dark:text-amber-100">
              {productsAreStale ? "Showing saved products. " : ""}{productError}
            </Text>
            <Pressable
              onPress={() => void fetchProducts()}
              disabled={productsLoading}
              accessibilityRole="button"
              accessibilityLabel="Retry loading products"
              accessibilityState={{ disabled: productsLoading, busy: productsLoading }}
              className="min-h-11 justify-center px-2"
            >
              <Text className="font-bold text-xs text-amber-900 dark:text-amber-200">
                {productsLoading ? "RETRYING" : "RETRY"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={handleHeroPress} accessibilityRole="button" accessibilityLabel={`${heroContent.headline}. ${heroContent.ctaText}`}>
          <View className="mb-8 h-[450px] overflow-hidden">
            <ImageBackground
              source={heroImageSource}
              className="flex-1 items-center justify-center"
              resizeMode="cover"
            >
              <View className="absolute inset-0 bg-black/70" />

              <View className="mb-12 mt-auto z-10 px-6">
                <Text className="mb-4 font-light text-xs tracking-widest text-white">
                  {heroContent.overlayLabel}
                </Text>
                <Text className="font-bold text-5xl leading-tight text-white">
                  {heroContent.headline}
                </Text>
                <Text className="mt-6 font-normal text-xs tracking-widest text-white/80">
                  {heroContent.ctaText}
                </Text>
              </View>
            </ImageBackground>
          </View>
        </Pressable>

        <View className="mb-8">
          <View className="mb-6 flex-row items-center justify-between px-6">
            <View>
              <Text className="font-light text-sm tracking-wider text-black dark:text-white">
                EDITOR&apos;S CHOICE
              </Text>
              <Text className="font-bold text-xl tracking-wide text-black dark:text-white uppercase">
                Trending Now
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleTrendingScroll("left")}
                accessibilityRole="button"
                accessibilityLabel="Previous trending products"
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={isDark ? "#ffffff" : "#000000"}
                />
              </Pressable>
              <Pressable
                onPress={() => handleTrendingScroll("right")}
                accessibilityRole="button"
                accessibilityLabel="Next trending products"
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={isDark ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </View>
          </View>

          <FlatList
            ref={trendingFlatListRef}
            data={trendingProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/product/${item.id}` as any)}
                accessibilityRole="button"
                accessibilityLabel={`${item.brand ?? "House of Shirts"}, ${item.name}, ${formatPrice(item.price)}`}
                accessibilityHint="Opens product details"
                className="w-48"
              >
                <View className="overflow-hidden">
                  <View className="relative h-64 w-full bg-gray-100">
                    <Image
                      source={
                        typeof item.image === "string"
                          ? { uri: item.image }
                          : item.image
                      }
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                    <View className="absolute right-3 top-3 min-h-7 min-w-10 items-center justify-center rounded bg-white px-2 py-1">
                      <Text className="font-bold text-[10px] leading-3 text-black">
                        NEW
                      </Text>
                    </View>
                  </View>

                  <View className="py-4">
                    <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-gray-400">
                      {item.brand?.toUpperCase()}
                    </Text>
                    <Text
                      className="mb-3 font-bold text-sm text-black dark:text-white"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text className="font-bold text-sm text-black dark:text-white">
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>

        <View className="mb-12">
          <View className="mb-6 px-6">
            <Text className="font-light text-sm tracking-wider text-gray-400 dark:text-gray-500">
              CURATED ATELIER
            </Text>
            <Text className="font-bold text-xl tracking-wide text-black dark:text-white uppercase">
              The Brand Collective
            </Text>
          </View>

          <FlatList
            data={brands}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/shop",
                    // `brand` is the param the shop screen filters on. `search`
                    // belongs to the search screen and was silently ignored
                    // here, so the tile opened an unfiltered shop.
                    params: { brand: item.name },
                  } as any)
                }
                accessibilityRole="button"
                accessibilityLabel={`Shop ${item.name}`}
                className="items-center"
              >
                <View className="h-28 w-40 items-center justify-center relative overflow-hidden">
                  {/* Faint Watermark Initial */}
                  <Text className="absolute font-bold text-4xl text-slate-300/30 dark:text-white/5 uppercase">
                    {item.name[0]}
                  </Text>
                  {!loadedBrandLogos[item.id] ? (
                    <View className="absolute inset-0">
                      <BrandTileSkeleton />
                    </View>
                  ) : null}
                  <Grayscale>
                    <Contrast amount={1.8}>
                      <Image
                        key={item.logo}
                        source={{ uri: item.logo }}
                        style={{
                          width: 150,
                          height: 108,
                          opacity: isDark ? 0.92 : 1,
                        }}
                        resizeMode="contain"
                        onLoadEnd={() =>
                          setLoadedBrandLogos((current) => ({
                            ...current,
                            [item.id]: true,
                          }))
                        }
                      />
                    </Contrast>
                  </Grayscale>
                </View>
              </Pressable>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        <View className="mb-8 px-6">
          <Text className="mb-2 font-bold text-lg tracking-wide text-black dark:text-white uppercase">
            Personalized for You
          </Text>
          <Text className="mb-6 font-normal text-xs text-gray-600 dark:text-gray-400">
            Curated selections based on your style and preferences
          </Text>

          <View className="gap-4">
            <View className="flex-row gap-4">
              {personalizedProducts.slice(0, 2).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                  className="flex-1"
                >
                  <View className="overflow-hidden bg-transparent">
                    <View className="relative h-56 w-full bg-gray-100 dark:bg-neutral-900">
                      <Image
                        source={
                          typeof item.image === "string"
                            ? { uri: item.image }
                            : item.image
                        }
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="p-3">
                      <Text
                        className="font-bold text-xs text-black dark:text-white"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="mt-2 font-bold text-sm text-black dark:text-white">
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-4">
              {personalizedProducts.slice(2, 4).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                  className="flex-1"
                >
                  <View className="overflow-hidden bg-transparent">
                    <View className="relative h-56 w-full bg-gray-100 dark:bg-neutral-900">
                      <Image
                        source={
                          typeof item.image === "string"
                            ? { uri: item.image }
                            : item.image
                        }
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="p-3">
                      <Text
                        className="font-bold text-xs text-black dark:text-white"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="mt-2 font-bold text-sm text-black dark:text-white">
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View className="mx-6 mb-8 bg-gray-50 p-8 dark:bg-neutral-950">
          <Text className="mb-3 font-light text-xs tracking-widest text-gray-600 dark:text-gray-400">
            EXCLUSIVE BENEFITS
          </Text>
          <Text className="mb-4 font-bold text-2xl text-black dark:text-white">
            JOIN THE ATELIER
          </Text>
          <Text className="mb-6 font-normal text-sm text-gray-600 dark:text-gray-400">
            Sign up to get insider access to collections and events
          </Text>

          <View className="flex-row">
            <View className="flex-1 flex-row items-center bg-white px-4 dark:bg-neutral-900">
              <TextInput
                value={atelierEmail}
                onChangeText={setAtelierEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                className="flex-1 py-3 font-normal text-black dark:text-white"
              />
            </View>
            <Pressable className="items-center justify-center bg-black px-6 py-3 dark:bg-white">
              <Text className="font-semibold text-xs tracking-widest text-white dark:text-black">
                JOIN
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
