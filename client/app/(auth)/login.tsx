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
import { useAuthStore } from "@/stores/authStore";
import { hasSupabaseConfig } from "@/constants/keys";
import "../../global.css";
import { LinearGradient } from "expo-linear-gradient";

const Login = () => {
  const router = useRouter();
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    if (!hasSupabaseConfig()) {
      // Fallback: no Supabase configured, simulate login
      setTimeout(() => {
        setLoading(false);
        router.replace("/(tabs)");
      }, 1500);
      return;
    }

    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    router.replace("/(tabs)");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    const { error: authError } = await signInWithGoogle();
    setLoading(false);

    if (authError) {
      if (authError !== "Authentication was cancelled") {
        setError(authError);
      }
      return;
    }

    router.replace("/(tabs)");
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
            {/* Logo/Brand Section */}
            <View className="items-center mb-12">
              <Text className="font-bold text-3xl text-slate-900 mb-2">
                House of Shirts
              </Text>
            </View>

            <Text className="font-bold text-gray-900 mb-8 text-4xl">
              Welcome back!
            </Text>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="font-medium text-red-600 text-sm">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Form Inputs */}
            <View className="gap-4 mb-6">
              {/* Email Input */}
              <View>
                <Text className="font-medium uppercase text-slate-900 mb-2 text-sm">
                  Email Address
                </Text>
                <TextInput
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  className="h-14 border border-gray-300 rounded-lg px-4 font-normal"
                  style={{ paddingVertical: 0 }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="font-medium text-slate-900 uppercase mb-2 text-sm">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="h-14 border border-gray-300 rounded-lg px-4 pr-12 font-normal"
                    style={{ paddingVertical: 0 }}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Forgot Password */}
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password" as any)}
              className="mb-6"
            >
              <Text className="font-medium text-slate-900 text-right text-sm">
                Forgot Password?
              </Text>
            </Pressable>

            {/* Sign In Button */}
            <Pressable
              onPress={handleLogin}
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
                  {loading ? "SIGNING IN ..." : "SIGN IN"}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-6 my-8">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="font-normal text-gray-500 mx-4 text-sm">
                Or continue with
              </Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Social Auth Buttons */}
            <View className="flex-row gap-4 mb-6">
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={loading}
                className="flex-1 h-12 border border-gray-300 rounded-lg flex-row items-center justify-center gap-2"
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text className="font-medium text-slate-900">
                  Google
                </Text>
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center gap-1">
              <Text className="font-normal text-gray-600">
                Don&apos;t have an account?
              </Text>
              <Pressable onPress={() => router.push("/(auth)/signup" as any)}>
                <Text className="font-semibold text-slate-900">Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
