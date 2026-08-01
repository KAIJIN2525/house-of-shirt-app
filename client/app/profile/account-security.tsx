import { AppText as Text } from "@/components/AppText";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Please try again.";
};

export default function AccountSecurityScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const isDark = useThemeStore((state) => state.isDark);
  const [isResending, setIsResending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const usesPassword = useMemo(
    () => user?.identities?.some((identity) => identity.provider === "email") ?? false,
    [user?.identities],
  );
  const emailVerified = Boolean(user?.email_confirmed_at);

  const resendVerification = async () => {
    if (!user?.email || isResending) return;
    setIsResending(true);
    try {
      const emailRedirectTo = AuthSession.makeRedirectUri({ path: "auth/callback" });
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      Alert.alert("Verification sent", "Check your inbox and follow the verification link.");
    } catch (error) {
      Alert.alert("Could not resend email", getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const exportData = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-self-service", {
        body: { action: "export" },
      });
      if (error) throw error;
      const file = new FileSystem.File(
        FileSystem.Paths.cache,
        `house-of-shirts-account-${new Date().toISOString().slice(0, 10)}.json`,
      );
      file.create({ overwrite: true });
      file.write(JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Export account data" });
      } else {
        Alert.alert("Export ready", `Your export was saved to ${file.uri}`);
      }
    } catch (error) {
      Alert.alert("Export failed", getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!user?.email || confirmation !== "DELETE" || isDeleting) return;
    setIsDeleting(true);
    try {
      if (usesPassword) {
        if (!password) throw new Error("Enter your password to verify your identity.");
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password });
        if (signInError) throw new Error("Your password could not be verified.");
      }
      const { error } = await supabase.functions.invoke("account-self-service", {
        body: { action: "delete", confirmation },
      });
      if (error) throw error;
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      const message = getErrorMessage(error);
      Alert.alert(
        "Account not deleted",
        message.includes("reauthentication_required")
          ? "Sign out, sign back in, then return here within ten minutes."
          : message,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <View className="flex-row items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Ionicons name="arrow-back" size={25} color={isDark ? "#fff" : "#000"} />
        </Pressable>
        <Text className="font-bold text-sm tracking-[2px] text-black dark:text-white">ACCOUNT & PRIVACY</Text>
        <View className="w-6" />
      </View>

      <ScrollView contentContainerClassName="gap-8 px-6 pb-20 pt-8" keyboardShouldPersistTaps="handled">
        <View className="bg-gray-50 p-5 dark:bg-[#101215]">
          <Text className="font-bold text-xs tracking-[1.5px] text-gray-500 dark:text-white/60">EMAIL VERIFICATION</Text>
          <Text preserveCase={Boolean(user?.email)} className="mt-3 font-semibold text-lg text-black dark:text-white">{user?.email ?? "No email address"}</Text>
          <View className="mt-3 flex-row items-center gap-2">
            <Ionicons name={emailVerified ? "checkmark-circle" : "alert-circle"} size={18} color={emailVerified ? "#16a34a" : "#d97706"} />
            <Text className="text-sm text-gray-600 dark:text-white/70">{emailVerified ? "Verified" : "Verification required"}</Text>
          </View>
          {!emailVerified ? (
            <Pressable disabled={isResending} onPress={() => void resendVerification()} accessibilityRole="button" accessibilityLabel="Resend verification email" accessibilityState={{ disabled: isResending, busy: isResending }} className="mt-5 self-start bg-black px-5 py-3 dark:bg-white">
              <Text className="font-bold text-xs tracking-[1px] text-white dark:text-black">{isResending ? "SENDING..." : "RESEND EMAIL"}</Text>
            </Pressable>
          ) : null}
        </View>

        <View>
          <Text className="font-bold text-xs tracking-[1.5px] text-gray-500 dark:text-white/60">YOUR DATA</Text>
          <Text className="mt-3 text-sm leading-6 text-gray-600 dark:text-white/70">Download a JSON copy of your profile, addresses, orders, saved items, notifications, returns, restock requests, and support history. Payment tokens are excluded.</Text>
          <Pressable disabled={isExporting} onPress={() => void exportData()} accessibilityRole="button" accessibilityLabel="Download my account data" accessibilityState={{ disabled: isExporting, busy: isExporting }} className="mt-5 items-center border border-black px-5 py-4 dark:border-white">
            <Text className="font-bold text-xs tracking-[1.2px] text-black dark:text-white">{isExporting ? "PREPARING EXPORT..." : "DOWNLOAD MY DATA"}</Text>
          </Pressable>
        </View>

        <View className="border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <Text className="font-bold text-xs tracking-[1.5px] text-red-700 dark:text-red-300">DELETE ACCOUNT</Text>
          <Text className="mt-3 text-sm leading-6 text-red-800 dark:text-red-200">This permanently removes your account and personal app data. Completed order records are retained without your identity.</Text>
          {usesPassword ? (
            <TextInput accessibilityLabel="Current password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Current password" placeholderTextColor="#9ca3af" className="mt-5 border border-red-200 bg-white px-4 py-4 text-black dark:border-red-900 dark:bg-black dark:text-white" />
          ) : (
            <Text className="mt-4 text-xs leading-5 text-red-700 dark:text-red-300">For social sign-in, sign out and sign back in if your last sign-in was more than ten minutes ago.</Text>
          )}
          <TextInput accessibilityLabel="Account deletion confirmation" accessibilityHint="Type DELETE to enable permanent account deletion" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" placeholder="Type DELETE" placeholderTextColor="#9ca3af" className="mt-3 border border-red-200 bg-white px-4 py-4 text-black dark:border-red-900 dark:bg-black dark:text-white" />
          <Pressable disabled={confirmation !== "DELETE" || isDeleting} onPress={() => void deleteAccount()} accessibilityRole="button" accessibilityLabel="Permanently delete my account" accessibilityState={{ disabled: confirmation !== "DELETE" || isDeleting, busy: isDeleting }} className={`mt-4 items-center px-5 py-4 ${confirmation === "DELETE" && !isDeleting ? "bg-red-600" : "bg-red-300 dark:bg-red-950"}`}>
            <Text className="font-bold text-xs tracking-[1.2px] text-white">{isDeleting ? "DELETING..." : "DELETE MY ACCOUNT"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
