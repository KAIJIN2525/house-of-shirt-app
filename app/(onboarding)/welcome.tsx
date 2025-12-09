import { useRouter } from "expo-router";
import React from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";

const Welcome = () => {

    const router = useRouter();

  return (
    <View className="flex-1">
      <ImageBackground
        source={require("../../assets/images/img1.jpeg")}
        className="flex-1"
      >
        {/* Dark gradient Overlay */}
        <View className="flex-1 bg-black/40">
          {/* Content at the bottom */}
          <View className="absolute bottom-20 px-6 w-full">
            <Text className="font-futura-bold text-center text-white text-3xl mb-2">
              Welcome to House of Shirt
            </Text>
            <Text className="font-futura text-white/80 text-base mb-8 text-center">
              Premium quality fashion delivered to your doorstep.
            </Text>

            {/* Get started button */}
            <Pressable
                onPress={() => router.push("/(onboarding)/intro" as any)}
            className="bg-white py-4 rounded-full items-center">
              <Text className="font-futura-demi text-slate-900">
                Get Started
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Welcome;
