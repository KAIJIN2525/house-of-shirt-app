import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useAdminAccess() {
  const userId = useAuthStore((state) => state.user?.id);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!userId) {
        setIsAdmin(false);
        setIsLoading(false);
        return () => {
          active = false;
        };
      }

      setIsLoading(true);
      void supabase.rpc("current_user_is_admin").then(({ data, error }) => {
        if (active) {
          setIsAdmin(!error && data === true);
          setIsLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [userId]),
  );

  return { isAdmin, isLoading };
}
