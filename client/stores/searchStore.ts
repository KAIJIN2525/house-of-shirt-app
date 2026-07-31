import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SearchState {
  recentSearches: string[];
  addSearch: (term: string) => void;
  removeSearch: (term: string) => void;
  clearAll: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addSearch: (term: string) => {
        if (!term.trim()) return;
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase());
          return {
            recentSearches: [term, ...filtered].slice(0, 10), // Keep last 10
          };
        });
      },
      removeSearch: (term: string) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== term),
        }));
      },
      clearAll: () => set({ recentSearches: [] }),
    }),
    {
      name: "@search_history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
