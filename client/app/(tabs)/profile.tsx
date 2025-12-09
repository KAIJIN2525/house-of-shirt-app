import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, styles } from "@/constants/index";
import { profileStyles } from "@/constants/profile";
import { useAddress } from "@/contexts/AddressContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const router = useRouter();
  const { addresses } = useAddress();
  const { favorites } = useFavorites();

  return (
    <SafeAreaView className="flex-1 bg-white" style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white"
      >
        {/* Header Section */}
        <View style={profileStyles.header}>
          <View style={profileStyles.avatarContainer}>
            <View style={profileStyles.avatar}>
              <Text style={profileStyles.avatarText}>JD</Text>
            </View>
            <TouchableOpacity style={profileStyles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={profileStyles.name}>John Doe</Text>
          <Text style={profileStyles.email}>johndoe@example.com</Text>
          <TouchableOpacity style={profileStyles.editProfileButton}>
            <Text style={profileStyles.editProfileButtonText}>
              Edit Profile
            </Text>
          </TouchableOpacity>
          <Pressable className="mt-6" onPress={() => router.push("/(auth)/login")}>
            <Text>Go to login</Text>
          </Pressable>
        </View>

        {/* Stats Section */}
        <View style={profileStyles.statsContainer}>
          <StatCard icon="cart-outline" value="12" label="Orders" />
          <StatCard
            icon="heart-outline"
            value={favorites.length.toString()}
            label="Wishlist"
          />
          <StatCard icon="gift-outline" value="3" label="Rewards" />
        </View>

        {/* Account Section */}
        <View style={profileStyles.sectionContainer}>
          <Text style={profileStyles.sectionTitle}>Account</Text>
          <View style={profileStyles.menuGroup}>
            <MenuItem
              icon="location-outline"
              title="Shipping Addresses"
              badge={
                addresses.length > 0 ? addresses.length.toString() : undefined
              }
              onPress={() => router.push("/profile/shipping-addresses" as any)}
            />
            <MenuItem icon="card-outline" title="Payment Methods" />
            <MenuItem icon="receipt-outline" title="Order History" />
          </View>
        </View>

        {/* Settings Section */}
        <View style={profileStyles.sectionContainer}>
          <Text style={profileStyles.sectionTitle}>Settings</Text>
          <View style={profileStyles.menuGroup}>
            <MenuItem icon="notifications-outline" title="Notifications" />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy & Security"
            />
            <MenuItem
              icon="language-outline"
              title="Language"
              value="English"
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={profileStyles.sectionContainer}>
          <Text style={profileStyles.sectionTitle}>Support</Text>
          <View style={profileStyles.menuGroup}>
            <MenuItem icon="help-circle-outline" title="Help Center" />
            <MenuItem icon="chatbubble-outline" title="Contact Us" />
            <MenuItem icon="star-outline" title="Rate App" />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={profileStyles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={profileStyles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) => (
  <View style={profileStyles.statCard}>
    <View style={profileStyles.statIconContainer}>
      <Ionicons name={icon} size={20} color={colors.accent} />
    </View>
    <Text style={profileStyles.statValue}>{value}</Text>
    <Text style={profileStyles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({
  icon,
  title,
  badge,
  value,
  onPress,
}: {
  icon: any;
  title: string;
  badge?: string;
  value?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={profileStyles.menuItem}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={profileStyles.menuItemLeft}>
      <View style={profileStyles.iconContainer}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <Text style={profileStyles.menuItemText}>{title}</Text>
      {badge && (
        <View style={profileStyles.badge}>
          <Text style={profileStyles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <View style={profileStyles.menuItemRight}>
      {value && <Text style={profileStyles.menuItemValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

export default Profile;
