import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  autoHideDuration: number;
  showToast: (input: {
    message: string;
    type?: ToastType;
    autoHideDuration?: number;
  }) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: "",
  type: "info",
  autoHideDuration: 4000,
  showToast: ({ message, type = "info", autoHideDuration = 4000 }) =>
    set({
      visible: true,
      message,
      type,
      autoHideDuration,
    }),
  hideToast: () =>
    set((state) => ({
      ...state,
      visible: false,
    })),
}));
