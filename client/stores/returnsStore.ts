import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOrdersStoreBase } from "./ordersStore";

export type ReturnRequestType = "return" | "exchange";
export type ReturnRequestStatus = "Requested" | "In Transit" | "Quality Check" | "Processed" | "Rejected";

export interface ReturnTimelineEvent {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

export interface AdminReturnNote {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  message: string;
}

export interface ReturnRequestRecord {
  id: string;
  orderId: string;
  type: ReturnRequestType;
  status: ReturnRequestStatus;
  rmaNumber: string;
  customerName: string;
  submittedAt: string;
  items?: {
    id: string;
    title: string;
    subtitle: string;
    price: number;
    image: string;
    reason: string;
  }[];
  itemTitle: string;
  itemSubtitle: string;
  itemPrice: number;
  itemImage: string;
  customerPhotoUrls: string[];
  returnLabelCode?: string;
  returnLabelIssuedAt?: string;
  reason: string;
  comments?: string;
  adminNotes: AdminReturnNote[];
  timeline: ReturnTimelineEvent[];
  read: boolean;
}

interface ReturnsState {
  requests: ReturnRequestRecord[];
  createRequest: (input: {
    orderId: string;
    type: ReturnRequestType;
    customerName?: string;
    itemTitle: string;
    itemSubtitle: string;
    itemPrice: number;
    itemImage: string;
    customerPhotoUrls?: string[];
    reason: string;
    comments?: string;
    items?: {
      id: string;
      title: string;
      subtitle: string;
      price: number;
      image: string;
      reason: string;
    }[];
  }) => Promise<ReturnRequestRecord>;
  getRequestById: (id: string) => ReturnRequestRecord | undefined;
  markRequestRead: (id: string) => void;
  markAllRequestsRead: () => void;
  reviewRequest: (id: string, decision: "approve" | "reject") => void;
  addAdminNote: (id: string, note: string) => void;
  processRefund: (id: string) => void;
}

const useReturnsStoreBase = create<ReturnsState>()(
  persist(
    (set, get) => ({
      requests: [],
      getRequestById: (id) => get().requests.find((request) => request.id === id),
      createRequest: async (input) => {
        const requestItems = input.items?.length
          ? input.items
          : [{
              id: `item-${Date.now()}`,
              title: input.itemTitle,
              subtitle: input.itemSubtitle,
              price: input.itemPrice,
              image: input.itemImage,
              reason: input.reason,
            }];
        const primaryItem = requestItems[0];

        const request: ReturnRequestRecord = {
          id: `request-${Date.now()}`,
          customerName: input.customerName ?? "House of Shirts Client",
          orderId: input.orderId,
          type: input.type,
          status: "Requested",
          rmaNumber: `${Math.floor(1000000 + Math.random() * 8999999)}`,
          submittedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          items: requestItems,
          itemTitle: primaryItem.title,
          itemSubtitle: primaryItem.subtitle,
          itemPrice: primaryItem.price,
          itemImage: primaryItem.image,
          customerPhotoUrls: input.customerPhotoUrls ?? ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
          reason: input.reason,
          comments: input.comments,
          adminNotes: [],
          read: false,
          timeline: [
            { id: "1", title: input.type === "exchange" ? "Exchange Requested" : "Return Requested", description: `${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} - 09:45 AM`, active: true },
            { id: "2", title: "Item Received", description: "Awaiting pickup confirmation", active: false },
            { id: "3", title: input.type === "exchange" ? "Replacement Prepared" : "Quality Check", description: input.type === "exchange" ? "Replacement will be prepared after atelier review" : "Pending inspection by Atelier team", active: false },
            { id: "4", title: input.type === "exchange" ? "Exchange Shipped" : "Refund Processed", description: input.type === "exchange" ? "Replacement shipment details will appear here" : "Credit will appear in 3-5 business days", active: false },
          ],
        };

        set((state) => ({ requests: [request, ...state.requests] }));

        if (input.type === "exchange") {
          useOrdersStoreBase.getState().updateOrderForExchange(input.orderId);
        }

        return request;
      },
      markRequestRead: (id) => {
        set((state) => ({
          requests: state.requests.map((r) => (r.id === id ? { ...r, read: true } : r)),
        }));
      },
      markAllRequestsRead: () => {
        set((state) => ({
          requests: state.requests.map((r) => (r.read ? r : { ...r, read: true })),
        }));
      },
      reviewRequest: (id, decision) => {
        set((state) => ({
          requests: state.requests.map((request) => {
            if (request.id !== id) return request;

            if (decision === "reject") {
              return {
                ...request,
                status: "Rejected",
                returnLabelCode: undefined,
                returnLabelIssuedAt: undefined,
                adminNotes: [{ id: `note-${Date.now()}`, author: "House of Shirts Admin", role: "Returns Desk", timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), message: "Return request was declined after review. Customer will need manual support follow-up before a label is issued." }, ...request.adminNotes],
                timeline: request.timeline.map((event, index) => ({ ...event, active: index === 0, description: event.id === "2" ? "Request was not approved for shipment" : event.description })),
              };
            }

            const issuedAt = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
            const labelCode = `HOS-${request.type === "exchange" ? "EXC" : "RTN"}-${request.rmaNumber}`;

            return {
              ...request,
              status: "In Transit",
              returnLabelCode: labelCode,
              returnLabelIssuedAt: issuedAt,
              adminNotes: [{ id: `note-${Date.now()}`, author: "House of Shirts Admin", role: "Returns Desk", timestamp: issuedAt, message: request.type === "exchange" ? `Exchange approved. Reverse-logistics label ${labelCode} was generated for atelier intake before replacement dispatch.` : `Return approved. Reverse-logistics label ${labelCode} was generated and is ready for inbound shipment.` }, ...request.adminNotes],
              timeline: request.timeline.map((event, index) => {
                if (event.id === "2") return { ...event, active: true, description: request.type === "exchange" ? `Label ${labelCode} issued. Awaiting inbound exchange shipment.` : `Label ${labelCode} issued. Awaiting return shipment.` };
                if (event.id === "3") return { ...event, active: false, title: request.type === "exchange" ? "Replacement Review" : event.title, description: request.type === "exchange" ? "Replacement piece will be prepared after atelier inspection." : event.description };
                return { ...event, active: index <= 1 };
              }),
            };
          }),
        }));
      },
      addAdminNote: (id, note) => {
        const trimmed = note.trim();
        if (!trimmed) return;
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id
              ? { ...request, adminNotes: [{ id: `note-${Date.now()}`, author: "House of Shirts Admin", role: "Atelier Returns Desk", timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), message: trimmed }, ...request.adminNotes] }
              : request
          ),
        }));
      },
      processRefund: (id) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status: "Processed",
                  adminNotes: [{ id: `note-${Date.now()}`, author: "House of Shirts Admin", role: "Finance Review", timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), message: request.type === "exchange" ? "Replacement order was approved manually after atelier review and is ready for the dispatch queue." : "Refund was processed manually after atelier inspection and fee review." }, ...request.adminNotes],
                  timeline: request.timeline.map((event, index) => {
                    if (request.type === "exchange" && event.id === "4") return { ...event, active: true, title: "Replacement Ready", description: "Replacement item cleared and queued for outbound dispatch." };
                    return { ...event, active: index <= 3 };
                  }),
                }
              : request
          ),
        }));
      },
    }),
    {
      name: "@return_requests",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useReturnsStore = () => {
  const store = useReturnsStoreBase();
  return {
    ...store,
    unreadCount: store.requests.filter((r) => !r.read).length,
  };
};
