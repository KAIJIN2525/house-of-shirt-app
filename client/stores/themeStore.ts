import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "system" | "light" | "dark";
export type TypographyFont = "lexend" | "outfit";
export type TextTransformMode = "none" | "capitalize" | "uppercase" | "lowercase";

export interface ThemeState {
  themeMode: ThemeMode;
  colorScheme: Exclude<ThemeMode, "system">;
  isDark: boolean;
  typographyFont: TypographyFont;
  textTransformMode: TextTransformMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setTypographyFont: (font: TypographyFont) => Promise<void>;
  setTextTransformMode: (mode: TextTransformMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  initTheme: (systemColorScheme: Exclude<ThemeMode, "system">) => Promise<void>;
}

const STORAGE_KEY = "@theme_mode";
const TYPOGRAPHY_FONT_KEY = "@typography_font";
const TEXT_TRANSFORM_KEY = "@text_transform_mode";

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: "system",
  colorScheme: "light",
  isDark: false,
  typographyFont: "lexend",
  textTransformMode: "capitalize",
  
  setThemeMode: async (mode) => {
    // Keep it optimistic
    const systemScheme = get().colorScheme; // If we switch back to system, we might need system scheme. For now, let's keep it simple.
    
    set((state) => {
      const resolved = mode === "system" ? state.colorScheme : mode;
      return {
        themeMode: mode,
        colorScheme: resolved,
        isDark: resolved === "dark"
      };
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },

  setTypographyFont: async (font) => {
    set({ typographyFont: font });
    await AsyncStorage.setItem(TYPOGRAPHY_FONT_KEY, font);
  },

  setTextTransformMode: async (mode) => {
    set({ textTransformMode: mode });
    await AsyncStorage.setItem(TEXT_TRANSFORM_KEY, mode);
  },
  
  toggleTheme: async () => {
    const { colorScheme, setThemeMode } = get();
    await setThemeMode(colorScheme === "dark" ? "light" : "dark");
  },
  
  initTheme: async (systemColorScheme) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const storedFont = await AsyncStorage.getItem(TYPOGRAPHY_FONT_KEY);
      const storedTextTransform = await AsyncStorage.getItem(TEXT_TRANSFORM_KEY);
      const nextThemeMode =
        stored === "dark" || stored === "light" || stored === "system"
          ? (stored as ThemeMode)
          : "system";
      const nextTypographyFont =
        storedFont === "lexend" || storedFont === "outfit"
          ? (storedFont as TypographyFont)
          : "lexend";
      const nextTextTransformMode =
        storedTextTransform === "capitalize" ||
        storedTextTransform === "uppercase" ||
        storedTextTransform === "lowercase" ||
        storedTextTransform === "none"
          ? (storedTextTransform as TextTransformMode)
          : "capitalize";
      
      const resolvedScheme = nextThemeMode === "system" ? systemColorScheme : nextThemeMode;
      
      set({ 
        themeMode: nextThemeMode,
        colorScheme: resolvedScheme,
        isDark: resolvedScheme === "dark",
        typographyFont: nextTypographyFont,
        textTransformMode: nextTextTransformMode,
      });
    } catch (error) {
      console.error("Failed to load theme mode:", error);
    }
  }
}));
