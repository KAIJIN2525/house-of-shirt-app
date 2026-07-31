import { useAdminContentStore } from "@/stores/adminContentStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef } from "react";
import { Animated, ImageBackground, Pressable, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import "../../global.css";

const Welcome = () => {
  const router = useRouter();
  const {  welcome  } = useAdminContentStore();

  // Safety check: if welcome data is missing, use defaults
  const safeWelcome = welcome || {
    headline: "House of Shirts",
    subtitle: "The Digital Atelier",
    ctaText: "Enter Atelier",
    videoUri: null,
    imageUri: null,
    textFont: "lexend" as const,
  };

  const isCormorant = safeWelcome.textFont === "cormorant";
  const subtitleFontStyle = isCormorant ? { fontFamily: "Cormorant-Medium" } : undefined;
  const headlineFontStyle = isCormorant ? { fontFamily: "Cormorant-Bold" } : undefined;

  // Animation states
  const subtitleAnim = useRef(new Animated.Value(20)).current;
  const headlineAnim = useRef(new Animated.Value(20)).current;
  const ctaAnim = useRef(new Animated.Value(20)).current;
  
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cinematic delay: wait 10 seconds (or 3s for demo/faster feel) then animate
    // I'll set it to 6 seconds for a "best of both worlds" intro feel
    const animationDelay = 6000; 

    const timer = setTimeout(() => {
      Animated.stagger(400, [
        Animated.parallel([
          Animated.spring(subtitleAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }),
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(headlineAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }),
          Animated.timing(headlineOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(ctaAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }),
          Animated.timing(ctaOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ]).start();
    }, animationDelay);

    return () => clearTimeout(timer);
  }, []);

  // Initialize player safely.
  const player = useVideoPlayer(safeWelcome.videoUri ? { uri: safeWelcome.videoUri } : null, (player) => {
    player.loop = true;
    player.muted = safeWelcome.muted ?? true; // Apply mute setting
    player.play();
  });

  const renderBackground = () => {
    if (safeWelcome.videoUri && player) {
      return (
        <View className="flex-1 overflow-hidden">
          <VideoView
            player={player}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            nativeControls={false}
          />
        </View>
      );
    }
    return (
      <ImageBackground
        source={safeWelcome.imageUri ? { uri: safeWelcome.imageUri } : require("../../assets/images/img1.jpeg")}
        className="flex-1"
        resizeMode="cover"
      />
    );
  };

  return (
    <View className="flex-1 bg-black">
      <View className="absolute inset-0">
        {renderBackground()}
      </View>

      <LinearGradient
        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]}
        className="flex-1"
      >
        <View className="mt-auto px-6 pb-12 w-full items-center">
          <Animated.View style={{ opacity: subtitleOpacity, transform: [{ translateY: subtitleAnim }] }}>
            <Text
              className="font-light text-center text-gray-300 text-[12px] tracking-[6px] mb-4 uppercase"
              style={subtitleFontStyle}
            >
              {safeWelcome.subtitle || "The Digital Atelier"}
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: headlineOpacity, transform: [{ translateY: headlineAnim }] }}>
            <Text
              className="font-bold text-center text-white text-[48px] leading-[44px] mb-12 tracking-[2px] uppercase"
              style={headlineFontStyle}
            >
              {(safeWelcome.headline || "House of Shirts").split(" ").join("\n")}
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: ctaOpacity, transform: [{ translateY: ctaAnim }], width: "100%" }}>
            <Pressable
              onPress={() => router.push("/(onboarding)/intro" as any)}
              className="w-full bg-white py-6 items-center rounded-sm active:opacity-90"
            >
              <View className="flex-row items-center justify-center gap-3">
                <Text className="font-bold text-black text-[13px] tracking-[4px] uppercase">
                  {safeWelcome.ctaText || "Enter Atelier"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="black" />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default Welcome;
