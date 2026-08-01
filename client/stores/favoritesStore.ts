import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FavoritesState {
  favorites: string[];
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
}


export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,

      fetchFavorites: async () => {
        set({ isLoading: true });
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from("favorites")
            .select("product_id")
            .eq("user_id", user.id);

          if (error) throw error;
          if (data) {
            set({ favorites: data.map((f) => f.product_id) });
          }
        } catch (err) {
          console.error("Error fetching favorites:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      addToFavorites: async (productId) => {
        set((state) => ({ favorites: [...state.favorites, productId] }));
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from("favorites").upsert({ user_id: user.id, product_id: productId });
        } catch (err) {
          console.error("Error saving favorite:", err);
        }
      },

      removeFromFavorites: async (productId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== productId),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
        } catch (err) {
          console.error("Error removing favorite:", err);
        }
      },

      clearFavorites: async () => {
        set({ favorites: [] });
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from("favorites").delete().eq("user_id", user.id);
        } catch (err) {
          console.error("Error clearing favorites:", err);
        }
      },

      isFavorite: (productId) => get().favorites.includes(productId),

      toggleFavorite: async (productId) => {
        if (get().isFavorite(productId)) {
          await get().removeFromFavorites(productId);
        } else {
          await get().addToFavorites(productId);
        }
      },

    }),
    {
      name: "@favorites",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
