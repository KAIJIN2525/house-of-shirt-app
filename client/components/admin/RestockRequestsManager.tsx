import { AppText as Text } from "@/components/AppText";
import { HouseFeedbackModal } from "@/components/feedback/HouseFeedbackModal";
import { HouseLoader } from "@/components/loading/HouseLoader";
import { Product } from "@/constants/products";
import { supabase } from "@/lib/supabase";
import { useProductsStore } from "@/stores/productsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Channel = "app" | "push" | "email" | "sms";

const REQUEST_TIMEOUT_MS = 15000;

async function withTimeout<T>(request: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "The request timed out. Check your connection and try again.",
              ),
            ),
          REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface RestockRequest {
  id: string;
  user_id: string;
  product_id: string;
  shopify_product_id?: string | null;
  product_title: string;
  size: string;
  email?: string | null;
  phone?: string | null;
  notification_channels?: Channel[] | null;
  notification_attempts?: number;
  status: string;
  created_at: string;
  profile?: {
    email?: string | null;
    full_name?: string | null;
    phone?: string | null;
  };
}

interface DispatchReport {
  requestId?: string;
  channels: Record<
    "email" | "sms" | "push" | "app" | "admin",
    "sent" | "failed" | "skipped"
  >;
  errors?: Record<string, string | null>;
}

const findProduct = (request: RestockRequest, products: Product[]) =>
  products.find(
    (product) =>
      String(product.id) === String(request.product_id) ||
      String(product.id) === String(request.shopify_product_id),
  );

const getStock = (request: RestockRequest, products: Product[]) => {
  const product = findProduct(request, products);
  if (!product) {
    return {
      ready: false,
      quantity: 0,
      reason: "Product is missing from the synced catalog",
    };
  }
  const option = product.sizeOptions?.find(
    (size) =>
      size.value.trim().toLowerCase() === request.size.trim().toLowerCase(),
  );
  if (!option) {
    return {
      ready: false,
      quantity: 0,
      reason: "Requested size is missing from the synced catalog",
    };
  }
  const ready = option.available && option.inventoryQuantity > 0;
  return {
    ready,
    quantity: option.inventoryQuantity,
    reason: ready ? "" : "This variant is still out of stock",
  };
};

const customerName = (request: RestockRequest) =>
  request.profile?.full_name ||
  request.profile?.email?.split("@")[0] ||
  request.email?.split("@")[0] ||
  "Customer";

const RequestCard = memo(function RequestCard({
  request,
  stock,
  sending,
  onNotify,
}: {
  request: RestockRequest;
  stock: ReturnType<typeof getStock>;
  sending: boolean;
  onNotify: (request: RestockRequest) => void;
}) {
  return (
    <View className="mb-3 bg-white px-5 py-5 dark:bg-[#101215]">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[9px] font-bold tracking-[1.3px] text-neutral-400">
            SIZE {request.size.toUpperCase()}
          </Text>
          <Text className="mt-2 text-[19px] font-bold text-black dark:text-white">
            {request.product_title}
          </Text>
          <Text
            preserveCase
            className="mt-2 text-[12px] text-neutral-600 dark:text-neutral-300"
          >
            {customerName(request)}
          </Text>
        </View>
        <View
          className={`px-3 py-2 ${
            stock.ready
              ? "bg-green-50 dark:bg-green-950"
              : "bg-amber-50 dark:bg-amber-950"
          }`}
        >
          <Text
            className={`text-[8px] font-bold tracking-[1px] ${
              stock.ready
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {stock.ready ? `${stock.quantity} AVAILABLE` : "NOT READY"}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-neutral-100 pt-4 dark:border-white/10">
        <Text
          preserveCase
          className="max-w-[58%] text-[10px] leading-4 text-neutral-500 dark:text-neutral-400"
        >
          {stock.ready
            ? `${(request.notification_channels ?? ["app", "push", "email"]).join(", ")} notification`
            : stock.reason}
        </Text>
        <Pressable
          disabled={sending || !stock.ready}
          onPress={() => onNotify(request)}
          className={`min-w-[132px] items-center px-4 py-3 ${
            stock.ready
              ? "bg-black dark:bg-white"
              : "bg-neutral-200 dark:bg-white/10"
          }`}
        >
          <Text
            className={`text-[9px] font-bold tracking-[1.2px] ${
              stock.ready ? "text-white dark:text-black" : "text-neutral-400"
            }`}
          >
            {sending
              ? "SENDING..."
              : stock.ready
                ? "NOTIFY CUSTOMER"
                : "AWAITING STOCK"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

export function RestockRequestsManager() {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const { products, fetchProducts } = useProductsStore();
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const pending = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );
  const filtered = useMemo(
    () =>
      pending.filter(
        (request) =>
          (!selectedProduct || request.product_title === selectedProduct) &&
          (!selectedSize || request.size === selectedSize),
      ),
    [pending, selectedProduct, selectedSize],
  );
  const readyFiltered = useMemo(
    () => filtered.filter((request) => getStock(request, products).ready),
    [filtered, products],
  );
  const productFilters = useMemo(
    () => [...new Set(pending.map((request) => request.product_title))].sort(),
    [pending],
  );
  const sizeFilters = useMemo(
    () => [...new Set(pending.map((request) => request.size))].sort(),
    [pending],
  );

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      void fetchProducts();
      const { data, error } = await withTimeout(
        supabase
          .from("back_in_stock_requests")
          .select("*")
          .order("created_at", { ascending: false }),
      );
      if (error) throw error;
      const rows = (data ?? []) as RestockRequest[];
      const ids = [...new Set(rows.map((request) => request.user_id))];
      const profiles = ids.length
        ? ((
            await supabase
              .from("profiles")
              .select("id, email, full_name, phone")
              .in("id", ids)
          ).data ?? [])
        : [];
      const profileMap = new Map(
        profiles.map((profile: any) => [profile.id, profile]),
      );
      setRequests(
        rows.map((request) => ({
          ...request,
          profile: profileMap.get(request.user_id),
        })),
      );
    } catch (error) {
      setFeedback({
        type: "error",
        title: "Could not load requests",
        message: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const dispatch = useCallback(
    async (targets: RestockRequest[]) => {
      const ready = targets.filter(
        (request) => getStock(request, products).ready,
      );
      if (!ready.length) {
        setFeedback({
          type: "info",
          title: "Stock is not ready",
          message:
            "Sync inventory first. Notifications are blocked until the exact requested variants have stock.",
        });
        return;
      }

      setActiveIds(ready.map((request) => request.id));
      try {
        const { data, error } = await supabase.functions.invoke(
          "notify-customers",
          {
            body: {
              messageType: "restock",
              customers: ready.map((request) => ({
                requestId: request.id,
                userId: request.user_id,
                productId: request.product_id,
                name: customerName(request),
                email: request.email || request.profile?.email || undefined,
                phone: request.phone || request.profile?.phone || undefined,
                customMessage: `${request.product_title} in size ${request.size} is available again. Open House of Shirts to secure it before it sells out.`,
                notificationChannels: request.notification_channels?.length
                  ? request.notification_channels
                  : ["app", "push", "email"],
              })),
            },
          },
        );
        if (error) throw error;

        const reports = (data?.reports ?? []) as DispatchReport[];
        let delivered = 0;
        let failed = 0;
        await Promise.all(
          ready.map(async (request) => {
            const report = reports.find(
              (item) => item.requestId === request.id,
            );
            const succeeded = report
              ? ["email", "sms", "push", "app"].some(
                  (channel) =>
                    report.channels[channel as keyof typeof report.channels] ===
                    "sent",
                )
              : false;
            const errorMessage =
              report?.errors?.delivery ||
              (!report
                ? "No delivery report returned by notification service"
                : null);
            const { error: updateError } = await supabase
              .from("back_in_stock_requests")
              .update({
                status: succeeded ? "notified" : "pending",
                notified_at: succeeded ? new Date().toISOString() : null,
                notification_attempts:
                  Number(request.notification_attempts ?? 0) + 1,
                last_attempt_at: new Date().toISOString(),
                last_error: succeeded ? null : errorMessage,
                delivery_report: report ?? {},
              })
              .eq("id", request.id);
            if (updateError) throw updateError;
            if (succeeded) delivered += 1;
            else failed += 1;
          }),
        );

        setFeedback({
          type: delivered > 0 ? "success" : "error",
          title:
            delivered > 0
              ? "Restock delivery completed"
              : "No notifications delivered",
          message: `${delivered} customer${delivered === 1 ? "" : "s"} reached.${
            failed
              ? ` ${failed} request${failed === 1 ? "" : "s"} remain pending for retry.`
              : ""
          }`,
        });
        await fetchRequests();
      } catch (error) {
        setFeedback({
          type: "error",
          title: "Notification failed",
          message:
            error instanceof Error
              ? error.message
              : "Requests remain pending for retry.",
        });
      } finally {
        setActiveIds([]);
      }
    },
    [fetchRequests, products],
  );

  const confirmBulk = () => {
    if (!readyFiltered.length) {
      void dispatch(filtered);
      return;
    }
    Alert.alert(
      "Notify restock customers?",
      `${readyFiltered.length} customer${readyFiltered.length === 1 ? "" : "s"} will be contacted for variants confirmed in stock.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Notify", onPress: () => void dispatch(readyFiltered) },
      ],
    );
  };

  const header = (
    <View>
      <View className="mb-6 bg-white px-5 py-6 dark:bg-[#101215]">
        <Text className="text-[10px] font-bold tracking-[1.4px] text-neutral-400">
          PENDING CUSTOMERS
        </Text>
        <Text className="mt-3 text-[44px] font-bold leading-[44px] text-black dark:text-white">
          {String(pending.length).padStart(2, "0")}
        </Text>
        <View className="mt-5 flex-row gap-2">
          <View className="flex-1 bg-green-50 px-3 py-3 dark:bg-green-950">
            <Text className="text-[9px] font-bold text-green-600 dark:text-green-400">
              READY TO NOTIFY
            </Text>
            <Text className="mt-1 text-[18px] font-bold text-black dark:text-white">
              {
                pending.filter((request) => getStock(request, products).ready)
                  .length
              }
            </Text>
          </View>
          <View className="flex-1 bg-amber-50 px-3 py-3 dark:bg-amber-950">
            <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
              AWAITING STOCK
            </Text>
            <Text className="mt-1 text-[18px] font-bold text-black dark:text-white">
              {
                pending.filter((request) => !getStock(request, products).ready)
                  .length
              }
            </Text>
          </View>
        </View>
      </View>

      {pending.length ? (
        <View className="mb-6 bg-white px-5 py-5 dark:bg-[#101215]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-bold tracking-[1.5px] text-neutral-400">
              FILTER REQUESTS
            </Text>
            {selectedProduct || selectedSize ? (
              <Pressable
                onPress={() => {
                  setSelectedProduct("");
                  setSelectedSize("");
                }}
              >
                <Text className="text-[9px] font-bold text-red-500">
                  CLEAR ALL
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text className="mb-2 mt-5 text-[9px] font-bold text-neutral-400">
            PRODUCTS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {productFilters.map((product) => (
              <Pressable
                key={product}
                onPress={() =>
                  setSelectedProduct(selectedProduct === product ? "" : product)
                }
                className={`mr-2 border px-3 py-2 ${
                  selectedProduct === product
                    ? "border-black bg-black dark:border-white dark:bg-white"
                    : "border-neutral-200 dark:border-white/10"
                }`}
              >
                <Text
                  className={`text-[9px] font-bold ${
                    selectedProduct === product
                      ? "text-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {product}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text className="mb-2 mt-4 text-[9px] font-bold text-neutral-400">
            SIZES
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sizeFilters.map((size) => (
              <Pressable
                key={size}
                onPress={() =>
                  setSelectedSize(selectedSize === size ? "" : size)
                }
                className={`mr-2 border px-3 py-2 ${
                  selectedSize === size
                    ? "border-black bg-black dark:border-white dark:bg-white"
                    : "border-neutral-200 dark:border-white/10"
                }`}
              >
                <Text
                  className={`text-[9px] font-bold ${
                    selectedSize === size
                      ? "text-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  SIZE {size}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            disabled={activeIds.length > 0 || !filtered.length}
            onPress={confirmBulk}
            className="mt-5 items-center bg-black px-4 py-4 dark:bg-white"
          >
            <Text className="text-[10px] font-bold tracking-[1.3px] text-white dark:text-black">
              {activeIds.length
                ? "SENDING..."
                : `NOTIFY READY FILTERED (${readyFiltered.length})`}
            </Text>
          </Pressable>
          {readyFiltered.length !== filtered.length ? (
            <Text
              preserveCase
              className="mt-3 text-center text-[9px] text-neutral-500 dark:text-neutral-400"
            >
              {filtered.length - readyFiltered.length} filtered request(s)
              remain blocked until stock is available.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={isDark ? "#fff" : "#111"}
          />
        </Pressable>
        <Text className="text-[11px] font-bold tracking-[1.5px] text-black dark:text-white">
          RESTOCK REQUESTS
        </Text>
        <Pressable onPress={() => void fetchRequests()}>
          <Ionicons name="refresh" size={18} color={isDark ? "#fff" : "#111"} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(request) => request.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            stock={getStock(item, products)}
            sending={activeIds.includes(item.id)}
            onNotify={(request) => void dispatch([request])}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <HouseLoader label="LOADING REQUESTS" />
          ) : (
            <View className="bg-white px-5 py-8 dark:bg-[#101215]">
              <Text className="text-[19px] font-bold text-black dark:text-white">
                No pending requests
              </Text>
              <Text className="mt-3 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                New “Notify Me” requests will appear here.
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && requests.length > 0}
            onRefresh={fetchRequests}
            tintColor={isDark ? "#fff" : "#111"}
          />
        }
      />

      <HouseFeedbackModal
        visible={Boolean(feedback)}
        type={feedback?.type ?? "info"}
        title={feedback?.title ?? ""}
        message={feedback?.message}
        onRequestClose={() => setFeedback(null)}
        primaryAction={{ label: "Close", onPress: () => setFeedback(null) }}
      />
    </SafeAreaView>
  );
}
