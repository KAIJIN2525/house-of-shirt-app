import { formatPrice } from "@/constants";
import { useOrdersStore } from "@/stores/ordersStore";
import { ReturnRequestType, useReturnsStore } from "@/stores/returnsStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

const RETURN_REASONS = [
  "Too large in shoulders",
  "Fabric texture different than expected",
  "Arrived with damage",
  "Changed my mind",
];

export default function InitiateReturnScreen() {
  const router = useRouter();
  const {  createRequest  } = useReturnsStore();
  const {  orders, getOrderById  } = useOrdersStore();
  const { id, type } = useLocalSearchParams<{ id: string; type?: ReturnRequestType }>();
  const order = getOrderById(id) ?? orders.find((item) => item.id === id);
  const requestType: ReturnRequestType = type === "exchange" ? "exchange" : "return";

  const returnItems = useMemo(() => {
    if (!order) {
      return [];
    }

    if (order.lineItems?.length) {
      return order.lineItems.map((item, index) => ({
        id: item.id || `${order.id}-${index}`,
        title: item.title,
        subtitle: [item.variantTitle, `Qty: ${item.quantity}`].filter(Boolean).join(" | "),
        price: item.price,
        image: item.image || order.image,
      }));
    }

    return [
      {
        id: `${order.id}-1`, 
        title: order.title,
        subtitle: order.subtitle,
        price: order.subtotal || order.total,
        image: order.image,
      },
    ];
  }, [order]);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  React.useEffect(() => {
    setSelectedItems((current) => {
      const availableIds = new Set(returnItems.map((item) => item.id));
      const stillValid = current.length > 0 && current.every((itemId) => availableIds.has(itemId));

      if (stillValid) {
        return current;
      }

      return returnItems[0] ? [returnItems[0].id] : [];
    });
  }, [returnItems]);
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [comments, setComments] = useState("");

  const toggleItem = (itemId: string) => {
    setSelectedItems((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  };

  const handleSubmitReturn = async () => {
    if (!order || selectedItems.length === 0) {
      return;
    }

    const requestItems = returnItems
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({ ...item, reason: selectedReason }));
    const firstSelectedItem = requestItems[0];

    const request = await createRequest({
      orderId: order.id,
      type: requestType,
      itemTitle: firstSelectedItem.title,
      itemSubtitle: firstSelectedItem.subtitle,
      itemPrice: firstSelectedItem.price,
      itemImage: firstSelectedItem.image,
      reason: selectedReason,
      comments,
      items: requestItems,
    });

    router.push(`/returns/status/${request.id}` as any);
  };

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f6f8] px-6">
        <Text className="text-center font-bold text-xl text-black">Order not found</Text>
        <Text className="mt-3 text-center text-sm text-neutral-500">We could not find this order for a return or exchange.</Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-black px-6 py-3">
          <Text className="font-bold text-white">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111111" />
          </Pressable>
          <Text className="font-bold text-[14px] text-black">
            Return Status
          </Text>
          <View className="w-6" />
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            ORDER #{order.id}
          </Text>
          <Text className="mt-2 font-bold text-[34px] leading-9 text-black">
            Select items to {requestType === "exchange" ? "Exchange" : "Return"}
          </Text>
          <Text className="mt-3 font-normal text-[14px] leading-6 text-neutral-400">
            Please select the garments you wish to return from your recent
            Atelier purchase. Each return is handled with the same precision as
            our tailoring.
          </Text>
        </View>

        <View className="mt-8 px-4">
          <View className="rounded-[28px] bg-white px-4 py-4">
            <View className="gap-4">
              {returnItems.map((item) => {
                const selected = selectedItems.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleItem(item.id)}
                    className="flex-row gap-3"
                  >
                    <View
                      className={`mt-1 h-4 w-4 items-center justify-center border ${
                        selected ? "border-black bg-black" : "border-gray-300"
                      }`}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      ) : null}
                    </View>

                    <Image
                      source={{ uri: item.image }}
                      className="h-20 w-16 bg-gray-100"
                      resizeMode="cover"
                    />

                    <View className="flex-1">
                      <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                        {requestType === "exchange" ? "EXCHANGE ITEM" : "RETURN ITEM"}
                      </Text>
                      <Text className="mt-1 font-bold text-[22px] leading-6 text-black">
                        {item.title}
                      </Text>
                      <Text className="mt-1 font-normal text-[12px] text-neutral-400">
                        {item.subtitle}
                      </Text>
                      <Text className="mt-3 font-bold text-[16px] text-black">
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-bold text-[11px] tracking-[2px] text-neutral-400">
            REASON FOR RETURN
          </Text>
        </View>

        <View className="mt-4 px-6">
          <View className="overflow-hidden border border-gray-200 bg-white">
            {RETURN_REASONS.map((reason, index) => {
              const selected = selectedReason === reason;

              return (
                <Pressable
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  className={`flex-row items-center justify-between px-4 py-4 ${
                    index !== RETURN_REASONS.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <Text className="font-normal text-[14px] text-neutral-600">
                    {reason}
                  </Text>
                  <View
                    className={`h-4 w-4 rounded-full border ${
                      selected ? "border-black" : "border-gray-300"
                    }`}
                  >
                    {selected ? (
                      <View className="m-[3px] h-2 w-2 rounded-full bg-black" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-bold text-[11px] tracking-[2px] text-neutral-400">
            ADDITIONAL COMMENTS (OPTIONAL)
          </Text>
          <TextInput
            value={comments}
            onChangeText={setComments}
            multiline
            textAlignVertical="top"
            className="mt-4 min-h-28 bg-white px-4 py-4 font-normal text-[13px] text-neutral-500"
            placeholder="Provide more details for our tailors..."
            placeholderTextColor="#b8bcc5"
          />
        </View>

        <View className="mt-8 px-6">
          <Pressable onPress={handleSubmitReturn} className="bg-[#131926] py-4">
            <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
              SUBMIT {requestType === "exchange" ? "EXCHANGE" : "RETURN"}
            </Text>
          </Pressable>

          <Text className="mt-4 text-center font-normal text-[11px] leading-5 text-neutral-400">
            By submitting you agree to our Return Policy. Refunds are processed
            within 5-7 business days.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
