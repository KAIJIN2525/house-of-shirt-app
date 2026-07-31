import { NIGERIAN_STATES } from "@/constants/states";
import { useAddressStore } from "@/stores/addressStore";
import { useThemeStore } from "@/stores/themeStore";
import { 
  getPlacePredictions, 
  getPlaceDetails, 
  PlacePrediction 
} from "@/services/google-places";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText as Text } from "@/components/AppText";
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
  const { addresses, addAddress, updateAddress } = useAddressStore();
  const theme = useThemeStore();
  const isDark = theme?.isDark ?? false;


  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    if (editingId && visible) {
      const existingAddress = addresses.find((a) => a.id === editingId);
      if (existingAddress) {
        setFullName(existingAddress.fullName);
        setPhoneNumber(existingAddress.phoneNumber);
        setAddress(existingAddress.address);
        setApartment(existingAddress.apartment || "");
        setCity(existingAddress.city);
        setState(existingAddress.state);
        setZipCode(existingAddress.zipCode);
        setIsDefault(existingAddress.isDefault);
      } else if (!visible) {
        // Reset form when modal is closed
        resetForm();
      }
    }
  }, [editingId, visible, addresses]);

  const resetForm = () => {
    setFullName("");
    setPhoneNumber("");
    setAddress("");
    setApartment("");
    setCity("");
    setState("");
    setZipCode("");
    setIsDefault(false);
    setPredictions([]);
    setShowPredictions(false);
  };

  const handleAddressChange = async (text: string) => {
    setAddress(text);
    if (text.length >= 3) {
      setIsSearching(true);
      const results = await getPlacePredictions(text);
      console.log(`[Google Places] Found ${results.length} results for: "${text}"`);
      setPredictions(results);
      setShowPredictions(results.length > 0);
      setIsSearching(false);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setAddress(prediction.description);
    setShowPredictions(false);
    
    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      setAddress(details.address);
      setCity(details.city);
      setZipCode(details.zipCode);
      
      // Map state to NIGERIAN_STATES if it matches
      const matchedState = NIGERIAN_STATES.find(
        s => s.toLowerCase() === details.state.toLowerCase() || 
             details.state.toLowerCase().includes(s.toLowerCase()) ||
             s.toLowerCase().includes(details.state.toLowerCase())
      );
      if (matchedState) setState(matchedState);
    }

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
      apartment,
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
        <View className="bg-white dark:bg-[#0F1113] rounded-t-3xl h-[90%]" >
          {/* Modal Header */}
          <View className="px-4 py-4 border-b border-gray-200 dark:border-white/10 flex-row items-center justify-between">
            <Text className="font-bold text-xl text-slate-900 dark:text-white">
              {editingId ? "Edit Address" : "Add New Address"}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#0f172a"} />
            </Pressable>
          </View>

          {/* Form Fields */}
          <ScrollView
            className="flex-1 px-4 py-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4">
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                Full Name *
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
                placeholderTextColor="#94a3b3"
                className="border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 font-normal text-base text-slate-900 dark:text-white"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-4">
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                Phone Number *
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="08012345678"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={11}
                className="border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 font-normal text-base text-slate-900 dark:text-white"
              />
            </View>

            {/* Address */}
            <View className="mb-4" style={{ zIndex: 100 }}>
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                Street Address *
              </Text>
              <View className="relative">
                <TextInput
                  value={address}
                  onChangeText={handleAddressChange}
                  placeholder="123 Main Street, Apartment 4B"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                  onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                  className="border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 font-normal text-base text-slate-900 dark:text-white"
                />
                {isSearching && (
                  <View className="absolute right-4 top-4">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-[1px]">SEARCHING...</Text>
                  </View>
                )}
              </View>
              
              {/* Suggestions List - Positioned absolutely relative to the form field */}
              {showPredictions && predictions.length > 0 && (
                <View 
                  style={{ 
                    zIndex: 9999,
                    position: "absolute",
                    top: 85, 
                    left: 0,
                    right: 0,
                    elevation: 10,
                  }}
                  className="bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden"
                >
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                    {predictions.map((p) => (
                      <Pressable
                        key={p.place_id}
                        onPress={() => handleSelectPrediction(p)}
                        className="px-4 py-4 border-b border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-white/5"
                      >
                        <Text className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.structured_formatting.main_text}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                          {p.structured_formatting.secondary_text}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Apartment/Suite/Estate */}
            <View className="mb-4">
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                Apartment, Suite, Unit, or Estate Details
              </Text>
              <TextInput
                value={apartment}
                onChangeText={setApartment}
                placeholder="e.g. Flat 4, Dpkay Estate Gate"
                placeholderTextColor="#94a3b8"
                className="border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 font-normal text-base text-slate-900 dark:text-white"
              />
            </View>




            {/* City */}
            <View className="mb-4">
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                City *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Lagos"
                placeholderTextColor="#94a3b8"
                className="border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 font-normal text-base text-slate-900 dark:text-white"
              />
            </View>

            {/* State */}
            <View className="mb-4">
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                State *
              </Text>
              <View className="border border-gray-300 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#101215]">
                <Picker 
                  selectedValue={state} 
                  onValueChange={setState}
                  dropdownIconColor={isDark ? "white" : "black"}
                  style={{ color: isDark ? "white" : "black" }}
                >
                  <Picker.Item label="Select State" value="" color={isDark ? "#94a3b8" : "#94a3b8"} />
                  {NIGERIAN_STATES.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Zip Code */}
            <View className="mb-4">
              <Text className="font-medium text-slate-900 dark:text-white mb-2">
                Zip Code
              </Text>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="100001"
                placeholderTextColor="#94a3b8"
                className="border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 font-normal text-base text-slate-900 dark:text-white"
              />
            </View>

            {/* Default Toggle */}
            <Pressable
              onPress={() => setIsDefault(!isDefault)}
              className="flex-row items-center justify-between py-4 border-t border-gray-200 dark:border-white/10 mb-4"
            >
              <View>
                <Text className="font-medium text-slate-900 dark:text-white">
                  Set as default address
                </Text>
                <Text className="font-normal text-xs text-gray-500 mt-1">
                  Use this address for future orders
                </Text>
              </View>
              <View
                className={`w-12 h-7 rounded-full p-1 ${isDefault ? "bg-slate-900 dark:bg-white" : "bg-gray-300 dark:bg-white/10"}`}
              >
                <View
                  className={`w-5 h-5 rounded-full ${isDefault ? "bg-white dark:bg-black" : "bg-white"}`}
                  style={{
                    transform: [{ translateX: isDefault ? 20 : 0 }],
                  }}
                />
              </View>
            </Pressable>
          </ScrollView>

          {/* Save Button */}
          <View className="px-4 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1113]">
            <Pressable
              onPress={handleSave}
              className="bg-slate-900 dark:bg-white py-4 rounded-lg items-center"
            >
              <Text className="font-semibold text-white dark:text-black text-base">
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
