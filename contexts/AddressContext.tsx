import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface ShippingAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface AddressContextType {
  addresses: ShippingAddress[];
  addAddress: (address: Omit<ShippingAddress, "id">) => Promise<void>;
  updateAddress: (
    id: string,
    address: Partial<ShippingAddress>
  ) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  getDefaultAddress: () => ShippingAddress | undefined;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem("@shipping_addresses");
      if (stored) setAddresses(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  };

  const saveAddresses = async (newAddresses: ShippingAddress[]) => {
    try {
      await AsyncStorage.setItem(
        "@shipping_addresses",
        JSON.stringify(newAddresses)
      );
    } catch (error) {
      console.error("Failed to save addresses:", error);
    }
  };

  const addAddress = async (address: Omit<ShippingAddress, "id">) => {
    const newAddress: ShippingAddress = {
      ...address,
      id: Date.now().toString(),
    };

    // If this is the first address or marked as default, set it to default
    const newAddresses = address.isDefault
      ? [newAddress, ...addresses.map((a) => ({ ...a, isDefault: false }))]
      : [...addresses, newAddress];

    setAddresses(newAddresses);
    await saveAddresses(newAddresses);
  };

  const updateAddress = async (
    id: string,
    updatedData: Partial<ShippingAddress>
  ) => {
    const newAddresses = addresses.map((addr) => {
      if (addr.id === id) {
        return { ...addr, ...updatedData };
      }
      // If setting this as the default, it unsets the others
      if (updatedData.isDefault) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    setAddresses(newAddresses);
    await saveAddresses(newAddresses);
  };

  const deleteAddress = async (id: string) => {
    const newAddresses = addresses.filter((addr) => addr.id !== id);
    setAddresses(newAddresses);
    await saveAddresses(newAddresses);
  };

  const setDefaultAddress = async (id: string) => {
    const newAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));

    setAddresses(newAddresses);
    await saveAddresses(newAddresses);
  };

  const getDefaultAddress = () => {
    return addresses.find((addr) => addr.isDefault);
  };

  return (
    <AddressContext.Provider
      value={{
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getDefaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error("useAddress must be used within AddressProvider");
  }
  return context;
};
