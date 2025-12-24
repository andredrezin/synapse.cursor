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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_learned_content: {
        Row: {
          answer: string
          approved_at: string | null
          approved_by: string | null
          content_type: string
          context: string | null
          created_at: string
          effectiveness_score: number | null
          id: string
          is_approved: boolean | null
          keywords: string[] | null
          occurrence_count: number
          question: string | null
          seller_profile_id: string | null
          source_conversation_id: string | null
          source_message_id: string | null
          tags: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          answer: string
          approved_at?: string | null
          approved_by?: string | null
          content_type: string
          context?: string | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          is_approved?: boolean | null
          keywords?: string[] | null
          occurrence_count?: number
          question?: string | null
          seller_profile_id?: string | null
          source_conversation_id?: string | null
          source_message_id?: string | null
          tags?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          answer?: string
          approved_at?: string | null
          approved_by?: string | null
          content_type?: string
          context?: string | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          is_approved?: boolean | null
          keywords?: string[] | null
          occurrence_count?: number
          question?: string | null
          seller_profile_id?: string | null
          source_conversation_id?: string | null
          source_message_id?: string | null
          tags?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learned_content_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learned_content_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learned_content_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learned_content_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learned_content_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          active_hours_end: string | null
          active_hours_start: string | null
          ai_name: string | null
          ai_personality: string | null
          allowed_topics: string[] | null
          blocked_topics: string[] | null
          created_at: string
          greeting_message: string | null
          id: string
          is_enabled: boolean | null
          max_context_messages: number | null
          security_prompt: string | null
          system_prompt: string | null
          timezone: string | null
          transfer_after_messages: number | null
          transfer_keywords: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          allowed_topics?: string[] | null
          blocked_topics?: string[] | null
          created_at?: string
          greeting_message?: string | null
          id?: string
          is_enabled?: boolean | null
          max_context_messages?: number | null
          security_prompt?: string | null
          system_prompt?: string | null
          timezone?: string | null
          transfer_after_messages?: number | null
          transfer_keywords?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          allowed_topics?: string[] | null
          blocked_topics?: string[] | null
          created_at?: string
          greeting_message?: string | null
          id?: string
          is_enabled?: boolean | null
          max_context_messages?: number | null
          security_prompt?: string | null
          system_prompt?: string | null
          timezone?: string | null
          transfer_after_messages?: number | null
          transfer_keywords?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_status: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          company_info_extracted: number
          confidence_score: number | null
          created_at: string
          faqs_detected: number
          id: string
          linked_whatsapp_id: string | null
          messages_analyzed: number
          min_days_required: number
          min_messages_required: number
          objections_learned: number
          ready_at: string | null
          seller_patterns_learned: number
          started_at: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          company_info_extracted?: number
          confidence_score?: number | null
          created_at?: string
          faqs_detected?: number
          id?: string
          linked_whatsapp_id?: string | null
          messages_analyzed?: number
          min_days_required?: number
          min_messages_required?: number
          objections_learned?: number
          ready_at?: string | null
          seller_patterns_learned?: number
          started_at?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          company_info_extracted?: number
          confidence_score?: number | null
          created_at?: string
          faqs_detected?: number
          id?: string
          linked_whatsapp_id?: string | null
          messages_analyzed?: number
          min_days_required?: number
          min_messages_required?: number
          objections_learned?: number
          ready_at?: string | null
          seller_patterns_learned?: number
          started_at?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_status_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_status_linked_whatsapp_id_fkey"
            columns: ["linked_whatsapp_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_health_checks: {
        Row: {
          connection_id: string
          created_at: string
          error_message: string | null
          id: string
          last_check_at: string
          provider: string
          response_time_ms: number | null
          status: string
          workspace_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string
          provider: string
          response_time_ms?: number | null
          status?: string
          workspace_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string
          provider?: string
          response_time_ms?: number | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_health_checks_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_health_checks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_feedback: {
        Row: {
          accepted_offer: boolean | null
          additional_feedback: string | null
          created_at: string
          id: string
          plan: string | null
          reason: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          accepted_offer?: boolean | null
          additional_feedback?: string | null
          created_at?: string
          id?: string
          plan?: string | null
          reason: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          accepted_offer?: boolean | null
          additional_feedback?: string | null
          created_at?: string
          id?: string
          plan?: string | null
          reason?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          intent: string | null
          is_resolved: boolean | null
          key_points: Json | null
          lead_id: string
          mentioned_products: string[] | null
          mentioned_services: string[] | null
          resolution_notes: string | null
          sentiment: string | null
          summary: string | null
          topics: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          intent?: string | null
          is_resolved?: boolean | null
          key_points?: Json | null
          lead_id: string
          mentioned_products?: string[] | null
          mentioned_services?: string[] | null
          resolution_notes?: string | null
          sentiment?: string | null
          summary?: string | null
          topics?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          intent?: string | null
          is_resolved?: boolean | null
          key_points?: Json | null
          lead_id?: string
          mentioned_products?: string[] | null
          mentioned_services?: string[] | null
          resolution_notes?: string | null
          sentiment?: string | null
          summary?: string | null
          topics?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_context_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_context_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_context_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          created_at: string
          ended_at: string | null
          id: string
          lead_id: string
          messages_count: number | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          started_at: string
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id: string
          messages_count?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          started_at?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id?: string
          messages_count?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          started_at?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          is_ai_accessible: boolean
          is_public: boolean
          keywords: string[] | null
          last_used_at: string | null
          sensitivity_level: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          usage_count: number | null
          version: number | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          is_ai_accessible?: boolean
          is_public?: boolean
          keywords?: string[] | null
          last_used_at?: string | null
          sensitivity_level?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          version?: number | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          is_ai_accessible?: boolean
          is_public?: boolean
          keywords?: string[] | null
          last_used_at?: string | null
          sensitivity_level?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          version?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distribution_settings: {
        Row: {
          auto_assign_new_leads: boolean
          created_at: string
          distribution_mode: string
          id: string
          round_robin_index: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_assign_new_leads?: boolean
          created_at?: string
          distribution_mode?: string
          id?: string
          round_robin_index?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_assign_new_leads?: boolean
          created_at?: string
          distribution_mode?: string
          id?: string
          round_robin_index?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_distribution_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_knowledge_profile: {
        Row: {
          avg_response_time: number | null
          best_contact_time: string | null
          communication_style: string | null
          created_at: string
          id: string
          interests: string[] | null
          lead_id: string
          preferred_channel: string | null
          preferred_products: string[] | null
          preferred_services: string[] | null
          total_conversations: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avg_response_time?: number | null
          best_contact_time?: string | null
          communication_style?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          lead_id: string
          preferred_channel?: string | null
          preferred_products?: string[] | null
          preferred_services?: string[] | null
          total_conversations?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avg_response_time?: number | null
          best_contact_time?: string | null
          communication_style?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          lead_id?: string
          preferred_channel?: string | null
          preferred_products?: string[] | null
          preferred_services?: string[] | null
          total_conversations?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_knowledge_profile_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_knowledge_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          messages_count: number | null
          name: string
          objections: string[] | null
          phone: string
          response_time_avg: number | null
          score: number
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          messages_count?: number | null
          name: string
          objections?: string[] | null
          phone: string
          response_time_avg?: number | null
          score?: number
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          messages_count?: number | null
          name?: string
          objections?: string[] | null
          phone?: string
          response_time_avg?: number | null
          score?: number
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string | null
          sender_type: string
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          whatsapp_connection_id: string | null
          whatsapp_message_id: string | null
          workspace_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          sender_type: string
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          whatsapp_connection_id?: string | null
          whatsapp_message_id?: string | null
          workspace_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          sender_type?: string
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          whatsapp_connection_id?: string | null
          whatsapp_message_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_read: boolean | null
          lead_id: string | null
          priority: string | null
          title: string
          type: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          priority?: string | null
          title: string
          type: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          priority?: string | null
          title?: string
          type?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          lead_id: string | null
          metadata: Json | null
          page_url: string | null
          pixel_id: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          pixel_id: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          pixel_id?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixel_events_pixel_id_fkey"
            columns: ["pixel_id"]
            isOneToOne: false
            referencedRelation: "tracking_pixels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixel_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          current_workspace_id: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          current_workspace_id?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          current_workspace_id?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_workspace_id_fkey"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_whatsapp_assignments: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          profile_id: string
          whatsapp_connection_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          profile_id: string
          whatsapp_connection_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          profile_id?: string
          whatsapp_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_whatsapp_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_whatsapp_assignments_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          has_advanced_reports: boolean
          has_ai_features: boolean
          has_api_access: boolean
          id: string
          max_conversations_per_month: number
          max_leads: number
          max_team_members: number
          max_whatsapp_connections: number
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_advanced_reports?: boolean
          has_ai_features?: boolean
          has_api_access?: boolean
          id?: string
          max_conversations_per_month?: number
          max_leads?: number
          max_team_members?: number
          max_whatsapp_connections?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_advanced_reports?: boolean
          has_ai_features?: boolean
          has_api_access?: boolean
          id?: string
          max_conversations_per_month?: number
          max_leads?: number
          max_team_members?: number
          max_whatsapp_connections?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: Database["public"]["Enums"]["invite_status"]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          status?: Database["public"]["Enums"]["invite_status"]
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: Database["public"]["Enums"]["invite_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_pixels: {
        Row: {
          created_at: string
          domain: string | null
          events_count: number | null
          id: string
          is_active: boolean | null
          last_event_at: string | null
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          events_count?: number | null
          id?: string
          is_active?: boolean | null
          last_event_at?: string | null
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          events_count?: number | null
          id?: string
          is_active?: boolean | null
          last_event_at?: string | null
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_pixels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_connection_logs: {
        Row: {
          connection_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connection_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          api_key: string | null
          api_url: string | null
          created_at: string
          id: string
          instance_name: string | null
          last_sync_at: string | null
          name: string
          phone_number: string | null
          provider: Database["public"]["Enums"]["whatsapp_provider"]
          qr_code: string | null
          status: Database["public"]["Enums"]["whatsapp_status"]
          updated_at: string
          webhook_secret: string | null
          workspace_id: string
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          instance_name?: string | null
          last_sync_at?: string | null
          name: string
          phone_number?: string | null
          provider?: Database["public"]["Enums"]["whatsapp_provider"]
          qr_code?: string | null
          status?: Database["public"]["Enums"]["whatsapp_status"]
          updated_at?: string
          webhook_secret?: string | null
          workspace_id: string
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          instance_name?: string | null
          last_sync_at?: string | null
          name?: string
          phone_number?: string | null
          provider?: Database["public"]["Enums"]["whatsapp_provider"]
          qr_code?: string | null
          status?: Database["public"]["Enums"]["whatsapp_status"]
          updated_at?: string
          webhook_secret?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_text: string
          buttons: Json | null
          category: string
          connection_id: string | null
          created_at: string
          footer_text: string | null
          header_content: string | null
          header_type: string | null
          id: string
          language: string
          meta_template_id: string | null
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body_text: string
          buttons?: Json | null
          category?: string
          connection_id?: string | null
          created_at?: string
          footer_text?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body_text?: string
          buttons?: Json | null
          category?: string
          connection_id?: string | null
          created_at?: string
          footer_text?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          daily_report: boolean | null
          email_alerts: boolean | null
          id: string
          push_notifications: boolean | null
          updated_at: string
          weekly_report: boolean | null
          whatsapp_connected: boolean | null
          whatsapp_phone: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          daily_report?: boolean | null
          email_alerts?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string
          weekly_report?: boolean | null
          whatsapp_connected?: boolean | null
          whatsapp_phone?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          daily_report?: boolean | null
          email_alerts?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string
          weekly_report?: boolean | null
          whatsapp_connected?: boolean | null
          whatsapp_phone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_usage: {
        Row: {
          ai_requests_count: number
          conversations_count: number
          created_at: string
          id: string
          leads_count: number
          messages_count: number
          month_year: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_requests_count?: number
          conversations_count?: number
          created_at?: string
          id?: string
          leads_count?: number
          messages_count?: number
          month_year: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_requests_count?: number
          conversations_count?: number
          created_at?: string
          id?: string
          leads_count?: number
          messages_count?: number
          month_year?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_training_progress: {
        Args: { ws_id: string }
        Returns: {
          days_elapsed: number
          is_ready: boolean
          messages_progress: number
          total_progress: number
        }[]
      }
      can_access_data: {
        Args: { assigned_profile_id: string; ws_id: string }
        Returns: boolean
      }
      check_workspace_limit: {
        Args: { limit_type: string; ws_id: string }
        Returns: boolean
      }
      check_workspace_membership: {
        Args: { uid: string; ws_id: string }
        Returns: boolean
      }
      get_next_seller_round_robin: { Args: { ws_id: string }; Returns: string }
      get_user_workspace_role: {
        Args: { uid: string; ws_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { uid: string; ws_id: string }
        Returns: boolean
      }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      search_knowledge: {
        Args: { p_limit?: number; p_query: string; p_workspace_id: string }
        Returns: {
          category_name: string
          content: string
          entry_type: string
          id: string
          relevance: number
          summary: string
          title: string
        }[]
      }
      user_is_workspace_admin: { Args: { ws_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      conversation_status: "open" | "closed" | "pending"
      invite_status: "pending" | "accepted" | "rejected" | "expired"
      lead_source:
        | "ads"
        | "organic"
        | "referral"
        | "landing"
        | "direct"
        | "pixel"
      lead_status: "new" | "in_progress" | "converted" | "lost"
      lead_temperature: "cold" | "warm" | "hot"
      sentiment_type: "positive" | "neutral" | "negative"
      whatsapp_provider: "evolution" | "official"
      whatsapp_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "qr_pending"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
      conversation_status: ["open", "closed", "pending"],
      invite_status: ["pending", "accepted", "rejected", "expired"],
      lead_source: ["ads", "organic", "referral", "landing", "direct", "pixel"],
      lead_status: ["new", "in_progress", "converted", "lost"],
      lead_temperature: ["cold", "warm", "hot"],
      sentiment_type: ["positive", "neutral", "negative"],
      whatsapp_provider: ["evolution", "official"],
      whatsapp_status: [
        "disconnected",
        "connecting",
        "connected",
        "qr_pending",
      ],
    },
  },
} as const
