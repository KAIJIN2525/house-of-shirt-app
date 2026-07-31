import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import "../../global.css";

const ForgotPassword = () => {
  const router = useRouter();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError("");
    setSuccess(false);
    setLoading(true);

    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSuccess(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="px-6 pt-8 pb-8">
            {/* Back Button */}
            <Pressable onPress={() => router.back()} className="mb-8">
              <View className="flex-row items-center gap-2">
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
                <Text className="font-medium text-slate-900">Back</Text>
              </View>
            </Pressable>
            <Text className="font-semibold text-md text-slate-400 mb-2">
              ACCOUNT RECOVERY
            </Text>

            {/* Logo/Brand Section */}
            <View className="items-center mb-12">
              <Text className="font-bold text-6xl text-slate-900 mb-2">
                Reset Password
              </Text>
              <Text className="font-normal text-gray-500">
                Enter your email address and we&apos;ll send you a link to reset your
                password.
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="font-medium text-red-600 text-sm">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Success Message */}
            {success ? (
              <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 items-center">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="checkmark" size={24} color="#16a34a" />
                </View>
                <Text className="font-semibold text-green-700 text-base text-center mb-2">
                  Check Your Email
                </Text>
                <Text className="font-normal text-green-600 text-sm text-center">
                  We&apos;ve sent a password reset link to {email}
                </Text>
              </View>
            ) : null}

            {/* Form Input */}
            {!success && (
              <>
                <View className="gap-4 mb-6">
                  {/* Email Input */}
                  <View>
                    <Text className="font-medium uppercase text-slate-600 mb-2 text-sm">
                      Email Address
                    </Text>
                    <TextInput
                      placeholder="your.email@example.com"
                      value={email}
                      onChangeText={setEmail}
                      className="h-14 border border-gray-300 px-4 font-normal"
                      style={{ paddingVertical: 0 }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Reset Button */}
                <Pressable
                  onPress={handleResetPassword}
                  disabled={loading}
                  className={`h-16 items-center justify-center mb-6 overflow-hidden ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  <LinearGradient
                    colors={["#141923", "#475569"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-1 w-full items-center justify-center"
                  >
                    <Text className="font-semibold text-white text-base tracking-widest">
                      {loading ? "SENDING..." : "SEND RESET LINK"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}

            {/* Back to Login Link */}
            {success && (
              <Pressable
                onPress={() => router.push("/(auth)/login" as any)}
                className="h-16 items-center justify-center overflow-hidden"
              >
                <LinearGradient
                  colors={["#141923", "#475569"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-1 w-full items-center justify-center"
                >
                  <Text className="font-semibold text-white text-base tracking-widest">
                    BACK TO SIGN IN
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
