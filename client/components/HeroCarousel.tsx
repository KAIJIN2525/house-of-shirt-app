import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  View,
} from "react-native";
import "../global.css";

const { width } = Dimensions.get("window");

interface HeroSlide {
  id: string;
  image: string;
  title?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800",
    title: "New Arrivals",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea3c5c10?w=800",
    title: "Summer Sale",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
    title: "Featured Collection",
  },
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dotAnimations = useRef(
    HERO_SLIDES.map(() => new Animated.Value(0))
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

  return (
    <View className="mb-6">
      <FlatList
        data={HERO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={{ width }}>
            <View
              className="mx-4 rounded-2xl overflow-hidden"
              style={{ height: 180 }}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: width - 32, height: 180 }}
                resizeMode="cover"
              />
            </View>
          </Pressable>
        )}
      />

      <View className="flex-row justify-center items-center gap-1.5 mt-4">
        {HERO_SLIDES.map((_, index) => {
          const dotWidth = dotAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [8, 24],
          });

          const dotOpacity = dotAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          });

          return (
            <Animated.View
              key={index}
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
    </View>
  );
};

export default HeroCarousel;
