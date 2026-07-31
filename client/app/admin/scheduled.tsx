import { useAdminContentStore } from "@/stores/adminContentStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminScheduledScreen() {
  const router = useRouter();
  const {  notificationCampaigns  } = useAdminContentStore();

  const scheduledCampaigns = useMemo(
    () =>
      notificationCampaigns.filter(
        (campaign) => campaign.status === "Scheduled"
      ),
    [notificationCampaigns]
  );

  const draftCampaigns = useMemo(
    () => notificationCampaigns.filter((campaign) => campaign.status === "Draft"),
    [notificationCampaigns]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111111" />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <View className="w-6" />
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400">
            CAMPAIGN OPS
          </Text>
          <Text className="mt-2 font-bold text-[42px] leading-[42px] text-black">
            Scheduled Queue
          </Text>
          <Text className="mt-3 font-normal text-[14px] leading-6 text-neutral-400">
            Review upcoming sends and drafts before they reach customers.
          </Text>
        </View>

        <View className="mt-7 px-6">
          <View className="flex-row gap-4">
            <View className="flex-1 bg-white px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-300">
                SCHEDULED
              </Text>
              <Text className="mt-3 font-bold text-[34px] text-black">
                {scheduledCampaigns.length}
              </Text>
            </View>
            <View className="flex-1 bg-[#1f2736] px-5 py-5">
              <Text className="font-bold text-[10px] tracking-[1.4px] text-white/40">
                DRAFTS
              </Text>
              <Text className="mt-3 font-bold text-[34px] text-white">
                {draftCampaigns.length}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="font-bold text-[16px] text-black">
            Upcoming Campaigns
          </Text>
          <View className="mt-4 gap-4">
            {scheduledCampaigns.length ? (
              scheduledCampaigns.map((campaign) => (
                <View key={campaign.id} className="bg-white px-5 py-5">
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1">
                      <Text className="font-bold text-[17px] text-black">
                        {campaign.title}
                      </Text>
                      <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                        {campaign.message}
                      </Text>
                    </View>
                    <Text className="font-bold text-[10px] tracking-[1.4px] text-[#3c6a9e]">
                      SCHEDULED
                    </Text>
                  </View>
                  <Text className="mt-4 font-normal text-[11px] text-neutral-400">
                    {campaign.scheduledFor} | Audience: {campaign.audience.toUpperCase()}
                  </Text>
                </View>
              ))
            ) : (
              <View className="bg-white px-5 py-5">
                <Text className="font-normal text-[13px] text-neutral-500">
                  No scheduled campaigns yet.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="font-bold text-[16px] text-black">
            Saved Drafts
          </Text>
          <View className="mt-4 gap-4">
            {draftCampaigns.length ? (
              draftCampaigns.map((campaign) => (
                <View key={campaign.id} className="bg-white px-5 py-5">
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1">
                      <Text className="font-bold text-[17px] text-black">
                        {campaign.title}
                      </Text>
                      <Text className="mt-2 font-normal text-[12px] leading-5 text-neutral-500">
                        {campaign.message}
                      </Text>
                    </View>
                    <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
                      DRAFT
                    </Text>
                  </View>
                  <Text className="mt-4 font-normal text-[11px] text-neutral-400">
                    {campaign.sentAt} | Audience: {campaign.audience.toUpperCase()}
                  </Text>
                </View>
              ))
            ) : (
              <View className="bg-white px-5 py-5">
                <Text className="font-normal text-[13px] text-neutral-500">
                  No drafts waiting in the queue.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
