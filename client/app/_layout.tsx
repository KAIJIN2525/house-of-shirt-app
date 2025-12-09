import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { AddressProvider } from "@/contexts/AddressContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

// Remove or comment out the anchor to control initial route
// export const unstable_settings = {
//   anchor: "(tabs)",
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    "Futura-Light": require("../assets/fonts/FuturaCyrillicLight.ttf"),
    "Futura-Book": require("../assets/fonts/FuturaCyrillicBook.ttf"),
    "Futura-Medium": require("../assets/fonts/FuturaCyrillicMedium.ttf"),
    "Futura-Demi": require("../assets/fonts/FuturaCyrillicDemi.ttf"),
    "Futura-Bold": require("../assets/fonts/FuturaCyrillicBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");

    const timer = setTimeout(() => {
      NavigationBar.setVisibilityAsync("hidden");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <FavoritesProvider>
      <AddressProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack initialRouteName="(onboarding)">
            <Stack.Screen
              name="(onboarding)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(onboarding)/intro"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="profile/shipping-addresses"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="dark" backgroundColor="#ffffff" />
        </ThemeProvider>
      </AddressProvider>
    </FavoritesProvider>
  );
}
