import { formatPrice } from "@/constants";
import { useAdminCustomersStore } from "@/stores/adminCustomersStore";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "@/stores/themeStore";
import * as ImagePicker from "expo-image-picker";

const formatOrderReference = (id: string) =>
  id.startsWith("#") ? id : `#${id}`;

const statusColors = {
  Fulfilled: "text-[#4aa972]",
  Archived: "text-[#6b7a90]",
  Pending: "text-[#b45309]",
} as const;

const logIcons = {
  "Support Outbound": "mail-outline",
  "Internal VIP Note": "chatbox-ellipses-outline",
  "Concierge Call": "call-outline",
} as const;

export default function AdminCustomerProfileScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const {
    getCustomerById,
    addVipNote,
    toggleBlacklist,
    markCustomerContacted,
    fetchCustomers,
    updateCustomerAvatar,
  } = useAdminCustomersStore();
  const { isDark } = useThemeStore();

  const [isVipNoteOpen, setIsVipNoteOpen] = useState(false);
  const [vipNote, setVipNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const customer = getCustomerById(customerId);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const analytics = useMemo(
    () => [
      {
        label: "Retention Score",
        value: `${customer?.retentionScore ?? 0}%`,
      },
      {
        label: "Last Contact",
        value: customer?.lastContactDate ?? "No contact yet",
      },
      {
        label: "Preferred Categories",
        value: customer?.preferredCategories.join(", ") ?? "Unassigned",
      },
    ],
    [customer],
  );

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-bold text-[24px] text-black">
            Customer not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendMessage = async () => {
    await markCustomerContacted(
      customer.id,
      `Opened concierge outreach thread for ${customer.name}.`,
    );

    if (customer.phone) {
      const numericPhone = customer.phone.replace(/[^0-9]/g, "");
      // If it starts with 0, you might need country code, but let's just use it as is
      import("react-native").then(({ Linking }) => {
        Linking.openURL(`https://wa.me/${numericPhone}`).catch(() => {
          Linking.openURL(`mailto:${customer.email}`);
        });
      });
    } else {
      import("react-native").then(({ Linking }) => {
        Linking.openURL(`mailto:${customer.email}`);
      });
    }
  };

  const handleSaveVipNote = async () => {
    await addVipNote(customer.id, vipNote);
    setVipNote("");
    setIsVipNoteOpen(false);
  };

  const handleBlacklistToggle = async () => {
    await toggleBlacklist(customer.id);
  };

  const handleUpdateAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setIsUploading(true);
      try {
        const localUri = result.assets[0].uri;
        const { supabase } = await import("@/lib/supabase");
        const fileExt = localUri.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `customer-${customer.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const response = await fetch(localUri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from("assets")
          .upload(filePath, blob, {
            contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
            upsert: true,
          });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("assets")
          .getPublicUrl(filePath);

        updateCustomerAvatar(customer.id, publicUrlData.publicUrl);
        Alert.alert("Success", "Customer profile photo updated successfully.");
      } catch (error: any) {
        console.warn("Avatar upload failed, falling back to local URI:", error);
        updateCustomerAvatar(customer.id, result.assets[0].uri);
        Alert.alert(
          "Photo Saved Locally",
          "We saved the photo to this device, but we couldn't upload it to your Supabase 'assets' storage bucket. Please ensure the bucket exists and is public in Supabase.",
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pb-4 pt-4">
          <Pressable
            onPress={() => router.navigate("/admin/customers" as any)}
            className="flex-row items-center gap-2 self-start"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#f8fafc" : "#111111"}
            />
            <Text className="font-bold text-[11px] tracking-[2px] text-black dark:text-white">
              BACK TO CUSTOMERS
            </Text>
          </Pressable>
        </View>

        <View className="px-6">
          <View className="flex-row gap-4">
            <Pressable accessibilityLabel="Update customer avatar"
              onPress={handleUpdateAvatar}
              className="relative overflow-hidden"
            >
              {!customer.avatar ||
              customer.avatar.includes("photo-1500648767791-00dcc994a43e") ? (
                <View className="h-28 w-20 bg-neutral-200 dark:bg-neutral-800 items-center justify-center border border-neutral-300 dark:border-neutral-700">
                  <Ionicons
                    name="person"
                    size={38}
                    color={isDark ? "#d4d4d4" : "#525252"}
                  />
                  <View className="absolute inset-x-0 bottom-0 bg-black/40 py-1 items-center">
                    <Ionicons name="camera" size={12} color="white" />
                  </View>
                </View>
              ) : (
                <View className="h-28 w-20 relative">
                  <Image
                    source={{ uri: customer.avatar }}
                    className="w-full h-full bg-[#e9edf3]"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-x-0 bottom-0 bg-black/40 py-1 items-center">
                    <Ionicons name="camera" size={12} color="white" />
                  </View>
                </View>
              )}
            </Pressable>

            <View className="flex-1">
              <Text className="font-bold text-[54px] leading-[48px] text-[#13213b] dark:text-white">
                {customer.name.split(" ")[0]}
                {"\n"}
                {customer.name.split(" ").slice(1).join(" ")}
              </Text>

              <View className="mt-4 flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="font-normal text-[14px] leading-6 text-[#44618e]">
                    {customer.email}
                  </Text>
                  <Text className="mt-1 font-normal text-[12px] text-neutral-400">
                    {customer.phone || "No phone on file"}
                  </Text>
                </View>
                <Text className="font-normal text-[11px] tracking-[1.8px] text-[#5a6b86]">
                  {customer.shopifySynced
                    ? "SHOPIFY\nSYNCED"
                    : "MANUAL\nPROFILE"}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 flex-row gap-2">
            <View className="bg-black px-3 py-2">
              <Text className="font-bold text-[10px] tracking-[1.3px] text-white">
                {customer.badge}
              </Text>
            </View>
            {customer.tier ? (
              <View className="bg-[#13213b] px-3 py-2">
                <Text className="font-bold text-[10px] tracking-[1.3px] text-white">
                  {customer.tier}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mt-6 flex-row px-6">
          <Pressable
            onPress={handleSendMessage}
            className="flex-1 items-center justify-center bg-[#111826] py-5"
          >
            <Text className="text-center font-bold text-[11px] tracking-[1.8px] text-white">
              SEND{"\n"}MESSAGE
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsVipNoteOpen(true)}
            className="flex-1 items-center justify-center border border-[#d9dde4] bg-white py-5"
          >
            <Text className="text-center font-bold text-[11px] tracking-[1.8px] text-[#111826]">
              ADD{"\n"}VIP NOTE
            </Text>
          </Pressable>
          <Pressable
            onPress={handleBlacklistToggle}
            className={`flex-1 items-center justify-center border py-5 ${
              customer.blacklisted
                ? "border-[#111826] bg-[#111826]"
                : "border-[#eed5d1] bg-white"
            }`}
          >
            <Text
              className={`text-center font-bold text-[11px] tracking-[1.8px] ${
                customer.blacklisted ? "text-white" : "text-[#b64030]"
              }`}
            >
              {customer.blacklisted ? "RESTORE" : "BLACKLIST"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6">
            <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
              TOTAL LIFETIME VALUE
            </Text>
            <Text className="mt-5 font-bold text-[48px] leading-[46px] text-black">
              {formatPrice(customer.lifetimeValue)}
            </Text>

            <View className="mt-8 gap-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[13px] text-[#70819b]">
                  Average Order Value
                </Text>
                <Text className="font-bold text-[24px] text-black">
                  {formatPrice(customer.averageOrderValue)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="font-normal text-[13px] text-[#70819b]">
                  Total Orders
                </Text>
                <Text className="font-bold text-[24px] text-black">
                  {String(customer.totalOrders).padStart(2, "0")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-5 px-6">
          <View className="bg-white px-5 py-6">
            <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
              CLIENT ANALYTICS
            </Text>

            <View className="mt-6 gap-5">
              {analytics.map((item) => (
                <View
                  key={item.label}
                  className="border-b border-[#eef1f4] pb-4"
                >
                  <Text className="font-normal text-[12px] tracking-[1.2px] text-[#70819b]">
                    {item.label.toUpperCase()}
                  </Text>
                  <Text className="mt-2 font-bold text-[18px] leading-7 text-[#13213b]">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
                RECENT ORDER HISTORY
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push("/admin/orders" as any)}>
                <Text className="font-bold text-[10px] tracking-[1.8px] text-[#111826]">
                  VIEW ALL
                </Text>
              </Pressable>
            </View>

            <View className="gap-4">
              {customer.orders.map((order, index) => (
                <Pressable
                  key={order.id}
                  onPress={() => {
                    if (!order.linkedOrderId) {
                      return;
                    }

                    router.push(`/admin/orders/${order.linkedOrderId}` as any);
                  }}
                  className={`${index !== customer.orders.length - 1 ? "border-b border-[#eef1f4] pb-4" : ""}`}
                >
                  <View className="flex-row items-start gap-4">
                    <View className="h-14 w-10 bg-[#e8ecf1]" />
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-4">
                        <View className="flex-1">
                          <Text className="font-bold text-[15px] text-[#13213b]">
                            {formatOrderReference(order.id)}
                          </Text>
                          <Text className="mt-1 font-normal text-[12px] text-[#70819b]">
                            {order.title}
                          </Text>
                          <Text className="mt-1 font-normal text-[11px] text-[#70819b]">
                            {order.date}
                          </Text>
                        </View>
                        <Text className="font-bold text-[18px] text-black">
                          {formatPrice(order.amount)}
                        </Text>
                      </View>

                      <Text
                        className={`mt-2 font-bold text-[10px] tracking-[1.5px] ${statusColors[order.status]}`}
                      >
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6">
            <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
              CUSTOMER COMMUNICATION LOGS
            </Text>

            <View className="mt-6 gap-6">
              {customer.communicationLogs.map((log) => (
                <View key={log.id} className="flex-row gap-4">
                  <View className="mt-1 h-8 w-8 items-center justify-center rounded-full border border-[#dde2e8] bg-white">
                    <Ionicons
                      name={
                        logIcons[log.type] as keyof typeof Ionicons.glyphMap
                      }
                      size={14}
                      color="#111111"
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-4">
                      <Text className="font-bold text-[13px] text-black">
                        {log.type.toUpperCase()}
                      </Text>
                      <Text className="font-normal text-[10px] text-[#9aa6b5]">
                        {log.age}
                      </Text>
                    </View>
                    <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-600">
                      {log.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6">
            <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
              PRIMARY ATELIER ADDRESS
            </Text>

            <View className="mt-6">
              <Text className="font-bold text-[14px] leading-6 text-black">
                {customer.address.line1}
              </Text>
              <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-600">
                {customer.address.line2}
              </Text>
              <Text className="font-normal text-[13px] leading-6 text-neutral-600">
                {customer.address.cityStateZip}
              </Text>
              <Text className="font-normal text-[13px] leading-6 text-neutral-600">
                {customer.address.country}
              </Text>
            </View>

            <View className="mt-6 flex-row items-center gap-2">
              <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-300">
                MANAGED VIA SHOPIFY
              </Text>
              <Ionicons name="lock-closed-outline" size={12} color="#c1c7d0" />
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-6">
            <Text className="font-bold text-[10px] tracking-[1.8px] text-[#70819b]">
              SEGMENTS & TAGS
            </Text>

            <View className="mt-6 flex-row flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <View key={tag} className="bg-[#f4f6f8] px-3 py-2">
                  <Text className="font-bold text-[9px] tracking-[1.4px] text-black">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isVipNoteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVipNoteOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full bg-white px-5 py-5">
            <Text className="font-bold text-[18px] text-[#111826]">
              Add VIP Note
            </Text>
            <Text className="mt-2 font-normal text-[13px] leading-6 text-neutral-500">
              Capture a private service note for {customer.name} so the atelier
              team has the right context next time.
            </Text>

            <TextInput accessibilityLabel="Example: Prefers short lead times and neutral packaging for weekday deliveries."
              value={vipNote}
              onChangeText={setVipNote}
              multiline
              placeholder="Example: Prefers short lead times and neutral packaging for weekday deliveries."
              placeholderTextColor="#a0a7b3"
              textAlignVertical="top"
              className="mt-5 min-h-[130px] border border-[#d9dde4] px-4 py-4 font-normal text-[13px] leading-6 text-black"
            />

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setIsVipNoteOpen(false);
                  setVipNote("");
                }}
                className="flex-1 items-center justify-center border border-[#d9dde4] py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-[#111826]">
                  CANCEL
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button"
                onPress={handleSaveVipNote}
                className="flex-1 items-center justify-center bg-[#111826] py-4"
              >
                <Text className="font-bold text-[11px] tracking-[1.4px] text-white">
                  SAVE NOTE
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {isUploading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white dark:bg-[#101215] px-6 py-6 items-center border border-neutral-200 dark:border-white/10">
            <Text className="font-bold text-[11px] tracking-[2px] text-black dark:text-white uppercase mb-2">
              UPLOADING PHOTO
            </Text>
            <Text className="text-[10px] text-neutral-400">
              Uploading customer photo to Supabase Storage...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
