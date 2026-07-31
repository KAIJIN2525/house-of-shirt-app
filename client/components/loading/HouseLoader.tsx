import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";
import { AppText as Text } from "@/components/AppText";

const loaderLogo = require("../../assets/images/house_of_shirt2.png");

type HouseLoaderProps = {
  label?: string;
  fullscreen?: boolean;
  compact?: boolean;
  inverted?: boolean;
};

export function HouseLoader({
  label = "CURATING",
  fullscreen = false,
  compact = false,
  inverted = false,
}: HouseLoaderProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progressLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1150,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 720,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 720,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    progressLoop.start();
    pulseLoop.start();

    return () => {
      progressLoop.stop();
      pulseLoop.stop();
    };
  }, [progress, pulse]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-92, 92],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <View
      className={
        fullscreen
          ? "flex-1 items-center justify-center bg-white px-8 dark:bg-[#050505]"
          : compact
            ? "items-center justify-center px-4 py-1"
            : "items-center justify-center px-6 py-10"
      }
    >
      <Animated.View style={{ opacity }} className="items-center">
        <View
          className={`items-center justify-center overflow-hidden ${
            compact
              ? "mb-1 h-8 w-8 rounded-lg bg-white"
              : "mb-5 h-24 w-24 rounded-[28px] bg-white shadow-sm dark:bg-white"
          }`}
        >
          <Image
            source={loaderLogo}
            resizeMode="contain"
            className="h-full w-full"
          />
        </View>
        <Text
          className={`font-bold tracking-[4px] ${
            compact ? "text-[9px]" : "text-[12px]"
          } ${
            inverted
              ? "text-white"
              : "text-black dark:text-white"
          }`}
        >
          HOUSE OF SHIRTS
        </Text>
        <Text
          className={`font-normal tracking-[3px] ${
            compact ? "mt-1 text-[8px]" : "mt-3 text-[10px]"
          } ${inverted ? "text-white/60" : "text-neutral-400"}`}
        >
          {label}
        </Text>
      </Animated.View>

      <View
        className={`h-[2px] overflow-hidden ${
          compact ? "mt-2 w-24" : "mt-6 w-44"
        } ${inverted ? "bg-white/20" : "bg-neutral-200 dark:bg-white/10"}`}
      >
        <Animated.View
          style={{ transform: [{ translateX }] }}
          className={`h-full w-20 ${inverted ? "bg-white" : "bg-black dark:bg-white"}`}
        />
      </View>
    </View>
  );
}
