import { OrderPaymentMethod, OrderRecord } from "@/constants/orders";
import { toJson } from "@/lib/json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAdminCustomersStore } from "./adminCustomersStore";

export interface NotificationAttemptStatus {
  email: "sent" | "skipped" | "failed";
  sms: "sent" | "skipped" | "failed";
  push: "sent" | "skipped" | "failed";
  app: "sent" | "skipped" | "failed";
  admin: "sent" | "skipped" | "failed";
}

export interface NotificationDispatchResult {
  orderId?: string;
  customerName: string;
  channels: NotificationAttemptStatus;
}

interface OrdersState {
  orders: OrderRecord[];
  myOrders: OrderRecord[];
  arrivalAttentionOrders: OrderRecord[];
  blacklistedOrderAlerts: OrderRecord[];
  isLoading: boolean;
  hasLoaded: boolean;
  fetchOrders: () => Promise<void>;
  fetchMyOrders: () => Promise<void>;

  importShopifyOrders: (
    orders: {
      id: string;
      customerName: string;
      customerPhone?: string;
      title: string;
      subtitle: string;
      total: number;
      image: string;
      placedOn: string;
      paymentMethod?: OrderPaymentMethod;
      lineItems?: import("@/constants/orders").OrderLineItem[];
    }[],
  ) => Promise<number>;
  getOrderById: (id: string) => OrderRecord | undefined;
  updateOrderForExchange: (orderId: string) => void;
  acknowledgeArrivalAlert: (orderId: string, note?: string) => void;
  resolveArrivalAlert: (orderId: string, note?: string) => void;
  updateOrderLogisticsStatus: (
    orderId: string,
    milestone: OrderRecord["logisticsMilestone"],
  ) => Promise<NotificationDispatchResult | null>;

  bulkDispatchOrders: (
    orderIds: string[],
  ) => Promise<NotificationDispatchResult[]>;
  addOutreachNote: (orderId: string, note: string) => void;
  dispatchExternalOrder: (details: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    orderTitle: string;
  }) => Promise<NotificationDispatchResult[]>;
}

const NIGERIAN_STATES = [
  "abia",
  "adamawa",
  "akwa ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara",
  "fct",
  "abuja",
];

const isNigerianState = (value?: string) =>
  Boolean(value && NIGERIAN_STATES.includes(value.trim().toLowerCase()));

const isLagosLocation = (...values: unknown[]) =>
  values.some((value) =>
    typeof value === "string" && value.toLowerCase().includes("lagos"),
  );

const getLogisticsForLocation = (
  isLagosOrder: boolean,
  isNigeriaOrder: boolean,
  paymentMethod?: OrderPaymentMethod,
) => {
  const carrier = isLagosOrder
    ? "House Rider"
    : isNigeriaOrder
      ? "GIG Logistics"
      : "DHL Express";
  const trackingPrefix = isLagosOrder
    ? "HOS-RIDER"
    : isNigeriaOrder
      ? "GIGL-NG"
      : "DHL";
  const fulfillmentMethod: OrderRecord["fulfillmentMethod"] =
    isLagosOrder ||
    !(isNigeriaOrder && paymentMethod === "Pay on Delivery")
      ? "Home Delivery"
      : "Pickup Station";

  return { carrier, trackingPrefix, fulfillmentMethod };
};

const isAdminProfile = async (supabase: any) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) {
    return { isAdmin: false, userId: null as string | null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;

  return { isAdmin: Boolean(profile?.is_admin), userId: user.id };
};

const milestoneDescriptions: Record<OrderRecord["logisticsMilestone"], string> = {
  Processing: "Payment confirmed & verified",
  Shipped: "Courier pickup confirmed by dispatch team",
  "In Transit": "Shipment is moving through the courier network",
  "Arrived at Hub": "Shipment has reached the local branch",
  "Out for Delivery": "Rider has been assigned and customer should be reachable",
  "Available for Pickup": "Order is ready at the pickup station",
  Delivered: "Package signed by recipient",
};

const getMilestonePath = (
  fulfillmentMethod?: OrderRecord["fulfillmentMethod"],
): OrderRecord["logisticsMilestone"][] => [
  "Processing",
  "Shipped",
  "In Transit",
  "Arrived at Hub",
  fulfillmentMethod === "Pickup Station" ? "Available for Pickup" : "Out for Delivery",
  "Delivered",
];

const buildProgressiveTimeline = (
  milestone: OrderRecord["logisticsMilestone"],
  currentDateLabel: string,
  placedDateLabel?: string,
  fulfillmentMethod?: OrderRecord["fulfillmentMethod"],
): OrderRecord["timeline"] => {
  const milestonePath = getMilestonePath(fulfillmentMethod);
  const currentIndex = Math.max(0, milestonePath.indexOf(milestone));
  const activeDate = currentDateLabel.toUpperCase();
  const firstDate = (placedDateLabel || currentDateLabel).toUpperCase();

  return milestonePath.map((title, index) => ({
    id: String(index + 1),
    title,
    description: milestoneDescriptions[title],
    date: index === currentIndex ? activeDate : index === 0 ? firstDate : "",
    active: index <= currentIndex,
  }));
};

const buildDefaultTimeline = (
  milestone: OrderRecord["logisticsMilestone"],
  createdAtLabel: string,
  fulfillmentMethod?: OrderRecord["fulfillmentMethod"],
): OrderRecord["timeline"] =>
  buildProgressiveTimeline(milestone, createdAtLabel, createdAtLabel, fulfillmentMethod);

const normalizeTimeline = (
  timeline: OrderRecord["timeline"] | undefined,
  milestone: OrderRecord["logisticsMilestone"],
  placedDateLabel: string,
  fulfillmentMethod?: OrderRecord["fulfillmentMethod"],
): OrderRecord["timeline"] => {
  const existingByTitle = new Map(
    (timeline ?? []).map((event) => [event.title.toLowerCase(), event]),
  );
  const currentEvent = existingByTitle.get(milestone.toLowerCase());
  const currentDate = currentEvent?.date || placedDateLabel;

  return buildProgressiveTimeline(
    milestone,
    currentDate,
    placedDateLabel,
    fulfillmentMethod,
  ).map((event) => {
    const existingEvent = existingByTitle.get(event.title.toLowerCase());
    return {
      ...event,
      description: existingEvent?.description || event.description,
      date: event.active ? existingEvent?.date || event.date : "",
    };
  });
};

const mapDatabaseOrder = (order: any): OrderRecord => {
  const createdAt = new Date(order.created_at ?? Date.now());
  const placedOn = createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const metadata = order.metadata ?? {};
  const items = Array.isArray(metadata.items) ? metadata.items : [];
  const lineItems = items.map((item: any, index: number) => ({
    id: String(item.id ?? index),
    productId: item.productId ?? item.product_id,
    variantId: item.variantId ?? item.variant_id,
    title: item.name ?? item.title ?? "House Piece",
    variantTitle: item.variantTitle ?? item.variant_title,
    quantity: Number(item.quantity ?? 1),
    price: Number(item.price ?? 0),
    image: item.image,
  }));
  const deliveryRegion = String(metadata.region ?? order.delivery_region ?? "")
    .toLowerCase()
    .includes("nigeria")
    ? "Nigeria"
    : "International";
  const paymentMethod = String(
    metadata.payment_method ?? order.payment_method ?? "",
  )
    .toLowerCase()
    .includes("delivery")
    ? "Pay on Delivery"
    : "Card";
  const milestone = (order.logistics_milestone ??
    (String(order.status ?? "")
      .toLowerCase()
      .includes("deliver")
      ? "Delivered"
      : "Processing")) as OrderRecord["logisticsMilestone"];
  const title =
    order.title ?? items[0]?.name ?? order.subtitle ?? "House Piece";
  const subtotal =
    Number(metadata.subtotal ?? order.subtotal ?? 0) ||
    Math.max(
      0,
      Number(order.total_amount ?? order.total ?? 0) -
        Number(metadata.shipping ?? 0),
    );
  const shipping = Number(metadata.shipping ?? order.shipping ?? 0);
  const shippingAddress = metadata.shipping_address ?? order.shipping_address ?? {};
  const isLagosOrder = isLagosLocation(
    metadata.shipping_state,
    metadata.region,
    order.delivery_region,
    shippingAddress.state,
    shippingAddress.province,
    shippingAddress.city,
    shippingAddress.address1,
    shippingAddress.address,
  );
  const isNigeriaMappedOrder =
    deliveryRegion === "Nigeria" ||
    isNigerianState(String(order.delivery_region ?? "")) ||
    isNigerianState(String(shippingAddress.state ?? shippingAddress.province ?? ""));
  const logistics = getLogisticsForLocation(
    isLagosOrder,
    isNigeriaMappedOrder,
    paymentMethod,
  );
  const metadataFulfillment = String(metadata.fulfillment_method ?? "").toLowerCase();
  const fulfillmentMethod = isLagosOrder
    ? "Home Delivery"
    : metadataFulfillment.includes("pickup")
      ? "Pickup Station"
      : "Home Delivery";

  return normalizeOrder({
    id: String(order.order_number ?? order.id),
    customerName: order.customer_name ?? "House Client",
    customerPhone: metadata.phone ?? "",
    customerRiskStatus:
      metadata.risk_status === "Blacklisted" ? "Blacklisted" : "None",
    customerRiskReason: metadata.risk_reason ?? "",
    placedOn,
    estimatedArrival: metadata.estimated_arrival ?? placedOn,
    carrier: isLagosOrder ? logistics.carrier : order.carrier || logistics.carrier,
    trackingNumber: order.tracking_number || `${logistics.trackingPrefix}PENDING`,
    title,
    subtitle:
      order.subtitle ??
      (items.length > 0 ? `${items.length} Item(s)` : "House of Shirts Order"),
    status: order.status ?? "Processing",
    atelierStage:
      milestone === "Delivered"
        ? "Delivered"
        : milestone === "Shipped" || milestone === "In Transit"
          ? "Shipped"
          : "Pending",
    deliveryRegion,
    paymentMethod,
    fulfillmentMethod,
    logisticsMilestone: milestone,
    followUpStatus: metadata.follow_up_status ?? "None",
    outreachNotes: Array.isArray(metadata.outreach_notes)
      ? metadata.outreach_notes
      : [],
    total: Number(order.total_amount ?? order.total ?? 0),
    subtotal,
    shipping,
    image: items[0]?.image ?? "",
    lineItems,
    timeline:
      Array.isArray(order.timeline) && order.timeline.length > 0
        ? normalizeTimeline(
            order.timeline,
            milestone,
            placedOn,
            fulfillmentMethod,
          )
        : buildDefaultTimeline(
            milestone,
            placedOn,
            fulfillmentMethod,
          ),
  });
};

const normalizeOrder = (order: OrderRecord): OrderRecord => ({
  ...order,
  customerPhone: order.customerPhone ?? "",
  customerRiskStatus: order.customerRiskStatus ?? "None",
  customerRiskReason: order.customerRiskReason ?? "",
  deliveryRegion: order.deliveryRegion ?? "International",
  paymentMethod: order.paymentMethod ?? "Card",
  fulfillmentMethod: order.fulfillmentMethod ?? "Home Delivery",
  logisticsMilestone: order.logisticsMilestone ?? "Processing",
  followUpStatus: order.followUpStatus ?? "None",
  outreachNotes: order.outreachNotes ?? [],
  timeline: normalizeTimeline(
    order.timeline,
    order.logisticsMilestone ?? "Processing",
    order.placedOn,
    order.fulfillmentMethod,
  ),
});

const needsArrivalFollowUp = (order: OrderRecord) =>
  order.deliveryRegion === "Nigeria" &&
  order.paymentMethod === "Pay on Delivery" &&
  (order.logisticsMilestone === "Arrived at Hub" ||
    order.logisticsMilestone === "Out for Delivery") &&
  order.followUpStatus !== "Resolved";

type CustomerNotificationMessageType =
  | "processing"
  | "dispatched"
  | "in_transit"
  | "arrived_at_hub"
  | "out_for_delivery"
  | "delivered"
  | "custom";

const milestoneStatusConfig: Record<
  OrderRecord["logisticsMilestone"],
  { status: string; atelierStage: OrderRecord["atelierStage"] }
> = {
  Processing: { status: "Processing", atelierStage: "Pending" },
  Shipped: { status: "Shipped", atelierStage: "Shipped" },
  "In Transit": { status: "In Transit", atelierStage: "Shipped" },
  "Arrived at Hub": { status: "Arrived at GIGL Hub", atelierStage: "Shipped" },
  "Out for Delivery": { status: "Out for Delivery", atelierStage: "Shipped" },
  "Available for Pickup": {
    status: "Available for Pickup",
    atelierStage: "Shipped",
  },
  Delivered: { status: "Delivered", atelierStage: "Delivered" },
};

const milestoneNotificationTypeMap: Record<
  OrderRecord["logisticsMilestone"],
  CustomerNotificationMessageType
> = {
  Processing: "processing",
  Shipped: "dispatched",
  "In Transit": "in_transit",
  "Arrived at Hub": "arrived_at_hub",
  "Out for Delivery": "out_for_delivery",
  "Available for Pickup":
    "available_for_pickup" as CustomerNotificationMessageType,

  Delivered: "delivered",
};

const buildOrderMetadata = (order: OrderRecord) => ({
  phone: order.customerPhone,
  items: order.lineItems ?? [],
  region: order.deliveryRegion,
  payment_method: order.paymentMethod,
  fulfillment_method: order.fulfillmentMethod,
  estimated_arrival: order.estimatedArrival,
  risk_status: order.customerRiskStatus,
  risk_reason: order.customerRiskReason,
  follow_up_status: order.followUpStatus,
  outreach_notes: order.outreachNotes,
});

const defaultNotificationChannels: NotificationAttemptStatus = {
  email: "skipped",
  sms: "skipped",
  push: "skipped",
  app: "skipped",
  admin: "skipped",
};

export const useOrdersStoreBase = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      myOrders: [],
      arrivalAttentionOrders: [],
      blacklistedOrderAlerts: [],
      isLoading: false,
      hasLoaded: false,

      fetchMyOrders: async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            set({ myOrders: [] });
            return;
          }

          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Supabase fetchMyOrders error:", error);
            throw error;
          }

          set({ myOrders: (data ?? []).map(mapDatabaseOrder) });
        } catch (error) {
          console.error("Error fetching my orders:", error);
        }
      },

      fetchOrders: async () => {
        if (get().isLoading) {
          return;
        }

        set({ isLoading: true });
        try {
          const { supabase } = await import("@/lib/supabase");
          const { isAdmin, userId } = await isAdminProfile(supabase);

          if (!userId) {
            set({ orders: [], isLoading: false, hasLoaded: true });
            return;
          }

          if (isAdmin) {
            const { data, error } = await supabase.functions.invoke("admin-orders", {
              method: "POST",
            });

            if (error) {
              console.error("Admin orders function error:", error);
              throw error;
            }

            if (data?.syncWarning) {
              const warning = typeof data.syncWarning === "string"
                ? data.syncWarning
                : JSON.stringify(data.syncWarning);
              console.warn("Latest Shopify order refresh warning:", warning);
            }

            set({
              orders: (data?.orders ?? []).map(mapDatabaseOrder),
              hasLoaded: true,
            });
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ orders: [], isLoading: false, hasLoaded: true });
            return;
          }

          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Supabase fetchOrders error:", error);
            throw error;
          }

          set({
            orders: (data ?? []).map(mapDatabaseOrder),
            hasLoaded: true,
          });
        } catch (error) {
          console.error("Error fetching real orders:", error);
          set({ orders: [], hasLoaded: true });
        } finally {
          set({ isLoading: false });
        }
      },

      getOrderById: (id) => get().orders.find((order) => order.id === id),

      importShopifyOrders: async (importedOrders) => {
        let createdCount = 0;
        const next = [...get().orders];
        const customers = useAdminCustomersStore.getState().customers;

        importedOrders.forEach((incomingOrder) => {
          const existing = next.find((order) => order.id === incomingOrder.id);
          if (existing) return;

          createdCount += 1;
          const matchedBlacklistedCustomer = customers.find((customer) => {
            const sameName =
              customer.name.trim().toLowerCase() ===
              incomingOrder.customerName.trim().toLowerCase();
            const samePhone =
              customer.phone.replace(/[^\d+]/g, "") ===
              (incomingOrder.customerPhone ?? "").replace(/[^\d+]/g, "");
            return customer.blacklisted && (sameName || samePhone);
          });

          next.unshift(
            normalizeOrder({
              id: incomingOrder.id,
              customerName: incomingOrder.customerName,
              customerPhone: incomingOrder.customerPhone ?? "",
              customerRiskStatus: matchedBlacklistedCustomer
                ? "Blacklisted"
                : "None",
              customerRiskReason:
                matchedBlacklistedCustomer?.blacklistReason ?? "",
              placedOn: incomingOrder.placedOn,
              estimatedArrival: incomingOrder.placedOn,
              carrier: "Shopify Sync",
              trackingNumber: `SYNC-${incomingOrder.id}`,
              title: incomingOrder.title,
              subtitle: incomingOrder.subtitle,
              status: "Imported from Shopify",
              atelierStage: "Pending",
              deliveryRegion: "International",
              paymentMethod: incomingOrder.paymentMethod ?? "Card",
              fulfillmentMethod: "Home Delivery",
              logisticsMilestone: "Processing",
              followUpStatus: "None",
              outreachNotes: matchedBlacklistedCustomer
                ? [
                    {
                      id: `risk-${Date.now()}-${createdCount}`,
                      text: `Shopify import alert: ${matchedBlacklistedCustomer.name} has a restricted account and placed order ${incomingOrder.id}.`,
                      timestamp: new Date().toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                  ]
                : [],
              total: incomingOrder.total,
              subtotal: Math.max(0, incomingOrder.total - 15000),
              shipping: 15000,
              image: incomingOrder.image,
              lineItems: incomingOrder.lineItems,
              timeline: [
                {
                  id: "1",
                  title: "Imported",
                  description:
                    "Order pulled from Shopify into the admin dashboard",
                  date: incomingOrder.placedOn.toUpperCase(),
                  active: true,
                },
                {
                  id: "2",
                  title: "Processing",
                  description: "Awaiting local fulfillment workflow",
                  date: "",
                  active: false,
                },
                {
                  id: "3",
                  title: "Shipped",
                  description: "Awaiting courier handoff",
                  date: "",
                  active: false,
                },
                {
                  id: "4",
                  title: "Delivered",
                  description: "Package signed by recipient",
                  date: "",
                  active: false,
                },
              ],
            }),
          );
        });

        set({ orders: next, hasLoaded: true });
        return createdCount;
      },

      updateOrderForExchange: (orderId) => {
        const today = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order;
            return {
              ...order,
              status: "Exchange Review",
              atelierStage: "Quality Check" as const,
              followUpStatus:
                order.followUpStatus === "Pending"
                  ? "Contacted"
                  : order.followUpStatus,
              timeline: [
                {
                  id: "1",
                  title: "Quality Check",
                  description:
                    "Exchange request received and garment under atelier review",
                  date: today.toUpperCase(),
                  active: true,
                },
                {
                  id: "2",
                  title: "Replacement Prepared",
                  description:
                    "Replacement tailoring slot reserved for the next piece",
                  date: "",
                  active: false,
                },
                {
                  id: "3",
                  title: "Shipped",
                  description:
                    "Replacement will move to dispatch once approved",
                  date: "",
                  active: false,
                },
                {
                  id: "4",
                  title: "Delivered",
                  description: "Replacement package signed by recipient",
                  date: "",
                  active: false,
                },
              ],
            };
          }),
        }));
      },

      acknowledgeArrivalAlert: (orderId, note) => {
        const timestamp = new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  followUpStatus: "Contacted" as const,
                  outreachNotes: [
                    {
                      id: `note-${Date.now()}`,
                      text:
                        note ??
                        `Admin contacted customer regarding ${order.status.toLowerCase()} for ${order.carrier}.`,
                      timestamp,
                    },
                    ...order.outreachNotes,
                  ],
                }
              : order,
          ),
        }));
      },

      resolveArrivalAlert: (orderId, note) => {
        const timestamp = new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  followUpStatus: "Resolved" as const,
                  outreachNotes: [
                    {
                      id: `note-${Date.now()}`,
                      text:
                        note ??
                        `Customer pickup/payment confirmed for ${order.status.toLowerCase()} order.`,
                      timestamp,
                    },
                    ...order.outreachNotes,
                  ],
                }
              : order,
          ),
        }));
      },

      addOutreachNote: (orderId, note) => {
        const timestamp = new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  outreachNotes: [
                    { id: `note-${Date.now()}`, text: note, timestamp },
                    ...order.outreachNotes,
                  ],
                }
              : order,
          ),
        }));
      },

      bulkDispatchOrders: async (orderIds: string[]) => {
        set({ isLoading: true });
        try {
          const { supabase } = await import("@/lib/supabase");

          const shippedDate = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          const selectedOrders = get().orders.filter((o) =>
            orderIds.includes(o.id),
          );

          // 2. Trigger the Edge Function
          // The Edge Function now handles:
          // - Inserting customer/admin app_notifications
          // - Sending customer push/email/SMS where configured
          const customersToNotify = selectedOrders.map((o) => ({
            name: o.customerName,
            phone: o.customerPhone,
            orderId: o.id,
          }));

          const shippedMetadataUpdates = selectedOrders.map((order) => {
            const nextOrder: OrderRecord = {
              ...order,
              status: "Shipped",
              atelierStage: "Shipped",
              logisticsMilestone: "Shipped",
              timeline: buildProgressiveTimeline(
                "Shipped",
                shippedDate,
                order.placedOn,
                order.fulfillmentMethod,
              ),
            };

            return {
              id: order.id,
              status: nextOrder.status,
              atelierStage: nextOrder.atelierStage,
              logisticsMilestone: nextOrder.logisticsMilestone,
              timeline: nextOrder.timeline,
              metadata: buildOrderMetadata(nextOrder),
            };
          });

          await Promise.all(
            shippedMetadataUpdates.map((update) =>
              supabase
                .from("orders")
                .update({
                  status: update.status,
                  logistics_milestone: update.logisticsMilestone,
                  timeline: toJson(update.timeline),
                  metadata: toJson(update.metadata),
                })
                .eq("id", update.id),
            ),
          );

          const { data: notifyData, error: notifyError } =
            await supabase.functions.invoke("notify-customers", {
              body: {
                customers: customersToNotify,
                messageType: "dispatched",
              },
            });

          if (notifyError) {
            throw notifyError;
          }

          // 3. Update Local State (Instant UI feedback)
          set((state) => ({
            orders: state.orders.map((order) => {
              if (orderIds.includes(order.id)) {
                return {
                  ...order,
                  status: "Shipped",
                  atelierStage: "Shipped" as const,
                  logisticsMilestone: "Shipped" as const,
                  timeline: buildProgressiveTimeline(
                    "Shipped",
                    shippedDate,
                    order.placedOn,
                    order.fulfillmentMethod,
                  ),
                };
              }
              return order;
            }),
          }));

          const reports = Array.isArray(notifyData?.reports)
            ? notifyData.reports
            : selectedOrders.map((order) => ({
                orderId: order.id,
                customerName: order.customerName,
                channels: defaultNotificationChannels,
              }));

          return reports as NotificationDispatchResult[];
        } catch (error) {
          console.error("Error bulk dispatching orders:", error);
          return [];
        } finally {
          set({ isLoading: false });
        }
      },

      dispatchExternalOrder: async (details) => {
        set({ isLoading: true });
        try {
          const { supabase } = await import("@/lib/supabase");

          const externalOrderId = `EXT-${Math.floor(Math.random() * 100000)}`;

          const { data: notifyData, error: notifyError } =
            await supabase.functions.invoke("notify-customers", {
              body: {
                customers: [
                  {
                    name: details.customerName,
                    phone: details.customerPhone,
                    email: details.customerEmail,
                    orderId: externalOrderId,
                  },
                ],
                messageType: "dispatched",
                customMessage: `Great news! Your custom order (${details.orderTitle}) has been dispatched.`,
              },
            });

          if (notifyError) {
            throw notifyError;
          }

          const newOrder = normalizeOrder({
            id: externalOrderId,
            customerName: details.customerName,
            customerPhone: details.customerPhone,
            customerRiskStatus: "None",
            customerRiskReason: "",
            placedOn: new Date().toISOString(),
            estimatedArrival: new Date().toISOString(),
            carrier: "Direct Delivery",
            trackingNumber: externalOrderId,
            title: details.orderTitle,
            subtitle: "External/Manual Order",
            status: "Shipped",
            atelierStage: "Shipped",
            deliveryRegion: "Nigeria",
            paymentMethod: "Bank Transfer",
            fulfillmentMethod: "Home Delivery",
            logisticsMilestone: "Shipped",
            followUpStatus: "None",
            outreachNotes: [],
            total: 0,
            subtotal: 0,
            shipping: 0,
            image: "",
            lineItems: [],
            timeline: [],
          });

          set((state) => ({ orders: [newOrder, ...state.orders] }));

          return Array.isArray(notifyData?.reports)
            ? (notifyData.reports as NotificationDispatchResult[])
            : [
                {
                  orderId: externalOrderId,
                  customerName: details.customerName,
                  channels: defaultNotificationChannels,
                },
              ];
        } catch (error) {
          console.error("Error dispatching external order:", error);
          return [];
        } finally {
          set({ isLoading: false });
        }
      },

      updateOrderLogisticsStatus: async (orderId, milestone) => {
        const timestamp = new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const order = get().orders.find((item) => item.id === orderId);
        if (!order) {
          return null;
        }

        const nextFollowUpStatus =
          milestone === "Delivered"
            ? "Resolved"
            : milestone === "Arrived at Hub" || milestone === "Out for Delivery"
              ? order.paymentMethod === "Pay on Delivery" &&
                order.deliveryRegion === "Nigeria"
                ? "Pending"
                : order.followUpStatus
              : order.followUpStatus;

        const nextOrder: OrderRecord = {
          ...order,
          logisticsMilestone: milestone,
          status: milestoneStatusConfig[milestone].status,
          atelierStage: milestoneStatusConfig[milestone].atelierStage,
          followUpStatus: nextFollowUpStatus,
          timeline: buildProgressiveTimeline(
            milestone,
            timestamp,
            order.placedOn,
            order.fulfillmentMethod,
          ),
          outreachNotes:
            milestone === "Arrived at Hub" || milestone === "Out for Delivery"
              ? [
                  {
                    id: `note-${Date.now()}`,
                    text: `Automatic operational alert generated after staff updated order to ${milestone.toLowerCase()}.`,
                    timestamp,
                  },
                  ...order.outreachNotes,
                ]
              : order.outreachNotes,
        };

        set((state) => ({
          orders: state.orders.map((stateOrder) =>
            stateOrder.id === orderId ? nextOrder : stateOrder,
          ),
        }));

        try {
          const { supabase } = await import("@/lib/supabase");

          await supabase
            .from("orders")
            .update({
              status: nextOrder.status,
              logistics_milestone: nextOrder.logisticsMilestone,
              timeline: toJson(nextOrder.timeline),
              metadata: toJson(buildOrderMetadata(nextOrder)),
            })
            .eq("id", orderId);

          const { data: notifyData, error: notifyError } =
            await supabase.functions.invoke("notify-customers", {
              body: {
                customers: [
                  {
                    name: nextOrder.customerName,
                    phone: nextOrder.customerPhone,
                    orderId: nextOrder.id,
                  },
                ],
                messageType: milestoneNotificationTypeMap[milestone],
              },
            });

          if (notifyError) {
            throw notifyError;
          }

          const report = Array.isArray(notifyData?.reports)
            ? notifyData.reports[0]
            : {
                orderId: nextOrder.id,
                customerName: nextOrder.customerName,
                channels: defaultNotificationChannels,
              };

          return report as NotificationDispatchResult;
        } catch (error) {
          console.error("Error updating order milestone notifications:", error);
          return null;
        }
      },
    }),
    {
      name: "@orders",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.orders = state.orders.map(normalizeOrder);
        }
      },
    },
  ),
);

export const useOrdersStore = () => {
  const store = useOrdersStoreBase();
  return {
    ...store,
    arrivalAttentionOrders: store.orders.filter(needsArrivalFollowUp),
    blacklistedOrderAlerts: store.orders.filter(
      (order) => order.customerRiskStatus === "Blacklisted",
    ),
  };
};
