import { formatPrice } from "@/constants";
import { BrandTileSkeleton } from "@/components/loading/Skeleton";
import { useAdminContentStore } from "@/stores/adminContentStore";
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
  Text,
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
  const { isDark } = useThemeStore();
  const [loadedBrandLogos, setLoadedBrandLogos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const trendingProducts = products.slice(0, 5);
  const personalizedProducts = products.slice(0, 4);
  const heroContent = useMemo(
    () => ({
      overlayLabel: banner.isActive ? banner.overlayLabel : "Limited Edition",
      headline: banner.isActive ? banner.headline : "The Monochrome Collection",
      ctaText: banner.isActive ? banner.ctaText : "Shop the Look",
      targetUrl: banner.targetUrl,
    }),
    [banner]
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
      router.push({
        pathname: "/(tabs)/shop",
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
            className="w-10 items-start"
          >
            <Ionicons name="search" size={24} color={isDark ? "#ffffff" : "#000"} />
          </Pressable>
          <Text
            numberOfLines={1}
            className="flex-1 px-3 text-center font-bold text-sm leading-6 tracking-[2.5px] text-black dark:text-white"
          >
            HOUSE OF SHIRTS
          </Text>
          <Pressable
            onPress={() => router.push("/notifications" as any)}
            className="relative w-10 items-end"
          >
            <Ionicons name="notifications-outline" size={24} color={isDark ? "#ffffff" : "#000"} />
            {unreadNotificationCount > 0 ? (
              <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-800 px-1">
                <Text className="font-bold text-[10px] leading-3 text-white">
                  {unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <Pressable onPress={handleHeroPress}>
          <View className="mb-8 h-[450px] overflow-hidden">
            <ImageBackground
              source={heroImageSource}
              className="flex-1 items-center justify-center"
              resizeMode="cover"
            >
              <View className="absolute inset-0 bg-black/70" />

              <View className="mb-12 mt-auto z-10 px-6">
                <Text className="mb-4 font-light text-xs tracking-widest text-white">
                  {heroContent.overlayLabel.toUpperCase()}
                </Text>
                <Text className="font-bold text-5xl leading-tight text-white">
                  {heroContent.headline.toUpperCase()}
                </Text>
                <Text className="mt-6 font-normal text-xs tracking-widest text-white/80">
                  {heroContent.ctaText.toUpperCase()}
                </Text>
              </View>
            </ImageBackground>
          </View>
        </Pressable>

        <View className="mb-8">
          <View className="mb-6 flex-row items-center justify-between px-6">
            <View>
              <Text className="font-light text-sm tracking-wider">
                EDITOR&apos;S CHOICE
              </Text>
              <Text className="font-bold text-xl tracking-wide text-black uppercase">
                Trending Now
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleTrendingScroll("left")}
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={16} color="#000" />
              </Pressable>
              <Pressable
                onPress={() => handleTrendingScroll("right")}
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons name="arrow-forward" size={16} color="#000" />
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
                      <Text className="font-bold text-[10px] leading-3 text-black dark:text-white">
                        NEW
                      </Text>
                    </View>
                  </View>

                  <View className="py-4">
                    <Text className="mb-2 font-light text-xs text-gray-500 dark:text-gray-400">
                      FEATURED ITEM
                    </Text>
                    <Text
                      className="mb-3 font-bold text-sm text-black dark:text-white"
                      numberOfLines={2}
                    >
                      {item.name.toUpperCase()}
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
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 24}}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({
                  pathname: "/(tabs)/shop",
                  params: { search: item.name }
                } as any)}
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
                  <View className="overflow-hidden rounded-lg bg-gray-50">
                    <View className="relative h-56 w-full bg-gray-100">
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
                        className="font-bold text-xs text-black"
                        numberOfLines={1}
                      >
                        {item.name.toUpperCase()}
                      </Text>
                      <Text className="mt-2 font-bold text-sm text-black">
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
                  <View className="overflow-hidden rounded-lg bg-gray-50">
                    <View className="relative h-56 w-full bg-gray-100">
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
                        className="font-bold text-xs text-black"
                        numberOfLines={1}
                      >
                        {item.name.toUpperCase()}
                      </Text>
                      <Text className="mt-2 font-bold text-sm text-black">
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View className="mx-6 mb-8 rounded-lg bg-gray-50 p-8">
          <Text className="mb-3 font-light text-xs tracking-widest text-gray-600">
            EXCLUSIVE BENEFITS
          </Text>
          <Text className="mb-4 font-bold text-2xl text-black">
            JOIN THE ATELIER
          </Text>
          <Text className="mb-6 font-normal text-sm text-gray-600">
            Sign up to get insider access to collections and events
          </Text>

          <View className="flex-row">
            <View className="flex-1 flex-row items-center border border-gray-300 bg-white px-4">
              <TextInput
                value={atelierEmail}
                onChangeText={setAtelierEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                className="flex-1 py-3 font-normal text-black"
              />
            </View>
            <Pressable className="items-center justify-center bg-black px-6 py-3">
              <Text className="font-semibold text-xs tracking-widest text-white">
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
