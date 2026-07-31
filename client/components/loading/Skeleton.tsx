import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-neutral-200 dark:bg-white/10 ${className}`}
    />
  );
}

export function BrandTileSkeleton() {
  return (
    <View className="h-28 w-40 items-center justify-center bg-white dark:bg-[#101215]">
      <SkeletonBlock className="h-12 w-28" />
    </View>
  );
}

