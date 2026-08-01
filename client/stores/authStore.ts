import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { hasSupabaseConfig, GOOGLE_WEB_CLIENT_ID } from "@/constants/keys";
import { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Alert } from "react-native";
import { signInSchema, signUpSchema, resetPasswordSchema } from "@/schemas/authSchemas";

export interface CustomerProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at?: string | null;
}

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: CustomerProfile | null;
  isProfileLoading: boolean;
  initialize: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  profile: null,
  isProfileLoading: false,

  initialize: () => {
    if (!hasSupabaseConfig()) {
      set({ isLoading: false });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isAuthenticated: !!session,
        ...(!session ? { profile: null, isProfileLoading: false } : {}),
      });
      if (session) void get().fetchProfile();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        ...(!session ? { profile: null, isProfileLoading: false } : {}),
      });
      if (session) void get().fetchProfile();
    });
  },

  signInWithEmail: async (email, password) => {
    if (!hasSupabaseConfig()) return { error: null };

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { error: error ? error.message : null };
  },

  signUpWithEmail: async (email, password, fullName) => {
    if (!hasSupabaseConfig()) return { error: null };

    const validation = signUpSchema.safeParse({ email, password, fullName });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName ?? "",
        },
      },
    });

    return { error: error ? error.message : null };
  },

  signInWithGoogle: async () => {
    if (!hasSupabaseConfig()) {
      Alert.alert(
        "Not Configured",
        "Supabase is not configured yet. Add your EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable authentication."
      );
      return { error: "Supabase not configured" };
    }

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            ...(GOOGLE_WEB_CLIENT_ID ? { client_id: GOOGLE_WEB_CLIENT_ID } : {}),
          },
        },
      });

      if (error) return { error: error.message };
      if (!data?.url) return { error: "No auth URL returned" };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          return { error: null };
        }

        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) return { error: exchangeError.message };
          return { error: null };
        }

        return { error: "Could not extract session from redirect" };
      }

      return { error: "Authentication was cancelled" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      return { error: message };
    }
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null, isProfileLoading: false });
      return;
    }

    set({ isProfileLoading: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,phone,avatar_url,created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load customer profile:", error.message);
      set({ isProfileLoading: false });
      return;
    }

    set({ profile: data as CustomerProfile | null, isProfileLoading: false });
  },

  signOut: async () => {
    if (hasSupabaseConfig()) {
      await supabase.auth.signOut();
    }
    
    // Clear storage keys for user-specific data
    try {
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      await AsyncStorage.multiRemove([
        "@orders",
        "@favorites",
        "@shipping_addresses",
      ]);
    } catch (e) {
      console.error("Failed to clear async storage keys on logout:", e);
    }
    
    // Clear in-memory Zustand states of user stores so they immediately reflect empty data
    try {
      const { useOrdersStoreBase } = await import("./ordersStore");
      useOrdersStoreBase.setState({ orders: [], arrivalAttentionOrders: [], blacklistedOrderAlerts: [] });
      
      const { useFavoritesStore } = await import("./favoritesStore");
      useFavoritesStore.setState({ favorites: [] });
      
      const { useAddressStore } = await import("./addressStore");
      useAddressStore.setState({ addresses: [] });
      
      const { useBagStore } = await import("./bagStore");
      useBagStore.setState({ bagItems: [] });
    } catch (e) {
      console.error("Failed to reset user store states on logout:", e);
    }

    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isProfileLoading: false,
    });
  },

  resetPassword: async (email) => {
    if (!hasSupabaseConfig()) return { error: "Supabase not configured" };

    const validation = resetPasswordSchema.safeParse({ email });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    const redirectTo = AuthSession.makeRedirectUri({
      path: "auth/reset-password",
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    return { error: error ? error.message : null };
  },
}));
