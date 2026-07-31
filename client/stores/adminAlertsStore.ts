import { supabase } from "@/lib/supabase";
import { create } from "zustand";

export interface AdminAlertRecord {
  id: string;
  title: string;
  message: string;
  label: string;
  icon: string;
  targetType?: string;
  targetValue?: string;
  read: boolean;
  createdAt: string;
}

interface AdminAlertsState {
  alerts: AdminAlertRecord[];
  isLoading: boolean;
  fetchAlerts: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const mapAlert = (row: any): AdminAlertRecord => ({
  id: String(row.id),
  title: row.title ?? "Admin alert",
  message: row.message ?? "",
  label: row.label ?? "OPERATIONS",
  icon: row.icon ?? "notifications-outline",
  targetType: row.target_type ?? undefined,
  targetValue: row.target_value ?? undefined,
  read: Boolean(row.read),
  createdAt: row.created_at ?? new Date().toISOString(),
});

export const useAdminAlertsStore = create<AdminAlertsState>((set, get) => ({
  alerts: [],
  isLoading: false,
  fetchAlerts: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        set({ alerts: [] });
        return;
      }
      const { data, error } = await supabase
        .from("app_notifications")
        .select("id, title, message, label, icon, target_type, target_value, read, created_at")
        .eq("user_id", auth.user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      set({ alerts: (data ?? []).map(mapAlert) });
    } catch (error) {
      console.error("Failed to fetch admin alerts:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  markRead: async (id) => {
    set((state) => ({
      alerts: state.alerts.map((alert) => alert.id === id ? { ...alert, read: true } : alert),
    }));
    const { error } = await supabase.from("app_notifications").update({ read: true }).eq("id", id);
    if (error) throw error;
  },
  markAllRead: async () => {
    const unreadIds = get().alerts.filter((alert) => !alert.read).map((alert) => alert.id);
    if (!unreadIds.length) return;
    set((state) => ({ alerts: state.alerts.map((alert) => ({ ...alert, read: true })) }));
    const { error } = await supabase.from("app_notifications").update({ read: true }).in("id", unreadIds);
    if (error) throw error;
  },
}));
