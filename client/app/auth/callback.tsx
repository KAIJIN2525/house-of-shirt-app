import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import "../../global.css";

export default function AuthCallback() {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Re-initialize the auth state to pick up the new session
    initialize();
    
    // Brief delay to ensure session is hydrated
    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [initialize, router]);

  return (
    <View className="flex-1 bg-white dark:bg-[#050505] items-center justify-center">
      <View className="items-center px-10">
        <ActivityIndicator size="small" color="#141923" />
        <Text className="mt-8 font-bold text-[10px] tracking-[3.5px] text-slate-400 dark:text-slate-500 text-center uppercase leading-[18px]">
          Synchronizing Your{"\n"}Atelier Profile
        </Text>
      </View>
    </View>
  );
}

