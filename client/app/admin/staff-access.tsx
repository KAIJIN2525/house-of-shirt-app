import { AppText as Text } from "@/components/AppText";
import {
  AdminAccessGrant,
  fetchAdminAccessGrants,
  setAdminAccess,
} from "@/services/admin-access";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StaffRow = memo(function StaffRow({
  grant,
  busy,
  onToggle,
}: {
  grant: AdminAccessGrant;
  busy: boolean;
  onToggle: (grant: AdminAccessGrant) => void;
}) {
  const isOwner = grant.role === "owner";
  const isActive = grant.status === "active";

  return (
    <View className="mx-6 mb-3 rounded-[24px] bg-white p-5 dark:bg-[#101215]">
      <View className="flex-row items-center gap-4">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#eef1f5] dark:bg-[#1b1e23]">
          <Ionicons
            name={isOwner ? "shield-checkmark" : "person"}
            size={19}
            color="#697386"
          />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-[13px] text-black dark:text-white">
            {grant.email}
          </Text>
          <Text className="mt-1 font-bold text-[9px] tracking-[1.3px] text-neutral-400">
            {isOwner
              ? "WORKSPACE OWNER"
              : isActive
                ? grant.user_id
                  ? "ACTIVE STAFF"
                  : "ACCESS PENDING SIGN-IN"
                : "ACCESS REVOKED"}
          </Text>
        </View>
        {!isOwner ? (
          <Pressable
            disabled={busy}
            onPress={() => onToggle(grant)}
            accessibilityRole="button"
            accessibilityLabel={`${isActive ? "Revoke" : "Restore"} access for ${grant.email}`}
            className={`rounded-full px-4 py-2 ${isActive ? "bg-red-50 dark:bg-red-950/30" : "bg-black dark:bg-white"}`}
          >
            <Text
              className={`font-bold text-[9px] tracking-[1px] ${isActive ? "text-red-600" : "text-white dark:text-black"}`}
            >
              {busy ? "SAVING" : isActive ? "REVOKE" : "RESTORE"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

export default function StaffAccessScreen() {
  const router = useRouter();
  const isDark = useThemeStore((state) => state.isDark);
  const [email, setEmail] = useState("");
  const [grants, setGrants] = useState<AdminAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadGrants = useCallback(async () => {
    try {
      setMessage("");
      setGrants(await fetchAdminAccessGrants());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load staff access.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  const grantAccess = useCallback(async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setMessage("Enter a valid colleague email address.");
      return;
    }

    setBusyEmail(normalizedEmail);
    setMessage("");
    try {
      await setAdminAccess(normalizedEmail, true);
      setEmail("");
      await loadGrants();
      setMessage(
        "Staff access granted. It activates when that email signs in.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not grant access.",
      );
    } finally {
      setBusyEmail(null);
    }
  }, [email, loadGrants]);

  const changeAccess = useCallback(
    (grant: AdminAccessGrant) => {
      const enabling = grant.status !== "active";
      const applyChange = async () => {
        setBusyEmail(grant.email);
        setMessage("");
        try {
          await setAdminAccess(grant.email, enabling);
          await loadGrants();
          setMessage(
            enabling ? "Staff access restored." : "Staff access revoked.",
          );
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Could not update access.",
          );
        } finally {
          setBusyEmail(null);
        }
      };

      if (enabling) {
        void applyChange();
        return;
      }

      Alert.alert(
        "Revoke staff access?",
        `${grant.email} will immediately lose access to admin data and screens.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Revoke",
            style: "destructive",
            onPress: () => void applyChange(),
          },
        ],
      );
    },
    [loadGrants],
  );

  const renderItem = useCallback<ListRenderItem<AdminAccessGrant>>(
    ({ item }) => (
      <StaffRow
        grant={item}
        busy={busyEmail === item.email}
        onToggle={changeAccess}
      />
    ),
    [busyEmail, changeAccess],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <FlatList
        data={grants}
        keyExtractor={(item) => item.email}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGrants} />
        }
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center gap-4 px-6 pb-5 pt-4">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={isDark ? "#f8fafc" : "#111111"}
                />
              </Pressable>
              <View className="flex-1">
                <Text className="font-bold text-[16px] text-black dark:text-white">
                  Staff Access
                </Text>
                <Text className="mt-1 text-[10px] text-neutral-400">
                  MANAGE ADMIN COLLEAGUES
                </Text>
              </View>
            </View>

            <View className="mx-6 mb-7 rounded-[28px] bg-white p-5 dark:bg-[#101215]">
              <Text className="font-bold text-[20px] text-black dark:text-white">
                Give a colleague access
              </Text>
              <Text className="mt-2 text-[12px] leading-5 text-neutral-500">
                Add the email they use for House of Shirts. Existing accounts
                activate immediately; new accounts activate after sign-in.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="colleague@example.com"
                placeholderTextColor="#9ca3af"
                className="mt-5 rounded-[18px] bg-[#f1f2f5] px-4 py-4 text-[13px] text-black dark:bg-[#17191d] dark:text-white"
              />
              <Pressable
                onPress={grantAccess}
                disabled={busyEmail !== null}
                accessibilityRole="button"
                className="mt-3 rounded-[18px] bg-[#161c28] py-4"
              >
                <Text className="text-center font-bold text-[10px] tracking-[1.7px] text-white">
                  {busyEmail ? "SAVING ACCESS" : "GRANT ADMIN ACCESS"}
                </Text>
              </Pressable>
              {message ? (
                <Text className="mt-4 text-[11px] leading-5 text-[#3c6a9e]">
                  {message}
                </Text>
              ) : null}
            </View>

            <Text className="mb-4 px-6 font-bold text-[10px] tracking-[1.6px] text-neutral-400">
              WORKSPACE STAFF
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="px-6 py-8 text-center text-[12px] text-neutral-400">
              No staff records found.
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
