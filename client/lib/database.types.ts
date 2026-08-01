export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string
          phone: string
          state: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label: string
          phone: string
          state: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          state?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_access_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          target_email: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          target_email: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          target_email?: string
        }
        Relationships: []
      }
      admin_access_grants: {
        Row: {
          email: string
          granted_at: string
          granted_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          email: string
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          email?: string
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string
          changed_fields: string[]
          id: number
          new_record: Json | null
          occurred_at: string
          old_record: Json | null
          request_id: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string
          changed_fields?: string[]
          id?: never
          new_record?: Json | null
          occurred_at?: string
          old_record?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string
          changed_fields?: string[]
          id?: never
          new_record?: Json | null
          occurred_at?: string
          old_record?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      app_notifications: {
        Row: {
          archived: boolean | null
          created_at: string
          icon: string | null
          id: string
          label: string | null
          message: string
          read: boolean | null
          target_type: string | null
          target_value: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          icon?: string | null
          id?: string
          label?: string | null
          message: string
          read?: boolean | null
          target_type?: string | null
          target_value?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          icon?: string | null
          id?: string
          label?: string | null
          message?: string
          read?: boolean | null
          target_type?: string | null
          target_value?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      back_in_stock_requests: {
        Row: {
          created_at: string
          delivery_report: Json
          email: string | null
          id: string
          last_attempt_at: string | null
          last_error: string | null
          notification_attempts: number
          notification_channels: Json
          notified_at: string | null
          phone: string | null
          product_id: string
          product_title: string
          shopify_product_id: string | null
          size: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_report?: Json
          email?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          notification_attempts?: number
          notification_channels?: Json
          notified_at?: string | null
          phone?: string | null
          product_id: string
          product_title: string
          shopify_product_id?: string | null
          size: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_report?: Json
          email?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          notification_attempts?: number
          notification_channels?: Json
          notified_at?: string | null
          phone?: string | null
          product_id?: string
          product_title?: string
          shopify_product_id?: string | null
          size?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image: string | null
          name: string
          price: number
          product_id: string
          quantity: number
          size: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          name: string
          price: number
          product_id: string
          quantity?: number
          size?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          price?: number
          product_id?: string
          quantity?: number
          size?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      edge_rate_limits: {
        Row: {
          key_hash: string
          request_count: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          key_hash: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          key_hash?: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      editorials: {
        Row: {
          created_at: string
          created_by: string | null
          cta_text: string
          display_end: string | null
          display_start: string | null
          headline: string
          id: string
          image_url: string | null
          is_default: boolean
          media_asset_id: string | null
          overlay_label: string
          status: string
          target_url: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cta_text: string
          display_end?: string | null
          display_start?: string | null
          headline: string
          id?: string
          image_url?: string | null
          is_default?: boolean
          media_asset_id?: string | null
          overlay_label: string
          status?: string
          target_url?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cta_text?: string
          display_end?: string | null
          display_start?: string | null
          headline?: string
          id?: string
          image_url?: string | null
          is_default?: boolean
          media_asset_id?: string | null
          overlay_label?: string
          status?: string
          target_url?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorials_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integration_health_incidents: {
        Row: {
          first_seen_at: string
          incident_key: string
          integration: string
          last_notified_at: string | null
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          first_seen_at?: string
          incident_key: string
          integration: string
          last_notified_at?: string | null
          last_seen_at?: string
          message: string
          occurrence_count?: number
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          first_seen_at?: string
          incident_key?: string
          integration?: string
          last_notified_at?: string | null
          last_seen_at?: string
          message?: string
          occurrence_count?: number
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      managed_app_content: {
        Row: {
          content: Json
          content_key: string
          created_at: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content?: Json
          content_key: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: Json
          content_key?: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "managed_app_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          archived: boolean
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          folder: string
          height: number | null
          id: string
          media_type: string
          mime_type: string
          original_filename: string | null
          public_url: string
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          folder?: string
          height?: number | null
          id?: string
          media_type: string
          mime_type: string
          original_filename?: string | null
          public_url: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          folder?: string
          height?: number | null
          id?: string
          media_type?: string
          mime_type?: string
          original_filename?: string | null
          public_url?: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notification_campaigns: {
        Row: {
          audience: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          scheduled_at: string | null
          scheduled_for_text: string
          sent_at: string | null
          status: string
          target_type: string | null
          target_value: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          scheduled_at?: string | null
          scheduled_for_text: string
          sent_at?: string | null
          status: string
          target_type?: string | null
          target_value?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          scheduled_at?: string | null
          scheduled_for_text?: string
          sent_at?: string | null
          status?: string
          target_type?: string | null
          target_value?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string
          event_key: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          event_key: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          event_key?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          carrier: string | null
          created_at: string
          customer_name: string
          delivery_region: string | null
          email: string | null
          id: string
          logistics_milestone: string | null
          metadata: Json | null
          order_number: string | null
          payment_method: string | null
          shipping_address: Json | null
          shopify_event_at: string | null
          shopify_order_id: string | null
          status: string
          subtitle: string | null
          timeline: Json | null
          title: string | null
          total: number
          total_amount: number | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          customer_name: string
          delivery_region?: string | null
          email?: string | null
          id: string
          logistics_milestone?: string | null
          metadata?: Json | null
          order_number?: string | null
          payment_method?: string | null
          shipping_address?: Json | null
          shopify_event_at?: string | null
          shopify_order_id?: string | null
          status?: string
          subtitle?: string | null
          timeline?: Json | null
          title?: string | null
          total: number
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          customer_name?: string
          delivery_region?: string | null
          email?: string | null
          id?: string
          logistics_milestone?: string | null
          metadata?: Json | null
          order_number?: string | null
          payment_method?: string | null
          shipping_address?: Json | null
          shopify_event_at?: string | null
          shopify_order_id?: string | null
          status?: string
          subtitle?: string | null
          timeline?: Json | null
          title?: string | null
          total?: number
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string
          expiry_month: string
          expiry_year: string
          id: string
          is_default: boolean | null
          last4: string
          provider_token: string
          user_id: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          expiry_month: string
          expiry_year: string
          id?: string
          is_default?: boolean | null
          last4: string
          provider_token: string
          user_id?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          expiry_month?: string
          expiry_year?: string
          id?: string
          is_default?: boolean | null
          last4?: string
          provider_token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          body_html: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          handle: string
          id: string
          image_url: string | null
          images: Json | null
          inventory_quantity: number | null
          metadata: Json | null
          options: Json | null
          price: number | null
          product_type: string | null
          sales_count: number
          shopify_id: string | null
          shopify_updated_at: string | null
          status: string | null
          tags: string | null
          title: string
          updated_at: string
          variants: Json | null
          vendor: string | null
        }
        Insert: {
          body_html?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          handle: string
          id: string
          image_url?: string | null
          images?: Json | null
          inventory_quantity?: number | null
          metadata?: Json | null
          options?: Json | null
          price?: number | null
          product_type?: string | null
          sales_count?: number
          shopify_id?: string | null
          shopify_updated_at?: string | null
          status?: string | null
          tags?: string | null
          title: string
          updated_at?: string
          variants?: Json | null
          vendor?: string | null
        }
        Update: {
          body_html?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          handle?: string
          id?: string
          image_url?: string | null
          images?: Json | null
          inventory_quantity?: number | null
          metadata?: Json | null
          options?: Json | null
          price?: number | null
          product_type?: string | null
          sales_count?: number
          shopify_id?: string | null
          shopify_updated_at?: string | null
          status?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
          variants?: Json | null
          vendor?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          expo_push_token: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          expo_push_token?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          order_id: string | null
          reason: string
          rma_number: string | null
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          reason: string
          rma_number?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          reason?: string
          rma_number?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_customers: {
        Row: {
          blacklist_reason: string | null
          blacklisted: boolean
          blacklisted_at: string | null
          city: string | null
          country: string | null
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          shopify_id: string
          updated_at: string
        }
        Insert: {
          blacklist_reason?: string | null
          blacklisted?: boolean
          blacklisted_at?: string | null
          city?: string | null
          country?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          shopify_id: string
          updated_at?: string
        }
        Update: {
          blacklist_reason?: string | null
          blacklisted?: boolean
          blacklisted_at?: string | null
          city?: string | null
          country?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          shopify_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_webhook_deliveries: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          event_id: string | null
          last_error: string | null
          shop_domain: string | null
          status: string
          topic: string
          updated_at: string
          webhook_id: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          last_error?: string | null
          shop_domain?: string | null
          status?: string
          topic: string
          updated_at?: string
          webhook_id: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          last_error?: string | null
          shop_domain?: string | null
          status?: string
          topic?: string
          updated_at?: string
          webhook_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          sender: string
          text: string
          thread_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          sender: string
          text: string
          thread_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          sender?: string
          text?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          has_unread: boolean | null
          id: string
          title: string
          topic: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          has_unread?: boolean | null
          id?: string
          title: string
          topic?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          has_unread?: boolean | null
          id?: string
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender: string
          sender_name: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender: string
          sender_name: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender?: string
          sender_name?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          agent_name: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          description: string
          id: string
          order_id: string | null
          priority: string
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          description: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          description?: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          customers_imported: number | null
          id: string
          orders_imported: number | null
          products_imported: number | null
          started_at: string
          status: string
          summary: string | null
        }
        Insert: {
          completed_at?: string | null
          customers_imported?: number | null
          id?: string
          orders_imported?: number | null
          products_imported?: number | null
          started_at?: string
          status?: string
          summary?: string | null
        }
        Update: {
          completed_at?: string | null
          customers_imported?: number | null
          id?: string
          orders_imported?: number | null
          products_imported?: number | null
          started_at?: string
          status?: string
          summary?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_shopify_sync_health: { Args: never; Returns: undefined }
      claim_shopify_webhook: {
        Args: {
          p_event_id: string
          p_shop_domain: string
          p_topic: string
          p_webhook_id: string
        }
        Returns: boolean
      }
      consume_edge_rate_limit: {
        Args: { p_key_hash: string; p_limit: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after_seconds: number
        }[]
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      record_integration_incident: {
        Args: {
          p_active: boolean
          p_incident_key: string
          p_integration: string
          p_message: string
          p_severity: string
          p_title: string
        }
        Returns: boolean
      }
      set_admin_access: {
        Args: { p_email: string; p_enabled: boolean }
        Returns: {
          email: string
          granted_at: string
          granted_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "admin_access_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
