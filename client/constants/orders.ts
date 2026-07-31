export interface OrderTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  active: boolean;
}

export type OrderDeliveryRegion = "Nigeria" | "International";
export type OrderPaymentMethod = "Card" | "Pay on Delivery" | "Bank Transfer";
export type OrderFulfillmentMethod = "Home Delivery" | "Pickup Station";
export type OrderLogisticsMilestone =
  | "Processing"
  | "Shipped"
  | "In Transit"
  | "Arrived at Hub"
  | "Out for Delivery"
  | "Available for Pickup"
  | "Delivered";
export type OrderFollowUpStatus = "None" | "Pending" | "Contacted" | "Resolved";

export interface OrderOutreachNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface OrderLineItem {
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerRiskStatus?: "None" | "Blacklisted";
  customerRiskReason?: string;
  placedOn: string;
  estimatedArrival: string;
  carrier: string;
  trackingNumber: string;
  title: string;
  subtitle: string;
  status: string;
  atelierStage:
    | "Pending"
    | "Quality Check"
    | "Personalization"
    | "Shipped"
    | "Delivered";
  deliveryRegion: OrderDeliveryRegion;
  paymentMethod: OrderPaymentMethod;
  fulfillmentMethod: OrderFulfillmentMethod;
  logisticsMilestone: OrderLogisticsMilestone;
  followUpStatus: OrderFollowUpStatus;
  outreachNotes: OrderOutreachNote[];
  total: number;
  subtotal: number;
  shipping: number;
  image: string;
  lineItems?: OrderLineItem[];
  timeline: OrderTimelineEvent[];
}
