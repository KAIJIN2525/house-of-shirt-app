import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";

import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { useNotificationStore, registerForPushNotificationsAsync } from "@/stores/notificationStore";
import * as Notifications from "expo-notifications";
import { HouseLoader } from "@/components/loading/HouseLoader";
import { HouseToastHost } from "@/components/notifications/HouseToastHost";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useBagStore } from "@/stores/bagStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useAddressStore } from "@/stores/addressStore";
import { useAdminContentStore } from "@/stores/adminContentStore";
import { useProductsStore } from "@/stores/productsStore";



import {
  AppState,
  InteractionManager,
  Platform,
  useColorScheme as useSystemColorScheme,
} from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { useThemeStore } from "@/stores/themeStore";
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import {
  Cormorant_300Light,
  Cormorant_400Regular,
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold,
} from "@expo-google-fonts/cormorant";
import { ShopifyCheckoutSheetProvider } from "@shopify/checkout-sheet-kit";
import { isRunningInExpoGo } from "expo";
import * as Sentry from "@sentry/react-native";

// The DSN is not a secret -- it ships inside the app bundle either way -- so it
// is inlined as the fallback. That keeps EAS builds reporting even though
// .easignore excludes .env from the build upload. Override per environment with
// EXPO_PUBLIC_SENTRY_DSN when pointing a build at a different project.
Sentry.init({
  dsn:
    process.env.EXPO_PUBLIC_SENTRY_DSN ??
    "https://c2c0194abda53136b1e5a6c745e803b7@o4511825090248704.ingest.de.sentry.io/4511833284870224",

  environment: __DEV__ ? "development" : "production",

  // Full sampling while proving the wiring out. Drop to ~0.1-0.2 once real
  // traffic arrives, or tracing quota disappears fast on a busy storefront.
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,

  // Slow/frozen frame tracking needs the native module, which Expo Go lacks.
  enableNativeFramesTracking: !isRunningInExpoGo(),

  // Ties mobile traces to the Supabase Edge Functions they call, so a failed
  // checkout or order sync shows up as one trace rather than two halves.
  tracePropagationTargets: [/^https:\/\/[a-z0-9-]+\.supabase\.co/],

  debug: false,
});

function RootLayout() {
  return (
    <RootLayoutContent />
  );
}

// Wrapping the root captures render-phase errors and enables the touch/navigation
// instrumentation the tracing integration relies on.
export default Sentry.wrap(RootLayout);

function GlobalStoreInitializer() {
  const router = useRouter();
  const { expoPushToken, setExpoPushToken, setNotification } = useNotificationStore();

  const { initialize, isAuthenticated, user } = useAuthStore();
  const fetchBag = useBagStore((state) => state.fetchBag);
  const fetchFavorites = useFavoritesStore((state) => state.fetchFavorites);
  const fetchAddresses = useAddressStore((state) => state.fetchAddresses);
  const { fetchManagedContent } = useAdminContentStore();
  const fetchProducts = useProductsStore((state) => state.fetchProducts);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const refresh = () => void fetchManagedContent();
    const task = InteractionManager.runAfterInteractions(refresh);
    const interval = setInterval(refresh, 5 * 60 * 1000);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      task.cancel();
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [fetchManagedContent]);

  useEffect(() => {
    const refresh = () => void fetchProducts();
    refresh();

    const interval = setInterval(refresh, 5 * 60 * 1000);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [fetchProducts]);

  useEffect(() => {
    if (isAuthenticated) {
      const task = InteractionManager.runAfterInteractions(() => {
        void fetchBag().catch(() => {});
        void fetchFavorites().catch(() => {});
        void fetchAddresses().catch(() => {});
      });

      return () => task.cancel();
    }
  }, [isAuthenticated, fetchBag, fetchFavorites, fetchAddresses]);

  // Synchronize Expo Push Token to user's profile in Supabase
  useEffect(() => {
    if (isAuthenticated && user?.id && expoPushToken) {
      const task = InteractionManager.runAfterInteractions(() => {
        void (async () => {
          try {
            const { error } = await supabase
              .from("profiles")
              .update({ expo_push_token: expoPushToken })
              .eq("id", user.id);

            if (error) {
              console.error("Error updating profiles expo_push_token:", error);
            }
          } catch (error) {
            console.error("Error synchronizing expo push token:", error);
          }
        })();
      });

      return () => task.cancel();
    }
  }, [isAuthenticated, user?.id, expoPushToken]);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      void registerForPushNotificationsAsync()
        .then((token) => {
          if (isMounted) {
            setExpoPushToken(token);
          }
        })
        .catch((error: unknown) => {
          console.error("Push registration failed:", error);
        });
    }, 1500);

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification Response Received:", response);
      const data = response.notification.request.content.data;
      
      if (data) {
        // Handle admin campaign data structure
        const type = data.targetType || data.type;
        const val = data.targetValue || data.id || data.orderId || data.productId;

        if (type === 'product' && val) {
          router.push(`/product/${val}` as any);
        } else if (type === 'orders' && val) {
          router.push(`/orders/${val}` as any);
        } else if (data.url) {
          router.push(data.url as any);
        }
      }

    });
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      notificationListener.remove();
      responseListener.remove();
    };
  }, [router, setExpoPushToken, setNotification]);



  return null;
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const initTheme = useThemeStore((state) => state.initTheme);
  const systemColorScheme = useSystemColorScheme();

  const [fontsLoaded] = useFonts({
    "Lexend-Light": require("../assets/fonts/Lexend_300Light.ttf"),
    "Lexend-Regular": require("../assets/fonts/Lexend_400Regular.ttf"),
    "Lexend-Medium": require("../assets/fonts/Lexend_500Medium.ttf"),
    "Lexend-SemiBold": require("../assets/fonts/Lexend_600SemiBold.ttf"),
    "Lexend-Bold": require("../assets/fonts/Lexend_700Bold.ttf"),
    "Outfit-Light": Outfit_300Light,
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    "Cormorant-Light": Cormorant_300Light,
    "Cormorant-Regular": Cormorant_400Regular,
    "Cormorant-Medium": Cormorant_500Medium,
    "Cormorant-SemiBold": Cormorant_600SemiBold,
    "Cormorant-Bold": Cormorant_700Bold,
  });

  useEffect(() => {
    initTheme(systemColorScheme === "dark" ? "dark" : "light");
  }, [systemColorScheme, initTheme]);

  useEffect(() => {
    setColorScheme(colorScheme);
  }, [colorScheme, setColorScheme]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    const timer = setTimeout(() => {
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
      NavigationBar.setButtonStyleAsync(colorScheme === "dark" ? "light" : "dark").catch(
        () => {}
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [colorScheme]);

  if (!fontsLoaded) {
    return <HouseLoader fullscreen label="OPENING ATELIER" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShopifyCheckoutSheetProvider>
        <GlobalStoreInitializer />
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                              <Stack initialRouteName="(onboarding)">
                              <Stack.Screen
                                name="(onboarding)"
                                options={{ headerShown: false }}
                              />

                              <Stack.Screen
                                name="(auth)"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="auth/reset-password"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="search"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="notifications"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="contact"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="admin"
                                options={{ headerShown: false }}
                              />

                              <Stack.Screen
                                name="orders/index"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="support/chat"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="(tabs)"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="checkout/payment"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="checkout/success"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="checkout/failed"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="orders/[id]"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="returns/initiate/[id]"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="returns/status/[id]"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="returns/index"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="product/[id]"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="profile/shipping-addresses"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="profile/account-security"
                                options={{ headerShown: false }}
                              />
                              <Stack.Screen
                                name="modal"
                                options={{
                                  presentation: "modal",
                                  title: "Modal",
                                }}
                              />
                              </Stack>
                              <StatusBar
                                style={colorScheme === "dark" ? "light" : "dark"}
                                backgroundColor={colorScheme === "dark" ? "#050505" : "#ffffff"}
                              />
                              <HouseToastHost />
        </ThemeProvider>
      </ShopifyCheckoutSheetProvider>
    </GestureHandlerRootView>
  );
}
