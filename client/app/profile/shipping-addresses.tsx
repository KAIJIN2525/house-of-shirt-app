import AddressFormModal from "@/components/AddressFormModal";
import { useAddressStore } from "@/stores/addressStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";

const ShippingAddresses = () => {
  const { addresses, deleteAddress, setDefaultAddress } = useAddressStore();
  const router = useRouter();
  const theme = useThemeStore();
  const isDark = theme?.isDark ?? false;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAddress(id),
        },
      ]
    );
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#050505]">
      <View className="px-4 py-4 border-b border-gray-200 flex-row items-center dark:border-white/10">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#ffffff" : "#0f172a"} />
        </Pressable>
        <Text className="font-bold text-xl text-slate-900 ml-4 dark:text-white">
          Shipping Addresses
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Add New Address Button */}
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="flex-row items-center justify-center bg-slate-900 rounded-md py-4 mb-6 dark:bg-white"
        >
          <Ionicons name="add" size={24} color={isDark ? "#000000" : "white"} />
          <Text className="font-semibold text-white ml-2 dark:text-black">
            Add New Address
          </Text>
        </Pressable>

        {/* Address List */}
        {addresses.map((address) => (
          <View
            key={address.id}
            className="border border-gray-200 rounded-lg p-4 mb-4 bg-white dark:border-white/10 dark:bg-[#101215]"
          >
            {/* Default Badge */}
            {address.isDefault && (
              <View className="bg-green-100 px-3 py-1 rounded-full self-start mb-3">
                <Text className="font-medium text-xs text-green-700">
                  ✓ Default Address
                </Text>
              </View>
            )}

            {/* Address Info */}
              <Text className="font-semibold text-base text-slate-900 dark:text-white">
              {address.fullName}
            </Text>
            <Text className="font-normal text-sm text-gray-600 mt-1 dark:text-white">
              {address.phoneNumber}
            </Text>
            <Text className="font-normal text-sm text-gray-600 mt-2 dark:text-white">
              {address.address}
            </Text>
            <Text className="font-normal text-sm text-gray-600 dark:text-white">
              {address.city}, {address.state} - {address.zipCode}
            </Text>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-4">
              <Pressable
                onPress={() => handleEdit(address.id)}
                className="w-10 h-10 border border-slate-900 rounded-lg items-center justify-center"
              >
                <Ionicons name="pencil-outline" size={18} color="#0f172a" />
              </Pressable>

              {!address.isDefault && (
                <Pressable
                  onPress={() => setDefaultAddress(address.id)}
                  className="w-10 h-10 border border-green-500 rounded-lg items-center justify-center"
                >
                  <Ionicons name="star-outline" size={18} color="#22c55e" />
                </Pressable>
              )}

              <Pressable
                onPress={() => handleDelete(address.id)}
                className="w-10 h-10 border border-red-300 rounded-lg items-center justify-center"
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        ))}

        {addresses.length === 0 && (
          <View className="items-center py-20">
            <Ionicons name="location-outline" size={64} color="#cbd5e1" />
            <Text className="font-semibold text-lg text-slate-900 mt-4 dark:text-white">
              No addresses saved
            </Text>
            <Text className="font-normal text-gray-500 text-center mt-2 px-8">
              Add a shipping address for faster checkout
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Address Form Modal */}
      <AddressFormModal
        visible={showAddModal}
        onClose={handleCloseModal}
        editingId={editingId}
      />
    </SafeAreaView>
  );
};

export default ShippingAddresses;
