import { View, Text, Modal, Pressable, ScrollView, Alert } from "react-native";
import React, { useState } from "react";
import { useAddress } from "@/contexts/AddressContext";
import { Ionicons } from "@expo/vector-icons";
import "../global.css";
import AddressFormModal from "./AddressFormModal";

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (addressId: string) => void;
}

const AddressModal = ({
  visible,
  onClose,
  onSelectAddress,
}: AddressModalProps) => {
  const { addresses, deleteAddress, setDefaultAddress } = useAddress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleContinue = () => {
    if (selectedId) {
      onSelectAddress(selectedId);
      onClose();
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingId(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "80%" }}>
          {/* Header */}
          <View className="px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
            <Text className="font-futura-bold text-xl text-slate-900">
              Select Address
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Add New Button */}
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="border-2 border-dashed border-slate-300 py-4 rounded-lg flex-row items-center justify-center mb-4"
            >
              <Ionicons name="add-circle-outline" size={24} color="#64748b" />
              <Text className="font-futura-medium text-slate-600 ml-2">
                Add New Address
              </Text>
            </Pressable>

            {/* Addresses List */}
            {addresses.map((address) => (
              <Pressable
                key={address.id}
                onPress={() => handleSelect(address.id)}
                className={`border-2 rounded-lg p-4 mb-3 ${
                  selectedId === address.id
                    ? "border-slate-900 bg-slate-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-start">
                  <View className="flex-1">
                    {/* Default Badge */}
                    {address.isDefault && (
                      <View className="bg-green-100 px-2 py-1 rounded self-start mb-2">
                        <Text className="font-futura-medium text-xs text-green-700">
                          Default
                        </Text>
                      </View>
                    )}

                    {/* Address Info */}
                    <Text className="font-futura-demi text-base text-slate-900">
                      {address.fullName}
                    </Text>
                    <Text className="font-futura text-sm text-gray-600 mt-1">
                      {address.phoneNumber}
                    </Text>
                    <Text className="font-futura text-sm text-gray-600 mt-2">
                      {address.address}
                    </Text>
                    <Text className="font-futura text-sm text-gray-600">
                      {address.city}, {address.state}
                    </Text>

                    {/* Edit Button */}
                    <Pressable
                      onPress={() => handleEdit(address.id)}
                      className="mt-3 self-start"
                    >
                      <Text className="font-futura-medium text-sm text-slate-900 underline">
                        Edit
                      </Text>
                    </Pressable>
                  </View>

                  {/* Selection Radio */}
                  <View className="ml-2 mt-1">
                    {selectedId === address.id ? (
                      <Ionicons
                        name="radio-button-on"
                        size={24}
                        color="#0f172a"
                      />
                    ) : (
                      <Ionicons
                        name="radio-button-off"
                        size={24}
                        color="#cbd5e1"
                      />
                    )}
                  </View>
                </View>
              </Pressable>
            ))}

            {addresses.length === 0 && (
              <View className="items-center py-12">
                <Ionicons name="location-outline" size={48} color="#cbd5e1" />
                <Text className="font-futura-medium text-gray-600 mt-3">
                  No addresses saved
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Continue Button */}
          {selectedId && (
            <View className="px-4 py-4 border-t border-gray-200">
              <Pressable
                onPress={handleContinue}
                className="bg-slate-900 py-4 rounded-lg items-center"
              >
                <Text className="font-futura-demi text-white text-base">
                  Continue with this address
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Nested Add/Edit Modal */}
      <AddressFormModal
        visible={showAddModal}
        onClose={handleCloseAddModal}
        editingId={editingId}
      />
    </Modal>
  );
};

export default AddressModal;
