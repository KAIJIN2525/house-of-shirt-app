import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import "../../global.css";

const Login = () => {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (mode === "signup") {
      if (!name) {
        setError("Please enter your name");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }

    setLoading(true);

    // TODO: Implement actual authentication logic here
    // For now, just simulate a delay and navigate
    setTimeout(() => {
      setLoading(false);
      router.replace("/(tabs)");
    }, 1500);
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
              <View className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-4">
                <Ionicons name="shirt-outline" size={40} color="white" />
              </View>
              <Text className="font-futura-bold text-3xl text-slate-900 mb-2">
                House of Shirt
              </Text>
              <Text className="font-futura text-gray-500 text-center">
                {mode === "signin"
                  ? "Welcome back! Sign in to continue"
                  : "Create an account to get started"}
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="font-futura-medium text-red-600 text-sm">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Tab Switcher */}
            <View className="flex-row bg-gray-100 rounded-lg p-1 mb-6">
              <Pressable
                onPress={() => setMode("signin")}
                className={`flex-1 py-3 rounded-md ${
                  mode === "signin" ? "bg-white" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-center font-futura-demi ${
                    mode === "signin" ? "text-slate-900" : "text-gray-500"
                  }`}
                >
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("signup")}
                className={`flex-1 py-3 rounded-md ${
                  mode === "signup" ? "bg-white" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-center font-futura-demi ${
                    mode === "signup" ? "text-slate-900" : "text-gray-500"
                  }`}
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {/* Form Inputs */}
            <View className="gap-4 mb-6">
              {/* Name Input - Only for Sign Up */}
              {mode === "signup" && (
                <View>
                  <Text className="font-futura-medium text-slate-900 mb-2 text-sm">
                    Full Name
                  </Text>
                  <TextInput
                    placeholder="John Doe"
                    value={name}
                    onChangeText={setName}
                    className="h-12 border border-gray-300 rounded-lg px-4 font-futura"
                    style={{ paddingVertical: 0 }}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Email Input */}
              <View>
                <Text className="font-futura-medium text-slate-900 mb-2 text-sm">
                  Email
                </Text>
                <TextInput
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  className="h-12 border border-gray-300 rounded-lg px-4 font-futura"
                  style={{ paddingVertical: 0 }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="font-futura-medium text-slate-900 mb-2 text-sm">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="h-12 border border-gray-300 rounded-lg px-4 pr-12 font-futura"
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

              {/* Confirm Password - Only for Sign Up */}
              {mode === "signup" && (
                <View>
                  <Text className="font-futura-medium text-slate-900 mb-2 text-sm">
                    Confirm Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      className="h-12 border border-gray-300 rounded-lg px-4 pr-12 font-futura"
                      style={{ paddingVertical: 0 }}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-3"
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color="#64748b"
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Forgot Password - Only for Sign In */}
            {mode === "signin" && (
              <Pressable className="mb-6">
                <Text className="font-futura-medium text-slate-900 text-right text-sm">
                  Forgot Password?
                </Text>
              </Pressable>
            )}

            {/* Sign In/Up Button */}
            <Pressable
              onPress={handleAuth}
              disabled={loading}
              className={`bg-slate-900 h-12 rounded-lg items-center justify-center mb-6 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Text className="font-futura-demi text-white text-base">
                {loading
                  ? mode === "signin"
                    ? "Signing in ..."
                    : "Signing up ..."
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </Text>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="font-futura text-gray-500 mx-4 text-sm">
                Or continue with
              </Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Social Auth Buttons */}
            <View className="flex-row gap-4 mb-6">
              <Pressable className="flex-1 h-12 border border-gray-300 rounded-lg flex-row items-center justify-center gap-2">
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text className="font-futura-medium text-slate-900">
                  Google
                </Text>
              </Pressable>
              <Pressable className="flex-1 h-12 border border-gray-300 rounded-lg flex-row items-center justify-center gap-2">
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text className="font-futura-medium text-slate-900">Apple</Text>
              </Pressable>
            </View>

            {/* Terms & Conditions - Only for Sign Up */}
            {mode === "signup" && (
              <Text className="font-futura text-gray-500 text-center text-xs">
                By signing up, you agree to our{" "}
                <Text className="font-futura-medium text-slate-900">
                  Terms & Conditions
                </Text>{" "}
                and{" "}
                <Text className="font-futura-medium text-slate-900">
                  Privacy Policy
                </Text>
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
