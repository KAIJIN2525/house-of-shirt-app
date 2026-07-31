import { useAdminContentStore } from "@/stores/adminContentStore";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const { width } = Dimensions.get("window");

const Intro = () => {
  const router = useRouter();
  const {  intro  } = useAdminContentStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const dotAnimations = useRef(
    (intro?.slides ?? []).map(() => new Animated.Value(0)),
  ).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;

      dotAnimations.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: index === newIndex ? 1 : 0,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }).start();
      });

      setCurrentIndex(newIndex);
    }
  }).current;

  // Safety check: if intro or slides are missing, don't crash
  if (!intro || !intro.slides) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Loading onboarding...</Text>
      </SafeAreaView>
    );
  }

  const handleNext = () => {
    if (currentIndex < intro.slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.push("/(auth)/login" as any);
    }
  };

  const handleSkip = () => {
    router.push("/(auth)/login" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        ref={flatListRef}
        data={intro.slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
              <Text className="font-bold text-black text-lg tracking-widest">
                HOUSE OF SHIRTS
              </Text>
              <Pressable onPress={handleSkip}>
                <Text className="font-normal text-gray-600 text-xs tracking-widest">
                  SKIP
                </Text>
              </Pressable>
            </View>

            {/* Image Section */}
            <View className="relative">
              <View className="h-80 items-center justify-center px-6 py-4">
                <View className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Badge */}
              <View className="px-6 pb-6 absolute bottom-1 left-3">
                <View className="bg-black px-3 py-2 self-start rounded">
                  <Text className="font-semibold text-white text-xs tracking-[3px]">
                    {item.badge}
                  </Text>
                </View>
              </View>
            </View>

            {/* Content Section */}
            <View className="flex-1 px-6 pb-8 mt-4">
              <Text className="font-normal text-gray-500 text-xs tracking-[3px] mb-3">
                {item.subtitle}
              </Text>

              <Text className="font-bold text-black text-5xl leading-tight mb-4">
                {item.title}
              </Text>

              <Text className="font-normal text-gray-600 text-lg leading-relaxed mb-8">
                {item.description}
              </Text>

              {/* Pagination Dots */}
              <View className="flex-row items-center my-6 gap-2 ">
                {intro.slides.map((_, idx) => (
                  <Animated.View
                    key={idx}
                    style={{
                      width: dotAnimations[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 8],
                      }),
                      opacity: dotAnimations[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#000",
                    }}
                  />
                ))}
              </View>

              {/* Get Started Button */}
              <Pressable onPress={handleNext} className="mb-3">
                <LinearGradient
                  colors={["#000000", "#1a1a1a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-6 items-center rounded"
                >
                  <Text className="font-semibold text-white text-sm tracking-widest">
                    {currentIndex === intro.slides.length - 1
                      ? "GET STARTED"
                      : "NEXT"}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Login Button */}
              <Pressable
                onPress={handleSkip}
                className="py-6 border-2 border-black items-center rounded"
              >
                <Text className="font-semibold text-black text-sm tracking-widest">
                  LOGIN
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Intro;
