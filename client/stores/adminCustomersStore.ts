import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AdminCustomerRecord,
  CustomerCommunicationLog,
  CustomerOrderSummary,
} from "@/constants/admin-customers";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ImportedShopifyCustomer {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  tag?: string;
}

interface AdminCustomersState {
  customers: AdminCustomerRecord[];
  isLoading: boolean;
  hasLoaded: boolean;
  fetchCustomers: () => Promise<void>;
  getCustomerById: (customerId?: string) => AdminCustomerRecord | undefined;
  addVipNote: (customerId: string, note: string) => void;
  toggleBlacklist: (customerId: string, reason?: string) => Promise<void>;
  markCustomerContacted: (customerId: string, note?: string) => void;
  updateCustomerAvatar: (customerId: string, avatarUrl: string) => void;
  importShopifyCustomers: (customers: ImportedShopifyCustomer[]) => number;
  recordBlacklistDecision: (
    customerId: string,
    decision: "whitelist" | "keep",
  ) => void;
}

const DEFAULT_AVATAR = "";
const LEGACY_DEFAULT_AVATAR_ID = "photo-1500648767791-00dcc994a43e";

const normalizeAvatar = (avatar?: string | null) => {
  if (!avatar || avatar.includes(LEGACY_DEFAULT_AVATAR_ID)) {
    return DEFAULT_AVATAR;
  }

  return avatar;
};

const nowLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const withPrependedLog = (
  customer: AdminCustomerRecord,
  log: CustomerCommunicationLog,
): AdminCustomerRecord => ({
  ...customer,
  lastContactDate: nowLabel(),
  communicationLogs: [log, ...customer.communicationLogs],
});

const getDefaultStatusTone = (badge: string) =>
  badge === "VIP" ? "dark" : "light";

const mapOrderStatus = (status?: string): CustomerOrderSummary["status"] => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("deliver") || normalized.includes("fulfilled")) {
    return "Fulfilled";
  }
  if (normalized.includes("archive")) {
    return "Archived";
  }
  return "Pending";
};

const buildOrderSummary = (order: any): CustomerOrderSummary => ({
  id: String(order.order_number ?? order.id),
  title:
    order.title ??
    order.metadata?.items?.[0]?.name ??
    order.subtitle ??
    "House of Shirts Order",
  date: new Date(order.created_at ?? Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  amount: Number(order.total_amount ?? order.total ?? 0),
  status: mapOrderStatus(order.status),
  linkedOrderId: String(order.order_number ?? order.id),
});

const normalizeCustomer = (
  customer: AdminCustomerRecord,
): AdminCustomerRecord => ({
  ...customer,
  phone: customer.phone ?? "",
  avatar: normalizeAvatar(customer.avatar),
  badge: customer.badge || "ACTIVE",
  statusLabel: customer.statusLabel || customer.badge || "ACTIVE",
  statusTone:
    customer.statusTone ?? getDefaultStatusTone(customer.badge || "ACTIVE"),
  lastActivity: customer.lastActivity || "No activity yet",
  lastContactDate: customer.lastContactDate || "No contact yet",
  featuredPurchase: customer.featuredPurchase || "No order history yet",
  featuredVariant: customer.featuredVariant || "No variant recorded",
  retentionScore: Number(customer.retentionScore ?? 0),
  preferredCategories:
    customer.preferredCategories && customer.preferredCategories.length > 0
      ? customer.preferredCategories
      : ["Unassigned"],
  lifetimeValue: Number(customer.lifetimeValue ?? 0),
  averageOrderValue: Number(customer.averageOrderValue ?? 0),
  totalOrders: Number(customer.totalOrders ?? 0),
  shopifySynced: Boolean(customer.shopifySynced),
  blacklisted: Boolean(customer.blacklisted),
  communicationLogs: Array.isArray(customer.communicationLogs)
    ? customer.communicationLogs
    : [],
  address: customer.address ?? {
    line1: customer.name,
    line2: "No address on file",
    cityStateZip: "Unknown location",
    country: "Unknown country",
  },
  tags: Array.isArray(customer.tags) ? customer.tags : [],
  orders: Array.isArray(customer.orders) ? customer.orders : [],
});

const buildCustomerMapFromSupabase = (
  profiles: any[],
  orders: any[],
  existingCustomers: AdminCustomerRecord[],
) => {
  const customersById = new Map<string, AdminCustomerRecord>();
  const profilesById = new Map<string, any>();

  profiles.forEach((profile) => {
    profilesById.set(String(profile.id), profile);
  });

  const profileIdByEmail = new Map(
    profiles
      .filter((profile) => profile.email)
      .map((profile) => [
        String(profile.email).trim().toLowerCase(),
        String(profile.id),
      ]),
  );
  const groupedOrders = new Map<string, any[]>();
  orders.forEach((order) => {
    const orderEmail = String(order.email ?? "")
      .trim()
      .toLowerCase();
    const key = String(
      order.user_id ??
        profileIdByEmail.get(orderEmail) ??
        (orderEmail
          ? `email:${orderEmail}`
          : (order.customer_name ?? order.id)),
    );
    groupedOrders.set(key, [...(groupedOrders.get(key) ?? []), order]);
  });

  const existingById = new Map(
    existingCustomers.map((customer) => [customer.id, customer]),
  );
  const existingByEmail = new Map(
    existingCustomers.map((customer) => [
      customer.email.trim().toLowerCase(),
      customer,
    ]),
  );

  const allKeys = new Set<string>([
    ...profilesById.keys(),
    ...groupedOrders.keys(),
  ]);

  allKeys.forEach((key) => {
    const profile = profilesById.get(key);
    const customerOrders = [...(groupedOrders.get(key) ?? [])].sort(
      (left, right) =>
        new Date(right.created_at ?? 0).getTime() -
        new Date(left.created_at ?? 0).getTime(),
    );

    const primaryOrder = customerOrders[0];
    const fullName =
      profile?.full_name ??
      primaryOrder?.customer_name ??
      profile?.email?.split("@")[0] ??
      "House Client";
    const email =
      profile?.email ??
      primaryOrder?.email ??
      existingById.get(key)?.email ??
      `No email on file (${key.slice(0, 8)})`;
    const existing =
      existingById.get(key) ?? existingByEmail.get(email.trim().toLowerCase());
    const orderSummaries = customerOrders.slice(0, 5).map(buildOrderSummary);
    const lifetimeValue = customerOrders.reduce(
      (sum, order) => sum + Number(order.total_amount ?? order.total ?? 0),
      0,
    );
    const averageOrderValue =
      customerOrders.length > 0 ? lifetimeValue / customerOrders.length : 0;
    const categories = Array.from(
      new Set(
        customerOrders
          .flatMap((order) =>
            Array.isArray(order.metadata?.items)
              ? order.metadata.items.map((item: any) => item.name)
              : [order.title],
          )
          .filter(Boolean),
      ),
    );
    const lastActivityDate = primaryOrder?.created_at ?? profile?.updated_at;

    customersById.set(
      key,
      normalizeCustomer({
        id: key,
        name: fullName,
        email,
        phone:
          profile?.phone ??
          primaryOrder?.metadata?.phone ??
          primaryOrder?.shipping_address?.phone ??
          existing?.phone ??
          "",
        avatar: normalizeAvatar(profile?.avatar_url ?? existing?.avatar),
        badge:
          existing?.badge ??
          (customerOrders.length >= 5
            ? "VIP"
            : customerOrders.length > 0
              ? "ACTIVE"
              : "NEW"),
        tier: existing?.tier,
        statusLabel: existing?.blacklisted
          ? "BLACKLISTED"
          : (existing?.statusLabel ??
            (customerOrders.length >= 5
              ? "VIP"
              : customerOrders.length > 0
                ? "ACTIVE"
                : "NEW")),
        statusTone:
          existing?.statusTone ??
          getDefaultStatusTone(
            existing?.badge ??
              (customerOrders.length >= 5
                ? "VIP"
                : customerOrders.length > 0
                  ? "ACTIVE"
                  : "NEW"),
          ),
        lastActivity: lastActivityDate
          ? new Date(lastActivityDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No activity yet",
        lastContactDate: existing?.lastContactDate ?? "No contact yet",
        blacklistReason: existing?.blacklistReason ?? "",
        blacklistOrderId:
          existing?.blacklistOrderId ?? orderSummaries[0]?.linkedOrderId ?? "",
        featuredPurchase:
          orderSummaries[0]?.title?.toUpperCase() ?? "NO ORDER HISTORY YET",
        featuredVariant:
          orderSummaries[0]?.title ??
          existing?.featuredVariant ??
          "No variant recorded",
        retentionScore:
          existing?.retentionScore ??
          Math.min(
            100,
            customerOrders.length * 18 + (lifetimeValue > 0 ? 10 : 0),
          ),
        preferredCategories:
          categories.length > 0
            ? categories.slice(0, 3)
            : (existing?.preferredCategories ?? []),
        lifetimeValue,
        averageOrderValue,
        totalOrders: customerOrders.length,
        shopifySynced: existing?.shopifySynced ?? false,
        blacklisted: existing?.blacklisted ?? false,
        communicationLogs: existing?.communicationLogs ?? [],
        address: existing?.address ?? {
          line1: fullName,
          line2: profile?.email ?? "No address on file",
          cityStateZip: "Unknown location",
          country: "Unknown country",
        },
        tags:
          existing?.tags && existing.tags.length > 0
            ? existing.tags
            : [
                customerOrders.length >= 5
                  ? "VIP"
                  : customerOrders.length > 0
                    ? "ACTIVE"
                    : "NEW",
                profile ? "APP USER" : "ORDER ONLY",
              ],
        orders: orderSummaries,
      }),
    );
  });

  return Array.from(customersById.values()).sort((left, right) => {
    if (right.totalOrders !== left.totalOrders) {
      return right.totalOrders - left.totalOrders;
    }
    return left.name.localeCompare(right.name);
  });
};

const mergeShopifyCustomerDetails = (
  customers: AdminCustomerRecord[],
  shopifyCustomers: any[],
) => {
  const shopifyByEmail = new Map(
    shopifyCustomers
      .filter((customer) => customer.email)
      .map((customer) => [
        String(customer.email).trim().toLowerCase(),
        customer,
      ]),
  );

  const merged = customers.map((customer) => {
    const normalizedEmail = customer.email.trim().toLowerCase();
    const shopify = shopifyByEmail.get(normalizedEmail);
    if (!shopify) return customer;
    shopifyByEmail.delete(normalizedEmail);
    const shopifyName = [shopify.first_name, shopify.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return normalizeCustomer({
      ...customer,
      name:
        customer.name === "House Client" && shopifyName
          ? shopifyName
          : customer.name,
      email: shopify.email,
      phone: customer.phone || shopify.phone || "",
      shopifySynced: true,
      blacklisted: Boolean(shopify.blacklisted),
      blacklistReason: shopify.blacklist_reason ?? "",
      statusLabel: shopify.blacklisted ? "BLACKLISTED" : customer.statusLabel,
      statusTone: shopify.blacklisted ? "dark" : customer.statusTone,
      address:
        customer.address?.line2 !== "No address on file"
          ? customer.address
          : {
              line1: shopifyName || customer.name,
              line2: "Shopify customer",
              cityStateZip: shopify.city || "Unknown location",
              country: shopify.country || "Unknown country",
            },
    });
  });

  shopifyByEmail.forEach((shopify) => {
    const name =
      [shopify.first_name, shopify.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || String(shopify.email).split("@")[0];
    merged.push(
      normalizeCustomer({
        id: `shopify-${shopify.shopify_id}`,
        name,
        email: shopify.email,
        phone: shopify.phone || "",
        avatar: "",
        badge: "ACTIVE",
        statusLabel: shopify.blacklisted ? "BLACKLISTED" : "ACTIVE",
        statusTone: shopify.blacklisted ? "dark" : "light",
        lastActivity: "Shopify customer",
        lastContactDate: "No contact yet",
        featuredPurchase: "No order history yet",
        featuredVariant: "No variant recorded",
        retentionScore: 0,
        preferredCategories: [],
        lifetimeValue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        shopifySynced: true,
        blacklisted: Boolean(shopify.blacklisted),
        blacklistReason: shopify.blacklist_reason ?? "",
        communicationLogs: [],
        address: {
          line1: name,
          line2: "Shopify customer",
          cityStateZip: shopify.city || "Unknown location",
          country: shopify.country || "Unknown country",
        },
        tags: ["SHOPIFY", "SYNCED"],
        orders: [],
      }),
    );
  });

  return merged.sort(
    (left, right) =>
      right.totalOrders - left.totalOrders ||
      left.name.localeCompare(right.name),
  );
};

export const useAdminCustomersStore = create<AdminCustomersState>()(
  persist(
    (set, get) => ({
      customers: [],
      isLoading: false,
      hasLoaded: false,
      fetchCustomers: async () => {
        if (get().isLoading) {
          return;
        }

        set({ isLoading: true });
        try {
          const { supabase } = await import("@/lib/supabase");
          const [
            { data: profiles, error: profilesError },
            { data: orders, error: ordersError },
            { data: shopifyCustomers, error: shopifyCustomersError },
          ] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, email, full_name, phone, avatar_url, updated_at"),
            supabase
              .from("orders")
              .select(
                "id, user_id, email, customer_name, title, subtitle, total, total_amount, status, order_number, created_at, shipping_address, metadata",
              ),
            supabase
              .from("shopify_customers")
              .select(
                "shopify_id, email, first_name, last_name, phone, city, country, blacklisted, blacklist_reason, blacklisted_at",
              ),
          ]);

          if (profilesError) throw profilesError;
          if (ordersError) throw ordersError;
          if (shopifyCustomersError) throw shopifyCustomersError;

          const built = buildCustomerMapFromSupabase(
            profiles ?? [],
            orders ?? [],
            get().customers,
          );

          const customers = mergeShopifyCustomerDetails(
            built,
            shopifyCustomers ?? [],
          );

          set({ customers, hasLoaded: true });
        } catch (error) {
          console.error("Error fetching admin customers:", error);
          set({ hasLoaded: true });
        } finally {
          set({ isLoading: false });
        }
      },
      getCustomerById: (customerId) =>
        get().customers.find((customer) => customer.id === customerId),
      addVipNote: (customerId, note) => {
        const trimmedNote = note.trim();
        if (!trimmedNote) return;
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId
              ? withPrependedLog(customer, {
                  id: `vip-note-${Date.now()}`,
                  type: "Internal VIP Note",
                  age: "Just now",
                  message: trimmedNote,
                })
              : customer,
          ),
        }));
      },
      toggleBlacklist: async (customerId, reason) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return;
        const blacklisted = !customer.blacklisted;

        // Optimistic local update
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            return withPrependedLog(
              {
                ...c,
                blacklisted,
                blacklistReason: blacklisted
                  ? (reason ?? "Restricted by admin.")
                  : "",
                statusLabel: blacklisted ? "BLACKLISTED" : c.badge,
                statusTone: blacklisted
                  ? "dark"
                  : getDefaultStatusTone(c.badge),
              },
              {
                id: `blacklist-${Date.now()}`,
                type: "Internal VIP Note",
                age: "Just now",
                message: blacklisted
                  ? "Customer was moved to the blacklist after admin review."
                  : "Customer was restored from the blacklist and returned to active review.",
              },
            );
          }),
        }));

        // Persist to Supabase
        try {
          const { supabase } = await import("@/lib/supabase");
          await supabase
            .from("shopify_customers")
            .update({
              blacklisted,
              blacklist_reason: blacklisted
                ? (reason ?? "Restricted by admin.")
                : null,
              blacklisted_at: blacklisted ? new Date().toISOString() : null,
            })
            .eq("email", customer.email.trim().toLowerCase());
        } catch (err) {
          console.error("Error persisting blacklist to Supabase:", err);
        }
      },
      markCustomerContacted: (customerId, note) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId
              ? withPrependedLog(customer, {
                  id: `contact-${Date.now()}`,
                  type: "Support Outbound",
                  age: "Just now",
                  message:
                    note?.trim() ||
                    "Customer outreach thread opened from the admin registry for direct follow-up.",
                })
              : customer,
          ),
        }));
      },
      updateCustomerAvatar: (customerId, avatarUrl) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId
              ? { ...customer, avatar: avatarUrl }
              : customer,
          ),
        }));
      },
      importShopifyCustomers: (importedCustomers) => {
        let createdCount = 0;
        const next = [...get().customers];

        importedCustomers.forEach((incomingCustomer) => {
          const normalizedEmail = incomingCustomer.email.trim().toLowerCase();
          const existingIndex = next.findIndex(
            (customer) =>
              customer.email.trim().toLowerCase() === normalizedEmail,
          );

          if (existingIndex >= 0) {
            next[existingIndex] = normalizeCustomer({
              ...next[existingIndex],
              name: incomingCustomer.name,
              phone: incomingCustomer.phone ?? next[existingIndex].phone,
              shopifySynced: true,
              tags: Array.from(
                new Set([
                  ...(next[existingIndex].tags ?? []),
                  incomingCustomer.tag ?? "SHOPIFY",
                  "SYNCED",
                ]),
              ),
            });
            return;
          }

          createdCount += 1;
          next.unshift(
            normalizeCustomer({
              id: `shopify-${normalizedEmail || Date.now()}`,
              name: incomingCustomer.name,
              email: incomingCustomer.email,
              phone: incomingCustomer.phone ?? "",
              avatar: DEFAULT_AVATAR,
              badge: incomingCustomer.tag === "VIP" ? "VIP" : "ACTIVE",
              statusLabel: incomingCustomer.tag === "VIP" ? "VIP" : "ACTIVE",
              statusTone: incomingCustomer.tag === "VIP" ? "dark" : "light",
              lastActivity: nowLabel(),
              lastContactDate: "No contact yet",
              featuredPurchase: "SHOPIFY IMPORT",
              featuredVariant: "Shopify Import",
              retentionScore: 0,
              preferredCategories: ["Shopify Sync"],
              lifetimeValue: 0,
              averageOrderValue: 0,
              totalOrders: 0,
              shopifySynced: true,
              blacklisted: false,
              communicationLogs: [],
              address: {
                line1: incomingCustomer.name,
                line2: incomingCustomer.city ?? "Imported from Shopify",
                cityStateZip: incomingCustomer.city ?? "Unknown City",
                country: incomingCustomer.country ?? "Unknown Country",
              },
              tags: [incomingCustomer.tag ?? "SHOPIFY", "SYNCED"],
              orders: [],
            }),
          );
        });

        set({ customers: next, hasLoaded: true });
        return createdCount;
      },
      recordBlacklistDecision: (customerId, decision) => {
        set((state) => ({
          customers: state.customers.map((customer) => {
            if (customer.id !== customerId) return customer;
            const timestampMessage =
              decision === "whitelist"
                ? "Customer was reviewed and removed from the restricted list."
                : "Customer restriction was reviewed and kept active for future orders.";

            return withPrependedLog(
              {
                ...customer,
                blacklisted: decision === "keep",
                statusLabel:
                  decision === "keep" ? "BLACKLISTED" : customer.badge,
                statusTone:
                  decision === "keep"
                    ? "dark"
                    : getDefaultStatusTone(customer.badge),
              },
              {
                id: `blacklist-review-${Date.now()}`,
                type: "Internal VIP Note",
                age: "Just now",
                message: timestampMessage,
              },
            );
          }),
        }));
      },
    }),
    {
      name: "@admin_customers",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.customers = state.customers.map(normalizeCustomer);
        }
      },
    },
  ),
);
