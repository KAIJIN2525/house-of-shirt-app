import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ShippingAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault: boolean;
}


interface AddressState {
  addresses: ShippingAddress[];
  isLoading: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<ShippingAddress, "id">) => Promise<void>;
  updateAddress: (id: string, address: Partial<ShippingAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  getDefaultAddress: () => ShippingAddress | undefined;
}


export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      isLoading: false,

      fetchAddresses: async () => {
        set({ isLoading: true });
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (data) {
            set({
              addresses: data.map((a: any) => ({
                id: a.id,
                fullName: a.full_name,
                phoneNumber: a.phone,
                address: a.address_line1,
                apartment: a.address_line2 || "",
                city: a.city,
                state: a.state,
                zipCode: "", 
                country: a.country,
                isDefault: a.is_default,
              })),

            });
          }
        } catch (err) {
          console.error("Error fetching addresses:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      addAddress: async (address) => {
        const tempId = Math.random().toString();
        set((state) => {
          const newAddress: ShippingAddress = { ...address, id: tempId };
          const newAddresses = address.isDefault
            ? [newAddress, ...state.addresses.map((a) => ({ ...a, isDefault: false }))]
            : [...state.addresses, newAddress];
          return { addresses: newAddresses };
        });

        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (address.isDefault) {
             await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
          }

          await supabase.from("addresses").insert({
            user_id: user.id,
            label: "Shipping Address",
            full_name: address.fullName,
            phone: address.phoneNumber,
            address_line1: address.address,
            address_line2: address.apartment,
            city: address.city,
            state: address.state,
            country: address.country || "Nigeria",
            is_default: address.isDefault,
          });

          
          get().fetchAddresses();
        } catch (err) {
          console.error("Error adding address:", err);
        }
      },

      updateAddress: async (id, updatedData) => {
        set((state) => {
          const newAddresses = state.addresses.map((addr) => {
            if (addr.id === id) return { ...addr, ...updatedData };
            if (updatedData.isDefault) return { ...addr, isDefault: false };
            return addr;
          });
          return { addresses: newAddresses };
        });

        try {
          const { supabase } = await import("@/lib/supabase");
          if (updatedData.isDefault) {
            const { data: { user } } = await supabase.auth.getUser();
            // Without a session the filter would match nothing, silently leaving
            // the previous default in place alongside the new one.
            if (user) {
              await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
            }
          }

          await supabase.from("addresses").update({
            full_name: updatedData.fullName,
            phone: updatedData.phoneNumber,
            address_line1: updatedData.address,
            address_line2: updatedData.apartment,
            city: updatedData.city,
            state: updatedData.state,
            is_default: updatedData.isDefault,
          }).eq("id", id);

        } catch (err) {
          console.error("Error updating address:", err);
        }
      },

      deleteAddress: async (id) => {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase.from("addresses").delete().eq("id", id);
        } catch (err) {
          console.error("Error deleting address:", err);
        }
      },

      setDefaultAddress: async (id) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          })),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            return;
          }
          await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
          await supabase.from("addresses").update({ is_default: true }).eq("id", id);
        } catch (err) {
          console.error("Error setting default address:", err);
        }
      },

      getDefaultAddress: () => {
        return get().addresses.find((addr) => addr.isDefault);
      },

    }),
    {
      name: "@shipping_addresses",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
