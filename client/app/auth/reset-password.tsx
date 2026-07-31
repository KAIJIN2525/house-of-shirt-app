import { AppText as Text } from "@/components/AppText";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const establishRecoverySession = async (url: string) => {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const errorDescription =
    query.get("error_description") || fragment.get("error_description");
  if (errorDescription) throw new Error(errorDescription);

  const code = query.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("This password reset link is invalid or has expired.");
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPreparing, setIsPreparing] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      try {
        const recoveryUrl = url ?? await Linking.getInitialURL();
        if (!recoveryUrl) throw new Error("Password reset link was not received.");
        await establishRecoverySession(recoveryUrl);
        if (active) setIsRecoveryReady(true);
      } catch (recoveryError) {
        if (active) {
          setError(
            recoveryError instanceof Error
              ? recoveryError.message
              : "Password reset could not be started.",
          );
        }
      } finally {
        if (active) setIsPreparing(false);
      }
    };
    void prepare();
    return () => {
      active = false;
    };
  }, [url]);

  const updatePassword = async () => {
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/(tabs)/profile" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="font-bold text-[38px] leading-[42px] text-black dark:text-white">
            Set New Password
          </Text>
          <Text className="mt-3 text-[13px] leading-6 text-neutral-500 dark:text-neutral-300">
            Choose a secure password for your House of Shirts account.
          </Text>

          {isPreparing ? (
            <View className="mt-10 flex-row items-center gap-3">
              <ActivityIndicator color="#111111" />
              <Text className="text-neutral-500">Verifying your reset link…</Text>
            </View>
          ) : (
            <View className="mt-8 gap-4">
              {error ? (
                <View className="rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
                  <Text className="text-[12px] leading-5 text-red-600 dark:text-red-300">
                    {error}
                  </Text>
                </View>
              ) : null}

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoComplete="new-password"
                className="h-14 rounded-xl border border-neutral-200 px-4 text-black dark:border-white/10 dark:text-white"
              />
              <TextInput
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder="Confirm new password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoComplete="new-password"
                className="h-14 rounded-xl border border-neutral-200 px-4 text-black dark:border-white/10 dark:text-white"
              />

              <Pressable
                onPress={updatePassword}
                disabled={isSaving || !isRecoveryReady}
                className={`h-14 flex-row items-center justify-center gap-2 rounded-xl bg-black dark:bg-white ${
                  isSaving || !isRecoveryReady ? "opacity-50" : ""
                }`}
              >
                {isSaving ? <ActivityIndicator color="#ffffff" /> : null}
                <Text className="font-bold text-[12px] tracking-[1.5px] text-white dark:text-black">
                  {isSaving ? "UPDATING" : "UPDATE PASSWORD"}
                </Text>
                {!isSaving ? <Ionicons name="arrow-forward" size={17} color="#ffffff" /> : null}
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
