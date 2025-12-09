import { NIGERIAN_STATES } from "@/constants/states";
import { useAddress } from "@/contexts/AddressContext";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import "../global.css";

interface AddressFormModalProps {
  visible: boolean;
  onClose: () => void;
  editingId?: string | null;
}

const AddressFormModal = ({
  visible,
  onClose,
  editingId,
}: AddressFormModalProps) => {
  const { addresses, addAddress, updateAddress } = useAddress();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (editingId && visible) {
      const existingAddress = addresses.find((a) => a.id === editingId);
      if (existingAddress) {
        setFullName(existingAddress.fullName);
        setPhoneNumber(existingAddress.phoneNumber);
        setAddress(existingAddress.address);
        setCity(existingAddress.city);
        setState(existingAddress.state);
        setZipCode(existingAddress.zipCode);
        setIsDefault(existingAddress.isDefault);
      } else if (!visible) {
        // Reset form when modal is closed
        resetForm();
      }
    }
  }, [editingId, visible]);

  const resetForm = () => {
    setFullName("");
    setPhoneNumber("");
    setAddress("");
    setCity("");
    setState("");
    setIsDefault(false);
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter full name");
      return false;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 11) {
      Alert.alert("Error", "Please enter valid phone number (11 digits)");
      return false;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Please enter address");
      return false;
    }
    if (!city.trim()) {
      Alert.alert("Error", "Please enter city");
      return false;
    }
    if (!state) {
      Alert.alert("Error", "Please select state");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const addressData = {
      fullName,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      isDefault,
    };

    if (editingId) {
      await updateAddress(editingId, addressData);
    } else {
      await addAddress(addressData);
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-[90%]" >
          {/* Modal Header */}
          <View className="px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
            <Text className="font-futura-bold text-xl text-slate-900">
              {editingId ? "Edit Address" : "Add New Address"}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </Pressable>
          </View>

          {/* Form Fields */}
          <ScrollView
            className="flex-1 px-4 py-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4">
              <Text className="font-futura-medium text-slate-900 mb-2">
                Full Name *
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
                placeholderTextColor="#94a3b3"
                className="border border-gray-300 rounded-lg px-4 py-3 font-futura text-base text-slate-900"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <Text className="font-futura-medium text-slate-900 mb-2">
                Phone Number *
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="08012345678"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={11}
                className="border border-gray-300 rounded-lg px-4 py-3 font-futura text-base text-slate-900"
              />
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="font-futura-medium text-slate-900 mb-2">
                Street Address *
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="123 Main Street, Apartment 4B"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="border border-gray-300 rounded-lg px-4 py-3 font-futura text-base text-slate-900"
              />
            </View>

            {/* City */}
            <View className="mb-4">
              <Text className="font-futura-medium text-slate-900 mb-2">
                City *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Lagos"
                placeholderTextColor="#94a3b8"
                className="border border-gray-300 rounded-lg px-4 py-3 font-futura text-base text-slate-900"
              />
            </View>

            {/* State */}
            <View className="mb-4">
              <Text className="font-futura-medium text-slate-900 mb-2">
                State *
              </Text>
              <View className="border border-gray-300 rounded-lg overflow-hidden">
                <Picker selectedValue={state} onValueChange={setState}>
                  <Picker.Item label="Select State" value="" />
                  {NIGERIAN_STATES.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Zip Code */}
            <View className="mb-4">
              <Text className="font-futura-medium text-slate-900 mb-2">
                Zip Code
              </Text>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Lagos"
                placeholderTextColor="#94a3b8"
                className="border border-gray-300 rounded-lg px-4 py-3 font-futura text-base text-slate-900"
              />
            </View>

            {/* Default Toggle */}
            <Pressable
              onPress={() => setIsDefault(!isDefault)}
              className="flex-row items-center justify-between py-4 border-t border-gray-200 mb-4"
            >
              <View>
                <Text className="font-futura-medium text-slate-900">
                  Set as default address
                </Text>
                <Text className="font-futura text-xs text-gray-500 mt-1">
                  Use this address for future orders
                </Text>
              </View>
              <View
                className={`w-12 h-7 rounded-full p-1 ${isDefault ? "bg-slate-900" : "bg-gray-300"}`}
              >
                <View
                  className="w-5 h-5 rounded-full bg-white"
                  style={{
                    transform: [{ translateX: isDefault ? 20 : 0 }],
                  }}
                />
              </View>
            </Pressable>
          </ScrollView>

          {/* Save Button */}
          <View className="px-4 py-4 border-t border-gray-200">
            <Pressable
              onPress={handleSave}
              className="bg-slate-900 py-4 rounded-lg items-center"
            >
              <Text className="font-futura-demi text-white text-base">
                {editingId ? "Update Address" : "Save Address"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddressFormModal;
