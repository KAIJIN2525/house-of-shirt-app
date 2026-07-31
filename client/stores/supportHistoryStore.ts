import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SupportThreadRecord {
  id: string;
  topic: string;
  label: string;
  messagePreview: string;
  orderId?: string;
  productName?: string;
  createdAt: string;
}

interface SupportHistoryState {
  threads: SupportThreadRecord[];
  addThread: (input: Omit<SupportThreadRecord, "id" | "createdAt">) => void;
  clearThreads: () => void;
}

export const useSupportHistoryStore = create<SupportHistoryState>()(
  persist(
    (set) => ({
      threads: [],
      addThread: (input) =>
        set((state) => ({
          threads: [
            {
              ...input,
              id: `support-${Date.now()}`,
              createdAt: new Date().toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            ...state.threads,
          ].slice(0, 25),
        })),
      clearThreads: () => set({ threads: [] }),
    }),
    {
      name: "@support_history",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
