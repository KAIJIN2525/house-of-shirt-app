import { StyleSheet } from "react-native";

// Tailwind slate-900: #0f172a
export const colors = {
  background: "#ffffff",
  text: "#0f172a",
  textSecondary: "#64748b", // slate-500
  border: "#e2e8f0", // slate-200
  accent: "#314158",
};

// Format price with Nigerian Naira symbol and commas
export const formatPrice = (price: number): string => {
  return `₦${price.toLocaleString("en-NG")}`;
};

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
});
