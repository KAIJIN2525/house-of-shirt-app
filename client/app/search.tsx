import { formatPrice } from "@/constants";
import { useProductsStore } from "@/stores/productsStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { BrandLogo } from "@/components/BrandLogo";

// Curated suggestions are now dynamic based on products


import { useSearchStore } from "@/stores/searchStore";

const Search = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {  products, fetchProducts  } = useProductsStore();
  const {  isDark  } = useThemeStore();
  const { recentSearches, addSearch, removeSearch, clearAll } = useSearchStore();

  const [searchTerm, setSearchTerm] = useState((params.search as string) || "");
  const [showResults, setShowResults] = useState(
    (params.search as string) ? true : false,
  );

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    
    const keywords = term.split(/\s+/).filter(Boolean);
    
    return products.filter((p) => {
      const searchable = `${p.name} ${p.brand} ${p.category || ""}`.toLowerCase();
      return keywords.every((keyword) => searchable.includes(keyword));
    });
  }, [products, searchTerm]);

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    if (text.trim().length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const submitSearch = (term: string) => {
    if (term.trim()) {
      addSearch(term.trim());
      setSearchTerm(term);
      setShowResults(true);
    }
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    setShowResults(true);
  };

  const curatedSuggestionsItems = useMemo(() => {
    // Pick top rated products that have images
    return [...products]
      .filter(p => p.image)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        name: p.name,
        subtitle: `${p.brand} | ${p.category || "Collection"}`,
        image: typeof p.image === 'string' ? { uri: p.image } : p.image,
      }));
  }, [products]);

  const handleCuratedClick = (item: any) => {
    router.push(`/product/${item.id}` as any);
  };



  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-4 ">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#000"} />
          </Pressable>
          <BrandLogo width={154} height={28} />
          <Pressable onPress={() => router.push("/notifications" as any)}>
            <Ionicons name="notifications-outline" size={24} color={isDark ? "#ffffff" : "#000"} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center bg-gray-50 dark:bg-white/5 rounded-lg px-4 h-11 border border-gray-200 dark:border-white/10">
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              value={searchTerm}
              onChangeText={handleSearch}
              onSubmitEditing={() => submitSearch(searchTerm)}
              placeholder="FIND YOUR CUT"
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-3 font-normal text-black dark:text-white"
              autoFocus
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <Pressable onPress={() => handleSearch("")}>
                <Ionicons name="close" size={18} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Live Suggestions based on History */}
        {!showResults && searchTerm.length > 0 && (
          <View className="px-6 py-2 bg-white dark:bg-[#050505] border-b border-gray-100 dark:border-white/10">
            {recentSearches
              .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
              .slice(0, 3)
              .map((suggestion, idx) => (
                <Pressable 
                  key={idx}
                  onPress={() => submitSearch(suggestion)}
                  className="flex-row items-center py-3 gap-3 border-b border-gray-50 dark:border-white/5"
                >
                  <Ionicons name="time-outline" size={16} color="#94a3b8" />
                  <Text className="font-normal text-sm text-black dark:text-white">
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}


        {showResults ? (
          // Search Results
          <View className="flex-1 px-6">
            <Text className="font-bold text-lg text-black dark:text-white tracking-wide uppercase mt-6 mb-4">
              SEARCH RESULTS
            </Text>
            <Text className="font-normal text-xs text-gray-500 dark:text-neutral-400 mb-4">
              {filteredProducts.length} items found
            </Text>

            {filteredProducts.length > 0 ? (
              <FlatList
                data={filteredProducts}
                numColumns={2}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      addSearch(searchTerm);
                      router.push(`/product/${item.id}` as any);
                    }}
                    className="flex-1"
                  >
                    <View className="overflow-hidden rounded-[22px] bg-white dark:bg-transparent">
                      <View className="w-full h-48 overflow-hidden rounded-t-[22px] bg-gray-100 dark:bg-[#101215]">
                        <Image
                          source={
                            typeof item.image === "string"
                              ? { uri: item.image }
                              : item.image
                          }
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="px-1 pb-2 pt-3 dark:bg-transparent">
                        <Text
                          className="font-bold text-xs text-black dark:text-white mb-2"
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <Text className="font-bold text-sm text-black dark:text-white">
                          {formatPrice(item.price)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
                keyExtractor={(item) => item.id.toString()}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="search-outline" size={64} color="#cbd5e1" />
                <Text className="font-semibold text-lg text-slate-900 dark:text-white mt-4">
                  No results found
                </Text>
                <Text className="font-normal text-gray-500 dark:text-neutral-400 text-sm mt-2 text-center">
                  Try different keywords
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Initial State with Recent & Curated
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            className="flex-1 px-6"
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View className="mt-6 mb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-light text-xs text-gray-500 tracking-wider">
                    RECENT SEARCHES
                  </Text>
                  <Pressable onPress={clearAll}>
                    <Text className="font-light text-xs text-gray-400">
                      CLEAR ALL
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {recentSearches.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleRecentSearchClick(item)}
                      className="flex-row items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full"
                    >
                      <Text className="font-normal text-sm text-black dark:text-white">
                        {item}
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          removeSearch(item);
                        }}
                      >
                        <Ionicons name="close" size={16} color="#64748b" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>

              </View>
            )}

            {/* Curated Suggestions */}
            <View className="mb-8">
              <Text className="font-semibold text-xs text-slate-800 dark:text-gray-400 tracking-wider mb-4">
                CURATED SUGGESTIONS
              </Text>

              <View className="gap-4">
                {curatedSuggestionsItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleCuratedClick(item)}
                    className="flex-row items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10"
                  >
                    <Image
                      source={item.image}
                      className="w-14 h-14 rounded-lg"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text className="font-bold text-[13px] text-black dark:text-white">
                        {item.name}
                      </Text>
                      <Text className="font-normal text-[11px] text-gray-500 mt-1">
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color="#94a3b8" />

                  </Pressable>
                ))}
              </View>
            </View>

          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Search;
