import {
  BannerContent,
  IntroContent,
  useAdminContentStore,
  WelcomeContent,
  WelcomeTextFont,
} from "@/stores/adminContentStore";
import { useThemeStore } from "@/stores/themeStore";
import { ManagedMediaLibrary } from "@/components/admin/ManagedMediaLibrary";
import { listEditorialVersions, listMediaAssets, ManagedEditorialVersion, ManagedMediaAsset, registerMediaAsset } from "@/services/managed-content";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const fieldBaseClass =
  "mt-2 bg-[#f0f1f4] px-4 py-4 font-normal text-[13px] text-neutral-700 dark:bg-[#17191d] dark:text-white";

const fallbackBannerImage = require("../../assets/images/img1.jpeg");

type ContentTab = "Banner" | "Welcome" | "Onboarding";

export default function AdminBannerEditorScreen() {
  const router = useRouter();
  const {
    banner,
    welcome,
    intro,
    saveBanner,
    saveBaseBanner,
    saveWelcome,
    saveIntro,
    archiveBanner,
    fetchManagedContent,
  } = useAdminContentStore();
  const { isDark } = useThemeStore();

  const [activeTab, setActiveTab] = useState<ContentTab>("Banner");

  const [bannerDraft, setBannerDraft] = useState<BannerContent>(
    banner || ({} as BannerContent),
  );
  const [welcomeDraft, setWelcomeDraft] = useState<WelcomeContent>(
    welcome || ({} as WelcomeContent),
  );
  const [introDraft, setIntroDraft] = useState<IntroContent>(
    intro || ({ slides: [] } as IntroContent),
  );

  const [statusMessage, setStatusMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<ManagedMediaAsset[]>([]);
  const [editorialVersions, setEditorialVersions] = useState<ManagedEditorialVersion[]>([]);
  const [selectedIntroSlide, setSelectedIntroSlide] = useState(0);

  useEffect(() => {
    void fetchManagedContent();
    void Promise.all([listMediaAssets(), listEditorialVersions()])
      .then(([assets, versions]) => {
        setMediaAssets(assets);
        setEditorialVersions(versions);
      })
      .catch((error) => {
        console.warn("Could not load managed content library:", error);
      });
  }, [fetchManagedContent]);

  useEffect(() => {
    if (banner) setBannerDraft(banner);
    if (welcome) setWelcomeDraft(welcome);
    if (intro) setIntroDraft(intro);
  }, [banner, welcome, intro]);

  if (!banner || !welcome || !intro) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black items-center justify-center">
        <Text className="text-gray-500">Loading content...</Text>
      </SafeAreaView>
    );
  }

  const uploadMediaToSupabase = async (
    asset: ImagePicker.ImagePickerAsset,
    folder: string,
  ): Promise<string> => {
    setIsUploading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const sourceName = asset.fileName || asset.uri.split("/").pop() || "upload.jpg";
      const fileExt = sourceName.split(".").pop()?.toLowerCase() || (asset.type === "video" ? "mp4" : "jpg");
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      const mimeType = asset.mimeType || (asset.type === "video" ? "video/mp4" : fileExt === "png" ? "image/png" : "image/jpeg");
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage.from("assets").upload(filePath, blob, {
        contentType: mimeType,
        upsert: false,
      });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from("assets").getPublicUrl(filePath);
      await registerMediaAsset({
        storagePath: filePath,
        publicUrl: publicUrlData.publicUrl,
        mediaType: asset.type === "video" ? "video" : "image",
        mimeType,
        originalFilename: sourceName,
        folder,
        sizeBytes: asset.fileSize,
        width: asset.width,
        height: asset.height,
        durationSeconds: asset.duration ? asset.duration / 1000 : undefined,
      });
      setMediaAssets(await listMediaAssets());
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Managed media upload failed:", error);
      Alert.alert(
        "Upload failed",
        "This file was not saved. Check the Supabase assets bucket and your connection, then try again.",
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickBannerImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const publicUrl = await uploadMediaToSupabase(result.assets[0], "banners");
      setBannerDraft({ ...bannerDraft, imageUri: publicUrl });
    }
  };

  const handlePickWelcomeMedia = async (type: "image" | "video") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const publicUrl = await uploadMediaToSupabase(result.assets[0], "welcome");
      if (type === "video") {
        setWelcomeDraft({
          ...welcomeDraft,
          videoUri: publicUrl,
          imageUri: undefined,
        });
      } else {
        setWelcomeDraft({
          ...welcomeDraft,
          imageUri: publicUrl,
          videoUri: undefined,
        });
      }
    }
  };

  const handlePickIntroImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const publicUrl = await uploadMediaToSupabase(result.assets[0], "intro");
      const newSlides = [...introDraft.slides];
      newSlides[index] = { ...newSlides[index], image: publicUrl };
      setIntroDraft({ ...introDraft, slides: newSlides });
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === "Banner") {
        const finalBanner = {
          ...bannerDraft,
          currentEditorialTitle: bannerDraft.headline,
          archived: false,
        };
        await saveBanner(finalBanner);
        if (bannerDraft.isDefault) {
          await saveBaseBanner(finalBanner);
        }
      } else if (activeTab === "Welcome") {
        await saveWelcome(welcomeDraft);
      } else if (activeTab === "Onboarding") {
        await saveIntro(introDraft);
      }
      if (activeTab === "Banner") setEditorialVersions(await listEditorialVersions());
      setStatusMessage(`${activeTab} changes saved to Supabase.`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      Alert.alert("Error", "Failed to save.");
    }
  };

  const handleDiscard = () => {
    if (activeTab === "Banner") setBannerDraft(banner);
    else if (activeTab === "Welcome") setWelcomeDraft(welcome);
    else if (activeTab === "Onboarding") setIntroDraft(intro);
    setStatusMessage("Draft reset.");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      const timePart = bannerDraft.displayStart.includes("-")
        ? bannerDraft.displayStart.split("-")[1].trim()
        : "08:00";
      setBannerDraft({
        ...bannerDraft,
        displayStart: `${dateStr} - ${timePart}`,
      });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const datePart = bannerDraft.displayStart.includes("-")
        ? bannerDraft.displayStart.split("-")[0].trim()
        : "Apr 05, 2026";
      setBannerDraft({
        ...bannerDraft,
        displayStart: `${datePart} - ${timeStr}`,
      });
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      const timePart = bannerDraft.displayEnd?.includes("-")
        ? bannerDraft.displayEnd.split("-")[1].trim()
        : "23:59";
      setBannerDraft({
        ...bannerDraft,
        displayEnd: `${dateStr} - ${timePart}`,
      });
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const datePart = bannerDraft.displayEnd?.includes("-")
        ? bannerDraft.displayEnd.split("-")[0].trim()
        : "May 05, 2026";
      setBannerDraft({
        ...bannerDraft,
        displayEnd: `${datePart} - ${timeStr}`,
      });
    }
  };

  const handlePreviewApp = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7] dark:bg-[#050505]">
      <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
        <Pressable accessibilityRole="button" accessibilityLabel="Back to admin dashboard" onPress={() => router.navigate("/admin" as any)}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#f8fafc" : "#111111"}
          />
        </Pressable>
        <Text className="font-bold text-[11px] tracking-[1.5px] text-black dark:text-white uppercase">
          Brand Content Editor
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200 dark:border-white/10 px-6">
        {(["Banner", "Welcome", "Onboarding"] as ContentTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-6 pb-3 ${activeTab === tab ? "border-b-2 border-black dark:border-white" : ""}`}
          >
            <Text
              className={`font-bold text-[10px] tracking-[1px] ${activeTab === tab ? "text-black dark:text-white" : "text-gray-400"}`}
            >
              {tab.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {activeTab === "Banner" && (
          <View className="p-6">
            <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400 mb-4">
              LIVE PREVIEW
            </Text>
            <View className="relative h-[480px] w-full overflow-hidden bg-neutral-200 dark:bg-neutral-900">
              <ImageBackground
                source={
                  bannerDraft.imageUri
                    ? { uri: bannerDraft.imageUri }
                    : fallbackBannerImage
                }
                className="flex-1"
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  className="flex-1 justify-end p-8"
                >
                  <Text className="font-light text-white text-[10px] tracking-[4px] mb-2">
                    {bannerDraft.overlayLabel.toUpperCase()}
                  </Text>
                  <Text className="font-bold text-white text-[32px] leading-[36px] mb-6">
                    {bannerDraft.headline.toUpperCase()}
                  </Text>
                  <View className="self-start border border-white px-6 py-3">
                    <Text className="font-bold text-white text-[10px] tracking-[2px]">
                      {bannerDraft.ctaText.toUpperCase()}
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
              <Pressable
                accessibilityLabel="Change banner image"
                onPress={handlePickBannerImage}
                className="absolute right-4 top-4 h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/20"
              >
                <Ionicons name="camera" size={20} color="white" />
              </Pressable>
            </View>

            <ManagedMediaLibrary
              assets={mediaAssets}
              allowedTypes={["image"]}
              selectedUrl={bannerDraft.imageUri}
              onSelect={(asset) => setBannerDraft({ ...bannerDraft, imageUri: asset.publicUrl })}
            />
            {editorialVersions.length > 0 ? (
              <View className="mt-6 border-t border-neutral-200 pt-5 dark:border-white/10">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-[10px] font-bold tracking-[1.5px] text-black dark:text-white">EDITORIAL HISTORY</Text>
                  <Text className="text-[9px] font-bold text-neutral-400">{editorialVersions.length} VERSIONS</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {editorialVersions.map((version) => (
                    <Pressable
                      key={version.id}
                      onPress={() => {
                        setBannerDraft({ ...version.content, archived: false });
                        setStatusMessage(`Version ${version.version} loaded as a draft. Save to publish it as a new version.`);
                      }}
                      className="mr-3 w-48 border border-neutral-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#101215]"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[9px] font-bold tracking-[1.2px] text-neutral-400">V{version.version}</Text>
                        <Text className="text-[8px] font-bold text-[#b45309] dark:text-[#f0a35b]">{version.status.toUpperCase()}</Text>        </View>
                      <Text preserveCase className="mt-2 text-[13px] font-bold text-black dark:text-white" numberOfLines={2}>{version.content.headline}</Text>
                      <Text className="mt-2 text-[8px] text-neutral-400">{new Date(version.updatedAt).toLocaleDateString()}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <View className="mt-8 space-y-6">
              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  HEADLINE
                </Text>
                <TextInput
                  value={bannerDraft.headline}
                  onChangeText={(t) =>
                    setBannerDraft({ ...bannerDraft, headline: t })
                  }
                  className={fieldBaseClass}
                  placeholder="e.g. THE CRISP OXFORD"
                  placeholderTextColor="#999"
                />
              </View>
              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  OVERLAY LABEL
                </Text>
                <TextInput
                  value={bannerDraft.overlayLabel}
                  onChangeText={(t) =>
                    setBannerDraft({ ...bannerDraft, overlayLabel: t })
                  }
                  className={fieldBaseClass}
                />
              </View>
              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  SCHEDULED START
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="flex-1"
                  >
                    <TextInput
                      value={bannerDraft.displayStart.split("-")[0].trim()}
                      editable={false}
                      className={fieldBaseClass}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    className="flex-1"
                  >
                    <TextInput
                      value={
                        bannerDraft.displayStart.split("-")[1]?.trim() ||
                        "08:00"
                      }
                      editable={false}
                      className={fieldBaseClass}
                    />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white uppercase">
                  SCHEDULED END
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setShowEndDatePicker(true)}
                    className="flex-1"
                  >
                    <TextInput
                      value={
                        bannerDraft.displayEnd?.split("-")[0].trim() ||
                        "No End Date"
                      }
                      editable={false}
                      className={fieldBaseClass}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => setShowEndTimePicker(true)}
                    className="flex-1"
                  >
                    <TextInput
                      value={
                        bannerDraft.displayEnd?.split("-")[1]?.trim() || "23:59"
                      }
                      editable={false}
                      className={fieldBaseClass}
                    />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white uppercase">
                  TARGET URL
                </Text>
                <TextInput
                  value={bannerDraft.targetUrl || "/(tabs)/shop"}
                  onChangeText={(t) =>
                    setBannerDraft({ ...bannerDraft, targetUrl: t })
                  }
                  className={fieldBaseClass}
                  placeholder="e.g. /(tabs)/shop"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>

              <View className="flex-row items-center justify-between bg-white dark:bg-[#101215] p-4 border border-gray-100 dark:border-white/5">
                <View className="flex-1 mr-4">
                  <Text className="font-bold text-[10px] tracking-[1px] text-black dark:text-white uppercase">
                    SET AS DEFAULT BANNER
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    If active, this banner will show whenever other campaigns
                    expire.
                  </Text>
                </View>
                <Switch
                  value={bannerDraft.isDefault}
                  onValueChange={(v) =>
                    setBannerDraft({ ...bannerDraft, isDefault: v })
                  }
                  trackColor={{ false: "#767577", true: "#000" }}
                  thumbColor={bannerDraft.isDefault ? "#fff" : "#f4f3f4"}
                />
              </View>
            </View>
          </View>
        )}

        {activeTab === "Welcome" && (
          <View className="p-6">
            <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400 mb-4">
              PREVIEW
            </Text>
            <View className="h-64 w-full bg-neutral-200 dark:bg-neutral-900 rounded-lg overflow-hidden relative">
              {welcomeDraft.videoUri ? (
                <View className="flex-1 bg-black">
                  <WelcomeVideoPreview uri={welcomeDraft.videoUri} />
                </View>
              ) : (
                <ImageBackground
                  source={
                    welcomeDraft.imageUri
                      ? { uri: welcomeDraft.imageUri }
                      : fallbackBannerImage
                  }
                  className="flex-1"
                />
              )}
              <View className="absolute inset-0 bg-black/30 p-6 justify-end pointer-events-none">
                <Text
                  className="text-white font-bold text-xl"
                  style={
                    welcomeDraft.textFont === "cormorant"
                      ? { fontFamily: "Cormorant-Bold" }
                      : undefined
                  }
                >
                  {welcomeDraft.headline}
                </Text>
                <Text
                  className="text-white/80 text-xs tracking-[2px]"
                  style={
                    welcomeDraft.textFont === "cormorant"
                      ? { fontFamily: "Cormorant-Medium" }
                      : undefined
                  }
                >
                  {welcomeDraft.subtitle}
                </Text>
              </View>
              <View className="absolute right-4 top-4 flex-row gap-2">
                <Pressable
                  accessibilityLabel="Choose welcome image"
                  onPress={() => handlePickWelcomeMedia("image")}
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/20"
                >
                  <Ionicons name="image" size={18} color="white" />
                </Pressable>
                <Pressable
                  accessibilityLabel="Choose welcome video"
                  onPress={() => handlePickWelcomeMedia("video")}
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/20"
                >
                  <Ionicons name="videocam" size={18} color="white" />
                </Pressable>
              </View>
            </View>

            <ManagedMediaLibrary
              assets={mediaAssets}
              allowedTypes={["image", "video"]}
              selectedUrl={welcomeDraft.videoUri || welcomeDraft.imageUri}
              onSelect={(asset) => setWelcomeDraft({
                ...welcomeDraft,
                imageUri: asset.mediaType === "image" ? asset.publicUrl : undefined,
                videoUri: asset.mediaType === "video" ? asset.publicUrl : undefined,
              })}
            />
            <View className="mt-8 space-y-6">
              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  MAIN TITLE
                </Text>
                <TextInput
                  value={welcomeDraft.headline}
                  onChangeText={(t) =>
                    setWelcomeDraft({ ...welcomeDraft, headline: t })
                  }
                  className={fieldBaseClass}
                />
              </View>
              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  SUBTITLE
                </Text>
                <TextInput
                  value={welcomeDraft.subtitle}
                  onChangeText={(t) =>
                    setWelcomeDraft({ ...welcomeDraft, subtitle: t })
                  }
                  className={fieldBaseClass}
                />
              </View>
              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  BUTTON TEXT
                </Text>
                <TextInput
                  value={welcomeDraft.ctaText}
                  onChangeText={(t) =>
                    setWelcomeDraft({ ...welcomeDraft, ctaText: t })
                  }
                  className={fieldBaseClass}
                />
              </View>

              <View>
                <Text className="font-bold text-[10px] tracking-[1.5px] text-black dark:text-white">
                  TEXT STYLE
                </Text>
                <View className="mt-2 flex-row gap-2">
                  {(
                    [
                      { key: "lexend", label: "Lexend" },
                      { key: "cormorant", label: "Cormorant" },
                    ] as { key: WelcomeTextFont; label: string }[]
                  ).map((option) => {
                    const isSelected =
                      (welcomeDraft.textFont || "lexend") === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() =>
                          setWelcomeDraft({
                            ...welcomeDraft,
                            textFont: option.key,
                          })
                        }
                        className={`flex-1 items-center py-4 border ${
                          isSelected
                            ? "bg-black border-black dark:bg-white dark:border-white"
                            : "border-gray-200 dark:border-white/10"
                        }`}
                      >
                        <Text
                          className={`font-bold text-[11px] tracking-[1px] ${
                            isSelected
                              ? "text-white dark:text-black"
                              : "text-black dark:text-white"
                          }`}
                          style={
                            option.key === "cormorant"
                              ? { fontFamily: "Cormorant-Bold" }
                              : undefined
                          }
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text className="text-[10px] text-gray-400 mt-2">
                  Applies to the title and subtitle on the welcome screen, over
                  both the image and video background.
                </Text>
              </View>

              <View className="mt-4 flex-row items-center justify-between bg-white dark:bg-[#101215] p-4 border border-gray-100 dark:border-white/5">
                <View className="flex-1 mr-4">
                  <Text className="font-bold text-[10px] tracking-[1px] text-black dark:text-white uppercase">
                    MUTE VIDEO
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    If active, the background video will play without sound.
                  </Text>
                </View>
                <Switch
                  value={welcomeDraft.muted}
                  onValueChange={(v) =>
                    setWelcomeDraft({ ...welcomeDraft, muted: v })
                  }
                  trackColor={{ false: "#767577", true: "#000" }}
                  thumbColor={welcomeDraft.muted ? "#fff" : "#f4f3f4"}
                />
              </View>

              <Pressable
                onPress={() => handlePreviewApp("/(onboarding)/welcome")}
                className="mt-4 flex-row items-center justify-center py-4 border border-black/10 dark:border-white/10"
              >
                <Ionicons
                  name="eye-outline"
                  size={16}
                  color={isDark ? "#fff" : "#000"}
                />
                <Text className="ml-2 font-bold text-[10px] tracking-[1px] text-black dark:text-white uppercase">
                  Preview Welcome Screen
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeTab === "Onboarding" && (
          <View className="p-6">
            <Text className="text-[10px] font-bold tracking-[1.5px] text-black dark:text-white">EDITING SLIDE</Text>
            <View className="mt-3 flex-row gap-2">
              {introDraft.slides.map((slide, index) => (
                <Pressable
                  key={slide.id}
                  onPress={() => setSelectedIntroSlide(index)}
                  className={`h-10 w-10 items-center justify-center ${selectedIntroSlide === index ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-[#17191d]"}`}
                >
                  <Text className={`text-[10px] font-bold ${selectedIntroSlide === index ? "text-white dark:text-black" : "text-neutral-500"}`}>{index + 1}</Text>
                </Pressable>
              ))}
            </View>
            <ManagedMediaLibrary
              assets={mediaAssets}
              allowedTypes={["image"]}
              selectedUrl={introDraft.slides[selectedIntroSlide]?.image}
              onSelect={(asset) => {
                const slides = [...introDraft.slides];
                if (!slides[selectedIntroSlide]) return;
                slides[selectedIntroSlide] = { ...slides[selectedIntroSlide], image: asset.publicUrl };
                setIntroDraft({ ...introDraft, slides });
              }}
            />
            <View className="mb-8" />
            {introDraft.slides.map((slide, index) => (
              <View
                key={slide.id}
                className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8"
              >
                <Text className="font-bold text-[10px] tracking-[2px] text-neutral-400 mb-4 uppercase">
                  SLIDE {index + 1}
                </Text>
                <View className="flex-row gap-4">
                  <Pressable
                    onPress={() => handlePickIntroImage(index)}
                    className="h-32 w-32 bg-neutral-200 dark:bg-neutral-900 rounded-lg overflow-hidden items-center justify-center"
                  >
                    <ImageBackground
                      source={{ uri: slide.image }}
                      className="w-full h-full"
                    >
                      <View className="flex-1 bg-black/20 items-center justify-center">
                        <Ionicons name="camera" size={24} color="white" />
                      </View>
                    </ImageBackground>
                  </Pressable>
                  <View className="flex-1">
                    <Text className="font-bold text-[10px] tracking-[1px] text-black dark:text-white">
                      BADGE
                    </Text>
                    <TextInput
                      value={slide.badge}
                      onChangeText={(t) => {
                        const newSlides = [...introDraft.slides];
                        newSlides[index] = { ...newSlides[index], badge: t };
                        setIntroDraft({ ...introDraft, slides: newSlides });
                      }}
                      className={fieldBaseClass}
                    />
                  </View>
                </View>
                <View className="mt-4">
                  <Text className="font-bold text-[10px] tracking-[1px] text-black dark:text-white mt-4">
                    TITLE
                  </Text>
                  <TextInput
                    value={slide.title}
                    multiline
                    onChangeText={(t) => {
                      const newSlides = [...introDraft.slides];
                      newSlides[index] = { ...newSlides[index], title: t };
                      setIntroDraft({ ...introDraft, slides: newSlides });
                    }}
                    className={fieldBaseClass}
                  />
                  <Text className="font-bold text-[10px] tracking-[1px] text-black dark:text-white mt-4">
                    DESCRIPTION
                  </Text>
                  <TextInput
                    value={slide.description}
                    multiline
                    onChangeText={(t) => {
                      const newSlides = [...introDraft.slides];
                      newSlides[index] = {
                        ...newSlides[index],
                        description: t,
                      };
                      setIntroDraft({ ...introDraft, slides: newSlides });
                    }}
                    className={fieldBaseClass}
                  />
                </View>
              </View>
            ))}

            <Pressable
              onPress={() => handlePreviewApp("/(onboarding)/intro")}
              className="mt-2 flex-row items-center justify-center py-4 border border-black/10 dark:border-white/10"
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color={isDark ? "#fff" : "#000"}
              />
              <Text className="ml-2 font-bold text-[10px] tracking-[1px] text-black dark:text-white uppercase">
                Preview Onboarding Flow
              </Text>
            </Pressable>
          </View>
        )}

        <View className="mt-8 px-6">
          {statusMessage ? (
            <Text className="mb-4 font-normal text-[12px] text-[#3c6a9e]">
              {statusMessage}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSave}
            className="bg-[#161c28] py-4 rounded-sm"
          >
            <Text className="text-center font-bold text-[11px] tracking-[2px] text-white">
              SAVE CHANGES
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDiscard}
            className="mt-3 border border-[#e2e6eb] bg-white py-4 rounded-sm dark:border-white/10 dark:bg-[#101215]"
          >
            <Text className="text-center font-bold text-[11px] tracking-[2px] text-neutral-500">
              DISCARD DRAFT
            </Text>
          </Pressable>
          {activeTab === "Banner" && banner.isActive ? (
            <Pressable accessibilityRole="button"
              onPress={async () => {
                try {
                  await archiveBanner();
                  await fetchManagedContent();
                  setEditorialVersions(await listEditorialVersions());
                  setStatusMessage("Editorial archived. The default banner will be used when available.");
                } catch {
                  Alert.alert("Archive failed", "The editorial could not be archived.");
                }
              }}
              className="mt-3 py-3"
            >
              <Text className="text-center text-[9px] font-bold tracking-[1.4px] text-red-500">ARCHIVE CURRENT EDITORIAL</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          is24Hour={true}
          onChange={onTimeChange}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          is24Hour={true}
          onChange={onEndTimeChange}
        />
      )}
      {isUploading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white dark:bg-[#101215] px-6 py-6 items-center border border-neutral-200 dark:border-white/10">
            <Text className="font-bold text-[11px] tracking-[2px] text-black dark:text-white uppercase mb-2">
              UPLOADING MEDIA
            </Text>
            <Text className="text-[10px] text-neutral-400">
              Synchronizing with Supabase Storage...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function WelcomeVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
      nativeControls={true}
    />
  );
}
