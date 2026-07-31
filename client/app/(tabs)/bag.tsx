import { formatPrice } from "@/constants";
import { useBagStore } from "@/stores/bagStore";
import { useThemeStore } from "@/stores/themeStore";
import { useAddressStore } from "@/stores/addressStore";
import { useAuthStore } from "@/stores/authStore";
import {
  createShopifyCheckout,
  selectShopifyDeliveryOption,
  type ShopifyCheckoutSession,
  type ShopifyDeliveryOption,
} from "@/services/shopify-storefront";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  Pressable,
  Image,
  Modal,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";

const Bag = () => {
  const router = useRouter();
  const {  bagItems, removeFromBag, updateQuantity, getTotalPrice  } = useBagStore();
  const {  isDark  } = useThemeStore();
  const { user } = useAuthStore();
  const defaultAddress = useAddressStore((state) => state.getDefaultAddress());
  const [deliveryOptions, setDeliveryOptions] = useState<ShopifyDeliveryOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShopifyDeliveryOption | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<ShopifyCheckoutSession | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [showShippingModal, setShowShippingModal] = useState(false);

  const subtotal = getTotalPrice();
  const shippingCost = selectedShipping?.amount ?? 0;
  const total = subtotal + shippingCost;

  const loadShippingOptions = async () => {
    setShowShippingModal(true);
    if (!defaultAddress) {
      setShippingError("Add a default shipping address to calculate delivery.");
      return;
    }

    setIsLoadingShipping(true);
    setShippingError("");
    try {
      const nameParts = defaultAddress.fullName.trim().split(/\s+/);
      const country = (defaultAddress.country || "Nigeria").trim();
      const countryCode = country.toLowerCase() === "nigeria"
        ? "NG"
        : country.length === 2
          ? country.toUpperCase()
          : "NG";
      const session = await createShopifyCheckout({
        items: bagItems,
        email: user?.email,
        phone: defaultAddress.phoneNumber,
        address: {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || undefined,
          address1: defaultAddress.address,
          address2: defaultAddress.apartment,
          city: defaultAddress.city,
          province: defaultAddress.state,
          zip: defaultAddress.zipCode,
          countryCode,
          phone: defaultAddress.phoneNumber,
        },
      });
      setCheckoutSession(session);
      setDeliveryOptions(session.deliveryOptions);
      setSelectedShipping(null);
      if (session.deliveryOptions.length === 0) {
        setShippingError("Shopify returned no delivery option for this address.");
      }
    } catch (error) {
      setShippingError(
        error instanceof Error ? error.message : "Unable to calculate delivery.",
      );
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleShippingSelect = async (option: ShopifyDeliveryOption) => {
    if (!checkoutSession) return;
    setIsLoadingShipping(true);
    setShippingError("");
    try {
      const checkoutUrl = await selectShopifyDeliveryOption(checkoutSession.cartId, option);
      setCheckoutSession({ ...checkoutSession, checkoutUrl });
      setSelectedShipping(option);
      setShowShippingModal(false);
    } catch (error) {
      setShippingError(
        error instanceof Error ? error.message : "Unable to select delivery.",
      );
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (bagItems.length === 0) {
      return;
    }
    if (!selectedShipping || !checkoutSession) {
      void loadShippingOptions();
      return;
    }
    router.push({
      pathname: "/checkout/payment",
      params: {
        shippingCost: selectedShipping.amount.toString(),
        shippingTitle: selectedShipping.title,
        shippingDuration: selectedShipping.description || "Calculated by Shopify",
        deliveryGroupId: selectedShipping.groupId,
        deliveryHandle: selectedShipping.handle,
        deliveryCurrencyCode: selectedShipping.currencyCode,
        shopifyCartId: checkoutSession.cartId,
        shopifyCheckoutUrl: checkoutSession.checkoutUrl,
      },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
        <Ionicons name="menu" size={24} color={isDark ? "#ffffff" : "#000000"} />
        <BrandLogo width={154} height={28} />
        <Pressable onPress={() => router.push("/search" as any)}>
          <Ionicons name="search" size={24} color={isDark ? "#ffffff" : "#000000"} />
        </Pressable>
      </View>

      <View className="px-6 pb-6 pt-3">
        <Text className="mb-2 font-light text-xs tracking-widest text-gray-400 dark:text-gray-500">
          YOUR SELECTION
        </Text>
        <Text className="font-bold text-4xl tracking-tight text-black dark:text-white">
          Shopping Bag
        </Text>
      </View>

      {bagItems.length > 0 ? (
        <>
          {/* Scrollable Products Section */}
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 340 }}
          >
            <View className="mb-5 flex-row items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
              <Text className="font-medium text-xs tracking-wider text-gray-500 dark:text-gray-400">
                {bagItems.length} ITEM{bagItems.length === 1 ? "" : "S"}
              </Text>
            </View>
            <View className="gap-6">
              {bagItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row gap-4 border-b border-gray-100 pb-6 dark:border-white/10"
                >
                  {/* Product Image */}
                  <View className="h-32 w-28 overflow-hidden bg-gray-100 dark:bg-[#101215]">
                    <Image
                      source={
                        typeof item.image === "string"
                          ? { uri: item.image }
                          : item.image
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Product Info */}
                  <View className="flex-1 py-1 pr-2">
                    <Text className="mb-1 font-bold text-[15px] leading-5 text-black dark:text-white" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text className="mb-4 font-normal text-[11px] tracking-[0.5px] text-neutral-400 dark:text-neutral-500">
                      {item.size ? (
                        <>
                          Size: <Text preserveCase className="uppercase">{item.size}</Text>{" "}
                          •{" "}
                        </>
                      ) : null}
                      {item.color || "Standard"}
                    </Text>

                    {/* Quantity and Price */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-gray-100 px-1 py-1 dark:bg-white/10">
                        <Pressable
                          onPress={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Text className="px-2 font-bold text-sm text-black dark:text-white">
                            -
                          </Text>
                        </Pressable>
                        <Text className="w-6 text-center font-normal text-sm text-black dark:text-white">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Text className="px-2 font-bold text-sm text-black dark:text-white">
                            +
                          </Text>
                        </Pressable>
                      </View>

                      <Text className="font-bold text-sm text-black dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <Pressable
                    onPress={() => removeFromBag(item.id)}
                    className="h-8 w-8 items-center justify-center"
                  >
                    <Ionicons name="close" size={20} color={isDark ? "#cbd5e1" : "#94a3b8"} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Spacer for bottom overlay */}
            {/* <View className="h-32" /> */}
          </ScrollView>

          {/* Bottom Pricing Section with Curved Top - Full Width */}
          <View className="absolute bottom-16 left-0 right-0 rounded-t-lg border-t border-gray-100 bg-white pb-5 dark:border-white/10 dark:bg-[#101215]">
            <View className="px-6 pt-6">
              {/* Subtotal */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-normal text-sm text-gray-600 dark:text-neutral-400">
                  Subtotal
                </Text>
                <Text className="font-bold text-sm text-black dark:text-white">
                  {formatPrice(subtotal)}
                </Text>
              </View>

              {/* Shipping */}
              <Pressable
                onPress={() => void loadShippingOptions()}
                className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-white/10"
              >
                <View>
                  <Text className="font-normal text-sm text-gray-600 dark:text-neutral-400">
                    Shipping
                  </Text>
                  <Text className="mt-1 max-w-[230px] font-normal text-[10px] text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
                    {selectedShipping?.title ?? "Select delivery for your address"}
                  </Text>
                </View>
                <Text className="font-bold text-sm text-black dark:text-white">
                  {selectedShipping ? formatPrice(shippingCost) : "--"}
                </Text>
              </Pressable>

              {/* Total */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="font-bold text-base text-black dark:text-white">
                  Total
                </Text>
                <Text className="font-bold text-lg text-black dark:text-white">
                  {formatPrice(total)}
                </Text>
              </View>
            </View>

            {/* Proceed to Checkout Button - Full Width */}
            <Pressable
              onPress={handleProceedToCheckout}
              className="mx-6 rounded-lg bg-black py-4 dark:bg-white"
            >
              <Text className="font-bold text-xs text-white text-center tracking-widest dark:text-black">
                PROCEED TO CHECKOUT
              </Text>
            </Pressable>

            {/* Footer Text */}
            <View className="mb-2 px-6">
              <Text className="font-light text-xs text-gray-500 text-center mt-3 dark:text-neutral-400">
                Free returns on all orders within 30 days
              </Text>
            </View>
          </View>

          {/* Shipping Modal */}
          <Modal
            visible={showShippingModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowShippingModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white dark:bg-[#101215] rounded-t-3xl px-6 pt-6 pb-8 max-h-[80%]">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="font-bold text-lg text-black dark:text-white">
                    Select Shipping
                  </Text>
                  <Pressable onPress={() => setShowShippingModal(false)}>
                    <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#000"} />
                  </Pressable>
                </View>

                {/* Shipping Options */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="gap-4">
                    {isLoadingShipping ? (
                      <View className="items-center py-8">
                        <ActivityIndicator color={isDark ? "#ffffff" : "#111111"} />
                        <Text className="mt-3 text-xs text-gray-500 dark:text-neutral-400">
                          Loading live Shopify delivery rates...
                        </Text>
                      </View>
                    ) : shippingError ? (
                      <View className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/30">
                        <Text className="text-sm leading-5 text-red-700 dark:text-red-300">
                          {shippingError}
                        </Text>
                        {!defaultAddress ? (
                          <Pressable
                            onPress={() => {
                              setShowShippingModal(false);
                              router.push("/profile/shipping-addresses" as any);
                            }}
                            className="mt-4"
                          >
                            <Text className="font-bold text-xs text-red-700 dark:text-red-300">
                              ADD ADDRESS
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable onPress={() => void loadShippingOptions()} className="mt-4">
                            <Text className="font-bold text-xs text-red-700 dark:text-red-300">
                              RETRY
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : deliveryOptions.map((option) => (
                      <Pressable
                        key={`${option.groupId}-${option.handle}`}
                        onPress={() => void handleShippingSelect(option)}
                        className={`flex-row items-center gap-3 p-4 rounded-2xl ${
                          selectedShipping?.handle === option.handle
                            ? "bg-slate-100 dark:bg-white/10"
                            : "bg-gray-50 dark:bg-white/5"
                        }`}
                      >
                        {/* Radio Button */}
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            selectedShipping?.handle === option.handle
                              ? "bg-slate-500 border-slate-500 dark:bg-white dark:border-white"
                              : "border-gray-300 dark:border-white/25"
                          }`}
                        >
                          {selectedShipping?.handle === option.handle && (
                            <View className="w-2 h-2 bg-white rounded-full dark:bg-black" />
                          )}
                        </View>

                        {/* Option Details */}
                        <View className="flex-1">
                          <Text
                            className={`font-bold text-sm ${
                              selectedShipping?.handle === option.handle
                                ? "text-black dark:text-white"
                                : "text-gray-700 dark:text-neutral-300"
                            }`}
                          >
                            {option.title}
                          </Text>
                          <Text className="font-normal text-xs text-gray-500 dark:text-neutral-400 mt-1">
                            {option.description || "Live rate from Shopify"}
                          </Text>
                        </View>

                        {/* Price */}
                        <Text className="font-bold text-sm text-black dark:text-white">
                          {formatPrice(option.amount)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        /* Empty Bag State */
        <ScrollView
          className="flex-1 bg-white px-6 dark:bg-[#050505]"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View className="items-center border-t border-gray-100 pt-12 dark:border-white/10">
            <View className="h-20 w-20 items-center justify-center bg-gray-100 dark:bg-[#101215]">
              <Ionicons name="bag-outline" size={34} color={isDark ? "#ffffff" : "#000000"} />
            </View>
            <Text className="mt-7 text-center font-bold text-2xl text-black dark:text-white">
              Your bag is empty
            </Text>
            <Text className="mt-3 max-w-[290px] text-center font-normal text-sm leading-6 text-gray-500 dark:text-gray-400">
              Explore the collection and add the pieces you want to make your own.
            </Text>

            <Pressable
              onPress={() => router.push("/(tabs)/shop" as any)}
              className="mt-8 w-full rounded-lg bg-black px-8 py-4 dark:bg-white"
            >
              <Text className="text-center font-bold text-[11px] tracking-[2.4px] text-white dark:text-black">
                CONTINUE SHOPPING
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/favorites" as any)}
              className="mt-3 w-full rounded-lg border border-gray-200 px-8 py-4 dark:border-white/15"
            >
              <Text className="text-center font-bold text-[11px] tracking-[2.2px] text-black dark:text-white">
                VIEW WISHLIST
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Bag;
