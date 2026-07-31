import type {
  BannerContent,
  IntroContent,
  WelcomeContent,
} from "@/stores/adminContentStore";
import { supabase } from "@/lib/supabase";

export interface ManagedMediaAsset {
  id: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  mediaType: "image" | "video";
  mimeType: string;
  originalFilename?: string;
  folder: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  altText?: string;
  createdAt: string;
}

export interface ManagedContentSnapshot {
  banner?: BannerContent;
  welcome?: WelcomeContent;
  intro?: IntroContent;
}
export interface ManagedEditorialVersion {
  id: string;
  version: number;
  status: "draft" | "scheduled" | "live" | "archived";
  updatedAt: string;
  content: BannerContent;
}

const formatEditorDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} - ${time}`;
};

const parseEditorDate = (value?: string) => {
  if (!value?.trim()) return null;
  const normalized = value.replace(/\s+-\s+/, " ");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const mapEditorial = (row: any): BannerContent => ({
  headline: row.headline,
  overlayLabel: row.overlay_label,
  ctaText: row.cta_text,
  displayStart: formatEditorDate(row.display_start),
  displayEnd: formatEditorDate(row.display_end) || undefined,
  isDefault: Boolean(row.is_default),
  imageUri: row.media_assets?.public_url || row.image_url || undefined,
  currentEditorialTitle: row.headline,
  isActive: row.status === "live" || row.status === "scheduled",
  archived: row.status === "archived",
  targetUrl: row.target_url || undefined,
});

const selectCurrentEditorial = (rows: any[]) => {
  const now = Date.now();
  const eligible = rows
    .filter((row) => {
      if (!["live", "scheduled"].includes(row.status)) return false;
      const starts = row.display_start ? new Date(row.display_start).getTime() : -Infinity;
      const ends = row.display_end ? new Date(row.display_end).getTime() : Infinity;
      return starts <= now && ends > now;
    })
    .sort(
      (left, right) =>
        new Date(right.display_start ?? right.updated_at).getTime() -
        new Date(left.display_start ?? left.updated_at).getTime(),
    );
  if (eligible[0]) return eligible[0];
  return rows
    .filter((row) => row.is_default && row.status !== "archived")
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )[0];
};

export const fetchManagedContent = async (): Promise<ManagedContentSnapshot> => {
  const [{ data: editorials, error: editorialError }, { data: documents, error: documentError }] =
    await Promise.all([
      supabase
        .from("editorials")
        .select("*, media_assets(public_url)")
        .order("updated_at", { ascending: false })
        .limit(50),
      supabase
        .from("managed_app_content")
        .select("content_key, content"),
    ]);

  if (editorialError) throw editorialError;
  if (documentError) throw documentError;

  const selected = selectCurrentEditorial(editorials ?? []);
  const byKey = new Map(
    (documents ?? []).map((document: any) => [document.content_key, document.content]),
  );

  return {
    banner: selected ? mapEditorial(selected) : undefined,
    welcome: byKey.get("welcome") as WelcomeContent | undefined,
    intro: byKey.get("onboarding") as IntroContent | undefined,
  };
};

export const saveEditorial = async (banner: BannerContent) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const displayStart = parseEditorDate(banner.displayStart);
  const displayEnd = parseEditorDate(banner.displayEnd);
  const now = Date.now();
  const startTime = displayStart ? new Date(displayStart).getTime() : now;
  const status = banner.archived
    ? "archived"
    : !banner.isActive
      ? "draft"
      : startTime > now
        ? "scheduled"
        : "live";

  let mediaAssetId: string | null = null;
  if (banner.imageUri) {
    const { data: asset } = await supabase
      .from("media_assets")
      .select("id")
      .eq("public_url", banner.imageUri)
      .maybeSingle();
    mediaAssetId = asset?.id ?? null;
  }

  if (status === "live") {
    const { error: archiveError } = await supabase
      .from("editorials")
      .update({ status: "archived" })
      .eq("status", "live")
      .eq("is_default", false);
    if (archiveError) throw archiveError;
  }

  if (banner.isDefault) {
    const { error: defaultError } = await supabase
      .from("editorials")
      .update({ is_default: false })
      .eq("is_default", true);
    if (defaultError) throw defaultError;
  }

  const { data: latest } = await supabase
    .from("editorials")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("editorials")
    .insert({
      headline: banner.headline,
      overlay_label: banner.overlayLabel,
      cta_text: banner.ctaText,
      target_url: banner.targetUrl || null,
      media_asset_id: mediaAssetId,
      image_url: banner.imageUri || null,
      display_start: displayStart,
      display_end: displayEnd,
      status,
      is_default: Boolean(banner.isDefault),
      version: Number(latest?.version ?? 0) + 1,
      created_by: user?.id ?? null,
    })
    .select("*, media_assets(public_url)")
    .single();

  if (error) throw error;
  return mapEditorial(data);
};

export const archiveCurrentEditorial = async () => {
  const { data: current, error: findError } = await supabase
    .from("editorials")
    .select("id")
    .in("status", ["live", "scheduled"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (!current) return;
  const { error } = await supabase
    .from("editorials")
    .update({ status: "archived", is_default: false })
    .eq("id", current.id);
  if (error) throw error;
};
export const saveManagedDocument = async (
  key: "welcome" | "onboarding",
  content: WelcomeContent | IntroContent,
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: existing } = await supabase
    .from("managed_app_content")
    .select("version")
    .eq("content_key", key)
    .maybeSingle();
  const { error } = await supabase.from("managed_app_content").upsert({
    content_key: key,
    content,
    version: Number(existing?.version ?? 0) + 1,
    updated_by: user?.id ?? null,
  });
  if (error) throw error;
};

export const listMediaAssets = async (): Promise<ManagedMediaAsset[]> => {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    mediaType: row.media_type,
    mimeType: row.mime_type,
    originalFilename: row.original_filename ?? undefined,
    folder: row.folder,
    sizeBytes: row.size_bytes ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    altText: row.alt_text ?? undefined,
    createdAt: row.created_at,
  }));
};

export const listEditorialVersions = async (): Promise<ManagedEditorialVersion[]> => {
  const { data, error } = await supabase
    .from("editorials")
    .select("*, media_assets(public_url)")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    version: Number(row.version ?? 1),
    status: row.status,
    updatedAt: row.updated_at,
    content: mapEditorial(row),
  }));
};
export const registerMediaAsset = async (input: {
  storagePath: string;
  publicUrl: string;
  mediaType: "image" | "video";
  mimeType: string;
  originalFilename?: string;
  folder: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("media_assets")
    .upsert(
      {
        storage_bucket: "assets",
        storage_path: input.storagePath,
        public_url: input.publicUrl,
        media_type: input.mediaType,
        mime_type: input.mimeType,
        original_filename: input.originalFilename ?? null,
        folder: input.folder,
        size_bytes: input.sizeBytes ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        duration_seconds: input.durationSeconds ?? null,
        created_by: user?.id ?? null,
        archived: false,
      },
      { onConflict: "storage_bucket,storage_path" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
