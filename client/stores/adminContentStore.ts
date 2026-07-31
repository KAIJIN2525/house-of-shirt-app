import { SHOPIFY_STORE_DOMAIN } from "@/constants/shopify";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface BannerContent {
  headline: string;
  overlayLabel: string;
  ctaText: string;
  displayStart: string;
  displayEnd?: string;
  isDefault?: boolean;
  imageUri?: string;
  currentEditorialTitle: string;
  isActive: boolean;
  archived: boolean;
  targetUrl?: string;
}
export interface Brand {
  id: string;
  name: string;
  logo: string;
  domain?: string;
}
export type WelcomeTextFont = "lexend" | "cormorant";
export type WelcomeContent = {
  headline: string;
  subtitle: string;
  ctaText: string;
  videoUri?: string;
  imageUri?: string;
  muted?: boolean;
  textFont?: WelcomeTextFont;
};
export interface IntroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  image: string;
}
export interface IntroContent {
  slides: IntroSlide[];
}
export type NotificationTargetType = "shop" | "orders" | "product";

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  audience: "all" | "vip" | "new";
  status: "Scheduled" | "Sent" | "Draft";
  scheduledFor: string;
  sentAt: string;
  targetType: NotificationTargetType;
  targetValue: string;
}
export interface CustomerNotification {
  id: string;
  label: string;
  title: string;
  message: string;
  time: string;
  action?: string;
  icon: string;
  targetType?: NotificationTargetType;
  targetValue?: string;
  read: boolean;
  archived: boolean;
  campaignId?: string;
  type?: string;
  timestamp?: string;
}
export interface ExportRecord {
  id: string;
  fileName: string;
  format: string;
  status: "Ready" | "Queued";
  createdAt: string;
  rowCount: number;
}
export interface AdminSettings {
  globalNotifications: boolean;
  marketing: boolean;
}
export interface ShopifyWebhookHealth {
  id: string;
  topic: string;
  successRate: number;
  latencyMs: number;
  status: "Healthy" | "Warning" | "Delayed";
}
export interface ShopifySyncState {
  storeDomain: string;
  warningActive: boolean;
  warningTitle: string;
  warningMessage: string;
  syncingInRealtime: boolean;
  lastSuccessfulSync: string;
  lastForceSync: string;
  syncedOrders: number;
  syncedCustomers: number;
  syncedProducts: number;
  collectionDelayHours: number;
  webhooks: ShopifyWebhookHealth[];
}
export interface ShopifySyncLog {
  id: string;
  startedAt: string;
  completedAt: string;
  status: "Success" | "Warning" | "Failed";
  ordersImported: number;
  customersImported: number;
  productsImported: number;
  summary: string;
}
export interface NotificationTemplate {
  id: string;
  eventKey: string;
  title: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
}

const defaultBanner: BannerContent = {
  headline: "THE NEW SEASON IS HERE",
  overlayLabel: "EDITORIAL | SS26",
  ctaText: "SHOP THE COLLECTION",
  displayStart: "Apr 05, 2026 - 08:00",
  displayEnd: "May 05, 2026 - 23:59",
  isDefault: true,
  currentEditorialTitle: "Spring 2026 Main Editorial",
  isActive: true,
  archived: false,
  targetUrl: "/(tabs)/shop",
};
const defaultWelcome: WelcomeContent = {
  headline: "House of Shirts",
  subtitle: "The Digital Atelier",
  ctaText: "Enter Atelier",
  muted: true,
  textFont: "lexend",
};
const defaultIntro: IntroContent = {
  slides: [
    {
      id: "1",
      title: "The Perfect Shirt,\nEvery Time.",
      subtitle: "THE DIGITAL ATELIER",
      description:
        "Discover curated collections of timeless wardrobe staples, crafted with artisanal precision for the modern individual.",
      badge: "100% EGYPTIAN COTTON",
      image:
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    },
    {
      id: "2",
      title: "Timeless Design.\nModern Comfort.",
      subtitle: "THE DIGITAL ATELIER",
      description:
        "Each piece is carefully selected and crafted to elevate your everyday wardrobe with sophistication and style.",
      badge: "SUSTAINABLE FABRIC",
      image:
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400",
    },
    {
      id: "3",
      title: "Express Yourself.\nAuthentically.",
      subtitle: "THE DIGITAL ATELIER",
      description:
        "Our collection celebrates individuality through carefully curated pieces that reflect your unique personal style.",
      badge: "ARTISAN CRAFTED",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    },
  ],
};
const defaultBrands: Brand[] = [
  {
    id: "1",
    name: "US POLO",
    domain: "uspoloassn.com",
    logo: "https://cdn.brandfetch.io/uspoloassn.com/h/160/w/160/icon.png?c=1idwGU4uvv2T1aoYYzi",
  },
  {
    id: "2",
    name: "RALPH LAUREN",
    domain: "ralphlauren.com",
    logo: "https://cdn.brandfetch.io/ralphlauren.com/h/160/w/160/icon.png?c=1idwGU4uvv2T1aoYYzi",
  },
  {
    id: "3",
    name: "ASOS",
    domain: "asos.com",
    logo: "https://cdn.brandfetch.io/asos.com/h/160/w/160/icon.png?c=1idwGU4uvv2T1aoYYzi",
  },
  {
    id: "4",
    name: "ADIDAS",
    domain: "adidas.com",
    logo: "https://cdn.brandfetch.io/adidas.com/h/160/w/160/icon.png?c=1idwGU4uvv2T1aoYYzi",
  },
  {
    id: "5",
    name: "JACK & JONES",
    domain: "jackjones.com",
    logo: "https://cdn.brandfetch.io/jackjones.com/h/160/w/160/icon.png?c=1idwGU4uvv2T1aoYYzi",
  },
  {
    id: "6",
    name: "ZARA",
    domain: "zara.com",
    logo: "https://cdn.brandfetch.io/zara.com/h/160/w/160/icon.png?c=1idwGU4uvv2T1aoYYzi",
  },
];
const defaultSettings: AdminSettings = {
  globalNotifications: true,
  marketing: false,
};
const defaultCampaigns: NotificationCampaign[] = [
  {
    id: "campaign-1",
    title: "Restock Alert",
    message: "The Oxford Classic is back in select sizes.",
    audience: "vip",
    status: "Sent",
    scheduledFor: "Apr 02, 2026 - 09:00",
    sentAt: "Apr 02, 2026 - 09:00",
    targetType: "shop",
    targetValue: "oxford classic",
  },
];
const defaultCustomerNotifications: CustomerNotification[] = [
  {
    id: "base-1",
    label: "NEW RELEASE",
    title: "New Collection Drop",
    message:
      "The Atelier Series is now live. Explore our finest Egyptian cotton essentials for the modern wardrobe.",
    time: "2m ago",
    icon: "square",
    read: false,
    archived: false,
    targetType: "shop",
    targetValue: "egyptian cotton",
  },
  {
    id: "base-2",
    label: "LOGISTICS",
    title: "Order Shipped",
    message:
      "Your tailored shirt order HS-9632 is on its way. Track your package for real-time updates.",
    time: "4h ago",
    action: "TRACK ORDER",
    icon: "cube-outline",
    read: false,
    archived: false,
    targetType: "orders",
    targetValue: "HS-89201",
  },
  {
    id: "base-3",
    label: "LOYALTY",
    title: "Exclusive Offer",
    message:
      "As a valued Atelier member, enjoy early access to our private archive sale. Use code ARCHIVE24.",
    time: "1d ago",
    icon: "star",
    read: false,
    archived: false,
    targetType: "shop",
    targetValue: "archive sale",
  },
  {
    id: "base-4",
    label: "ACCOUNT",
    title: "Security Alert",
    message:
      "Your password was successfully changed. If you did not make this request, please contact support immediately.",
    time: "2d ago",
    icon: "person-outline",
    read: false,
    archived: false,
  },
  {
    id: "base-5",
    label: "RESTOCK",
    title: "The Charcoal Oxford is back",
    message:
      "The item in your wishlist is now back in stock. Secure yours before it is gone again.",
    time: "5d ago",
    action: "SHOP NOW",
    icon: "shirt-outline",
    read: false,
    archived: false,
    targetType: "shop",
    targetValue: "charcoal oxford",
  },
];
const defaultExports: ExportRecord[] = [
  {
    id: "export-1",
    fileName: "inventory_manifest_apr_01.csv",
    format: "CSV",
    status: "Ready",
    createdAt: "Apr 01, 2026 - 08:42",
    rowCount: 248,
  },
];
const defaultShopifySync: ShopifySyncState = {
  storeDomain: SHOPIFY_STORE_DOMAIN,
  warningActive: false,
  warningTitle: "",
  warningMessage: "",
  syncingInRealtime: true,
  lastSuccessfulSync: "Never",
  lastForceSync: "Never",
  syncedOrders: 0,
  syncedCustomers: 0,
  syncedProducts: 0,
  collectionDelayHours: 0,
  webhooks: [],
};
const defaultShopifySyncLogs: ShopifySyncLog[] = [];

export const normalizeShopifySyncState = (
  input?: Partial<ShopifySyncState> | null,
): ShopifySyncState => ({
  ...defaultShopifySync,
  ...(input ?? {}),
  storeDomain: input?.storeDomain || SHOPIFY_STORE_DOMAIN,
  warningActive: Boolean(
    input?.warningActive ?? defaultShopifySync.warningActive,
  ),
  warningTitle: input?.warningTitle || defaultShopifySync.warningTitle,
  warningMessage: input?.warningMessage || defaultShopifySync.warningMessage,
  syncingInRealtime: Boolean(
    input?.syncingInRealtime ?? defaultShopifySync.syncingInRealtime,
  ),
  lastSuccessfulSync:
    input?.lastSuccessfulSync || defaultShopifySync.lastSuccessfulSync,
  lastForceSync: input?.lastForceSync || defaultShopifySync.lastForceSync,
  syncedOrders: Number(input?.syncedOrders ?? 0),
  syncedCustomers: Number(input?.syncedCustomers ?? 0),
  syncedProducts: Number(input?.syncedProducts ?? 0),
  collectionDelayHours: Number(input?.collectionDelayHours ?? 0),
  webhooks: Array.isArray(input?.webhooks) ? input.webhooks : [],
});

export const normalizeShopifySyncLogs = (
  logs?: ShopifySyncLog[] | null,
): ShopifySyncLog[] => (Array.isArray(logs) ? logs : []);

const buildCustomerNotificationFromCampaign = (
  campaign: NotificationCampaign,
  previous?: CustomerNotification,
): CustomerNotification => ({
  id: previous?.id ?? `customer-${campaign.id}`,
  label:
    campaign.audience === "vip"
      ? "LOYALTY"
      : campaign.audience === "new"
        ? "WELCOME"
        : "HOUSE UPDATE",
  title: campaign.title,
  message: campaign.message,
  time: campaign.sentAt,
  action: campaign.targetType === "orders" ? "TRACK ORDER" : "SHOP NOW",
  icon:
    campaign.audience === "vip"
      ? "star"
      : campaign.audience === "new"
        ? "sparkles-outline"
        : "notifications-outline",
  read: previous?.read ?? false,
  archived: previous?.archived ?? false,
  targetType: campaign.targetType,
  targetValue: campaign.targetValue,
  campaignId: campaign.id,
});

interface AdminContentState {
  banner: BannerContent;
  notificationCampaigns: NotificationCampaign[];
  customerNotifications: CustomerNotification[];
  exportHistory: ExportRecord[];
  settings: AdminSettings;
  shopifySync: ShopifySyncState;
  shopifySyncLogs: ShopifySyncLog[];
  welcome: WelcomeContent;
  intro: IntroContent;
  brands: Brand[];
  baseBanner: BannerContent;
  notificationTemplates: NotificationTemplate[];
  isLoadingTemplates: boolean;
  isLoadingSyncLogs: boolean;
  isLoadingManagedContent: boolean;
  fetchManagedContent: () => Promise<void>;

  fetchSyncLogs: () => Promise<void>;
  fetchTemplates: () => Promise<void>;

  saveTemplate: (template: NotificationTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  saveBanner: (banner: BannerContent) => Promise<void>;

  saveBaseBanner: (banner: BannerContent) => void;
  archiveBanner: () => Promise<void>;
  saveSettings: (settings: AdminSettings) => Promise<void>;
  saveWelcome: (welcome: WelcomeContent) => Promise<void>;
  saveIntro: (intro: IntroContent) => Promise<void>;
  saveBrands: (brands: Brand[]) => void;
  sendNotificationCampaign: (input: {
    title: string;
    message: string;
    audience: NotificationCampaign["audience"];
    scheduledFor: string;
    mode?: "send" | "draft";
    targetType: NotificationTargetType;
    targetValue: string;
  }) => Promise<NotificationCampaign>;
  generateInventoryExport: () => Promise<ExportRecord>;
  markNotificationRead: (id: string) => Promise<void>;
  toggleNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  restoreNotification: (id: string) => Promise<void>;
  hydrateShopifySync: (input: {
    syncState: ShopifySyncState;
    logs?: ShopifySyncLog[];
  }) => void;
  runShopifySync: (input: {
    orderCount: number;
    customerCount: number;
    productCount: number;
  }) => Promise<{ syncState: ShopifySyncState; log: ShopifySyncLog }>;
  dismissShopifyWarning: () => void;
  fetchCustomerNotifications: () => Promise<void>;
}

const useAdminContentStoreBase = create<AdminContentState>()(
  persist(
    (set, get) => ({
      banner: defaultBanner,
      baseBanner: defaultBanner,
      notificationCampaigns: defaultCampaigns,
      customerNotifications: defaultCustomerNotifications,
      exportHistory: defaultExports,
      settings: defaultSettings,
      shopifySync: defaultShopifySync,
      shopifySyncLogs: defaultShopifySyncLogs,
      welcome: defaultWelcome,
      intro: defaultIntro,
      brands: defaultBrands,
      notificationTemplates: [],
      isLoadingTemplates: false,
      isLoadingSyncLogs: false,
      isLoadingManagedContent: false,

      fetchManagedContent: async () => {
        if (get().isLoadingManagedContent) return;
        set({ isLoadingManagedContent: true });
        try {
          const service = await import("@/services/managed-content");
          const snapshot = await service.fetchManagedContent();
          set((state) => ({
            banner: snapshot.banner ?? state.banner,
            baseBanner: snapshot.banner?.isDefault
              ? snapshot.banner
              : state.baseBanner,
            welcome: snapshot.welcome ?? state.welcome,
            intro: snapshot.intro ?? state.intro,
            settings: snapshot.settings ?? state.settings,
          }));
        } catch (error) {
          console.warn(
            "Managed content sync unavailable; using cached content:",
            error,
          );
        } finally {
          set({ isLoadingManagedContent: false });
        }
      },

      fetchSyncLogs: async () => {
        set({ isLoadingSyncLogs: true });
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data, error } = await supabase
            .from("sync_logs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(20);

          if (error) throw error;

          if (data) {
            const logs = data.map((l: any) => ({
              id: l.id,
              startedAt: new Date(l.started_at).toLocaleString(),
              completedAt: l.completed_at
                ? new Date(l.completed_at).toLocaleString()
                : "",
              status: l.status as ShopifySyncLog["status"],
              ordersImported: l.orders_imported,
              customersImported: l.customers_imported,
              productsImported: l.products_imported,
              summary: l.summary || "",
            }));
            const latestLog = data[0] ?? null;
            const lastSuccessfulLog = data.find(
              (log: any) => log.status === "Success" && log.completed_at,
            );
            const lastSuccessAt = lastSuccessfulLog?.completed_at
              ? new Date(lastSuccessfulLog.completed_at)
              : null;
            const isStale =
              !lastSuccessAt ||
              Date.now() - lastSuccessAt.getTime() > 2 * 60 * 60 * 1000;
            const latestFailed =
              latestLog && latestLog.status !== "Success";
            const warningActive = Boolean(isStale || latestFailed);
            const warningTitle = latestFailed
              ? `LATEST SYNC ${String(latestLog.status).toUpperCase()}`
              : "SHOPIFY SYNC IS STALE";
            const warningMessage = latestFailed
              ? latestLog.error_message || latestLog.summary || "The latest Shopify sync needs attention."
              : lastSuccessAt
                ? `The last successful sync was ${lastSuccessAt.toLocaleString()}.`
                : "No successful Shopify synchronization has been recorded.";

            set((state) => ({
              shopifySyncLogs: logs,
              shopifySync: {
                ...state.shopifySync,
                warningActive,
                warningTitle,
                warningMessage,
                syncingInRealtime: !warningActive,
                lastSuccessfulSync: lastSuccessAt
                  ? lastSuccessAt.toLocaleString()
                  : "Never",
              },
            }));
          }
        } catch (error) {
          console.error("Error fetching sync logs:", error);
        } finally {
          set({ isLoadingSyncLogs: false });
        }
      },

      fetchTemplates: async () => {
        set({ isLoadingTemplates: true });
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data, error } = await supabase
            .from("notification_templates")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;

          if (data) {
            set({
              notificationTemplates: data.map((t: any) => ({
                id: t.id,
                eventKey: t.event_key,
                title: t.title,
                body: t.body,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
              })),
            });
          }
        } catch (error) {
          console.error("Error fetching templates:", error);
        } finally {
          set({ isLoadingTemplates: false });
        }
      },

      saveTemplate: async (template) => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const { error } = await supabase
            .from("notification_templates")
            .upsert({
              id: template.id.includes("temp-") ? undefined : template.id,
              event_key: template.eventKey,
              title: template.title,
              body: template.body,
              updated_at: new Date().toISOString(),
            });

          if (error) throw error;
          await get().fetchTemplates();
        } catch (error) {
          console.error("Error saving template:", error);
        }
      },
      deleteTemplate: async (id) => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const { error } = await supabase
            .from("notification_templates")
            .delete()
            .eq("id", id);

          if (error) throw error;
          set((state) => ({
            notificationTemplates: state.notificationTemplates.filter(
              (t) => t.id !== id,
            ),
          }));
        } catch (error) {
          console.error("Error deleting template:", error);
        }
      },

      saveBanner: async (banner) => {
        const { saveEditorial } = await import("@/services/managed-content");
        const saved = await saveEditorial(banner);
        set({
          banner: saved,
          ...(saved.isDefault ? { baseBanner: saved } : {}),
        });
      },

      saveBaseBanner: (baseBanner) => set({ baseBanner }),
      archiveBanner: async () => {
        const { archiveCurrentEditorial } =
          await import("@/services/managed-content");
        await archiveCurrentEditorial();
        set((state) => ({
          banner: { ...state.baseBanner, isActive: true, archived: false },
        }));
      },
      saveSettings: async (settings) => {
        const { saveManagedDocument } =
          await import("@/services/managed-content");
        await saveManagedDocument("admin_settings", settings);
        set({ settings });
      },
      saveWelcome: async (welcome) => {
        const { saveManagedDocument } =
          await import("@/services/managed-content");
        await saveManagedDocument("welcome", welcome);
        set({ welcome });
      },
      saveIntro: async (intro) => {
        const { saveManagedDocument } =
          await import("@/services/managed-content");
        await saveManagedDocument("onboarding", intro);
        set({ intro });
      },
      saveBrands: (brands) => set({ brands }),

      sendNotificationCampaign: async (input) => {
        const campaign: NotificationCampaign = {
          id: `camp-${Date.now()}`,
          title: input.title,
          message: input.message,
          audience: input.audience,
          status:
            input.mode === "draft"
              ? "Draft"
              : input.scheduledFor === "Send Now"
                ? "Sent"
                : "Scheduled",
          scheduledFor: input.scheduledFor,
          sentAt:
            input.scheduledFor === "Send Now"
              ? new Date().toLocaleString()
              : "",
          targetType: input.targetType,
          targetValue: input.targetValue,
        };

        // Simulating delivery to the user's inbox
        if (campaign.status === "Sent") {
          const newNotification =
            buildCustomerNotificationFromCampaign(campaign);

          // Trigger Local System Notification
          Notifications.scheduleNotificationAsync({
            content: {
              title: campaign.title,
              body: campaign.message,
              data: {
                targetType: campaign.targetType,
                targetValue: campaign.targetValue,
              },
            },
            trigger: null, // Send immediately
          });

          set((state) => ({
            customerNotifications: [
              newNotification,
              ...state.customerNotifications,
            ],
            notificationCampaigns: [campaign, ...state.notificationCampaigns],
          }));
        } else {
          set((state) => ({
            notificationCampaigns: [campaign, ...state.notificationCampaigns],
          }));
        }

        return campaign;
      },
      generateInventoryExport: async () => {
        const timestamp = new Date().toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const cleanTimestamp = timestamp
          .replace(/[,/]/g, "")
          .replace(/\s+/g, "_")
          .toLowerCase();
        const exportRecord: ExportRecord = {
          id: `export-${Date.now()}`,
          fileName: `house_inventory_${cleanTimestamp}.csv`,
          format: "CSV",
          status: "Queued",
          createdAt: timestamp,
          rowCount: 248,
        };
        set((state) => ({
          exportHistory: [exportRecord, ...state.exportHistory],
        }));

        setTimeout(() => {
          set((state) => ({
            exportHistory: state.exportHistory.map((r) =>
              r.id === exportRecord.id ? { ...r, status: "Ready" } : r,
            ),
          }));
        }, 3000);

        return exportRecord;
      },
      markNotificationRead: async (id) => {
        set((state) => ({
          customerNotifications: state.customerNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase
            .from("app_notifications")
            .update({ read: true })
            .eq("id", id);
        } catch (e) {
          console.error(e);
        }
      },
      toggleNotificationRead: async (id) => {
        const current = get().customerNotifications.find((n) => n.id === id);
        const newRead = !current?.read;
        set((state) => ({
          customerNotifications: state.customerNotifications.map((n) =>
            n.id === id ? { ...n, read: newRead } : n,
          ),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase
            .from("app_notifications")
            .update({ read: newRead })
            .eq("id", id);
        } catch (e) {
          console.error(e);
        }
      },
      markAllNotificationsRead: async () => {
        set((state) => ({
          customerNotifications: state.customerNotifications.map((n) => ({
            ...n,
            read: true,
          })),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from("app_notifications")
              .update({ read: true })
              .eq("user_id", user.id);
          }
        } catch (e) {
          console.error(e);
        }
      },
      archiveNotification: async (id) => {
        set((state) => ({
          customerNotifications: state.customerNotifications.map((n) =>
            n.id === id ? { ...n, archived: true } : n,
          ),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase
            .from("app_notifications")
            .update({ archived: true })
            .eq("id", id);
        } catch (e) {
          console.error(e);
        }
      },
      restoreNotification: async (id) => {
        set((state) => ({
          customerNotifications: state.customerNotifications.map((n) =>
            n.id === id ? { ...n, archived: false } : n,
          ),
        }));
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase
            .from("app_notifications")
            .update({ archived: false })
            .eq("id", id);
        } catch (e) {
          console.error(e);
        }
      },
      hydrateShopifySync: (input) =>
        set((state) => ({
          shopifySync: normalizeShopifySyncState(input.syncState),
          shopifySyncLogs: input.logs
            ? normalizeShopifySyncLogs(input.logs)
            : normalizeShopifySyncLogs(state.shopifySyncLogs),
        })),
      runShopifySync: async (input) => {
        const now = new Date();
        const timeString = now.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const log: ShopifySyncLog = {
          id: `sync-${Date.now()}`,
          startedAt: timeString,
          completedAt: timeString,
          status: "Success",
          ordersImported: input.orderCount,
          customersImported: input.customerCount,
          productsImported: input.productCount,
          summary: `Manual sync completed. Imported ${input.orderCount} orders, ${input.customerCount} customers, and ${input.productCount} products.`,
        };
        const currentSyncState = normalizeShopifySyncState(get().shopifySync);
        const updatedState: ShopifySyncState = {
          ...currentSyncState,
          lastSuccessfulSync: `Today, ${now.toLocaleTimeString("en-US")}`,
          lastForceSync: timeString,
          syncedOrders: currentSyncState.syncedOrders + input.orderCount,
          syncedCustomers:
            currentSyncState.syncedCustomers + input.customerCount,
          syncedProducts: currentSyncState.syncedProducts + input.productCount,
        };
        set((state) => ({
          shopifySync: updatedState,
          shopifySyncLogs: [
            log,
            ...normalizeShopifySyncLogs(state.shopifySyncLogs),
          ],
        }));
        return { syncState: updatedState, log };
      },
      dismissShopifyWarning: () =>
        set((state) => ({
          shopifySync: { ...state.shopifySync, warningActive: false },
        })),
      fetchCustomerNotifications: async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from("app_notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;

          if (data) {
            const mapped = data.map((n: any) => ({
              id: n.id,
              label: n.label,
              title: n.title,
              message: n.message,
              time: new Date(n.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              icon: n.icon,
              targetType: n.target_type,
              targetValue: n.target_value,
              read: n.read,
              archived: n.archived,
              timestamp: n.created_at,
            }));

            set({ customerNotifications: mapped });
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      },
    }),
    {
      name: "@admin_content",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.shopifySync = normalizeShopifySyncState(state.shopifySync);
          state.shopifySyncLogs = normalizeShopifySyncLogs(
            state.shopifySyncLogs,
          );
        }
      },
    },
  ),
);

export const useAdminContentStore = () => {
  const store = useAdminContentStoreBase();
  return {
    ...store,
    unreadNotificationCount: store.customerNotifications.filter(
      (n) => !n.read && !n.archived,
    ).length,
  };
};
