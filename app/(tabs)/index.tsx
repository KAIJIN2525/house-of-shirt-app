import FeaturedCategories from "@/components/FeaturedCategories";
import HeroCarousel from "@/components/HeroCarousel";
import TrendingProducts from "@/components/TrendingProducts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const Home = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-6">
          <View>
            <Text className="font-futura-light text-gray-600">
              Hello, Welcome 👋
            </Text>
            <Text className="font-futura-bold text-2xl text-slate-900 mt-1">
              John Doe
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/profile" as any)}
            className="w-12 h-12 bg-slate-900 rounded-full items-center justify-center"
          >
            <Text className="font-futura-bold text-white text-lg">JD</Text>
          </Pressable>
        </View>

        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Quick Stats Cards */}
        <View className="flex-row px-4 gap-3 mb-6">
          <Pressable
            onPress={() => router.push("/(tabs)/bag" as any)}
            className="flex-1 bg-slate-50 rounded-xl p-4 border border-gray-200"
          >
            <View className="w-10 h-10 bg-slate-900 rounded-full items-center justify-center mb-2">
              <Ionicons name="cart-outline" size={20} color="white" />
            </View>
            <Text className="font-futura-demi text-slate-900 text-lg">12</Text>
            <Text className="font-futura text-gray-600 text-xs">Orders</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/favorites" as any)}
            className="flex-1 bg-slate-50 rounded-xl p-4 border border-gray-200"
          >
            <View className="w-10 h-10 bg-red-500 rounded-full items-center justify-center mb-2">
              <Ionicons name="heart-outline" size={20} color="white" />
            </View>
            <Text className="font-futura-demi text-slate-900 text-lg">24</Text>
            <Text className="font-futura text-gray-600 text-xs">Wishlist</Text>
          </Pressable>

          <Pressable className="flex-1 bg-slate-50 rounded-xl p-4 border border-gray-200">
            <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center mb-2">
              <Ionicons name="gift-outline" size={20} color="white" />
            </View>
            <Text className="font-futura-demi text-slate-900 text-lg">3</Text>
            <Text className="font-futura text-gray-600 text-xs">Rewards</Text>
          </Pressable>
        </View>

        {/* Featured Categories */}
        <FeaturedCategories />

        {/* Trending Products */}
        <TrendingProducts />

        {/* Collections Banner */}
        <View className="px-4 mb-6">
          <Pressable
            onPress={() => router.push("/(tabs)/shop" as any)}
            className="bg-slate-900 rounded-2xl p-6 flex-row items-center justify-between"
          >
            <View>
              <Text className="font-futura-bold text-white text-xl mb-1">
                Winter Collection
              </Text>
              <Text className="font-futura text-white/80 text-sm">
                Explore cozy essentials
              </Text>
            </View>
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="arrow-forward" size={24} color="white" />
            </View>
          </Pressable>
        </View>

        {/* Spacer for bottom navigation */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
