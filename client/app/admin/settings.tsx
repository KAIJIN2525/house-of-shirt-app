import { AdminSettings, useAdminContentStore } from "@/stores/adminContentStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const SelectRow = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) => (
  <View className="mt-5">
    <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
      {label}
    </Text>
    <Pressable
      onPress={onPress}
      className="mt-2 flex-row items-center justify-between bg-[#f1f2f5] px-4 py-4 dark:bg-[#17191d]"
    >
      <Text className="font-normal text-[13px] text-neutral-700 dark:text-white">{value}</Text>
      <Ionicons name="chevron-down" size={16} color="#7b8190" />
    </Pressable>
  </View>
);

const InputRow = ({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address";
}) => (
  <View className="mt-5">
    <Text className="font-bold text-[10px] tracking-[1.4px] text-neutral-400">
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor="#9ca3af"
      className="mt-2 bg-[#f1f2f5] px-4 py-4 font-normal text-[13px] text-neutral-700 dark:bg-[#17191d] dark:text-white"
    />
  </View>
);

const ToggleRow = ({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View className="flex-row items-center justify-between py-2">
    <View className="flex-1 pr-4">
      <Text className="font-bold text-[14px] text-black dark:text-white">{title}</Text>
      <Text className="mt-1 font-normal text-[10px] tracking-[1.2px] text-neutral-400">
        {subtitle}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#d9dbe1", true: "#111111" }}
      thumbColor="#ffffff"
    />
  </View>
);

export default function AdminSettingsScreen() {
  const router = useRouter();
  const {  settings, saveSettings  } = useAdminContentStore();
  const {  isDark  } = useThemeStore();
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeSelector, setActiveSelector] = useState<
    "currency" | "response" | "escalation" | null
  >(null);

  const currencyOptions = ["USD ($)", "NGN (Naira)", "EUR (€)"];
  const responseOptions = ["Under 2 hours", "Under 4 hours", "Same business day"];
  const escalationOptions = [
    "Notify Manager after 4h",
    "Escalate after 2h",
    "Escalate next business day",
  ];
  const selectorConfig = {
    currency: {
      label: "Currency",
      value: draft.currency,
      options: currencyOptions,
      onSelect: (value: string) =>
        setDraft((current) => ({ ...current, currency: value })),
    },
    response: {
      label: "Response Time Target",
      value: draft.responseTimeTarget,
      options: responseOptions,
      onSelect: (value: string) =>
        setDraft((current) => ({ ...current, responseTimeTarget: value })),
    },
    escalation: {
      label: "Escalation Rule",
      value: draft.escalationRule,
      options: escalationOptions,
      onSelect: (value: string) =>
        setDraft((current) => ({ ...current, escalationRule: value })),
    },
  } as const;

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = async () => {
    await saveSettings(draft);
    setStatusMessage("Admin settings saved locally.");
  };

  const handleDiscard = () => {
    setDraft(settings);
    setStatusMessage("Changes discarded.");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center gap-4 px-6 pb-5 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <Text className="font-bold text-[16px] text-black dark:text-white">
            Admin Settings
          </Text>
        </View>

        <View className="px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            WORKSPACE CONFIGURATION
          </Text>
        </View>

        <View className="mt-4 px-6">
          <View className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
            <InputRow
              label="APP NAME"
              value={draft.appName}
              onChangeText={(appName) =>
                setDraft((current) => ({ ...current, appName }))
              }
            />
            <InputRow
              label="CONTACT EMAIL"
              value={draft.contactEmail}
              keyboardType="email-address"
              onChangeText={(contactEmail) =>
                setDraft((current) => ({ ...current, contactEmail }))
              }
            />

            <SelectRow
              label="CURRENCY"
              value={draft.currency}
              onPress={() => setActiveSelector("currency")}
            />
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            CUSTOMER SERVICE
          </Text>
        </View>

        <View className="mt-4 px-6">
          <View className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
            <SelectRow
              label="RESPONSE TIME TARGET"
              value={draft.responseTimeTarget}
              onPress={() => setActiveSelector("response")}
            />
            <SelectRow
              label="ESCALATION RULE"
              value={draft.escalationRule}
              onPress={() => setActiveSelector("escalation")}
            />
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            PUSH NOTIFICATIONS
          </Text>
        </View>

        <View className="mt-4 px-6">
          <View className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
            <ToggleRow
              title="Global Notifications"
              subtitle="MASTER TOGGLE"
              value={draft.globalNotifications}
              onValueChange={(globalNotifications) =>
                setDraft((current) => ({ ...current, globalNotifications }))
              }
            />
            <ToggleRow
              title="Order Updates"
              subtitle="TRANSACTIONAL"
              value={draft.orderUpdates}
              onValueChange={(orderUpdates) =>
                setDraft((current) => ({ ...current, orderUpdates }))
              }
            />
            <ToggleRow
              title="Marketing"
              subtitle="CAMPAIGNS"
              value={draft.marketing}
              onValueChange={(marketing) =>
                setDraft((current) => ({ ...current, marketing }))
              }
            />
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            SOCIAL CONNECTIONS
          </Text>
        </View>

        <View className="mt-4 px-6">
          <View className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-[#f1f2f5] dark:bg-[#17191d]">
                <Ionicons name="logo-instagram" size={16} color="#111111" />
              </View>
              <Text className="font-bold text-[14px] text-black dark:text-white">
                Instagram
              </Text>
            </View>
            <InputRow
              label="INSTAGRAM HANDLE"
              value={draft.instagramHandle}
              onChangeText={(instagramHandle) =>
                setDraft((current) => ({ ...current, instagramHandle }))
              }
            />

            <View className="mt-6 flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-[#f1f2f5] dark:bg-[#17191d]">
                <Ionicons name="logo-twitter" size={16} color="#111111" />
              </View>
              <Text className="font-bold text-[14px] text-black dark:text-white">
                Twitter
              </Text>
            </View>
            <InputRow
              label="TWITTER HANDLE"
              value={draft.twitterHandle}
              onChangeText={(twitterHandle) =>
                setDraft((current) => ({ ...current, twitterHandle }))
              }
            />
          </View>
        </View>

        <View className="mt-7 px-6">
          <Text className="font-bold text-[10px] tracking-[1.6px] text-neutral-400">
            PROMOTIONAL CALENDAR
          </Text>
        </View>

        <View className="mt-4 px-6">
          <View className="rounded-[28px] bg-white px-5 py-5 dark:bg-[#101215]">
            <View className="flex-row gap-4 border-b border-[#eef1f4] pb-4">
              <View className="w-10 items-center">
                <Text className="font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                  OCT
                </Text>
                <Text className="mt-1 font-bold text-[20px] text-black dark:text-white">
                  24
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-black dark:text-white">
                  Seasonal Trunk Show
                </Text>
                <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                  Main banner scheduled to go live
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 pt-4">
              <View className="w-10 items-center">
                <Text className="font-bold text-[9px] tracking-[1.3px] text-neutral-300">
                  NOV
                </Text>
                <Text className="mt-1 font-bold text-[20px] text-black dark:text-white">
                  12
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-black dark:text-white">
                  Winter Collection Drop
                </Text>
                <Text className="mt-1 font-normal text-[11px] text-neutral-400">
                  Push inventory refresh
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          {statusMessage ? (
            <Text className="mb-4 font-normal text-[12px] text-[#3c6a9e]">
              {statusMessage}
            </Text>
          ) : null}

          <Pressable onPress={handleSave} className="bg-[#161c28] py-4">
            <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
              SAVE CHANGES
            </Text>
          </Pressable>

          <Pressable onPress={handleDiscard} className="mt-4 py-3">
            <Text className="text-center font-bold text-[11px] tracking-[1.8px] text-neutral-500">
              DISCARD
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={activeSelector !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveSelector(null)}
      >
        <Pressable
          onPress={() => setActiveSelector(null)}
          className="flex-1 justify-end bg-black/35"
        >
          <Pressable className="rounded-t-[32px] bg-[#fbfbfc] px-6 pb-8 pt-6 dark:bg-[#101215]">
            {activeSelector ? (
              <>
                <View className="self-center h-1.5 w-16 rounded-full bg-[#d7dbe2]" />
                <Text className="mt-5 font-bold text-[11px] tracking-[1.6px] text-neutral-400">
                  SELECT OPTION
                </Text>
                <Text className="mt-2 font-bold text-[28px] leading-8 text-black dark:text-white">
                  {selectorConfig[activeSelector].label}
                </Text>
                <View className="mt-6 gap-3">
                  {selectorConfig[activeSelector].options.map((option) => {
                    const isSelected =
                      option === selectorConfig[activeSelector].value;

                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          selectorConfig[activeSelector].onSelect(option);
                          setActiveSelector(null);
                        }}
                        className={`rounded-[22px] border px-5 py-4 ${
                          isSelected
                            ? "border-[#161c28] bg-[#161c28]"
                            : "border-[#e7eaf0] bg-white dark:border-white/10 dark:bg-[#17191d]"
                        }`}
                      >
                        <View className="flex-row items-center justify-between gap-4">
                          <Text
                            className={`font-bold text-[13px] ${
                              isSelected ? "text-white" : "text-black dark:text-white"
                            }`}
                          >
                            {option}
                          </Text>
                          {isSelected ? (
                            <Ionicons name="checkmark" size={16} color="#ffffff" />
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#9ca3af"
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
