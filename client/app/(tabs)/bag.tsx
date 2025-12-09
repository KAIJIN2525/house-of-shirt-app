// Add to your bag component
import AddressModal from "@/components/AddressModal";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const Bag = () => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

  const handleProceedToCheckout = () => {
    setShowAddressModal(true);
  };

  const router = useRouter();

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    // Continue to payment with selected address
    router.push(`/checkout/payment?addressId=${addressId}` as any);
  };

  return (
    <View className="flex-1 bg-white px-4 py-6">

      <Text className="font-futura-bold text-xl text-slate-900">Bag</Text>
      {/* Your bag items */}

      <Pressable
        onPress={handleProceedToCheckout}
        className="bg-slate-900 py-4 rounded-lg"
      >
        <Text className="text-white text-center font-futura-demi">
          Proceed to Checkout
        </Text>
      </Pressable>

      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSelectAddress={handleSelectAddress}
      />
    </View>
  );
};

export default Bag;
