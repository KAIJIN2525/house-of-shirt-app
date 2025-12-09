import { formatPrice } from "@/constants";
import { products } from "@/constants/products";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useFavorites } from "@/contexts/FavoritesContext";

const { width } = Dimensions.get("window");

const ProductDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const product = products.find((p) => p.id === id);
  const scrollRef = useRef<ScrollView>(null);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const productImages = product?.images || [product?.image || ""];

  // Animated values for each dot
  const dotAnimations = useRef(
    productImages.map(() => new Animated.Value(0))
  ).current;

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="font-futura-demi text-lg">Product not found</Text>
      </View>
    );
  }

  const handleFavoriteToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(product.id);
  };

  const handleAddToBag = async () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    setIsAdding(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simulate adding to bag
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccessModal(true);

      // Hide modal after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    }, 1000);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;

      // Animate all dots
      dotAnimations.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: index === newIndex ? 1 : 0,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }).start();
      });

      setCurrentImageIndex(newIndex);
    }
  }).current;

  return (
    <View className="flex-1 bg-white">
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* Image Carousel Section */}
        <View className="relative">
          <FlatList
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width, height: width * 1.2 }}
                resizeMode="cover"
              />
            )}
          />

          {/* Image Dots Indicator */}
          {productImages.length > 1 && (
            <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center gap-1.5">
              {productImages.map((_, index) => {
                const dotWidth = dotAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 32],
                });

                const dotOpacity = dotAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                });

                return (
                  <Animated.View
                    key={index}
                    style={{
                      width: dotWidth,
                      opacity: dotOpacity,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "white",
                    }}
                  />
                );
              })}
            </View>
          )}

          {/* Back Button */}
          <SafeAreaView className="absolute top-4 left-0 right-0">
            <View className="flex-row justify-between px-4">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/90 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={20} color="#0f172a" />
              </Pressable>

              {/* Favorite Button */}
              <Pressable
                onPress={handleFavoriteToggle}
                className="w-10 h-10 rounded-full bg-white/90 items-center justify-center"
              >
                <Ionicons
                  name={isFavorite(product.id) ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite(product.id) ? "#ef4444" : "#0f172a"}
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Product Info Card */}
        <View className="bg-white rounded-t-3xl -mt-6 px-6 pt-6">
          {/* Brand & Name */}
          <Text className="text-xs text-gray-500 uppercase font-futura tracking-wider">
            {product.brand}
          </Text>
          <Text className="font-futura-bold text-2xl text-slate-900 mt-1 leading-tight">
            {product.name}
          </Text>

          {/* Rating */}
          <View className="flex-row items-center mt-3">
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text className="font-futura-demi text-slate-900 ml-1">
              {product.rating}
            </Text>
            <Text className="font-futura text-gray-500 ml-2 text-sm">
              (128 reviews)
            </Text>
          </View>

          {/* Price */}
          <Text className="font-futura-demi text-3xl text-slate-900 mt-4">
            {formatPrice(product.price)}
          </Text>

          {/* Size Selection */}
          <View className="mt-8">
            <Text className="font-futura-demi text-base text-slate-900 mb-3">
              Select Size
            </Text>
            <View className="flex-row gap-3 flex-wrap">
              {product.sizes?.map((size) => (
                <Pressable
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  className={`px-6 py-3 rounded-lg border-2 ${
                    selectedSize === size
                      ? "bg-slate-900 border-slate-900"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`font-futura-medium ${
                      selectedSize === size ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <View className="mt-6">
              <Text className="font-futura-demi text-base text-slate-900 mb-3">
                Select Color
              </Text>
              <View className="flex-row gap-3">
                {product.colors.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      selectedColor === color
                        ? "bg-slate-900 border-slate-900"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-futura-medium text-sm ${
                        selectedColor === color
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      {color}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Product Description */}
          <View className="mt-8">
            <Text className="font-futura-demi text-base text-slate-900 mb-2">
              About this product
            </Text>
            <View className="h-px bg-gray-200 mb-4" />
            <Text
              className="font-futura text-gray-700 leading-6"
              numberOfLines={isExpanded ? undefined : 3}
            >
              {product.description}
            </Text>
            <Pressable
              onPress={() => setIsExpanded(!isExpanded)}
              className="mt-2"
            >
              <Text className="font-futura-medium text-slate-900">
                {isExpanded ? "Show Less" : "Read More"} →
              </Text>
            </Pressable>
          </View>

          {/* Product Details */}
          <View className="mt-6 mb-32">
            <Text className="font-futura-demi text-base text-slate-900 mb-2">
              Product Details
            </Text>
            <View className="h-px bg-gray-200 mb-4" />
            <View className="gap-2">
              <Text className="font-futura text-gray-700">
                • Material: 100% Premium Cotton
              </Text>
              <Text className="font-futura text-gray-700">
                • Fit: {product.category === "T-Shirts" ? "Regular" : "Relaxed"}
              </Text>
              <Text className="font-futura text-gray-700">
                • Care: Machine wash cold
              </Text>
              <Text className="font-futura text-gray-700">
                • Model height: 6'1" wearing size M
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 rounded-t-lg">
        <SafeAreaView edges={["bottom"]} className="flex-row gap-3">
          {/* Add to Bag Button */}
          <Pressable
            onPress={handleAddToBag}
            disabled={!selectedSize || isAdding}
            className={`flex-1 h-14 rounded-xl items-center justify-center flex-row ${
              !selectedSize || isAdding ? "bg-gray-300" : "bg-slate-900"
            }`}
          >
            {isAdding ? (
              <>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text className="font-futura-demi text-white text-base ml-2">
                  Adding...
                </Text>
              </>
            ) : (
              <Text className="font-futura-demi text-white text-base">
                Add to Bag
              </Text>
            )}
          </Pressable>

          {/* Favorite Icon Button */}
          <Pressable
            onPress={handleFavoriteToggle}
            className="w-14 h-14 rounded-xl border-2 border-gray-300 items-center justify-center"
          >
            <Ionicons
              name={isFavorite(product.id) ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite(product.id) ? "#ef4444" : "#0f172a"}
            />
          </Pressable>
        </SafeAreaView>
      </View>

      {/* Success Modal */}
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-3xl p-8 mx-6 items-center shadow-lg">
            <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center mb-4">
              <Ionicons name="checkmark" size={32} color="white" />
            </View>
            <Text className="font-futura-bold text-xl text-slate-900 mb-2">
              Added to Bag!
            </Text>
            <Text className="font-futura text-gray-600 text-center">
              {product.name} has been added to your bag
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProductDetails;
