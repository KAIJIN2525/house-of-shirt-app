import { formatPrice } from "@/constants";
import { supabase } from "@/lib/supabase";
import { useAddressStore } from "@/stores/addressStore";
import { useAuthStore } from "@/stores/authStore";
import { useBagStore } from "@/stores/bagStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";
import {
  createShopifyCheckout,
  selectShopifyDeliveryOption,
  type ShopifyCheckoutSession,
  type ShopifyDeliveryOption,
} from "@/services/shopify-storefront";
import {
  ensureShopifyCustomerAccessToken,
  hasShopifyCustomerAccountConfig,
} from "@/services/shopify-customer-auth";
import {
  type CheckoutCompletedEvent,
  useShopifyCheckoutSheet,
} from "@shopify/checkout-sheet-kit";

const CheckoutPaymentScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    shippingCost?: string | string[];
    shippingTitle?: string | string[];
    shippingDuration?: string | string[];
    deliveryGroupId?: string | string[];
    deliveryHandle?: string | string[];
    deliveryCurrencyCode?: string | string[];
    shopifyCartId?: string | string[];
    shopifyCheckoutUrl?: string | string[];
  }>();
  const { user } = useAuthStore();
  const {  bagItems, getTotalPrice, clearBag  } = useBagStore();
  const {  getDefaultAddress  } = useAddressStore();
  const shopifyCheckout = useShopifyCheckoutSheet();
  const {  isDark  } = useThemeStore();

  const defaultAddress = getDefaultAddress();

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const routeValue = (value?: string | string[]) =>
    (Array.isArray(value) ? value[0] : value)?.trim() || "";
  const initialDelivery = useMemo<ShopifyDeliveryOption | null>(() => {
    const groupId = routeValue(params.deliveryGroupId);
    const handle = routeValue(params.deliveryHandle);
    if (!groupId || !handle) return null;
    const amount = Number(routeValue(params.shippingCost));
    return {
      groupId,
      handle,
      title: routeValue(params.shippingTitle) || "Delivery",
      description: routeValue(params.shippingDuration) || undefined,
      amount: Number.isFinite(amount) ? amount : 0,
      currencyCode: routeValue(params.deliveryCurrencyCode) || "NGN",
    };
  }, [
    params.deliveryCurrencyCode,
    params.deliveryGroupId,
    params.deliveryHandle,
    params.shippingCost,
    params.shippingDuration,
    params.shippingTitle,
  ]);
  const initialCheckoutSession = useMemo<ShopifyCheckoutSession | null>(() => {
    const cartId = routeValue(params.shopifyCartId);
    const checkoutUrl = routeValue(params.shopifyCheckoutUrl);
    if (!cartId || !checkoutUrl || !initialDelivery) return null;
    return { cartId, checkoutUrl, deliveryOptions: [initialDelivery] };
  }, [initialDelivery, params.shopifyCartId, params.shopifyCheckoutUrl]);
  const [checkoutSession, setCheckoutSession] = useState<ShopifyCheckoutSession | null>(
    initialCheckoutSession,
  );
  const [selectedDelivery, setSelectedDelivery] = useState<ShopifyDeliveryOption | null>(
    initialDelivery,
  );
  const [checkoutError, setCheckoutError] = useState("");
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(false);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "ATELIER10") {
      setDiscount(subtotal * 0.1);
    } else {
      setDiscount(0);
    }
  };

  const quotedShippingCost = useMemo(() => {
    const value = Array.isArray(params.shippingCost)
      ? params.shippingCost[0]
      : params.shippingCost;
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [params.shippingCost]);
  const quotedShippingTitle = useMemo(() => {
    const value = Array.isArray(params.shippingTitle)
      ? params.shippingTitle[0]
      : params.shippingTitle;
    return value?.trim() || "Selected delivery";
  }, [params.shippingTitle]);
  const quotedShippingDuration = useMemo(() => {
    const value = Array.isArray(params.shippingDuration)
      ? params.shippingDuration[0]
      : params.shippingDuration;
    return value?.trim() || "Delivery timeframe confirmed at checkout";
  }, [params.shippingDuration]);
  const shippingCost = selectedDelivery?.amount ?? quotedShippingCost;
  const subtotal = getTotalPrice();
  const total = subtotal + shippingCost - discount;

  useEffect(() => {
    const completed = shopifyCheckout.addEventListener(
      "completed",
      async (event: CheckoutCompletedEvent) => {
        await clearBag();
        const orderId = event.orderDetails.id;
        const checkoutTotal = event.orderDetails.cart.price.total?.amount ?? total;
        router.replace({
          pathname: "/checkout/success",
          params: {
            orderNumber: orderId,
            total: String(checkoutTotal),
            itemName: "Shopify order",
            itemPrice: String(event.orderDetails.cart.price.subtotal?.amount ?? subtotal),
            tailoringFee: String(event.orderDetails.cart.price.shipping?.amount ?? shippingCost),
          },
        } as any);
      },
    );
    const failed = shopifyCheckout.addEventListener("error", (error: { message?: string }) => {
      setIsProcessingPayment(false);
      setCheckoutError(error.message || "Shopify checkout could not be opened.");
    });
    return () => {
      completed?.remove();
      failed?.remove();
    };
  }, [clearBag, router, shippingCost, shopifyCheckout, subtotal, total]);

  const shippingLines = useMemo(() => {
    if (!defaultAddress) {
      return [
        "No default shipping address saved yet.",
        "Add one from your profile to complete checkout.",
      ];
    }

    return [
      defaultAddress.address,
      `${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}`,
      defaultAddress.phoneNumber,
    ];
  }, [defaultAddress]);

  const prepareCheckout = useCallback(async (customerAccessToken?: string) => {
    if (!defaultAddress || bagItems.length === 0) return null;
    setIsLoadingDelivery(true);
    setCheckoutError("");
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
        customerAccessToken,
      });
      if (session.deliveryOptions.length === 0) {
        throw new Error("Shopify returned no delivery option for this address.");
      }
      const normalizedShippingTitle = quotedShippingTitle.toLowerCase();
      const delivery =
        session.deliveryOptions.find(
          (option) =>
            option.amount === quotedShippingCost ||
            option.title.toLowerCase().includes(normalizedShippingTitle) ||
            normalizedShippingTitle.includes(option.title.toLowerCase()),
        ) ?? session.deliveryOptions[0];
      const checkoutUrl = await selectShopifyDeliveryOption(session.cartId, delivery);
      const readySession = { ...session, checkoutUrl };
      setCheckoutSession(readySession);
      setSelectedDelivery(delivery);
      shopifyCheckout.preload(checkoutUrl);
      return readySession;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to prepare Shopify checkout.";
      setCheckoutError(message);
      return null;
    } finally {
      setIsLoadingDelivery(false);
    }
  }, [
    bagItems,
    defaultAddress,
    quotedShippingCost,
    quotedShippingTitle,
    shopifyCheckout,
    user?.email,
  ]);

  const handlePlaceOrder = async () => {
    // Check if the current user is blacklisted before processing
    if (user?.email) {
      const { data: blacklistRecord } = await supabase
        .from("shopify_customers")
        .select("blacklisted, blacklist_reason")
        .eq("email", user.email.toLowerCase())
        .eq("blacklisted", true)
        .maybeSingle();

      if (blacklistRecord) {
        await supabase.functions.invoke("blacklist-order-alert", {
          body: {
            source: "blocked_checkout",
            orderId: "Blocked checkout attempt",
            customerEmail: user.email,
            customerName: defaultAddress?.fullName,
            customerPhone: defaultAddress?.phoneNumber,
            orderTotal: total,
          },
        });

        Alert.alert(
          "Order Restricted",
          "Your account has been restricted from placing orders. Please contact our support team for assistance.",
          [{ text: "OK" }],
        );
        return;
      }
    }

    if (!defaultAddress) {
      Alert.alert("Shipping address required", "Add a delivery address before checkout.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      let customerAccessToken: string | undefined;
      if (hasShopifyCustomerAccountConfig()) {
        const token = await ensureShopifyCustomerAccessToken();
        if (!token) return;
        customerAccessToken = token;
      }

      // Always create a fresh cart here: authenticated checkout URLs are
      // short-lived and must contain the current customer access token.
      const session = await prepareCheckout(customerAccessToken);
      if (!session) return;
      shopifyCheckout.present(session.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Shopify customer sign-in failed.";
      setCheckoutError(message);
      Alert.alert("Shopify sign-in", message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-5 pt-4">
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/search" as any)}>
            <Ionicons name="search" size={18} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-light text-[10px] tracking-[1.6px] text-gray-400">
            SECURE CHECK OUT
          </Text>
          <Text className="mt-2 font-bold text-[48px] leading-[48px] text-black dark:text-white">
            Finalize{"\n"}Order
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-bold text-[18px] text-black dark:text-white">
              Shipping Address
            </Text>
            <Pressable
              onPress={() => router.push("/profile/shipping-addresses" as any)}
            >
              <Text className="font-bold text-[10px] tracking-[1.3px] text-neutral-500">
                EDIT
              </Text>
            </Pressable>
          </View>

          <View className="rounded-[26px] bg-white px-5 py-5 dark:bg-[#101215]">
            <Text className="font-bold text-[16px] text-black dark:text-white">
              {defaultAddress?.fullName ?? "Julian V. Sterling"}
            </Text>

            {shippingLines.map((line, index) => (
              <Text
                key={`${line}-${index}`}
                className="mt-1 font-normal text-[12px] leading-5 text-neutral-500 dark:text-white"
              >
                {line}
              </Text>
            ))}

            <View className="mt-3 flex-row items-center gap-2">
              <Ionicons name="location-outline" size={14} color={isDark ? "#a3a3a3" : "#6b7280"} />
              <Text className="font-normal text-[11px] text-neutral-400 dark:text-white">
                Express delivery in 2-4 business days
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="mb-4 font-bold text-[18px] text-black dark:text-white">
            Delivery
          </Text>
          <View className="rounded-[20px] bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="font-bold text-[13px] text-black dark:text-white">
                  {quotedShippingTitle}
                </Text>
                <Text className="mt-2 text-[11px] leading-5 text-neutral-400">
                  {quotedShippingDuration}
                </Text>
              </View>
              <Text className="font-bold text-[13px] text-black dark:text-white">
                {formatPrice(quotedShippingCost)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="mb-4 font-bold text-[18px] text-black dark:text-white">
            Payment Method
          </Text>

          <View className="rounded-[26px] bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={isDark ? "#ffffff" : "#111111"}
              />
              <View className="flex-1">
                <Text className="font-bold text-[13px] text-black dark:text-white">
                  Choose securely in Shopify Checkout
                </Text>
                <Text className="mt-2 text-[11px] leading-5 text-neutral-400 dark:text-neutral-300">
                  Select Paystack/card or Cash on Delivery once on the next screen.
                  Available methods are determined live by Shopify for this order
                  and delivery address.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="mb-4 font-bold text-[18px] text-black dark:text-white">
            Order Summary
          </Text>

          <View className="mb-4 flex-row items-center justify-between rounded-[16px] bg-white px-4 py-2 dark:bg-[#101215]">
            <TextInput
              placeholder="Promo Code"
              placeholderTextColor="#9ca3af"
              value={promoCode}
              onChangeText={setPromoCode}
              className="flex-1 py-3 font-normal text-[12px] text-black dark:text-white"
            />
            <Pressable onPress={handleApplyPromo} className="bg-black px-4 py-2 rounded-lg dark:bg-white">
              <Text className="font-bold text-[10px] tracking-[1px] text-white dark:text-black">APPLY</Text>
            </Pressable>
          </View>

          <View className="rounded-[26px] bg-white px-5 py-5 dark:bg-[#101215]">
            {bagItems.map((item, index) => (
              <View key={`${item.id}-${index}`} className="mb-5 flex-row gap-3 border-b border-gray-100 pb-5">
                <Image
                  source={
                    typeof item.image === "string"
                      ? { uri: item.image }
                      : item.image
                  }
                  className="h-16 w-16 rounded-lg bg-gray-100"
                  resizeMode="cover"
                />

                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    className="font-bold text-[15px] text-black dark:text-white"
                  >
                    {item.name}
                  </Text>
                  <Text preserveCase className="mt-1 font-normal text-[11px] uppercase tracking-[1px] text-neutral-400">
                    Size {item.size ?? "L"} | Qty{" "}
                    {item.quantity}
                  </Text>
                  <Text className="mt-2 font-bold text-[12px] text-black dark:text-white">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[12px] text-neutral-400">
                  Subtotal
                </Text>
                <Text className="font-bold text-[12px] text-neutral-500">
                  {formatPrice(subtotal)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[12px] text-neutral-400">
                  Shipping
                </Text>
                <Text className="font-bold text-[12px] text-neutral-500">
                  {formatPrice(shippingCost)}
                </Text>
              </View>

              {discount > 0 && (
                <View className="flex-row items-center justify-between">
                  <Text className="font-normal text-[12px] text-[#3ca168]">
                    Discount Applied
                  </Text>
                  <Text className="font-bold text-[12px] text-[#3ca168]">
                    -{formatPrice(discount)}
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-5 flex-row items-center justify-between border-t border-gray-100 pt-4">
              <Text className="font-bold text-[18px] text-black dark:text-white">
                Total
              </Text>
              <Text className="font-bold text-[24px] text-black dark:text-white">
                {formatPrice(total)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <Pressable
            onPress={handlePlaceOrder}
            disabled={isProcessingPayment || isLoadingDelivery || bagItems.length === 0 || !defaultAddress}
            className={`bg-black py-4 flex-row justify-center items-center gap-2 ${
              isProcessingPayment || isLoadingDelivery || bagItems.length === 0 || !defaultAddress
                ? "opacity-50"
                : ""
            }`}
          >
            {isProcessingPayment && <ActivityIndicator color="#fff" size="small" />}
            <Text className="text-center font-bold text-[11px] tracking-[2.2px] text-white">
              {isProcessingPayment
                ? "OPENING SHOPIFY..."
                : isLoadingDelivery
                  ? "CALCULATING DELIVERY..."
                  : "CONTINUE TO SECURE CHECKOUT"}
            </Text>
          </Pressable>
          {checkoutError ? (
            <Text className="mt-3 text-center text-[11px] leading-5 text-red-600 dark:text-red-300">
              {checkoutError}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CheckoutPaymentScreen;
