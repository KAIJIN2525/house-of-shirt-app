import { create } from "zustand";

export interface BagItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  image: any;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface BagState {
  bagItems: BagItem[];
  isLoading: boolean;
  fetchBag: () => Promise<void>;
  addToBag: (item: Omit<BagItem, "id">) => Promise<void>;
  removeFromBag: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearBag: () => Promise<void>;
  getTotalPrice: () => number;
}


export const useBagStore = create<BagState>((set, get) => ({
  bagItems: [],
  isLoading: false,

  fetchBag: async () => {
    set({ isLoading: true });
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      if (data) {
        set({
          bagItems: data.map((item) => ({
            id: item.id,
            productId: item.product_id,
            variantId: item.variant_id ? String(item.variant_id) : undefined,
            name: item.name,
            image: item.image,
            price: Number(item.price),
            quantity: item.quantity,
            size: item.size ?? undefined,
            color: item.color ?? undefined,
          })),
        });
      }
    } catch (err) {
      console.error("Error fetching bag:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addToBag: async (item) => {
    if (!item.variantId) {
      throw new Error("A Shopify variant is required before an item can be added to the bag.");
    }
    const tempId = Math.random().toString();
    set((state) => {
      const existingItem = state.bagItems.find(
        (i) =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.color === item.color &&
          i.variantId === item.variantId
      );

      if (existingItem) {
        return {
          bagItems: state.bagItems.map((i) =>
            i.id === existingItem.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }

      return {
        bagItems: [...state.bagItems, { ...item, id: tempId }],
      };
    });

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: persistedItems, error: lookupError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("variant_id", item.variantId)
        .limit(1);
      if (lookupError) throw lookupError;

      const persisted = persistedItems?.[0];
      if (persisted) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: Number(persisted.quantity ?? 0) + item.quantity })
          .eq("id", persisted.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: item.productId,
          variant_id: item.variantId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        });
        if (error) throw error;
      }

      // Abandoned Cart Notification Schedule
      const { scheduleAbandonedCartNotification } = await import("@/lib/notifications");
      scheduleAbandonedCartNotification();
      
    } catch (err) {
      console.error("Error adding to bag:", err);
    }
  },

  removeFromBag: async (id) => {
    set((state) => ({
      bagItems: state.bagItems.filter((item) => item.id !== id),
    }));
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("cart_items").delete().eq("id", id);
    } catch (err) {
      console.error("Error removing from bag:", err);
    }
  },

  updateQuantity: async (id, quantity) => {
    if (quantity <= 0) {
      await get().removeFromBag(id);
      return;
    }
    set((state) => ({
      bagItems: state.bagItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }));
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("cart_items").update({ quantity }).eq("id", id);
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  },

  clearBag: async () => {
    set({ bagItems: [] });
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      }
    } catch (err) {
      console.error("Error clearing bag:", err);
    }
  },

  getTotalPrice: () => {
    return get().bagItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },
}));
