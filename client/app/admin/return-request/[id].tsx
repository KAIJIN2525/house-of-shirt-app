import { formatPrice } from "@/constants";
import { useAdminCustomersStore } from "@/stores/adminCustomersStore";
import { useOrdersStore } from "@/stores/ordersStore";
import { useReturnsStore } from "@/stores/returnsStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import { BrandLogo } from "@/components/BrandLogo";

const statusCopy = {
  Requested: "Pending Review",
  "In Transit": "Approved",
  "Quality Check": "Inspection",
  Processed: "Processed",
  Rejected: "Rejected",
} as const;

export default function AdminReturnRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {  getRequestById, reviewRequest, addAdminNote, processRefund  } = useReturnsStore();
  const {  orders  } = useOrdersStore();
  const {  customers  } = useAdminCustomersStore();
  const {  isDark  } = useThemeStore();
  const [noteDraft, setNoteDraft] = useState("");
  const request = getRequestById(id);

  const order = useMemo(
    () => orders.find((item) => item.id === request?.orderId),
    [orders, request?.orderId]
  );

  const customer = useMemo(() => {
    if (!order?.customerName) {
      return undefined;
    }

    return customers.find(
      (item) => item.name.toLowerCase() === order.customerName.toLowerCase()
    );
  }, [customers, order?.customerName]);

  if (!request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f4f5f7] px-6">
        <Text className="font-bold text-[24px] text-black">
          Return request not found
        </Text>
      </SafeAreaView>
    );
  }

  const tax = Math.round(request.itemPrice * 0.09);
  const refundTotal = request.itemPrice + tax;
  const returnItems =
    request.items?.length
      ? request.items
      : [
          {
            id: request.id,
            title: request.itemTitle,
            subtitle: request.itemSubtitle,
            price: request.itemPrice,
            image: request.itemImage,
            reason: request.reason,
          },
        ];
  const itemCountLabel = `${returnItems.length} ${returnItems.length === 1 ? "Item" : "Items"} Total`;
  const requestTitle = request.type === "exchange" ? "EXCHANGE REQUEST" : "RETURN REQUEST";
  const approveLabel = request.type === "exchange" ? "APPROVE EXCHANGE" : "APPROVE RETURN";
  const notesTitle = request.type === "exchange" ? "ATELIER EXCHANGE NOTES" : "ATELIER INTERNAL NOTES";
  const processBoxTitle = request.type === "exchange" ? "REPLACEMENT ESTIMATE" : "REFUND ESTIMATE";
  const processButtonLabel =
    request.type === "exchange" ? "PREPARE REPLACEMENT MANUALLY" : "PROCESS REFUND MANUALLY";
  const statusHeading =
    request.type === "exchange" && request.status === "In Transit"
      ? "Approved Exchange"
      : statusCopy[request.status];
  const sanitizedPhone = (value?: string) => (value ?? "").replace(/[^\d+]/g, "");

  const handleSaveNote = async () => {
    await addAdminNote(request.id, noteDraft);
    setNoteDraft("");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/admin" as any)}>
            <Ionicons name="log-out-outline" size={18} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            RETURNS / {request.id.toUpperCase()}
          </Text>
          <Text className="mt-2 font-bold text-[42px] leading-[40px] text-black dark:text-white">
            {requestTitle}
          </Text>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="bg-[#eff1f4] px-3 py-2">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-[#4d5665]">
                {statusHeading.toUpperCase()}
              </Text>
            </View>
            <Text className="font-normal text-[12px] text-neutral-500">
              Requested {request.submittedAt}
            </Text>
          </View>

          <View className="mt-6 gap-3">
            <Pressable
              onPress={() => void reviewRequest(request.id, "reject")}
              className="border border-[#e6e8ec] bg-white px-5 py-4"
            >
              <Text className="text-center font-bold text-[11px] tracking-[1.6px] text-[#262a31]">
                REJECT REQUEST
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void reviewRequest(request.id, "approve")}
              className="bg-[#171d28] px-5 py-4"
            >
              <Text className="text-center font-bold text-[11px] tracking-[1.6px] text-white">
                {approveLabel}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5">
            <View className="mb-5 flex-row items-end justify-between">
              <Text className="font-bold text-[22px] text-[#2d3440]">
                ITEMS FOR RETURN
              </Text>
              <Text className="font-normal text-[11px] text-neutral-400">
                {itemCountLabel}
              </Text>
            </View>

            <View className="gap-8">
              {returnItems.map((item, index) => (
                <View key={item.id} className={index > 0 ? "border-t border-[#eef1f4] pt-8" : ""}>
                  <Image
                    source={{ uri: item.image }}
                    className="h-64 w-full bg-[#edf1f5]"
                    resizeMode="cover"
                  />

                  <View className="mt-5 flex-row items-start justify-between gap-4">
                    <Text className="flex-1 font-bold text-[18px] leading-6 text-[#2b3038]">
                      {item.title.toUpperCase()}
                    </Text>
                    <Text className="font-bold text-[18px] text-[#2b3038]">
                      {formatPrice(item.price)}
                    </Text>
                  </View>

                  <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                    {item.subtitle}
                  </Text>

                  <View className="mt-5 border-l-2 border-[#aeb5bf] bg-[#f5f6f8] px-4 py-4">
                    <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                      {request.type === "exchange" ? "REASON FOR EXCHANGE" : "REASON FOR RETURN"}
                    </Text>
                    <Text className="mt-3 font-normal text-[13px] italic leading-6 text-[#4b5563]">
                      &quot;{item.reason}&quot;
                    </Text>
                    {index === 0 && request.comments ? (
                      <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                        {request.comments}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[22px] text-[#2d3440]">
              CUSTOMER PHOTOS
            </Text>
            <View className="mt-5 flex-row gap-3">
              {request.customerPhotoUrls.map((photo, index) => (
                <Image
                  key={`${photo}-${index}`}
                  source={{ uri: photo }}
                  className="h-32 flex-1 bg-[#eceff3]"
                  resizeMode="cover"
                />
              ))}
            </View>
            <Text className="mt-3 font-bold text-[9px] tracking-[1.4px] text-neutral-300">
              NO MORE PHOTOS
            </Text>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[22px] text-[#2d3440]">
              {notesTitle}
            </Text>

            <View className="mt-5 gap-5">
              {request.adminNotes.map((note) => (
                <View key={note.id} className="flex-row gap-3">
                  <View className="mt-1 h-9 w-9 items-center justify-center bg-[#111826]">
                    <Text className="font-bold text-[10px] text-white">
                      {note.author
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="font-bold text-[12px] text-black">
                        {note.author.toUpperCase()}
                      </Text>
                      <Text className="font-normal text-[10px] text-neutral-400">
                        {note.timestamp}
                      </Text>
                    </View>
                    <Text className="mt-1 font-normal text-[10px] tracking-[1.2px] text-neutral-400">
                      {note.role.toUpperCase()}
                    </Text>
                    <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-600">
                      {note.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-5 border border-[#eef1f4] bg-[#fbfbfc] px-4 py-4">
              <TextInput
                value={noteDraft}
                onChangeText={setNoteDraft}
                multiline
                placeholder="ADD A PRIVATE NOTE..."
                placeholderTextColor="#b0b6bf"
                textAlignVertical="top"
                className="min-h-[90px] font-normal text-[13px] leading-6 text-black"
              />
              <Pressable
                onPress={handleSaveNote}
                className="mt-3 self-end"
              >
                <Text className="font-bold text-[10px] tracking-[1.5px] text-[#111826]">
                  SAVE NOTE
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="gap-5">
            <View className="border-l-2 border-black bg-white px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                CUSTOMER DETAILS
              </Text>
              <Text className="mt-4 font-bold text-[26px] leading-8 text-[#2b3038]">
                {(customer?.name ?? order?.customerName ?? "Customer").toUpperCase()}
              </Text>
              <Text className="mt-2 font-normal text-[13px] text-neutral-500">
                {customer
                  ? `${customer.badge} Member | ${customer.totalOrders} Orders`
                  : `${order?.deliveryRegion ?? "International"} delivery customer`}
              </Text>
              <View className="mt-5 flex-row flex-wrap gap-3">
                <Pressable
                  onPress={() => {
                    const phone = customer?.phone ?? order?.customerPhone;
                    if (phone) {
                      const numericPhone = phone.replace(/[^0-9]/g, "");
                      Linking.openURL(`https://wa.me/${numericPhone}?text=${encodeURIComponent(`Hi ${customer?.name ?? order?.customerName}, following up on your ${request.type} request ${request.rmaNumber}.`)}`);
                    } else {
                      Linking.openURL(`mailto:${customer?.email ?? "support@houseofshirts.com"}?subject=${request.type.toUpperCase()} Follow-up: ${request.rmaNumber}`);
                    }
                  }}
                  className="bg-[#171d28] px-4 py-3"
                >
                  <Text className="font-bold text-[10px] tracking-[1.4px] text-white">
                    MESSAGE
                  </Text>
                </Pressable>
                {(customer?.phone ?? order?.customerPhone) ? (
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        `tel:${sanitizedPhone(customer?.phone ?? order?.customerPhone)}`
                      ).catch(() => {})
                    }
                    className="border border-[#dce1e7] bg-white px-4 py-3"
                  >
                    <Text className="font-bold text-[10px] tracking-[1.4px] text-[#111826]">
                      CALL
                    </Text>
                  </Pressable>
                ) : null}
                {(customer?.phone ?? order?.customerPhone) ? (
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        `https://wa.me/${sanitizedPhone(customer?.phone ?? order?.customerPhone).replace(/^\+/, "")}`
                      ).catch(() => {})
                    }
                    className="border border-[#dce1e7] bg-white px-4 py-3"
                  >
                    <Text className="font-bold text-[10px] tracking-[1.4px] text-[#111826]">
                      WHATSAPP
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => {
                  if (!customer?.id) {
                    return;
                  }
                  router.push({
                    pathname: "/admin/customer-profile",
                    params: { customerId: customer.id },
                  } as any);
                }}
                className="mt-5 self-start"
              >
                <Text className="font-bold text-[10px] tracking-[1.5px] text-[#111826]">
                  VIEW CUSTOMER PROFILE
                </Text>
              </Pressable>
            </View>

            <View className="bg-white px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
                ASSOCIATED ORDER
              </Text>
              <Text className="mt-4 font-bold text-[28px] leading-8 text-[#2b3038]">
                ORDER #{request.orderId}
              </Text>
              <Text className="mt-2 font-normal text-[13px] text-neutral-500">
                Placed {order?.placedOn ?? request.submittedAt}
              </Text>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="font-bold text-[16px] text-black">
                  Total: {formatPrice(order?.total ?? request.itemPrice)}
                </Text>
                <Pressable
                  onPress={() => router.push(`/admin/orders/${request.orderId}` as any)}
                >
                  <Text className="font-bold text-[10px] tracking-[1.5px] text-[#111826]">
                    GO TO ORDER
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[22px] text-[#2d3440]">
              PROCESS TIMELINE
            </Text>
            {request.returnLabelCode ? (
              <View className="mt-5 bg-[#f3f5f8] px-4 py-4">
                <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                  SHIPPING LABEL
                </Text>
                <Text className="mt-2 font-bold text-[15px] text-[#111826]">
                  {request.returnLabelCode}
                </Text>
                <Text className="mt-1 font-normal text-[12px] text-neutral-500">
                  Issued {request.returnLabelIssuedAt}
                </Text>
              </View>
            ) : null}

            <View className="mt-6">
              {request.timeline.map((event, index) => (
                <View key={event.id} className="flex-row">
                  <View className="mr-4 items-center">
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full ${
                        event.active ? "bg-black" : "border border-[#d7dce2] bg-white"
                      }`}
                    >
                      {event.active ? (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      ) : null}
                    </View>
                    {index !== request.timeline.length - 1 ? (
                      <View className="h-16 w-[1px] bg-[#e8ebef]" />
                    ) : null}
                  </View>

                  <View className="flex-1 pb-8">
                    <Text
                      className={`font-bold text-[15px] tracking-[1.2px] ${
                        event.active ? "text-black" : "text-neutral-300"
                      }`}
                    >
                      {event.title.toUpperCase()}
                    </Text>
                    <Text
                      className={`mt-2 font-normal text-[12px] leading-5 ${
                        event.active ? "text-neutral-500" : "text-neutral-300"
                      }`}
                    >
                      {event.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5">
            <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
              {processBoxTitle}
            </Text>

            <View className="mt-5 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[13px] text-neutral-500">
                  Subtotal
                </Text>
                <Text className="font-normal text-[13px] text-neutral-500">
                  {formatPrice(request.itemPrice)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[13px] text-neutral-500">
                  Tax (9%)
                </Text>
                <Text className="font-normal text-[13px] text-neutral-500">
                  {formatPrice(tax)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[13px] text-[#c45b5b]">
                  {request.type === "exchange" ? "Replacement Fee" : "Restocking Fee"}
                </Text>
                <Text className="font-normal text-[13px] text-[#c45b5b]">
                  -{formatPrice(0)}
                </Text>
              </View>
            </View>

            <View className="mt-5 border-t border-[#eceff3] pt-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-[18px] text-[#2d3440]">
                  {request.type === "exchange" ? "TOTAL REPLACEMENT VALUE" : "TOTAL REFUND"}
                </Text>
                <Text className="font-bold text-[18px] text-[#2d3440]">
                  {formatPrice(refundTotal)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => void processRefund(request.id)}
              className="mt-5 bg-[#eff1f4] px-5 py-4"
            >
              <Text className="text-center font-bold text-[10px] tracking-[1.6px] text-[#2d3440]">
                {processButtonLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
