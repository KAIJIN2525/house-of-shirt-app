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

export const starterOrders: OrderRecord[] = [
  {
    id: "HS-89201",
    customerName: "Alexander West",
    customerPhone: "+234 801 555 1021",
    customerRiskStatus: "None",
    customerRiskReason: "",
    placedOn: "Oct 24, 2023",
    estimatedArrival: "Oct 28 2023",
    carrier: "GIG Logistics",
    trackingNumber: "GIGL-NG-2999AA10123",
    title: "Oxford Tailored Fit",
    subtitle: "SIZE 47 | WHITE COTTON",
    status: "Arrived at GIGL Hub",
    atelierStage: "Pending",
    deliveryRegion: "Nigeria",
    paymentMethod: "Pay on Delivery",
    fulfillmentMethod: "Pickup Station",
    logisticsMilestone: "Arrived at Hub",
    followUpStatus: "Pending",
    outreachNotes: [],
    total: 440000,
    subtotal: 425000,
    shipping: 15000,
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400",
    timeline: [
      {
        id: "1",
        title: "Arrived at Hub",
        description: "Package arrived at GIGL pickup station, Lagos. Customer availability confirmation needed.",
        date: "10:45 AM",
        active: true,
      },
      {
        id: "2",
        title: "In Transit",
        description: "Line haul completed into Lagos service zone",
        date: "OCT 26",
        active: true,
      },
      {
        id: "3",
        title: "Processing",
        description: "Payment Confirmed & Verified",
        date: "OCT 24",
        active: true,
      },
      {
        id: "4",
        title: "Delivered",
        description: "Package signed by recipient",
        date: "",
        active: false,
      },
    ],
  },
  {
    id: "HS-87644",
    customerName: "Julianne Thorne",
    customerPhone: "+1 212 555 0182",
    customerRiskStatus: "None",
    customerRiskReason: "",
    placedOn: "Sep 03, 2023",
    estimatedArrival: "Delivered Sep 03",
    carrier: "FedEx Priority",
    trackingNumber: "FDX88112210",
    title: "Evening Silk Blend",
    subtitle: "SIZE 47 | MIDNIGHT NAVY",
    status: "Delivered",
    atelierStage: "Quality Check",
    deliveryRegion: "International",
    paymentMethod: "Card",
    fulfillmentMethod: "Home Delivery",
    logisticsMilestone: "Delivered",
    followUpStatus: "Resolved",
    outreachNotes: [],
    total: 240000,
    subtotal: 225000,
    shipping: 15000,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    timeline: [
      {
        id: "1",
        title: "Delivered",
        description: "Package signed by recipient",
        date: "SEP 03",
        active: true,
      },
      {
        id: "2",
        title: "In Transit",
        description: "Arrived at Sort Facility, Lagos",
        date: "SEP 02",
        active: true,
      },
      {
        id: "3",
        title: "Shipped",
        description: "Departed Warehouse, London",
        date: "SEP 01",
        active: true,
      },
      {
        id: "4",
        title: "Processing",
        description: "Payment Confirmed & Verified",
        date: "AUG 30",
        active: true,
      },
    ],
  },
  {
    id: "HS-86110",
    customerName: "Marcus Vane",
    customerPhone: "+44 20 5550 1144",
    customerRiskStatus: "None",
    customerRiskReason: "",
    placedOn: "Aug 19, 2023",
    estimatedArrival: "Delivered Aug 19",
    carrier: "UPS Express",
    trackingNumber: "UPS11088211",
    title: "Architect's Poplin",
    subtitle: "SIZE 45 | IVORY POPLIN",
    status: "Delivered",
    atelierStage: "Personalization",
    deliveryRegion: "International",
    paymentMethod: "Card",
    fulfillmentMethod: "Home Delivery",
    logisticsMilestone: "Delivered",
    followUpStatus: "Resolved",
    outreachNotes: [],
    total: 185000,
    subtotal: 170000,
    shipping: 15000,
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400",
    timeline: [
      {
        id: "1",
        title: "Delivered",
        description: "Package signed by recipient",
        date: "AUG 19",
        active: true,
      },
      {
        id: "2",
        title: "In Transit",
        description: "Arrived at Final Sorting Hub",
        date: "AUG 18",
        active: true,
      },
      {
        id: "3",
        title: "Shipped",
        description: "Departed Warehouse, London",
        date: "AUG 17",
        active: true,
      },
      {
        id: "4",
        title: "Processing",
        description: "Payment Confirmed & Verified",
        date: "AUG 16",
        active: true,
      },
    ],
  },
  {
    id: "HS-84775",
    customerName: "Sophia Chen",
    customerPhone: "+234 809 222 7714",
    customerRiskStatus: "None",
    customerRiskReason: "",
    placedOn: "Jul 08, 2023",
    estimatedArrival: "Jul 14 2023",
    carrier: "GIG Logistics",
    trackingNumber: "GIGL-NG-44770022",
    title: "Linen Work Shirt",
    subtitle: "UTILITY STYLE | BONE BUTTONS",
    status: "Out for Delivery",
    atelierStage: "Shipped",
    deliveryRegion: "Nigeria",
    paymentMethod: "Pay on Delivery",
    fulfillmentMethod: "Home Delivery",
    logisticsMilestone: "Out for Delivery",
    followUpStatus: "Pending",
    outreachNotes: [],
    total: 290000,
    subtotal: 275000,
    shipping: 15000,
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
    timeline: [
      {
        id: "1",
        title: "Out for Delivery",
        description: "Rider assigned for same-day drop. Customer should be reachable for payment on delivery.",
        date: "JUL 10",
        active: true,
      },
      {
        id: "2",
        title: "Arrived at Hub",
        description: "Arrived at GIGL local branch before rider dispatch",
        date: "JUL 09",
        active: true,
      },
      {
        id: "3",
        title: "Processing",
        description: "Payment Confirmed & Verified",
        date: "JUL 08",
        active: true,
      },
      {
        id: "4",
        title: "Delivered",
        description: "Package signed by recipient",
        date: "",
        active: false,
      },
    ],
  },
  {
    id: "HS-83972",
    customerName: "Thomas Shelby",
    customerPhone: "+1 646 555 0199",
    customerRiskStatus: "None",
    customerRiskReason: "",
    placedOn: "Jun 21, 2023",
    estimatedArrival: "Jun 25 2023",
    carrier: "FedEx Priority",
    trackingNumber: "FDX11007721",
    title: "Herringbone Cotton",
    subtitle: "FORMAL SPREAD | CUFFLINKS",
    status: "Shipped",
    atelierStage: "Shipped",
    deliveryRegion: "International",
    paymentMethod: "Card",
    fulfillmentMethod: "Home Delivery",
    logisticsMilestone: "Shipped",
    followUpStatus: "None",
    outreachNotes: [],
    total: 710000,
    subtotal: 695000,
    shipping: 15000,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
    timeline: [
      {
        id: "1",
        title: "Shipped",
        description: "Courier pickup confirmed",
        date: "JUN 22",
        active: true,
      },
      {
        id: "2",
        title: "Quality Check",
        description: "Pressed and cleared for dispatch",
        date: "JUN 21",
        active: true,
      },
      {
        id: "3",
        title: "Processing",
        description: "Payment Confirmed & Verified",
        date: "JUN 21",
        active: true,
      },
      {
        id: "4",
        title: "Delivered",
        description: "Package signed by recipient",
        date: "",
        active: false,
      },
    ],
  },
];
