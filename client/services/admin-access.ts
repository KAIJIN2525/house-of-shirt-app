import { supabase } from "@/lib/supabase";

export type AdminAccessRole = "owner" | "admin";
export type AdminAccessStatus = "active" | "revoked";

export interface AdminAccessGrant {
  email: string;
  user_id: string | null;
  role: AdminAccessRole;
  status: AdminAccessStatus;
  granted_at: string;
  revoked_at: string | null;
  updated_at: string;
}

export async function fetchAdminAccessGrants(): Promise<AdminAccessGrant[]> {
  const { data, error } = await supabase
    .from("admin_access_grants")
    .select("email,user_id,role,status,granted_at,revoked_at,updated_at")
    .order("role", { ascending: false })
    .order("email", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AdminAccessGrant[];
}

export async function setAdminAccess(email: string, enabled: boolean) {
  const { data, error } = await supabase.rpc("set_admin_access", {
    p_email: email.trim().toLowerCase(),
    p_enabled: enabled,
  });

  if (error) throw error;
  return data as AdminAccessGrant;
}
