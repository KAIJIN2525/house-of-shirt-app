import { Product } from "@/constants/products";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { create } from "zustand";

interface RestockRequestsState {
  isSubmitting: boolean;
  requestRestockNotification: (product: Product, size: string) => Promise<void>;
}

export const useRestockRequestsStore = create<RestockRequestsState>((set) => ({
  isSubmitting: false,

  requestRestockNotification: async (product, size) => {
    const { user } = useAuthStore.getState();

    if (!user?.id) {
      throw new Error("Please sign in so we can notify you when this size is back.");
    }

    set({ isSubmitting: true });
    try {
      const { error } = await supabase.from("back_in_stock_requests").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          shopify_product_id: product.id,
          product_title: product.name,
          size,
          email: user.email ?? null,
          phone: user.phone ?? user.user_metadata?.phone ?? null,
          notification_channels: ["app", "push", "email"],
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id,size" },
      );

      if (error) {
        if (error.code === "42P01") {
          throw new Error("This feature isn't available yet. Please try again later.");
        }
        if (error.code === "23505") {
          throw new Error("You're already on the notify list for this size.");
        }
        throw new Error(error.message ?? "We could not save your restock request. Please try again.");
      }

      try {
        await supabase.from("app_notifications").insert({
          user_id: user.id,
          title: "Waitlist confirmed",
          message: `We'll notify you when ${product.name} in size ${size} is back in stock.`,
          label: "RESTOCK",
          icon: "notifications-outline",
          target_type: "product",
          target_value: product.id,
        });
      } catch {
        // Non-fatal: the restock request was already saved.
      }
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
