import { HouseLoader } from "@/components/loading/HouseLoader";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Redirect } from "expo-router";
import React, { PropsWithChildren, useEffect, useState } from "react";

export function AdminRouteGate({ children }: PropsWithChildren) {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setIsAdmin(false);
      setAccessLoading(false);
      return () => {
        active = false;
      };
    }

    setAccessLoading(true);
    void supabase.rpc("current_user_is_admin").then(({ data, error }) => {
      if (active) {
        setIsAdmin(!error && data === true);
        setAccessLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || accessLoading) {
    return <HouseLoader fullscreen label="VERIFYING STAFF ACCESS" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return children;
}
