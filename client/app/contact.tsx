import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { Image, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_URL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "@/constants/contact";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const SUBJECT_OPTIONS = [
  "Fitting & Sizing",
  "Order Tracking",
  "Returns & Exchanges",
  "Tailoring Consultation",
];

export default function ContactScreen() {
  const router = useRouter();
  const {  isDark  } = useThemeStore();
  const [fullName, setFullName] = useState("ALEXANDER WANG");
  const [email, setEmail] = useState("ALEXANDER@HOUSEOFSHIRTS.COM");
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(
      () => {},
    );
  };

  // Falls back to a normal call if WhatsApp is not installed to handle the link.
  const openWhatsApp = () => {
    Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {
      Linking.openURL(SUPPORT_PHONE_URL).catch(() => {});
    });
  };

  const openChat = () => {
    let topicId = "general";
    if (subject === "Fitting & Sizing") topicId = "product";
    if (subject === "Order Tracking") topicId = "order";
    if (subject === "Returns & Exchanges") topicId = "returns";

    router.push({
      pathname: "/support/chat",
      params: {
        topic: topicId,
        extraNote: message,
      },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f8] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
          <Text className="font-bold text-[10px] tracking-[2px] text-black dark:text-white">
            CONTACT
          </Text>
          <Pressable onPress={() => router.push("/bag" as any)}>
            <Ionicons name="bag-handle-outline" size={18} color={isDark ? "#ffffff" : "#111111"} />
          </Pressable>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[58px] leading-[56px] text-black dark:text-white">
            Get in touch.
          </Text>
          <Text className="mt-4 font-normal text-[14px] leading-6 text-neutral-400">
            Experience bespoke service tailored to your needs. Our concierge team
            is available for fitting advice and order inquiries.
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="bg-white px-5 py-5 dark:bg-[#101215]">
            <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-300">
              PREFERRED
            </Text>
            <Text className="mt-3 font-bold text-[28px] leading-8 text-black dark:text-white">
              Live Chat
            </Text>
            <Text className="mt-2 font-normal text-[14px] leading-6 text-neutral-400">
              Start a conversation with our concierge.
            </Text>
            <Pressable onPress={openChat} className="mt-6 self-start">
              <Text className="font-bold text-[11px] tracking-[1.8px] text-black dark:text-white">
                START CHAT
              </Text>
              <View className="mt-1 h-[1px] w-full bg-black" />
            </Pressable>
          </View>
        </View>

        <View className="mt-3 flex-row gap-3 px-6">
          <Pressable
            onPress={openEmail}
            accessibilityRole="button"
            accessibilityLabel={`Email the concierge at ${SUPPORT_EMAIL}`}
            className="flex-1 bg-[#eef2f7] px-4 py-4 dark:bg-[#101215]"
          >
            <Ionicons name="mail" size={16} color={isDark ? "#ffffff" : "#111111"} />
            <Text className="mt-4 font-bold text-[16px] text-black dark:text-white">
              Email
            </Text>
            <Text
              preserveCase
              className="mt-2 font-normal text-[12px] leading-5 text-neutral-500"
            >
              {SUPPORT_EMAIL}
            </Text>
          </Pressable>

          <Pressable
            onPress={openWhatsApp}
            accessibilityRole="button"
            accessibilityLabel={`Message the concierge on WhatsApp at ${SUPPORT_WHATSAPP_DISPLAY}`}
            className="flex-1 bg-[#eef2f7] px-4 py-4 dark:bg-[#101215]"
          >
            <Ionicons name="logo-whatsapp" size={16} color={isDark ? "#ffffff" : "#111111"} />
            <Text className="mt-4 font-bold text-[16px] text-black dark:text-white">
              WhatsApp
            </Text>
            <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
              {SUPPORT_WHATSAPP_DISPLAY}
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-row justify-between px-6">
          <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400">
            INSTAGRAM
          </Text>
          <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400">
            X (TWITTER)
          </Text>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            FORM
          </Text>
          <Text className="mt-2 font-bold text-[30px] leading-8 text-black dark:text-white">
            SUBMIT A REQUEST
          </Text>
        </View>

        <View className="mt-6 px-6">
          <View className="gap-4">
            <View>
              <Text className="mb-2 font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                FULL NAME
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className="bg-white px-4 py-4 font-normal text-[13px] text-neutral-400 dark:bg-[#101215] dark:text-white"
                placeholder="Alexander Wang"
                placeholderTextColor="#b8bcc5"
              />
            </View>

            <View>
              <Text className="mb-2 font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                EMAIL ADDRESS
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-white px-4 py-4 font-normal text-[13px] text-neutral-400 dark:bg-[#101215] dark:text-white"
                placeholder="alexander@houseofshirts.com"
                placeholderTextColor="#b8bcc5"
              />
            </View>

            <View>
              <Text className="mb-2 font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                SUBJECT
              </Text>
              <View className="bg-white px-2 dark:bg-[#101215]">
                <Picker
                  selectedValue={subject}
                  onValueChange={(itemValue) => setSubject(itemValue)}
                  dropdownIconColor={isDark ? "#ffffff" : "#111111"}
                  style={{ color: isDark ? "#ffffff" : "#111111" }}
                >
                  {SUBJECT_OPTIONS.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <View>
              <Text className="mb-2 font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                MESSAGE
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                className="min-h-28 bg-white px-4 py-4 font-normal text-[13px] text-neutral-400 dark:bg-[#101215] dark:text-white"
                placeholder="HOW CAN OUR ATELIER ASSIST YOU?"
                placeholderTextColor="#b8bcc5"
              />
            </View>

            <Pressable onPress={openChat} className="mt-2 bg-[#131926] py-4">
              <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
                SUBMIT REQUEST
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-10 px-6">
          <View className="overflow-hidden">
            <Image
              source={require("../assets/images/img1.jpeg")}
              className="h-44 w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/25" />
            <View className="absolute bottom-4 left-4">
              <Text className="font-bold text-[10px] tracking-[1.8px] text-white">
                SAVILE ROW, LONDON
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
