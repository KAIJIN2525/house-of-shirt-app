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
import "../../global.css";
import { LinearGradient } from "expo-linear-gradient";

const SignUp = () => {
  const router = useRouter();
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    setError("");
    setLoading(true);

    const { error: authError } = await signUpWithEmail(email, password, name);
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

            <Text className="font-bold text-black text-center text-5xl mb-8">
              Join the Atelier
            </Text>
            <Text className="font-normal text-gray-500 text-center text-lg mb-8">
              Step into a world of premium fashion and timeless style.
            </Text>

            {/* Error Message */}
            {error ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="assertive" className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="font-medium text-red-600 text-sm">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Form Inputs */}
            <View className="gap-4 mb-6">
              {/* Name Input */}
              <View>
                <Text className="font-medium uppercase text-slate-900 mb-2 text-sm">
                  Full Name
                </Text>
                <TextInput
                  placeholder="ALEXANDER VANE"
                  value={name}
                  onChangeText={setName}
                  className="h-12 border border-gray-300 rounded-lg px-4 font-normal"
                  style={{ paddingVertical: 0 }}
                  autoCapitalize="words"
                  accessibilityLabel="Full name"
                />
              </View>

              {/* Email Input */}
              <View>
                <Text className="font-medium uppercase text-slate-900 mb-2 text-sm">
                  Email
                </Text>
                <TextInput
                  placeholder="atelier@houseofshirts.com"
                  value={email}
                  onChangeText={setEmail}
                  className="h-12 border border-gray-300 rounded-lg px-4 font-normal"
                  style={{ paddingVertical: 0 }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityLabel="Email address"
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="font-medium uppercase text-slate-900 mb-2 text-sm">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="h-12 border border-gray-300 rounded-lg px-4 pr-12 font-normal"
                    style={{ paddingVertical: 0 }}
                    autoCapitalize="none"
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
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

              {/* Confirm Password Input */}
              {/* <View>
                <Text className="font-medium text-slate-900 mb-2 text-sm">
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    className="h-12 border border-gray-300 rounded-lg px-4 pr-12 font-normal"
                    style={{ paddingVertical: 0 }}
                    autoCapitalize="none"
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3"
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#64748b"
                    />
                  </Pressable>
                </View>
              </View> */}
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignUp}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
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
                  {loading ? "CREATING ACCOUNT ..." : "CREATE ACCOUNT"}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
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
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                accessibilityState={{ disabled: loading, busy: loading }}
                className="flex-1 h-12 border border-gray-300 rounded-lg flex-row items-center justify-center gap-2"
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text className="font-medium text-slate-900">
                  Google
                </Text>
              </Pressable>
            </View>

            {/* Terms & Conditions */}
            <Text className="font-normal text-gray-500 text-center text-xs mb-8">
              By signing up, you agree to our{" "}
              <Text className="font-medium text-slate-900">
                Terms & Conditions
              </Text>{" "}
              and{" "}
              <Text className="font-medium text-slate-900">
                Privacy Policy
              </Text>
            </Text>

            {/* Login Link */}
            <View className="flex-row justify-center items-center gap-1">
              <Text className="font-normal text-gray-600">
                Already have an account?
              </Text>
              <Pressable onPress={() => router.push("/(auth)/login" as any)}>
                <Text className="font-semibold text-slate-900">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
