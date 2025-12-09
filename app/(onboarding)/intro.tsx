import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const { width } = Dimensions.get("window");

interface IntroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

const INTRO_SLIDES: IntroSlide[] = [
  {
    id: "1",
    title: "Discover something new",
    subtitle: "Explore new products just for you",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
  },
  {
    id: "2",
    title: "Update trendy outfit",
    subtitle: "Find the hottest and trendiest outfits",
    image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400",
  },
  {
    id: "3",
    title: "Explore your true style",
    subtitle: "Relax and let us bring the fashion to you",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
  },
];

const Intro = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const dotAnimations = useRef(
    INTRO_SLIDES.map(() => new Animated.Value(0))
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

  const handleNext = () => {
    if (currentIndex < INTRO_SLIDES.length - 1) {
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
      {/* Skip Button */}
      <View className="absolute top-8 right-4 z-10">
        <Pressable onPress={handleSkip} className="px-4 py-2">
          <Text className="font-futura-medium text-gray-500">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={INTRO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ width }} className="flex-1 px-6">
            {/* Top Section - Title & Subtitle */}
            <View className="pt-16 px-4">
              <Text className="font-futura-bold text-2xl text-slate-900 text-center mb-2">
                {item.title}
              </Text>
              <Text className="font-futura text-gray-600 text-center text-base">
                {item.subtitle}
              </Text>
            </View>

            {/* Middle Section - Product Image */}
            <View className="flex-1 items-center justify-center py-12">
              <View className="w-72 h-96 bg-gray-50 rounded-3xl overflow-hidden shadow-lg">
                <Image
                  source={{ uri: item.image }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Bottom Section - Dots & Button */}
            <View className="pb-8 px-4">
              {/* Pagination Dots */}
              <View className="flex-row justify-center items-center gap-1.5 mb-8">
                {INTRO_SLIDES.map((_, idx) => {
                  const dotWidth = dotAnimations[idx].interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 24],
                  });

                  const dotOpacity = dotAnimations[idx].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  });

                  return (
                    <Animated.View
                      key={idx}
                      style={{
                        width: dotWidth,
                        opacity: dotOpacity,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#0f172a",
                      }}
                    />
                  );
                })}
              </View>

              {/* Action Button */}
              <Pressable
                onPress={handleNext}
                className="bg-slate-900 py-4 rounded-full items-center shadow-md"
              >
                <Text className="font-futura-demi text-white text-base">
                  {currentIndex === INTRO_SLIDES.length - 1
                    ? "Get Started"
                    : "Continue"}
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
