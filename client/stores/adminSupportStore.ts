import type { Tables } from "@/lib/db";
import { create } from "zustand";

export type SupportTicketPriority = "URGENT" | "HIGH" | "STANDARD";
export type SupportTicketStatus = "OPEN" | "PENDING" | "RESOLVED";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  customerName: string;
  customerEmail?: string;
  orderId?: string;
  agentName?: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  sender: "admin" | "customer";
  senderName: string;
  message: string;
  createdAt: string;
}

interface CreateTicketInput {
  title: string;
  description: string;
  customerName: string;
  customerEmail?: string;
  orderId?: string;
  priority: SupportTicketPriority;
}

interface AdminSupportState {
  tickets: SupportTicket[];
  messages: Record<string, SupportTicketMessage[]>;
  isLoading: boolean;
  hasLoaded: boolean;
  isSubmitting: boolean;
  fetchTickets: () => Promise<void>;
  createTicket: (input: CreateTicketInput) => Promise<SupportTicket | null>;
  updateTicketStatus: (
    ticketId: string,
    status: SupportTicketStatus,
  ) => Promise<void>;
  fetchMessages: (ticketId: string) => Promise<void>;
  sendMessage: (ticketId: string, message: string) => Promise<void>;
}

// support_tickets stores priority/status as text, so values arriving from the
// database must be narrowed rather than trusted.
const toTicketPriority = (value: string | null): SupportTicketPriority =>
  value === "URGENT" || value === "HIGH" ? value : "STANDARD";

const toTicketStatus = (value: string | null): SupportTicketStatus =>
  value === "OPEN" || value === "PENDING" ? value : "RESOLVED";

const mapDatabaseTicket = (row: Tables<"support_tickets">): SupportTicket => ({
  id: row.id,
  ticketNumber: row.ticket_number,
  title: row.title,
  description: row.description,
  customerName: row.customer_name,
  customerEmail: row.customer_email ?? undefined,
  orderId: row.order_id ?? undefined,
  agentName: row.agent_name ?? undefined,
  priority: toTicketPriority(row.priority),
  status: toTicketStatus(row.status),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toMessageSender = (value: string | null): SupportTicketMessage["sender"] =>
  value === "admin" ? "admin" : "customer";

const mapDatabaseMessage = (
  row: Tables<"support_ticket_messages">,
): SupportTicketMessage => ({
  id: row.id,
  ticketId: row.ticket_id,
  sender: toMessageSender(row.sender),
  senderName: row.sender_name,
  message: row.message,
  createdAt: row.created_at,
});

export const useAdminSupportStore = create<AdminSupportState>((set, get) => ({
  tickets: [],
  messages: {},
  isLoading: false,
  hasLoaded: false,
  isSubmitting: false,

  fetchTickets: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({ tickets: (data ?? []).map(mapDatabaseTicket), hasLoaded: true });
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      set({ hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },

  createTicket: async (input) => {
    set({ isSubmitting: true });
    try {
      const { supabase } = await import("@/lib/supabase");
      const ticketNumber = `TK-${Math.floor(1000 + Math.random() * 8999)}`;

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          ticket_number: ticketNumber,
          title: input.title,
          description: input.description,
          customer_name: input.customerName,
          customer_email: input.customerEmail || null,
          order_id: input.orderId || null,
          priority: input.priority,
          status: "OPEN",
        })
        .select()
        .single();

      if (error) throw error;

      const ticket = mapDatabaseTicket(data);
      set((state) => ({ tickets: [ticket, ...state.tickets] }));
      return ticket;
    } catch (error) {
      console.error("Error creating support ticket:", error);
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateTicketStatus: async (ticketId, status) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket,
      ),
    }));
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  },

  fetchMessages: async (ticketId) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: (data ?? []).map(mapDatabaseMessage),
        },
      }));
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
    }
  },

  sendMessage: async (ticketId, message) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const senderName =
        (user?.user_metadata?.full_name as string | undefined) ||
        user?.email ||
        "Admin";

      const { data, error } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender: "admin",
          sender_name: senderName,
          message,
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage = mapDatabaseMessage(data);
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: [...(state.messages[ticketId] ?? []), newMessage],
        },
      }));

      if (get().tickets.find((t) => t.id === ticketId)?.status === "OPEN") {
        await get().updateTicketStatus(ticketId, "PENDING");
      }
    } catch (error) {
      console.error("Error sending ticket message:", error);
    }
  },
}));
