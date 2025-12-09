import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem("@favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to load favorites", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem("@favorites", JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorites", error);
    }
  };

  const addToFavorites = async (productId: string) => {
    const newFavorites = [...favorites, productId];
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const removeFromFavorites = async (productId: string) => {
    const newFavorites = favorites.filter((id) => id !== productId);
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.includes(productId);
  };

  const toggleFavorite = async (productId: string) => {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
