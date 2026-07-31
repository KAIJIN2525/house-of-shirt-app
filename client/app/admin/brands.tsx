import { Brand, useAdminContentStore } from "@/stores/adminContentStore";
import { HouseLoader } from "@/components/loading/HouseLoader";
import { SkeletonBlock } from "@/components/loading/Skeleton";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const BRANDFETCH_CLIENT_ID = "1idwGU4uvv2T1aoYYzi";

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0];

const buildBrandLogoUrl = (domain: string) =>
  `https://cdn.brandfetch.io/${domain}/h/160/w/160/icon.png?c=${BRANDFETCH_CLIENT_ID}`;

const getBrandSearchUrl = (query: string) =>
  `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}?c=${BRANDFETCH_CLIENT_ID}`;

const extractLogoUrl = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    return typeof url === "string" ? url : "";
  }

  return "";
};

const BrandManagement = () => {
  const router = useRouter();
  const {  brands, saveBrands  } = useAdminContentStore();
  const {  isDark  } = useThemeStore();
  
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewDomain, setPreviewDomain] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  // Smart Guess & Preview Logic
  useEffect(() => {
    const fetchBrandPreview = async () => {
      const searchTerm = newName.trim() || newDomain.trim();
      if (searchTerm) {
        setIsPreviewLoading(true);
        try {
          const response = await fetch(getBrandSearchUrl(searchTerm));
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const bestMatch = data[0];
            const matchedDomain = normalizeDomain(bestMatch.domain ?? "");
            const logoUrl =
              extractLogoUrl(bestMatch.icon) ||
              extractLogoUrl(bestMatch.logo) ||
              buildBrandLogoUrl(matchedDomain);
            setPreviewLogo(
              logoUrl.includes("cdn.brandfetch.io") && !logoUrl.includes("?c=")
                ? buildBrandLogoUrl(matchedDomain)
                : logoUrl
            );
            setPreviewDomain(matchedDomain);
            if (!newDomain && matchedDomain) setNewDomain(matchedDomain);
          } else {
            // Fallback to guess if no API match
            const guess = newDomain.trim() || (newName.toLowerCase().replace(/\s+/g, '') + ".com");
            const domain = normalizeDomain(guess);
            setPreviewDomain(domain);
            setPreviewLogo(buildBrandLogoUrl(domain));
          }
        } catch {
          const guess = newDomain.trim() || (newName.toLowerCase().replace(/\s+/g, '') + ".com");
          const domain = normalizeDomain(guess);
          setPreviewDomain(domain);
          setPreviewLogo(buildBrandLogoUrl(domain));
        } finally {
          setIsPreviewLoading(false);
        }
      } else {
        setPreviewLogo(null);
        setPreviewDomain("");
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(fetchBrandPreview, 600);
    return () => clearTimeout(timer);
  }, [newDomain, newName]);

  const handleSearchDomain = () => {
    if (!newName.trim()) {
      Alert.alert("Brand Name Required", "Please enter the brand name first.");
      return;
    }
    const query = encodeURIComponent(`${newName} official website domain`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
  };

  const handleAddBrand = async () => {
    if (!newName.trim()) {
      Alert.alert("Missing Name", "Please provide a brand name.");
      return;
    }

    const domainToUse =
      previewDomain ||
      newDomain.trim() ||
      (newName.toLowerCase().replace(/\s+/g, '') + ".com");
    const domain = normalizeDomain(domainToUse);
    
    const newBrand: Brand = {
      id: Date.now().toString(),
      name: newName.toUpperCase(),
      domain,
      logo: previewLogo || buildBrandLogoUrl(domain),
    };

    setSavingBrand(true);
    try {
      const nextBrands = [...brands, newBrand];
      await saveBrands(nextBrands);

      setNewName("");
      setNewDomain("");
      setIsAdding(false);
      Alert.alert("Success", `${newName} has been added to the Brand Collective.`);
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = (id: string, name: string) => {
    Alert.alert(
      "Remove Brand",
      `Are you sure you want to remove ${name} from the collection?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            const nextBrands = brands.filter(b => b.id !== id);
            await saveBrands(nextBrands);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#111111"} />
          </Pressable>
          <Text className="font-bold text-[11px] tracking-[2.5px] text-black dark:text-white uppercase">
            Management
          </Text>
          <Pressable onPress={() => setIsAdding(!isAdding)}>
            <Ionicons 
              name={isAdding ? "close-outline" : "add-outline"} 
              size={24} 
              color={isDark ? "#f8fafc" : "#111111"} 
            />
          </Pressable>
        </View>

        <View className="px-6 mb-8">
          <Text className="font-bold text-[10px] tracking-[1.5px] text-neutral-400 uppercase">
            Curated Atelier
          </Text>
          <Text className="mt-2 font-bold text-[32px] leading-[36px] text-black dark:text-white">
            Brand Collective
          </Text>
          <Text className="mt-4 font-normal text-[14px] leading-6 text-neutral-500">
            Manage the designers and labels displayed on the home screen carousel.
          </Text>
        </View>

        {isAdding && (
          <View className="mx-6 mb-8 bg-white dark:bg-[#101215] p-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-bold text-[12px] tracking-[1.5px] text-black dark:text-white uppercase">
                Add New Designer
              </Text>
              {isPreviewLoading ? (
                <View className="h-12 w-12 items-center justify-center overflow-hidden bg-slate-100 dark:bg-white/5">
                  <SkeletonBlock className="h-8 w-8" />
                </View>
              ) : previewLogo ? (
                <View className="h-12 w-12 bg-slate-100 items-center justify-center border border-gray-100 relative overflow-hidden">
                  <Text className="absolute font-bold text-lg text-slate-300/50">
                    {newName[0]?.toUpperCase()}
                  </Text>
                  <Image 
                    key={previewLogo}
                    source={{ uri: previewLogo }} 
                    style={{ width: 48, height: 48 }}
                    resizeMode="contain" 
                  />
                </View>
              ) : null}
            </View>
            
            <View className="gap-4">
              <View>
                <Text className="font-bold text-[9px] tracking-[1px] text-gray-400 mb-2 uppercase">
                  Brand Name
                </Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. NIKE"
                  placeholderTextColor="#94a3b8"
                  className="bg-gray-50 border border-gray-100 px-4 py-3 font-medium text-black"
                />
              </View>

              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-bold text-[9px] tracking-[1px] text-gray-400 uppercase">
                    Brand Domain (Optional)
                  </Text>
                  <Pressable onPress={handleSearchDomain}>
                    <Text className="font-bold text-[9px] tracking-[1px] text-slate-800 uppercase underline">
                      Find Website
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={newDomain}
                  onChangeText={setNewDomain}
                  placeholder="e.g. nike.com (or leave blank to guess)"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  className="bg-gray-50 border border-gray-100 px-4 py-3 font-medium text-black"
                />
              </View>

              <Pressable
                onPress={handleAddBrand}
                disabled={savingBrand}
                className="bg-black mt-4 items-center justify-center py-4"
              >
                {savingBrand ? (
                  <HouseLoader compact inverted label="ADDING" />
                ) : (
                  <Text className="font-bold text-[10px] tracking-[2px] text-white uppercase">
                    ADD TO COLLECTION
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <FlatList
          data={brands}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between bg-white dark:bg-[#101215] p-4 mb-3 border border-gray-50">
              <View className="flex-row items-center gap-4">
                <View className="h-20 w-20 items-center justify-center bg-slate-100 border border-gray-100 dark:bg-white/5 dark:border-white/10 relative overflow-hidden">
                  <Text className="absolute font-bold text-2xl text-slate-300/40 dark:text-white/5">
                    {item.name[0]}
                  </Text>
                  <Image 
                    key={item.logo}
                    source={{ uri: item.logo }}
                    style={{ width: 80, height: 80 }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="font-bold text-sm text-black dark:text-white">
                    {item.name}
                  </Text>
                  <Text className="font-normal text-[10px] text-gray-400 uppercase mt-1">
                    Designer Label
                  </Text>
                </View>
              </View>
              
              <Pressable 
                onPress={() => handleDeleteBrand(item.id, item.name)}
                className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
              >
                <Ionicons name="trash-outline" size={18} color="#e11d48" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="grid-outline" size={48} color="#cbd5e1" />
              <Text className="mt-4 font-bold text-gray-400">No brands in collection</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default BrandManagement;
