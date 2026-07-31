import { HouseLoader } from "@/components/loading/HouseLoader";
import { HouseFeedbackModal } from "@/components/feedback/HouseFeedbackModal";
import { formatPrice } from "@/constants";
import type { ProductSizeOption } from "@/constants/products";
import { useAuthStore } from "@/stores/authStore";
import { useBagStore } from "@/stores/bagStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useProductsStore } from "@/stores/productsStore";
import { useRestockRequestsStore } from "@/stores/restockRequestsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const { width } = Dimensions.get("window");

const parseProductData = (description: string) => {
  if (!description) {
    return { description: "", details: [] as string[] };
  }

  const markers = ["PRODUCT DETAILS", "DETAILS:", "Product Details"];
  let body = description;
  let details: string[] = [];

  for (const marker of markers) {
    if (description.includes(marker)) {
      const [intro, rawDetails = ""] = description.split(marker);
      body = intro.trim();
      details = rawDetails
        .split(/\n|•|-/)
        .map((item) => item.trim())
        .filter(Boolean);
      break;
    }
  }

  return {
    description: body.replace(/^DESCRIPTION/i, "").trim(),
    details,
  };
};

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { products, fetchProducts, isLoading } = useProductsStore();
  const { addToBag } = useBagStore();
  const { isSubmitting, requestRestockNotification } = useRestockRequestsStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { isAuthenticated } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const product = products.find((item) => item.id === productId);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSizePrompt, setShowSizePrompt] = useState(false);
  const [pendingRestockSize, setPendingRestockSize] = useState("");
  const [showRestockSuccess, setShowRestockSuccess] = useState(false);
  const [restockError, setRestockError] = useState("");
  const [showFitGuide, setShowFitGuide] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [fitPreference, setFitPreference] = useState<"slim" | "regular" | "relaxed">("regular");
  const [bodyBuild, setBodyBuild] = useState<"narrow" | "average" | "broad">("average");
  const [heightRange, setHeightRange] = useState<"short" | "average" | "tall" | "veryTall">("average");
  const [weightRange, setWeightRange] = useState<"light" | "average" | "heavy" | "veryHeavy">("average");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const saved = await AsyncStorage.getItem("@user_size_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fitPreference) setFitPreference(parsed.fitPreference);
          if (parsed.bodyBuild) setBodyBuild(parsed.bodyBuild);
          if (parsed.heightRange) setHeightRange(parsed.heightRange);
          if (parsed.weightRange) setWeightRange(parsed.weightRange);
          setHasInteracted(true);
        }
      } catch (e) {
        console.error("Failed to load size profile:", e);
      }
    };
    void loadProfile();
  }, []);

  const saveSizeProfile = async (
    fit: typeof fitPreference,
    build: typeof bodyBuild,
    h: typeof heightRange,
    w: typeof weightRange
  ) => {
    try {
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      await AsyncStorage.setItem(
        "@user_size_profile",
        JSON.stringify({ fitPreference: fit, bodyBuild: build, heightRange: h, weightRange: w })
      );
    } catch (e) {
      console.error("Failed to save size profile:", e);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts, productId]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  const productImages = useMemo(() => {
    const images =
      product?.images && product.images.length > 0
        ? product.images.filter(Boolean)
        : [product?.image].filter(Boolean);

    return images.length > 0 ? images : [];
  }, [product]);

  const sizeOptions = useMemo<ProductSizeOption[]>(() => {
    if (!product) {
      return [];
    }

    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return product.sizeOptions;
    }

    return (product.sizes ?? []).map((size) => ({
      value: size,
      available: true,
      inventoryQuantity: 0,
    }));
  }, [product]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const nextIndex = viewableItems?.[0]?.index;
    if (typeof nextIndex === "number") {
      setActiveImageIndex(nextIndex);
    }
  }).current;

  const recommendedSize = useMemo(() => {
    if (!product) return "M";
    const availableSizes = sizeOptions.filter((option) => option.available);
    const targetList = availableSizes.length ? availableSizes.map((option) => option.value) : (product.sizes?.length ? product.sizes : ["S", "M", "L", "XL"]);
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
    let baseIndex = weightRange === "light" ? (heightRange === "short" ? 0 : 1) : weightRange === "average" ? (heightRange === "short" ? 1 : 2) : weightRange === "heavy" ? (heightRange === "veryTall" ? 4 : 3) : (heightRange === "veryTall" ? 6 : 5);
    if (bodyBuild === "narrow" || fitPreference === "slim") baseIndex -= 1;
    if (bodyBuild === "broad" || fitPreference === "relaxed") baseIndex += 1;
    const finalSize = sizeOrder[Math.min(sizeOrder.length - 1, Math.max(0, baseIndex))];
    if (targetList.includes(finalSize)) return finalSize;
    return targetList.reduce((closest, size) => Math.abs(sizeOrder.indexOf(size) - baseIndex) < Math.abs(sizeOrder.indexOf(closest) - baseIndex) ? size : closest, targetList[0] || "M");
  }, [bodyBuild, fitPreference, heightRange, product, sizeOptions, weightRange]);

  if (!product && isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#050505]">
        <HouseLoader label="LOADING PRODUCT" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#050505] px-6">
        <Text className="font-semibold text-lg text-black dark:text-white">
          Product not found
        </Text>
      </View>
    );
  }

  const { description: parsedDescription, details: parsedDetails } = parseProductData(
    product.description || "",
  );
  const handleFavoriteToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(product.id);
  };

  const handleAddToBag = async () => {
    let currentProduct = product;
    let currentSizeOptions = sizeOptions;
    let selectedSizeOption = currentSizeOptions.find(
      (option) => option.value === selectedSize,
    );

    if (sizeOptions.length > 0 && !selectedSize) {
      setShowSizePrompt(true);
      return;
    }

    if (selectedSizeOption && !selectedSizeOption.available) {
      setPendingRestockSize(selectedSizeOption.value);
      return;
    }

    const findSelectedVariant = (candidate: typeof product) =>
      candidate.variants?.find((variant) =>
        variant.selectedOptions.every((option) => {
        const name = option.name.toLowerCase();
        if (["size", "shoe size", "eu size", "us size", "uk size"].includes(name)) {
          return !selectedSize || option.value.toLowerCase() === selectedSize.toLowerCase();
        }
        if (["color", "colour"].includes(name)) {
          return !selectedColor || option.value.toLowerCase() === selectedColor.toLowerCase();
        }
        return true;
        }),
      );
    let selectedVariant = findSelectedVariant(currentProduct);
    let variantId =
      selectedVariant?.id ??
      selectedSizeOption?.variantId ??
      currentProduct.variantId;

    if (!variantId) {
      await fetchProducts();
      const refreshedProduct =
        useProductsStore.getState().getProductById(product.id);

      if (refreshedProduct) {
        currentProduct = refreshedProduct;
        currentSizeOptions = refreshedProduct.sizeOptions ?? [];
        selectedSizeOption = currentSizeOptions.find(
          (option) => option.value === selectedSize,
        );
        selectedVariant = findSelectedVariant(currentProduct);
        variantId =
          selectedVariant?.id ??
          selectedSizeOption?.variantId ??
          currentProduct.variantId;
      }
    }

    if (!variantId) {
      Alert.alert("Product unavailable", "This selection is not linked to a Shopify variant. Refresh the catalogue and try again.");
      return;
    }
    if (selectedVariant && !selectedVariant.available) {
      setPendingRestockSize(selectedSize || "One Size");
      return;
    }

    setIsAdding(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await Promise.resolve(addToBag({
      productId: currentProduct.id,
      variantId,
      name: currentProduct.name,
      image: currentProduct.image,
      price: selectedVariant?.price || currentProduct.price,
      quantity: 1,
      size: selectedSize || "One Size",
      color: selectedColor || "Default",
    }));

    setTimeout(() => {
      setIsAdding(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    }, 800);
  };

  const handleUnavailableSizePress = async (size: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setPendingRestockSize(size);
  };

  const handleRestockRequest = async () => {
    if (!pendingRestockSize) {
      return;
    }

    setRestockError("");
    try {
      await requestRestockNotification(product, pendingRestockSize);
      setPendingRestockSize("");
      setShowRestockSuccess(true);
    } catch (error) {
      setRestockError(
        error instanceof Error
          ? error.message
          : "We could not save your restock request. Please try again.",
      );
    }
  };

  const handleShare = async () => {
    try {
      const url = `houseofshirt://product/${product.id}`;
      const message = `Check out this amazing product: ${product.name} - ${formatPrice(product.price)}\n\nDiscover the collection at House of Shirts.`;

      await Share.share({
        message: `${message}\n${url}`,
        url,
      });
    } catch (error) {
      console.error("Error sharing product:", error);
      await Share.share({
        message: `${product.name} - ${formatPrice(product.price)}`,
      });
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#050505]">
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View className="relative">
          <FlatList
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width, height: width * 1.2 }}
                resizeMode="cover"
              />
            )}
          />

          {productImages.length > 1 ? (
            <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center gap-1.5">
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: activeImageIndex === index ? 32 : 8,
                    opacity: activeImageIndex === index ? 1 : 0.4,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "white",
                  }}
                />
              ))}
            </View>
          ) : null}

          <SafeAreaView className="absolute left-0 right-0 top-4">
            <View className="flex-row justify-between px-4">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
              >
                <Ionicons name="arrow-back" size={20} color="#0f172a" />
              </Pressable>

              <Pressable
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel={`Share ${product.name}`}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color="#0f172a"
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <View className="rounded-t-3xl -mt-6 bg-white px-6 pt-6 dark:bg-[#050505]">
          <Text className="text-[13px] font-bold uppercase tracking-[2px] text-gray-400">
            {product.brand?.toUpperCase()}
          </Text>
          <Text className="mt-1 text-base font-bold leading-tight text-slate-900 dark:text-white">
            {product.name}
          </Text>

          <View className="mt-3 flex-row items-center">
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text className="ml-1 font-semibold text-slate-900 dark:text-white">
              {product.rating}
            </Text>
            <Text className="ml-2 text-sm font-normal text-gray-500">
              (128 reviews)
            </Text>
          </View>

          <Text className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            {formatPrice(product.price)}
          </Text>

          {sizeOptions.length > 0 ? (
            <View className="mt-8">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">
                  Select Size
                </Text>
                <Pressable onPress={() => setShowFitGuide(true)} accessibilityRole="button" accessibilityLabel="Open fit guide">
                  <Text className="text-xs font-bold uppercase tracking-[1.2px] text-slate-900 dark:text-white">
                    Fit guide
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {sizeOptions.map((sizeOption) => {
                  const isSelected = selectedSize === sizeOption.value;
                  const isUnavailable = !sizeOption.available;

                  return (
                    <Pressable
                      key={sizeOption.value}
                      accessibilityRole="button"
                      accessibilityLabel={`Size ${sizeOption.value}${isUnavailable ? ", unavailable" : ""}`}
                      accessibilityState={{ selected: isSelected, disabled: isUnavailable }}
                      onPress={() =>
                        isUnavailable
                          ? void handleUnavailableSizePress(sizeOption.value)
                          : setSelectedSize(sizeOption.value)
                      }
                      className={`rounded-lg px-6 py-3 ${
                        isUnavailable
                          ? "bg-neutral-200 dark:bg-neutral-800"
                          : isSelected
                            ? "bg-slate-900 dark:bg-white"
                            : "bg-gray-100 dark:bg-white/10"
                      }`}
                    >
                      <Text
                        preserveCase
                        className={`font-medium uppercase ${
                          isUnavailable
                            ? "text-neutral-500 dark:text-neutral-300"
                            : isSelected
                              ? "text-white dark:text-black"
                              : "text-slate-900 dark:text-white"
                        } ${isUnavailable ? "line-through" : ""}`}
                      >
                        {sizeOption.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {(product.colors?.length ?? 0) > 0 ? (
            <View className="mt-6">
              <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                Select Color
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {product.colors?.map((color) => (
                  <Pressable
                    key={color}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${color}`}
                    accessibilityState={{ selected: selectedColor === color }}
                    onPress={() => setSelectedColor(color)}
                    className={`rounded-lg px-4 py-2 ${
                      selectedColor === color
                        ? "bg-slate-900 dark:bg-white"
                        : "bg-gray-100 dark:bg-white/10"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedColor === color
                          ? "text-white dark:text-black"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {color}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {parsedDescription ? (
            <View className="mt-8">
              <Text className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                About this product
              </Text>
              <View className="mb-4 h-px bg-gray-200 dark:bg-white/10" />
              <Text
                className="leading-6 text-gray-700 dark:text-gray-300"
                numberOfLines={isExpanded ? undefined : 3}
              >
                {parsedDescription}
              </Text>
              {parsedDescription.length > 150 ? (
                <Pressable
                  onPress={() => setIsExpanded(!isExpanded)}
                  className="mt-2"
                >
                  <Text className="font-medium text-slate-900 dark:text-white">
                    {isExpanded ? "Show Less" : "Read More"} {"->"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="mb-32 mt-6">
            <Text className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
              Product Details
            </Text>
            <View className="mb-4 h-px bg-gray-200 dark:bg-white/10" />
            <View className="gap-2">
              {parsedDetails.length > 0 ? (
                parsedDetails.map((detail, index) => (
                  <Text
                    key={`${detail}-${index}`}
                    className="font-normal text-gray-700 dark:text-gray-300"
                  >
                    - {detail}
                  </Text>
                ))
              ) : (
                <>
                  <Text className="font-normal text-gray-700 dark:text-gray-300">
                    - Material: 100% Premium Cotton
                  </Text>
                  <Text className="font-normal text-gray-700 dark:text-gray-300">
                    - Fit: {product.category === "T-Shirts" ? "Regular" : "Relaxed"}
                  </Text>
                  <Text className="font-normal text-gray-700 dark:text-gray-300">
                    - Care: Machine wash cold
                  </Text>
                  <Text className="font-normal text-gray-700 dark:text-gray-300">
                    - Model height: 6&apos;1&quot; wearing size M
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-lg border-t border-gray-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-[#050505]">
        <SafeAreaView edges={["bottom"]} className="flex-row gap-3">
          <Pressable
            onPress={handleAddToBag}
            disabled={isAdding}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to bag`}
            accessibilityState={{ disabled: isAdding, busy: isAdding }}
            className={`h-14 flex-1 flex-row items-center justify-center rounded-xl ${
              isAdding ? "bg-gray-300 dark:bg-white/10" : "bg-slate-900 dark:bg-white"
            }`}
          >
            {isAdding ? (
              <>
                <ActivityIndicator color={isDark ? "#d4d4d4" : "#ffffff"} size="small" />
                <Text className="ml-2 text-base font-semibold text-slate-700 dark:text-neutral-300">
                  Adding...
                </Text>
              </>
            ) : (
              <Text className="text-base font-semibold text-white dark:text-black">
                Add to Bag
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleFavoriteToggle}
            accessibilityRole="button"
            accessibilityLabel={isFavorite(product.id) ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
            accessibilityState={{ selected: isFavorite(product.id) }}
            className="h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10"
          >
            <Ionicons
              name={isFavorite(product.id) ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite(product.id) ? "#ef4444" : isDark ? "#ffffff" : "#0f172a"}
            />
          </Pressable>
        </SafeAreaView>
      </View>

      <HouseFeedbackModal
        visible={showSizePrompt}
        type="info"
        title="Choose a size"
        message="Select an available size before adding this piece to your bag."
        onRequestClose={() => setShowSizePrompt(false)}
        primaryAction={{
          label: "Got it",
          onPress: () => setShowSizePrompt(false),
        }}
      />

      <HouseFeedbackModal
        visible={showSuccessModal}
        type="success"
        title="Added to bag"
        message={`${product.name} is waiting for you at checkout.`}
        onRequestClose={() => setShowSuccessModal(false)}
        primaryAction={{
          label: "View bag",
          onPress: () => {
            setShowSuccessModal(false);
            router.push("/(tabs)/bag" as any);
          },
        }}
        secondaryAction={{
          label: "Keep shopping",
          onPress: () => setShowSuccessModal(false),
        }}
      />

      <HouseFeedbackModal
        visible={Boolean(pendingRestockSize)}
        type="info"
        title="Size unavailable"
        message={
          isAuthenticated
            ? `Size ${pendingRestockSize} is currently out of stock. We can notify you as soon as it returns.`
            : `Size ${pendingRestockSize} is currently out of stock. Sign in so we can notify you when it's back.`
        }
        onRequestClose={() => {
          setPendingRestockSize("");
          setRestockError("");
        }}
        primaryAction={{
          label: isAuthenticated
            ? isSubmitting ? "Saving..." : "Notify me"
            : "Sign in",
          onPress: () => {
            if (!isAuthenticated) {
              setPendingRestockSize("");
              router.push("/(auth)/login" as any);
            } else if (!isSubmitting) {
              void handleRestockRequest();
            }
          },
        }}
        secondaryAction={{
          label: "Not now",
          onPress: () => {
            setPendingRestockSize("");
            setRestockError("");
          },
        }}
      />

      <HouseFeedbackModal
        visible={Boolean(restockError)}
        type="error"
        title="Request failed"
        message={restockError}
        onRequestClose={() => setRestockError("")}
        primaryAction={{
          label: "Close",
          onPress: () => setRestockError(""),
        }}
      />

      <HouseFeedbackModal
        visible={showRestockSuccess}
        type="success"
        title="Notification saved"
        message="We will let you know when that size is available again."
        onRequestClose={() => setShowRestockSuccess(false)}
        primaryAction={{
          label: "Perfect",
          onPress: () => setShowRestockSuccess(false),
        }}
      />


      {showFitGuide ? (
        <View className="absolute bottom-0 left-0 right-0 border-t border-black/10 bg-white px-6 pb-8 pt-5 dark:border-white/10 dark:bg-[#050505] z-50">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-[10px] uppercase tracking-[1.5px] text-neutral-400">
              Size & Fit Calculator
            </Text>
            <Pressable onPress={() => setShowFitGuide(false)}>
              <Ionicons name="close" size={20} color={isDark ? "#fff" : "#000"} />
            </Pressable>
          </View>
          
          <Text className="mb-4 text-xs font-normal text-neutral-500">
            Tell us your height, weight, and preferences to calculate your recommended size.
          </Text>

          {/* Height Selection */}
          <Text className="font-bold text-[9px] uppercase tracking-[1.2px] text-gray-400 mb-2">
            Height
          </Text>
          <View className="flex-row gap-2 mb-3">
            {[
              { id: "short", label: "<170cm" },
              { id: "average", label: "170-180cm" },
              { id: "tall", label: "180-190cm" },
              { id: "veryTall", label: ">190cm" },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setHeightRange(opt.id as any);
                  setHasInteracted(true);
                  void saveSizeProfile(fitPreference, bodyBuild, opt.id as any, weightRange);
                }}
                className={`flex-1 border py-2.5 ${
                  heightRange === opt.id
                    ? "border-black bg-black dark:border-white dark:bg-white"
                    : "border-black/10 bg-white dark:border-white/10 dark:bg-[#101215]"
                }`}
              >
                <Text
                  className={`text-center text-[9px] font-bold uppercase tracking-[0.5px] ${
                    heightRange === opt.id
                      ? "text-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Weight Selection */}
          <Text className="font-bold text-[9px] uppercase tracking-[1.2px] text-gray-400 mb-2">
            Weight
          </Text>
          <View className="flex-row gap-2 mb-3">
            {[
              { id: "light", label: "<65kg" },
              { id: "average", label: "65-75kg" },
              { id: "heavy", label: "75-85kg" },
              { id: "veryHeavy", label: ">85kg" },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setWeightRange(opt.id as any);
                  setHasInteracted(true);
                  void saveSizeProfile(fitPreference, bodyBuild, heightRange, opt.id as any);
                }}
                className={`flex-1 border py-2.5 ${
                  weightRange === opt.id
                    ? "border-black bg-black dark:border-white dark:bg-white"
                    : "border-black/10 bg-white dark:border-white/10 dark:bg-[#101215]"
                }`}
              >
                <Text
                  className={`text-center text-[9px] font-bold uppercase tracking-[0.5px] ${
                    weightRange === opt.id
                      ? "text-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Body Build */}
          <Text className="font-bold text-[9px] uppercase tracking-[1.2px] text-gray-400 mb-2">
            Body Build
          </Text>
          <View className="flex-row gap-2 mb-3">
            {[
              { id: "narrow", label: "Narrow / Slim" },
              { id: "average", label: "Average" },
              { id: "broad", label: "Broad" },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setBodyBuild(opt.id as any);
                  setHasInteracted(true);
                  void saveSizeProfile(fitPreference, opt.id as any, heightRange, weightRange);
                }}
                className={`flex-1 border py-2.5 ${
                  bodyBuild === opt.id
                    ? "border-black bg-black dark:border-white dark:bg-white"
                    : "border-black/10 bg-white dark:border-white/10 dark:bg-[#101215]"
                }`}
              >
                <Text
                  className={`text-center text-[9px] font-bold uppercase tracking-[0.5px] ${
                    bodyBuild === opt.id
                      ? "text-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Fit Preference */}
          <Text className="font-bold text-[9px] uppercase tracking-[1.2px] text-gray-400 mb-2">
            Fit Preference
          </Text>
          <View className="flex-row gap-2 mb-5">
            {[
              { id: "slim", label: "Sharp / Fitted" },
              { id: "regular", label: "Regular" },
              { id: "relaxed", label: "Relaxed / Oversized" },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setFitPreference(opt.id as any);
                  setHasInteracted(true);
                  void saveSizeProfile(opt.id as any, bodyBuild, heightRange, weightRange);
                }}
                className={`flex-1 border py-2.5 ${
                  fitPreference === opt.id
                    ? "border-black bg-black dark:border-white dark:bg-white"
                    : "border-black/10 bg-white dark:border-white/10 dark:bg-[#101215]"
                }`}
              >
                <Text
                  className={`text-center text-[9px] font-bold uppercase tracking-[0.5px] ${
                    fitPreference === opt.id
                      ? "text-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recommendation Banner */}
          {hasInteracted ? (
            <View className="bg-neutral-100 p-4 dark:bg-[#101215] flex-row justify-between items-center">
              <View>
                <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-[1px]">
                  Recommended Size
                </Text>
                <Text className="text-xl font-bold text-black dark:text-white mt-1">
                  Size {recommendedSize}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedSize(recommendedSize);
                  setShowFitGuide(false);
                }}
                className="bg-black px-5 py-3 dark:bg-white"
              >
                <Text className="text-[10px] font-bold text-white dark:text-black uppercase tracking-[1px]">
                  Apply Size
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-neutral-100 p-4 dark:bg-[#101215]">
              <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-[1px] text-center">
                Select your measurements above to get your recommended size
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
