export interface CustomerOrderSummary {
  id: string;
  title: string;
  date: string;
  amount: number;
  status: "Fulfilled" | "Archived" | "Pending";
  linkedOrderId?: string;
}

export interface CustomerCommunicationLog {
  id: string;
  type: "Support Outbound" | "Internal VIP Note" | "Concierge Call";
  age: string;
  message: string;
}

export interface CustomerAddress {
  line1: string;
  line2: string;
  cityStateZip: string;
  country: string;
}

export interface AdminCustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  badge: string;
  tier?: string;
  statusLabel: string;
  statusTone: "dark" | "light";
  lastActivity: string;
  lastContactDate: string;
  blacklistReason?: string;
  blacklistOrderId?: string;
  featuredPurchase: string;
  featuredVariant: string;
  retentionScore: number;
  preferredCategories: string[];
  lifetimeValue: number;
  averageOrderValue: number;
  totalOrders: number;
  shopifySynced: boolean;
  blacklisted: boolean;
  communicationLogs: CustomerCommunicationLog[];
  address: CustomerAddress;
  tags: string[];
  orders: CustomerOrderSummary[];
}

export const adminCustomers: AdminCustomerRecord[] = [
  {
    id: "cust-julian-vane",
    name: "Julian Vane",
    email: "julian.vane@arch-studio.com",
    phone: "+1 917 555 0184",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    badge: "VIP",
    tier: "SILVER",
    statusLabel: "VIP",
    statusTone: "dark",
    lastActivity: "Oct 24, 2023",
    lastContactDate: "Apr 04, 2026",
    blacklistReason: "Payment Refused on Delivery (COD Failure)",
    blacklistOrderId: "HS-8921",
    featuredPurchase: "PREMIUM OXFORD (WHITE)",
    featuredVariant: "Premium Oxford (White)",
    retentionScore: 94,
    preferredCategories: ["Premium Shirts", "Tailored Suiting", "Accessories"],
    lifetimeValue: 12480,
    averageOrderValue: 1560,
    totalOrders: 8,
    shopifySynced: true,
    blacklisted: true,
    communicationLogs: [
      {
        id: "log-1",
        type: "Support Outbound",
        age: "2 days ago",
        message:
          "Re: Measurement custom fit order #ET-8821. Customer confirmed sleeve length change to 34.5 inches. Tailor notified.",
      },
      {
        id: "log-2",
        type: "Internal VIP Note",
        age: "1 month ago",
        message:
          "Prefers extra heavy starch on collars. High touch customer - ensure all suit deliveries include handwritten note.",
      },
      {
        id: "log-3",
        type: "Concierge Call",
        age: "2 months ago",
        message:
          "Discussed autumn collection preview. Interested in custom corduroy textures.",
      },
    ],
    address: {
      line1: "Julian Vane",
      line2: "842 Madison Avenue, Suite 12",
      cityStateZip: "New York, NY 10021",
      country: "United States",
    },
    tags: ["HIGH VALUE", "CUSTOM TAILORED", "NEW YORK HUB", "REPEAT BUYER"],
    orders: [
      {
        id: "ET-8821",
        title: "Custom Poplin Shirt",
        date: "Oct 12, 2023",
        amount: 245,
        status: "Fulfilled",
        linkedOrderId: "HS-89201",
      },
      {
        id: "ET-8714",
        title: "Italian Wool Suit",
        date: "Sep 28, 2023",
        amount: 2850,
        status: "Fulfilled",
        linkedOrderId: "HS-87644",
      },
      {
        id: "ET-8692",
        title: "Mulberry Silk Tie",
        date: "Aug 14, 2023",
        amount: 185,
        status: "Archived",
        linkedOrderId: "HS-86110",
      },
    ],
  },
  {
    id: "cust-julian-beaumont",
    name: "Julian Beaumont",
    email: "julian.b@atelier-prive.com",
    phone: "+33 6 44 10 55 82",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    badge: "VIP",
    statusLabel: "VIP",
    statusTone: "dark",
    lastActivity: "Oct 24, 2023",
    lastContactDate: "Mar 29, 2026",
    featuredPurchase: "PREMIUM OXFORD (WHITE)",
    featuredVariant: "Premium Oxford (White)",
    retentionScore: 89,
    preferredCategories: ["Formalwear", "Luxury Shirting"],
    lifetimeValue: 10890,
    averageOrderValue: 1815,
    totalOrders: 6,
    shopifySynced: true,
    blacklisted: false,
    communicationLogs: [],
    address: {
      line1: "Julian Beaumont",
      line2: "15 Rue de la Paix",
      cityStateZip: "Paris 75002",
      country: "France",
    },
    tags: ["VIP", "EUROPE", "FORMALWEAR"],
    orders: [],
  },
  {
    id: "cust-elara-vance",
    name: "Elara Vance",
    email: "e.vance@vogue-global.com",
    phone: "+44 7700 900221",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    badge: "ACTIVE",
    statusLabel: "ACTIVE",
    statusTone: "light",
    lastActivity: "Nov 12, 2023",
    lastContactDate: "Apr 01, 2026",
    featuredPurchase: "SILK EVENING SHIRT (BLACK)",
    featuredVariant: "Silk Evening Shirt (Black)",
    retentionScore: 78,
    preferredCategories: ["Eveningwear", "Silk Shirting"],
    lifetimeValue: 6420,
    averageOrderValue: 1070,
    totalOrders: 6,
    shopifySynced: true,
    blacklisted: false,
    communicationLogs: [],
    address: {
      line1: "Elara Vance",
      line2: "55 Broadway",
      cityStateZip: "London SW1A 1AA",
      country: "United Kingdom",
    },
    tags: ["ACTIVE", "EVENINGWEAR"],
    orders: [],
  },
  {
    id: "cust-marcus-thorne",
    name: "Marcus Thorne",
    email: "m.thorne@equity-partners.net",
    phone: "+44 20 5550 1182",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&sat=-100",
    badge: "NEW",
    statusLabel: "NEW",
    statusTone: "light",
    lastActivity: "Just Now",
    lastContactDate: "Apr 06, 2026",
    blacklistReason: "Address repeatedly inaccessible during fulfillment window.",
    blacklistOrderId: "HS-9042",
    featuredPurchase: "FIRST CONSULTATION",
    featuredVariant: "First Consultation",
    retentionScore: 61,
    preferredCategories: ["Consultation", "Business Casual"],
    lifetimeValue: 980,
    averageOrderValue: 980,
    totalOrders: 1,
    shopifySynced: false,
    blacklisted: true,
    communicationLogs: [],
    address: {
      line1: "Marcus Thorne",
      line2: "10 Bishopsgate",
      cityStateZip: "London EC2N 4BQ",
      country: "United Kingdom",
    },
    tags: ["NEW", "CONSULTATION"],
    orders: [],
  },
  {
    id: "cust-sienna-blake",
    name: "Sienna Blake",
    email: "sienna.b@creative-collective.com",
    phone: "+1 646 555 0108",
    avatar:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    badge: "VIP",
    statusLabel: "VIP",
    statusTone: "light",
    lastActivity: "Sep 18, 2023",
    lastContactDate: "Mar 22, 2026",
    blacklistReason: "Disputed authentic transaction after delivery confirmation.",
    blacklistOrderId: "HS-8711",
    featuredPurchase: "LINEN WORKSHIRT (NAVY)",
    featuredVariant: "Linen Workshirt (Navy)",
    retentionScore: 86,
    preferredCategories: ["Creative Office", "Linen Shirts"],
    lifetimeValue: 8540,
    averageOrderValue: 1423,
    totalOrders: 6,
    shopifySynced: true,
    blacklisted: true,
    communicationLogs: [],
    address: {
      line1: "Sienna Blake",
      line2: "18 Greene Street",
      cityStateZip: "New York, NY 10013",
      country: "United States",
    },
    tags: ["VIP", "CREATIVE", "NEW YORK HUB"],
    orders: [],
  },
];

export const getAdminCustomerById = (id?: string) =>
  adminCustomers.find((customer) => customer.id === id);
