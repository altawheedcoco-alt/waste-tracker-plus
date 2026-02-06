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
      account_periods: {
        Row: {
          carry_over_balance: boolean | null
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          created_at: string
          end_date: string
          external_partner_id: string | null
          id: string
          notes: string | null
          opening_balance: number
          organization_id: string
          partner_organization_id: string | null
          period_name: string
          start_date: string
          status: string
          total_deposits: number | null
          total_deposits_count: number | null
          total_shipments_count: number | null
          total_shipments_value: number | null
          updated_at: string
        }
        Insert: {
          carry_over_balance?: boolean | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          end_date: string
          external_partner_id?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          organization_id: string
          partner_organization_id?: string | null
          period_name: string
          start_date: string
          status?: string
          total_deposits?: number | null
          total_deposits_count?: number | null
          total_shipments_count?: number | null
          total_shipments_value?: number | null
          updated_at?: string
        }
        Update: {
          carry_over_balance?: boolean | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          end_date?: string
          external_partner_id?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          organization_id?: string
          partner_organization_id?: string | null
          period_name?: string
          start_date?: string
          status?: string
          total_deposits?: number | null
          total_deposits_count?: number | null
          total_shipments_count?: number | null
          total_shipments_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_periods_external_partner_id_fkey"
            columns: ["external_partner_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "account_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_periods_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "account_periods_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance: {
        Row: {
          agent_id: string
          answered_calls: number | null
          avg_duration_seconds: number | null
          avg_kpi_score: number | null
          avg_sentiment_score: number | null
          avg_wait_time_seconds: number | null
          created_at: string
          customer_satisfaction: number | null
          id: string
          inbound_calls: number | null
          kpi_breakdown: Json | null
          missed_calls: number | null
          organization_id: string
          outbound_calls: number | null
          period_date: string
          period_type: string | null
          rank_in_team: number | null
          total_calls: number | null
          total_duration_seconds: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          answered_calls?: number | null
          avg_duration_seconds?: number | null
          avg_kpi_score?: number | null
          avg_sentiment_score?: number | null
          avg_wait_time_seconds?: number | null
          created_at?: string
          customer_satisfaction?: number | null
          id?: string
          inbound_calls?: number | null
          kpi_breakdown?: Json | null
          missed_calls?: number | null
          organization_id: string
          outbound_calls?: number | null
          period_date: string
          period_type?: string | null
          rank_in_team?: number | null
          total_calls?: number | null
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          answered_calls?: number | null
          avg_duration_seconds?: number | null
          avg_kpi_score?: number | null
          avg_sentiment_score?: number | null
          avg_wait_time_seconds?: number | null
          created_at?: string
          customer_satisfaction?: number | null
          id?: string
          inbound_calls?: number | null
          kpi_breakdown?: Json | null
          missed_calls?: number | null
          organization_id?: string
          outbound_calls?: number | null
          period_date?: string
          period_type?: string | null
          rank_in_team?: number | null
          total_calls?: number | null
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "agent_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      aggregate_invoices: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          shipment_amount: number
          shipment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          shipment_amount?: number
          shipment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          shipment_amount?: number
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregate_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aggregate_invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          rate_limit_per_minute: number
          scopes: Database["public"]["Enums"]["api_scope"][]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          rate_limit_per_minute?: number
          scopes?: Database["public"]["Enums"]["api_scope"][]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rate_limit_per_minute?: number
          scopes?: Database["public"]["Enums"]["api_scope"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          priority: string | null
          request_data: Json | null
          request_description: string | null
          request_title: string
          request_type: string
          requester_organization_id: string | null
          requester_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_resource_id: string | null
          target_resource_type: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          request_data?: Json | null
          request_description?: string | null
          request_title: string
          request_type: string
          requester_organization_id?: string | null
          requester_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_resource_id?: string | null
          target_resource_type?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          request_data?: Json | null
          request_description?: string | null
          request_title?: string
          request_type?: string
          requester_organization_id?: string | null
          requester_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_resource_id?: string | null
          target_resource_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_requester_organization_id_fkey"
            columns: ["requester_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "approval_requests_requester_organization_id_fkey"
            columns: ["requester_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_run_log: {
        Row: {
          errors: Json | null
          id: string
          run_completed_at: string | null
          run_started_at: string
          status: string | null
          tables_processed: string[] | null
          total_records_archived: number | null
        }
        Insert: {
          errors?: Json | null
          id?: string
          run_completed_at?: string | null
          run_started_at?: string
          status?: string | null
          tables_processed?: string[] | null
          total_records_archived?: number | null
        }
        Update: {
          errors?: Json | null
          id?: string
          run_completed_at?: string | null
          run_started_at?: string
          status?: string | null
          tables_processed?: string[] | null
          total_records_archived?: number | null
        }
        Relationships: []
      }
      archive_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          records_archived: number | null
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          records_archived?: number | null
          retention_days?: number
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          records_archived?: number | null
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      archived_activity_logs: {
        Row: {
          archived_at: string
          id: string
          original_data: Json
        }
        Insert: {
          archived_at?: string
          id: string
          original_data: Json
        }
        Update: {
          archived_at?: string
          id?: string
          original_data?: Json
        }
        Relationships: []
      }
      archived_chat_messages: {
        Row: {
          archived_at: string
          id: string
          original_data: Json
        }
        Insert: {
          archived_at?: string
          id: string
          original_data: Json
        }
        Update: {
          archived_at?: string
          id?: string
          original_data?: Json
        }
        Relationships: []
      }
      archived_driver_locations: {
        Row: {
          archived_at: string
          id: string
          original_data: Json
        }
        Insert: {
          archived_at?: string
          id: string
          original_data: Json
        }
        Update: {
          archived_at?: string
          id?: string
          original_data?: Json
        }
        Relationships: []
      }
      archived_notifications: {
        Row: {
          archived_at: string
          archived_by: string | null
          id: string
          original_data: Json
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          id: string
          original_data: Json
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          id?: string
          original_data?: Json
        }
        Relationships: []
      }
      archived_shipments: {
        Row: {
          archive_reason: string | null
          archived_at: string
          archived_by: string | null
          id: string
          original_data: Json
          retention_until: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string
          archived_by?: string | null
          id: string
          original_data: Json
          retention_until?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string
          archived_by?: string | null
          id?: string
          original_data?: Json
          retention_until?: string | null
        }
        Relationships: []
      }
      call_analysis: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          call_log_id: string
          created_at: string
          detected_issues: Json | null
          escalation_required: boolean | null
          id: string
          keywords: Json | null
          kpi_scores: Json | null
          overall_score: number | null
          predicted_satisfaction: number | null
          sentiment: Database["public"]["Enums"]["call_sentiment"] | null
          sentiment_breakdown: Json | null
          sentiment_score: number | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          call_log_id: string
          created_at?: string
          detected_issues?: Json | null
          escalation_required?: boolean | null
          id?: string
          keywords?: Json | null
          kpi_scores?: Json | null
          overall_score?: number | null
          predicted_satisfaction?: number | null
          sentiment?: Database["public"]["Enums"]["call_sentiment"] | null
          sentiment_breakdown?: Json | null
          sentiment_score?: number | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          call_log_id?: string
          created_at?: string
          detected_issues?: Json | null
          escalation_required?: boolean | null
          id?: string
          keywords?: Json | null
          kpi_scores?: Json | null
          overall_score?: number | null
          predicted_satisfaction?: number | null
          sentiment?: Database["public"]["Enums"]["call_sentiment"] | null
          sentiment_breakdown?: Json | null
          sentiment_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_analysis_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_center_settings: {
        Row: {
          analyze_all_calls: boolean | null
          auto_link_by_active_shipment: boolean | null
          auto_link_by_phone: boolean | null
          created_at: string
          id: string
          kpi_thresholds: Json | null
          organization_id: string
          record_all_calls: boolean | null
          tracked_keywords: string[] | null
          transcribe_all_calls: boolean | null
          twilio_configured: boolean | null
          twilio_phone_number: string | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          analyze_all_calls?: boolean | null
          auto_link_by_active_shipment?: boolean | null
          auto_link_by_phone?: boolean | null
          created_at?: string
          id?: string
          kpi_thresholds?: Json | null
          organization_id: string
          record_all_calls?: boolean | null
          tracked_keywords?: string[] | null
          transcribe_all_calls?: boolean | null
          twilio_configured?: boolean | null
          twilio_phone_number?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          analyze_all_calls?: boolean | null
          auto_link_by_active_shipment?: boolean | null
          auto_link_by_phone?: boolean | null
          created_at?: string
          id?: string
          kpi_thresholds?: Json | null
          organization_id?: string
          record_all_calls?: boolean | null
          tracked_keywords?: string[] | null
          transcribe_all_calls?: boolean | null
          twilio_configured?: boolean | null
          twilio_phone_number?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "call_center_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "call_center_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          account_sid: string | null
          agent_id: string | null
          answered_at: string | null
          auto_linked: boolean | null
          call_sid: string | null
          created_at: string
          customer_id: string | null
          direction: Database["public"]["Enums"]["call_direction"]
          driver_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          external_weight_record_id: string | null
          from_number: string
          gps_snapshot: Json | null
          id: string
          link_confidence: number | null
          notes: string | null
          organization_id: string
          parent_call_sid: string | null
          recording_duration: number | null
          recording_sid: string | null
          recording_url: string | null
          shipment_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          tags: string[] | null
          to_number: string
          updated_at: string
        }
        Insert: {
          account_sid?: string | null
          agent_id?: string | null
          answered_at?: string | null
          auto_linked?: boolean | null
          call_sid?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: Database["public"]["Enums"]["call_direction"]
          driver_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          external_weight_record_id?: string | null
          from_number: string
          gps_snapshot?: Json | null
          id?: string
          link_confidence?: number | null
          notes?: string | null
          organization_id: string
          parent_call_sid?: string | null
          recording_duration?: number | null
          recording_sid?: string | null
          recording_url?: string | null
          shipment_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          tags?: string[] | null
          to_number: string
          updated_at?: string
        }
        Update: {
          account_sid?: string | null
          agent_id?: string | null
          answered_at?: string | null
          auto_linked?: boolean | null
          call_sid?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: Database["public"]["Enums"]["call_direction"]
          driver_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          external_weight_record_id?: string | null
          from_number?: string
          gps_snapshot?: Json | null
          id?: string
          link_confidence?: number | null
          notes?: string | null
          organization_id?: string
          parent_call_sid?: string | null
          recording_duration?: number | null
          recording_sid?: string | null
          recording_url?: string | null
          shipment_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          tags?: string[] | null
          to_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_external_weight_record_id_fkey"
            columns: ["external_weight_record_id"]
            isOneToOne: false
            referencedRelation: "external_weight_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcriptions: {
        Row: {
          call_log_id: string
          confidence_score: number | null
          created_at: string
          error_message: string | null
          full_text: string | null
          id: string
          language: string | null
          processing_status: string | null
          updated_at: string
          words_with_timestamps: Json | null
        }
        Insert: {
          call_log_id: string
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          processing_status?: string | null
          updated_at?: string
          words_with_timestamps?: Json | null
        }
        Update: {
          call_log_id?: string
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          processing_status?: string | null
          updated_at?: string
          words_with_timestamps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "call_transcriptions_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          room_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          room_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          room_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string | null
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          shipment_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          shipment_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          shipment_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_custom_versions: {
        Row: {
          created_at: string
          created_by: string | null
          custom_closing_text: string | null
          custom_dispute_resolution: string | null
          custom_duration_clause: string | null
          custom_header_text: string | null
          custom_introduction_text: string | null
          custom_notes: string | null
          custom_obligations_party_one: string | null
          custom_obligations_party_two: string | null
          custom_payment_terms: string | null
          custom_termination_clause: string | null
          custom_terms_template: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          original_contract_id: string | null
          template_id: string | null
          updated_at: string
          version_name: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_closing_text?: string | null
          custom_dispute_resolution?: string | null
          custom_duration_clause?: string | null
          custom_header_text?: string | null
          custom_introduction_text?: string | null
          custom_notes?: string | null
          custom_obligations_party_one?: string | null
          custom_obligations_party_two?: string | null
          custom_payment_terms?: string | null
          custom_termination_clause?: string | null
          custom_terms_template?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          original_contract_id?: string | null
          template_id?: string | null
          updated_at?: string
          version_name: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_closing_text?: string | null
          custom_dispute_resolution?: string | null
          custom_duration_clause?: string | null
          custom_header_text?: string | null
          custom_introduction_text?: string | null
          custom_notes?: string | null
          custom_obligations_party_one?: string | null
          custom_obligations_party_two?: string | null
          custom_payment_terms?: string | null
          custom_termination_clause?: string | null
          custom_terms_template?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          original_contract_id?: string | null
          template_id?: string | null
          updated_at?: string
          version_name?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_custom_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_custom_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contract_custom_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_custom_versions_original_contract_id_fkey"
            columns: ["original_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_custom_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          closing_text: string | null
          contract_category: string
          created_at: string
          created_by: string | null
          description: string | null
          dispute_resolution: string | null
          duration_clause: string | null
          header_text: string | null
          id: string
          include_header_logo: boolean | null
          include_signature: boolean | null
          include_stamp: boolean | null
          introduction_text: string | null
          is_active: boolean | null
          name: string
          obligations_party_one: string | null
          obligations_party_two: string | null
          organization_id: string
          partner_type: string
          payment_terms_template: string | null
          template_type: string
          termination_clause: string | null
          terms_template: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          closing_text?: string | null
          contract_category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispute_resolution?: string | null
          duration_clause?: string | null
          header_text?: string | null
          id?: string
          include_header_logo?: boolean | null
          include_signature?: boolean | null
          include_stamp?: boolean | null
          introduction_text?: string | null
          is_active?: boolean | null
          name: string
          obligations_party_one?: string | null
          obligations_party_two?: string | null
          organization_id: string
          partner_type?: string
          payment_terms_template?: string | null
          template_type?: string
          termination_clause?: string | null
          terms_template?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          closing_text?: string | null
          contract_category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispute_resolution?: string | null
          duration_clause?: string | null
          header_text?: string | null
          id?: string
          include_header_logo?: boolean | null
          include_signature?: boolean | null
          include_stamp?: boolean | null
          introduction_text?: string | null
          is_active?: boolean | null
          name?: string
          obligations_party_one?: string | null
          obligations_party_two?: string | null
          organization_id?: string
          partner_type?: string
          payment_terms_template?: string | null
          template_type?: string
          termination_clause?: string | null
          terms_template?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_verifications: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          user_agent: string | null
          verification_code: string
          verification_result: boolean
          verified_at: string
          verified_by_ip: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          user_agent?: string | null
          verification_code: string
          verification_result?: boolean
          verified_at?: string
          verified_by_ip?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          user_agent?: string | null
          verification_code?: string
          verification_result?: boolean
          verified_at?: string
          verified_by_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_verifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          attachment_url: string | null
          clause_count: number | null
          contract_number: string
          contract_type: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          is_verified: boolean | null
          legal_references: Json | null
          notes: string | null
          organization_id: string | null
          partner_name: string | null
          partner_organization_id: string | null
          start_date: string | null
          status: string
          terms: string | null
          title: string
          updated_at: string
          value: number | null
          verification_code: string | null
          verification_qr_url: string | null
          verified_at: string | null
          verified_by: string | null
          waste_category: string | null
          waste_type: string | null
        }
        Insert: {
          attachment_url?: string | null
          clause_count?: number | null
          contract_number: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_verified?: boolean | null
          legal_references?: Json | null
          notes?: string | null
          organization_id?: string | null
          partner_name?: string | null
          partner_organization_id?: string | null
          start_date?: string | null
          status?: string
          terms?: string | null
          title: string
          updated_at?: string
          value?: number | null
          verification_code?: string | null
          verification_qr_url?: string | null
          verified_at?: string | null
          verified_by?: string | null
          waste_category?: string | null
          waste_type?: string | null
        }
        Update: {
          attachment_url?: string | null
          clause_count?: number | null
          contract_number?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_verified?: boolean | null
          legal_references?: Json | null
          notes?: string | null
          organization_id?: string | null
          partner_name?: string | null
          partner_organization_id?: string | null
          start_date?: string | null
          status?: string
          terms?: string | null
          title?: string
          updated_at?: string
          value?: number | null
          verification_code?: string | null
          verification_qr_url?: string | null
          verified_at?: string | null
          verified_by?: string | null
          waste_category?: string | null
          waste_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contracts_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_contact_date: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          source: string | null
          status: string
          total_purchases: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          source?: string | null
          status?: string
          total_purchases?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          total_purchases?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          account_number: string | null
          ai_confidence_score: number | null
          ai_extracted: boolean | null
          ai_extracted_data: Json | null
          amount: number
          bank_branch: string | null
          bank_name: string | null
          branch_name: string | null
          category: string | null
          check_number: string | null
          created_at: string
          created_by: string | null
          currency: string
          deposit_date: string
          deposit_link_id: string | null
          depositor_name: string
          depositor_phone: string | null
          depositor_position: string | null
          depositor_title: string | null
          external_partner_id: string | null
          id: string
          is_public_submission: boolean | null
          notes: string | null
          organization_id: string
          partner_external_id: string | null
          partner_organization_id: string | null
          receipt_url: string | null
          reference_number: string | null
          submitter_email: string | null
          submitter_name: string | null
          submitter_phone: string | null
          transfer_method: string
          updated_at: string
          waste_type: string | null
        }
        Insert: {
          account_number?: string | null
          ai_confidence_score?: number | null
          ai_extracted?: boolean | null
          ai_extracted_data?: Json | null
          amount: number
          bank_branch?: string | null
          bank_name?: string | null
          branch_name?: string | null
          category?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_date?: string
          deposit_link_id?: string | null
          depositor_name: string
          depositor_phone?: string | null
          depositor_position?: string | null
          depositor_title?: string | null
          external_partner_id?: string | null
          id?: string
          is_public_submission?: boolean | null
          notes?: string | null
          organization_id: string
          partner_external_id?: string | null
          partner_organization_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          transfer_method?: string
          updated_at?: string
          waste_type?: string | null
        }
        Update: {
          account_number?: string | null
          ai_confidence_score?: number | null
          ai_extracted?: boolean | null
          ai_extracted_data?: Json | null
          amount?: number
          bank_branch?: string | null
          bank_name?: string | null
          branch_name?: string | null
          category?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_date?: string
          deposit_link_id?: string | null
          depositor_name?: string
          depositor_phone?: string | null
          depositor_position?: string | null
          depositor_title?: string | null
          external_partner_id?: string | null
          id?: string
          is_public_submission?: boolean | null
          notes?: string | null
          organization_id?: string
          partner_external_id?: string | null
          partner_organization_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          transfer_method?: string
          updated_at?: string
          waste_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_deposit_link_id_fkey"
            columns: ["deposit_link_id"]
            isOneToOne: false
            referencedRelation: "organization_deposit_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_external_partner_id_fkey"
            columns: ["external_partner_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "deposits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_partner_external_id_fkey"
            columns: ["partner_external_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "deposits_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          receiver_organization_id: string
          sender_id: string
          sender_organization_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          receiver_organization_id: string
          sender_id: string
          sender_organization_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          receiver_organization_id?: string
          sender_id?: string
          sender_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_organization_id_fkey"
            columns: ["receiver_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_organization_id_fkey"
            columns: ["receiver_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "direct_messages_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_verifications: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          document_id: string | null
          id: string
          new_status: string
          notes: string | null
          organization_id: string | null
          previous_status: string | null
          verification_action: string
          verification_type: string
          verified_by: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          new_status: string
          notes?: string | null
          organization_id?: string | null
          previous_status?: string | null
          verification_action: string
          verification_type: string
          verified_by?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          organization_id?: string | null
          previous_status?: string | null
          verification_action?: string
          verification_type?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_verifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "document_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_location_logs: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_location_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          license_expiry: string | null
          license_number: string
          organization_id: string | null
          profile_id: string
          updated_at: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          license_expiry?: string | null
          license_number: string
          organization_id?: string | null
          profile_id: string
          updated_at?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          license_expiry?: string | null
          license_number?: string
          organization_id?: string | null
          profile_id?: string
          updated_at?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          access_all_partners: boolean | null
          access_all_waste_types: boolean | null
          created_at: string
          email: string
          employee_type: string
          expires_at: string
          external_partner_ids: string[] | null
          id: string
          invited_by: string
          organization_id: string
          partner_ids: string[] | null
          permissions: string[] | null
          status: string
          token: string
          updated_at: string
          waste_types: string[] | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_all_partners?: boolean | null
          access_all_waste_types?: boolean | null
          created_at?: string
          email: string
          employee_type?: string
          expires_at: string
          external_partner_ids?: string[] | null
          id?: string
          invited_by: string
          organization_id: string
          partner_ids?: string[] | null
          permissions?: string[] | null
          status?: string
          token: string
          updated_at?: string
          waste_types?: string[] | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_all_partners?: boolean | null
          access_all_waste_types?: boolean | null
          created_at?: string
          email?: string
          employee_type?: string
          expires_at?: string
          external_partner_ids?: string[] | null
          id?: string
          invited_by?: string
          organization_id?: string
          partner_ids?: string[] | null
          permissions?: string[] | null
          status?: string
          token?: string
          updated_at?: string
          waste_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "employee_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_partner_access: {
        Row: {
          created_at: string
          created_by: string | null
          external_partner_id: string | null
          id: string
          organization_id: string
          partner_organization_id: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          external_partner_id?: string | null
          id?: string
          organization_id: string
          partner_organization_id?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          external_partner_id?: string | null
          id?: string
          organization_id?: string
          partner_organization_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_partner_access_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_partner_access_external_partner_id_fkey"
            columns: ["external_partner_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_partner_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "employee_partner_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_partner_access_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "employee_partner_access_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_partner_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_type: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_type: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_type?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_waste_access: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          profile_id: string
          waste_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          profile_id: string
          waste_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          profile_id?: string
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_waste_access_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_waste_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "employee_waste_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_waste_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          driver_id: string | null
          expense_date: string
          expense_number: string
          id: string
          is_recurring: boolean | null
          organization_id: string
          payment_method: string | null
          receipt_url: string | null
          recurring_frequency: string | null
          shipment_id: string | null
          status: string
          subcategory: string | null
          updated_at: string
          vehicle_plate: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          driver_id?: string | null
          expense_date?: string
          expense_number: string
          id?: string
          is_recurring?: boolean | null
          organization_id: string
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          shipment_id?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          vehicle_plate?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          driver_id?: string | null
          expense_date?: string
          expense_number?: string
          id?: string
          is_recurring?: boolean | null
          organization_id?: string
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          shipment_id?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      external_partners: {
        Row: {
          address: string | null
          city: string | null
          commercial_register: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          partner_type: string
          phone: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          commercial_register?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          partner_type: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          commercial_register?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          partner_type?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_partners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "external_partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_weight_records: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          created_by: string | null
          generator_company_id: string | null
          generator_company_name: string | null
          id: string
          is_linked_to_system: boolean
          linked_at: string | null
          linked_by: string | null
          notes: string | null
          organization_id: string
          partner_company_id: string | null
          partner_company_name: string | null
          partner_type: string | null
          quantity: number
          record_date: string
          unit: string
          updated_at: string
          waste_description: string | null
          waste_type: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          generator_company_id?: string | null
          generator_company_name?: string | null
          id?: string
          is_linked_to_system?: boolean
          linked_at?: string | null
          linked_by?: string | null
          notes?: string | null
          organization_id: string
          partner_company_id?: string | null
          partner_company_name?: string | null
          partner_type?: string | null
          quantity: number
          record_date: string
          unit?: string
          updated_at?: string
          waste_description?: string | null
          waste_type: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          generator_company_id?: string | null
          generator_company_name?: string | null
          id?: string
          is_linked_to_system?: boolean
          linked_at?: string | null
          linked_by?: string | null
          notes?: string | null
          organization_id?: string
          partner_company_id?: string | null
          partner_company_name?: string | null
          partner_type?: string | null
          quantity?: number
          record_date?: string
          unit?: string
          updated_at?: string
          waste_description?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_weight_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "external_weight_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_weight_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_weight_records_generator_company_id_fkey"
            columns: ["generator_company_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "external_weight_records_generator_company_id_fkey"
            columns: ["generator_company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_weight_records_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_weight_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "external_weight_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_weight_records_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "external_weight_records_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: string
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type?: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "financial_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          balance_after: number | null
          created_at: string
          created_by: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string
          id: string
          organization_id: string
          partner_organization_id: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_category: string | null
          transaction_date: string
          transaction_number: string
          transaction_type: string
        }
        Insert: {
          account_id?: string | null
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          id?: string
          organization_id: string
          partner_organization_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_category?: string | null
          transaction_date?: string
          transaction_number: string
          transaction_type: string
        }
        Update: {
          account_id?: string | null
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          id?: string
          organization_id?: string
          partner_organization_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_category?: string | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "financial_transactions_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      industrial_facilities: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          facility_type: string
          governorate: string | null
          id: string
          is_verified: boolean | null
          latitude: number
          longitude: number
          name: string
          name_ar: string | null
          source_id: string | null
          tags: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          facility_type?: string
          governorate?: string | null
          id?: string
          is_verified?: boolean | null
          latitude: number
          longitude: number
          name: string
          name_ar?: string | null
          source_id?: string | null
          tags?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          facility_type?: string
          governorate?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          name_ar?: string | null
          source_id?: string | null
          tags?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          shipment_id: string | null
          total_price: number
          unit: string | null
          unit_price: number
          waste_quantity: number | null
          waste_type: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          shipment_id?: string | null
          total_price?: number
          unit?: string | null
          unit_price?: number
          waste_quantity?: number | null
          waste_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          shipment_id?: string | null
          total_price?: number
          unit?: string | null
          unit_price?: number
          waste_quantity?: number | null
          waste_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_category: string
          invoice_number: string
          invoice_type: string
          issue_date: string
          notes: string | null
          organization_id: string | null
          paid_amount: number | null
          partner_name: string | null
          partner_organization_id: string | null
          remaining_amount: number | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_category?: string
          invoice_number: string
          invoice_type?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number | null
          partner_name?: string | null
          partner_organization_id?: string | null
          remaining_amount?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_category?: string
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number | null
          partner_name?: string | null
          partner_organization_id?: string | null
          remaining_amount?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      materialized_view_refresh_log: {
        Row: {
          duration_ms: number | null
          id: string
          refreshed_at: string
          triggered_by: string | null
          view_name: string
        }
        Insert: {
          duration_ms?: number | null
          id?: string
          refreshed_at?: string
          triggered_by?: string | null
          view_name: string
        }
        Update: {
          duration_ms?: number | null
          id?: string
          refreshed_at?: string
          triggered_by?: string | null
          view_name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          pdf_url: string | null
          request_id: string | null
          shipment_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          pdf_url?: string | null
          request_id?: string | null
          shipment_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          pdf_url?: string | null
          request_id?: string | null
          shipment_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_plans: {
        Row: {
          admin_notes: string | null
          created_at: string
          created_by: string | null
          frequency_details: string | null
          id: string
          organization_id: string
          priority: string | null
          quantity_estimates: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          schedule_details: Json | null
          service_description: string
          service_frequency: string
          service_scope: string
          status: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          waste_types: Json
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          created_by?: string | null
          frequency_details?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          quantity_estimates?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schedule_details?: Json | null
          service_description: string
          service_frequency: string
          service_scope: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          waste_types?: Json
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          created_by?: string | null
          frequency_details?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          quantity_estimates?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          schedule_details?: Json | null
          service_description?: string
          service_frequency?: string
          service_scope?: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          waste_types?: Json
        }
        Relationships: [
          {
            foreignKeyName: "operational_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "operational_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_plans_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_approval_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          organization_id: string
          performed_by: string
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          organization_id: string
          performed_by: string
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          organization_id?: string
          performed_by?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_approval_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_approval_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_deposit_links: {
        Row: {
          allow_amount_edit: boolean | null
          allow_date_edit: boolean | null
          allow_partner_edit: boolean | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_pinned: boolean | null
          last_used_at: string | null
          notes: string | null
          organization_id: string
          preset_account_number: string | null
          preset_amount: number | null
          preset_bank_name: string | null
          preset_branch: string | null
          preset_category: string | null
          preset_depositor_name: string | null
          preset_external_partner_id: string | null
          preset_notes: string | null
          preset_partner_id: string | null
          preset_payment_method: string | null
          preset_recipient_name: string | null
          preset_reference_number: string | null
          preset_waste_type: string | null
          require_receipt: boolean | null
          title: string | null
          token: string
          usage_count: number | null
        }
        Insert: {
          allow_amount_edit?: boolean | null
          allow_date_edit?: boolean | null
          allow_partner_edit?: boolean | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean | null
          last_used_at?: string | null
          notes?: string | null
          organization_id: string
          preset_account_number?: string | null
          preset_amount?: number | null
          preset_bank_name?: string | null
          preset_branch?: string | null
          preset_category?: string | null
          preset_depositor_name?: string | null
          preset_external_partner_id?: string | null
          preset_notes?: string | null
          preset_partner_id?: string | null
          preset_payment_method?: string | null
          preset_recipient_name?: string | null
          preset_reference_number?: string | null
          preset_waste_type?: string | null
          require_receipt?: boolean | null
          title?: string | null
          token: string
          usage_count?: number | null
        }
        Update: {
          allow_amount_edit?: boolean | null
          allow_date_edit?: boolean | null
          allow_partner_edit?: boolean | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean | null
          last_used_at?: string | null
          notes?: string | null
          organization_id?: string
          preset_account_number?: string | null
          preset_amount?: number | null
          preset_bank_name?: string | null
          preset_branch?: string | null
          preset_category?: string | null
          preset_depositor_name?: string | null
          preset_external_partner_id?: string | null
          preset_notes?: string | null
          preset_partner_id?: string | null
          preset_payment_method?: string | null
          preset_recipient_name?: string | null
          preset_reference_number?: string | null
          preset_waste_type?: string | null
          require_receipt?: boolean | null
          title?: string | null
          token?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_deposit_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_deposit_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_deposit_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_deposit_links_preset_external_partner_id_fkey"
            columns: ["preset_external_partner_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_deposit_links_preset_partner_id_fkey"
            columns: ["preset_partner_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_deposit_links_preset_partner_id_fkey"
            columns: ["preset_partner_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          ai_confidence_score: number | null
          ai_verification_result: Json | null
          auto_verified: boolean | null
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          organization_id: string
          rejection_reason: string | null
          updated_at: string | null
          uploaded_by: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_verification_result?: Json | null
          auto_verified?: boolean | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          organization_id: string
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_verification_result?: Json | null
          auto_verified?: boolean | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          organization_id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_locations: {
        Row: {
          address: string
          city: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          latitude: number | null
          location_name: string
          longitude: number | null
          organization_id: string
          region: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          location_name: string
          longitude?: number | null
          organization_id: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          organization_id?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "organization_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "organization_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          media_urls: Json | null
          organization_id: string
          post_type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          organization_id: string
          post_type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          organization_id?: string
          post_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_shipment_links: {
        Row: {
          allow_date_edit: boolean | null
          allow_generator_edit: boolean | null
          allow_location_edit: boolean | null
          allow_recycler_edit: boolean | null
          allow_weight_edit: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_pinned: boolean | null
          last_used_at: string | null
          notes: string | null
          organization_id: string
          preset_delivery_location: Json | null
          preset_generator_external_id: string | null
          preset_generator_id: string | null
          preset_notes: string | null
          preset_pickup_location: Json | null
          preset_recycler_external_id: string | null
          preset_recycler_id: string | null
          preset_waste_category: string | null
          preset_waste_type: string | null
          require_photo: boolean | null
          sender_name: string | null
          title: string | null
          token: string
          usage_count: number | null
        }
        Insert: {
          allow_date_edit?: boolean | null
          allow_generator_edit?: boolean | null
          allow_location_edit?: boolean | null
          allow_recycler_edit?: boolean | null
          allow_weight_edit?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean | null
          last_used_at?: string | null
          notes?: string | null
          organization_id: string
          preset_delivery_location?: Json | null
          preset_generator_external_id?: string | null
          preset_generator_id?: string | null
          preset_notes?: string | null
          preset_pickup_location?: Json | null
          preset_recycler_external_id?: string | null
          preset_recycler_id?: string | null
          preset_waste_category?: string | null
          preset_waste_type?: string | null
          require_photo?: boolean | null
          sender_name?: string | null
          title?: string | null
          token: string
          usage_count?: number | null
        }
        Update: {
          allow_date_edit?: boolean | null
          allow_generator_edit?: boolean | null
          allow_location_edit?: boolean | null
          allow_recycler_edit?: boolean | null
          allow_weight_edit?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean | null
          last_used_at?: string | null
          notes?: string | null
          organization_id?: string
          preset_delivery_location?: Json | null
          preset_generator_external_id?: string | null
          preset_generator_id?: string | null
          preset_notes?: string | null
          preset_pickup_location?: Json | null
          preset_recycler_external_id?: string | null
          preset_recycler_id?: string | null
          preset_waste_category?: string | null
          preset_waste_type?: string | null
          require_photo?: boolean | null
          sender_name?: string | null
          title?: string | null
          token?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_shipment_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_shipment_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_shipment_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_shipment_links_preset_generator_external_id_fkey"
            columns: ["preset_generator_external_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_shipment_links_preset_generator_id_fkey"
            columns: ["preset_generator_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_shipment_links_preset_generator_id_fkey"
            columns: ["preset_generator_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_shipment_links_preset_recycler_external_id_fkey"
            columns: ["preset_recycler_external_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_shipment_links_preset_recycler_id_fkey"
            columns: ["preset_recycler_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_shipment_links_preset_recycler_id_fkey"
            columns: ["preset_recycler_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          activity_type: string | null
          address: string | null
          agent_email: string | null
          agent_name: string | null
          agent_national_id: string | null
          agent_phone: string | null
          branches: Json | null
          city: string | null
          client_code: string | null
          commercial_register: string | null
          cover_url: string | null
          created_at: string | null
          delegate_email: string | null
          delegate_name: string | null
          delegate_national_id: string | null
          delegate_phone: string | null
          description: string | null
          email: string
          environmental_approval_number: string | null
          environmental_license: string | null
          establishment_registration: string | null
          field_of_work: string | null
          headquarters: string | null
          id: string
          ida_license: string | null
          industrial_registry: string | null
          is_active: boolean | null
          is_verified: boolean | null
          land_transport_license: string | null
          license_number: string | null
          logo_url: string | null
          name: string
          name_en: string | null
          organization_type: Database["public"]["Enums"]["organization_type"]
          phone: string
          policy: string | null
          production_capacity: string | null
          region: string | null
          registered_activity: string | null
          representative_email: string | null
          representative_name: string | null
          representative_national_id: string | null
          representative_phone: string | null
          representative_position: string | null
          secondary_phone: string | null
          signature_url: string | null
          stamp_url: string | null
          tax_card: string | null
          updated_at: string | null
          vision: string | null
          wmra_license: string | null
        }
        Insert: {
          activity_type?: string | null
          address?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_national_id?: string | null
          agent_phone?: string | null
          branches?: Json | null
          city?: string | null
          client_code?: string | null
          commercial_register?: string | null
          cover_url?: string | null
          created_at?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          delegate_national_id?: string | null
          delegate_phone?: string | null
          description?: string | null
          email: string
          environmental_approval_number?: string | null
          environmental_license?: string | null
          establishment_registration?: string | null
          field_of_work?: string | null
          headquarters?: string | null
          id?: string
          ida_license?: string | null
          industrial_registry?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          land_transport_license?: string | null
          license_number?: string | null
          logo_url?: string | null
          name: string
          name_en?: string | null
          organization_type: Database["public"]["Enums"]["organization_type"]
          phone: string
          policy?: string | null
          production_capacity?: string | null
          region?: string | null
          registered_activity?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_national_id?: string | null
          representative_phone?: string | null
          representative_position?: string | null
          secondary_phone?: string | null
          signature_url?: string | null
          stamp_url?: string | null
          tax_card?: string | null
          updated_at?: string | null
          vision?: string | null
          wmra_license?: string | null
        }
        Update: {
          activity_type?: string | null
          address?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_national_id?: string | null
          agent_phone?: string | null
          branches?: Json | null
          city?: string | null
          client_code?: string | null
          commercial_register?: string | null
          cover_url?: string | null
          created_at?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          delegate_national_id?: string | null
          delegate_phone?: string | null
          description?: string | null
          email?: string
          environmental_approval_number?: string | null
          environmental_license?: string | null
          establishment_registration?: string | null
          field_of_work?: string | null
          headquarters?: string | null
          id?: string
          ida_license?: string | null
          industrial_registry?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          land_transport_license?: string | null
          license_number?: string | null
          logo_url?: string | null
          name?: string
          name_en?: string | null
          organization_type?: Database["public"]["Enums"]["organization_type"]
          phone?: string
          policy?: string | null
          production_capacity?: string | null
          region?: string | null
          registered_activity?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_national_id?: string | null
          representative_phone?: string | null
          representative_position?: string | null
          secondary_phone?: string | null
          signature_url?: string | null
          stamp_url?: string | null
          tax_card?: string | null
          updated_at?: string | null
          vision?: string | null
          wmra_license?: string | null
        }
        Relationships: []
      }
      partner_account_settings: {
        Row: {
          account_status: string | null
          auto_invoice: boolean | null
          billing_cycle: string | null
          created_at: string
          credit_limit: number | null
          discount_percentage: number | null
          id: string
          notes: string | null
          organization_id: string
          partner_organization_id: string
          payment_terms_days: number | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          account_status?: string | null
          auto_invoice?: boolean | null
          billing_cycle?: string | null
          created_at?: string
          credit_limit?: number | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          partner_organization_id: string
          payment_terms_days?: number | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          account_status?: string | null
          auto_invoice?: boolean | null
          billing_cycle?: string | null
          created_at?: string
          credit_limit?: number | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          partner_organization_id?: string
          payment_terms_days?: number | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_account_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_account_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_account_settings_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_account_settings_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_balances: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          last_transaction_date: string | null
          organization_id: string
          partner_organization_id: string
          total_invoiced: number | null
          total_paid: number | null
          updated_at: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          last_transaction_date?: string | null
          organization_id: string
          partner_organization_id: string
          total_invoiced?: number | null
          total_paid?: number | null
          updated_at?: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          last_transaction_date?: string | null
          organization_id?: string
          partner_organization_id?: string
          total_invoiced?: number | null
          total_paid?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_balances_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_balances_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean | null
          note_type: string | null
          priority: string | null
          receiver_organization_id: string
          sender_organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          note_type?: string | null
          priority?: string | null
          receiver_organization_id: string
          sender_organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          note_type?: string | null
          priority?: string | null
          receiver_organization_id?: string
          sender_organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_notes_receiver_organization_id_fkey"
            columns: ["receiver_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_notes_receiver_organization_id_fkey"
            columns: ["receiver_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_notes_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_notes_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_price_items: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_active: boolean | null
          item_code: string | null
          item_description: string | null
          item_name: string
          max_quantity: number | null
          min_quantity: number | null
          notes: string | null
          organization_id: string
          partner_name: string | null
          partner_organization_id: string | null
          price_type: string | null
          unit: string | null
          unit_price: number
          updated_at: string
          waste_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_description?: string | null
          item_name: string
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          organization_id: string
          partner_name?: string | null
          partner_organization_id?: string | null
          price_type?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
          waste_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_description?: string | null
          item_name?: string
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          organization_id?: string
          partner_name?: string | null
          partner_organization_id?: string | null
          price_type?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
          waste_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_price_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_price_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_price_items_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_price_items_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_visibility_settings: {
        Row: {
          can_receive_notifications: boolean
          can_view_driver_info: boolean
          can_view_driver_location: boolean
          can_view_estimated_arrival: boolean
          can_view_maps: boolean
          can_view_reports: boolean
          can_view_routes: boolean
          can_view_shipment_details: boolean
          can_view_tracking: boolean
          can_view_vehicle_info: boolean
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          partner_organization_id: string
          updated_at: string
        }
        Insert: {
          can_receive_notifications?: boolean
          can_view_driver_info?: boolean
          can_view_driver_location?: boolean
          can_view_estimated_arrival?: boolean
          can_view_maps?: boolean
          can_view_reports?: boolean
          can_view_routes?: boolean
          can_view_shipment_details?: boolean
          can_view_tracking?: boolean
          can_view_vehicle_info?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          partner_organization_id: string
          updated_at?: string
        }
        Update: {
          can_receive_notifications?: boolean
          can_view_driver_info?: boolean
          can_view_driver_location?: boolean
          can_view_estimated_arrival?: boolean
          can_view_maps?: boolean
          can_view_reports?: boolean
          can_view_routes?: boolean
          can_view_shipment_details?: boolean
          can_view_tracking?: boolean
          can_view_vehicle_info?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          partner_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_visibility_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_visibility_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_visibility_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_visibility_settings_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_visibility_settings_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_waste_types: {
        Row: {
          created_at: string
          external_partner_id: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          partner_organization_id: string | null
          price_per_unit: number | null
          tax_included: boolean | null
          tax_rate: number | null
          tax_type: string | null
          unit: string | null
          updated_at: string
          waste_code: string | null
          waste_type: string
        }
        Insert: {
          created_at?: string
          external_partner_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          partner_organization_id?: string | null
          price_per_unit?: number | null
          tax_included?: boolean | null
          tax_rate?: number | null
          tax_type?: string | null
          unit?: string | null
          updated_at?: string
          waste_code?: string | null
          waste_type: string
        }
        Update: {
          created_at?: string
          external_partner_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          partner_organization_id?: string | null
          price_per_unit?: number | null
          tax_included?: boolean | null
          tax_rate?: number | null
          tax_type?: string | null
          unit?: string | null
          updated_at?: string
          waste_code?: string | null
          waste_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_waste_types_external_partner_id_fkey"
            columns: ["external_partner_id"]
            isOneToOne: false
            referencedRelation: "external_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_waste_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_waste_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_waste_types_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_waste_types_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      password_change_logs: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          is_sent: boolean | null
          organization_id: string
          reminder_date: string
          reminder_type: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          is_sent?: boolean | null
          organization_id: string
          reminder_date: string
          reminder_type?: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          is_sent?: boolean | null
          organization_id?: string
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "payment_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_name: string | null
          check_number: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          notes: string | null
          organization_id: string
          partner_name: string | null
          partner_organization_id: string | null
          payment_date: string
          payment_method: string
          payment_number: string
          payment_type: string
          receipt_url: string | null
          reference_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id: string
          partner_name?: string | null
          partner_organization_id?: string | null
          payment_date?: string
          payment_method?: string
          payment_number: string
          payment_type?: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string
          partner_name?: string | null
          partner_organization_id?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          payment_type?: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "payments_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_posts: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          media_url: string | null
          organization_id: string | null
          title: string | null
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          media_url?: string | null
          organization_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          media_url?: string | null
          organization_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profile_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_all_partners: boolean | null
          access_all_waste_types: boolean | null
          active_organization_id: string | null
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          employee_type: string | null
          full_name: string
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          invitation_date: string | null
          invited_by: string | null
          is_active: boolean | null
          national_id: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_all_partners?: boolean | null
          access_all_waste_types?: boolean | null
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          employee_type?: string | null
          full_name: string
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          invitation_date?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          national_id?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_all_partners?: boolean | null
          access_all_waste_types?: boolean | null
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          employee_type?: string | null
          full_name?: string
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          invitation_date?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          national_id?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recycling_reports: {
        Row: {
          closing_declaration: string | null
          created_at: string
          created_by: string | null
          custom_notes: string | null
          id: string
          opening_declaration: string | null
          pdf_url: string | null
          processing_details: string | null
          recycler_organization_id: string
          report_data: Json | null
          report_number: string
          shipment_id: string
          template_id: string | null
          updated_at: string
          waste_category: string
        }
        Insert: {
          closing_declaration?: string | null
          created_at?: string
          created_by?: string | null
          custom_notes?: string | null
          id?: string
          opening_declaration?: string | null
          pdf_url?: string | null
          processing_details?: string | null
          recycler_organization_id: string
          report_data?: Json | null
          report_number: string
          shipment_id: string
          template_id?: string | null
          updated_at?: string
          waste_category?: string
        }
        Update: {
          closing_declaration?: string | null
          created_at?: string
          created_by?: string | null
          custom_notes?: string | null
          id?: string
          opening_declaration?: string | null
          pdf_url?: string | null
          processing_details?: string | null
          recycler_organization_id?: string
          report_data?: Json | null
          report_number?: string
          shipment_id?: string
          template_id?: string | null
          updated_at?: string
          waste_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "recycling_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recycling_reports_recycler_organization_id_fkey"
            columns: ["recycler_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "recycling_reports_recycler_organization_id_fkey"
            columns: ["recycler_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recycling_reports_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recycling_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          auto_approve_at: string
          created_at: string
          id: string
          pdf_url: string | null
          request_title: string
          request_type: string
          requester_organization_id: string | null
          requester_user_id: string
          status: string
          target_resource_data: Json | null
          target_resource_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_approve_at?: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          request_title: string
          request_type: string
          requester_organization_id?: string | null
          requester_user_id: string
          status?: string
          target_resource_data?: Json | null
          target_resource_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_approve_at?: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          request_title?: string
          request_type?: string
          requester_organization_id?: string | null
          requester_user_id?: string
          status?: string
          target_resource_data?: Json | null
          target_resource_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_requests_requester_organization_id_fkey"
            columns: ["requester_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "report_requests_requester_organization_id_fkey"
            columns: ["requester_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          closing_declaration: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          description: string | null
          id: string
          include_barcode: boolean | null
          include_qr_code: boolean | null
          include_signature: boolean | null
          include_stamp: boolean | null
          is_active: boolean | null
          name: string
          opening_declaration: string | null
          organization_id: string
          processing_details_template: string | null
          template_type: string
          updated_at: string
          usage_count: number | null
          waste_category: string
          waste_types: Json | null
        }
        Insert: {
          closing_declaration?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          include_barcode?: boolean | null
          include_qr_code?: boolean | null
          include_signature?: boolean | null
          include_stamp?: boolean | null
          is_active?: boolean | null
          name: string
          opening_declaration?: string | null
          organization_id: string
          processing_details_template?: string | null
          template_type?: string
          updated_at?: string
          usage_count?: number | null
          waste_category: string
          waste_types?: Json | null
        }
        Update: {
          closing_declaration?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          include_barcode?: boolean | null
          include_qr_code?: boolean | null
          include_signature?: boolean | null
          include_stamp?: boolean | null
          is_active?: boolean | null
          name?: string
          opening_declaration?: string | null
          organization_id?: string
          processing_details_template?: string | null
          template_type?: string
          updated_at?: string
          usage_count?: number | null
          waste_category?: string
          waste_types?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "report_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_locations: {
        Row: {
          address: string
          category: string | null
          city: string | null
          created_at: string
          created_by: string | null
          governorate: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          latitude: number
          location_type: string | null
          longitude: number
          name: string
          name_en: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          source: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          address: string
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          governorate?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          latitude: number
          location_type?: string | null
          longitude: number
          name: string
          name_en?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          address?: string
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          governorate?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          latitude?: number
          location_type?: string | null
          longitude?: number
          name?: string
          name_en?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "saved_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audits: {
        Row: {
          audit_type: string
          checks_failed: number | null
          checks_passed: number | null
          checks_warning: number | null
          created_at: string
          findings: Json
          id: string
          organization_id: string | null
          run_duration_ms: number | null
          status: string
          summary: string | null
          triggered_by: string | null
        }
        Insert: {
          audit_type: string
          checks_failed?: number | null
          checks_passed?: number | null
          checks_warning?: number | null
          created_at?: string
          findings?: Json
          id?: string
          organization_id?: string | null
          run_duration_ms?: number | null
          status: string
          summary?: string | null
          triggered_by?: string | null
        }
        Update: {
          audit_type?: string
          checks_failed?: number | null
          checks_passed?: number | null
          checks_warning?: number | null
          created_at?: string
          findings?: Json
          id?: string
          organization_id?: string | null
          run_duration_ms?: number | null
          status?: string
          summary?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_check_settings: {
        Row: {
          check_interval_hours: number | null
          check_name: string
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          severity: string
          updated_at: string
        }
        Insert: {
          check_interval_hours?: number | null
          check_name: string
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          severity: string
          updated_at?: string
        }
        Update: {
          check_interval_hours?: number | null
          check_name?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          ip_address: string | null
          is_resolved: boolean | null
          is_suspicious: boolean | null
          location_info: Json | null
          organization_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          is_suspicious?: boolean | null
          location_info?: Json | null
          organization_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          is_suspicious?: boolean | null
          location_info?: Json | null
          organization_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_logs: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_receipts: {
        Row: {
          actual_weight: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          declared_weight: number | null
          driver_id: string | null
          driver_signature: string | null
          generator_id: string | null
          generator_signature: string | null
          id: string
          notes: string | null
          pickup_coordinates: Json | null
          pickup_date: string
          pickup_location: string | null
          pickup_photos: string[] | null
          receipt_number: string
          shipment_id: string
          status: string
          transporter_id: string | null
          unit: string | null
          updated_at: string
          waste_category: string | null
          waste_type: string | null
        }
        Insert: {
          actual_weight?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          declared_weight?: number | null
          driver_id?: string | null
          driver_signature?: string | null
          generator_id?: string | null
          generator_signature?: string | null
          id?: string
          notes?: string | null
          pickup_coordinates?: Json | null
          pickup_date?: string
          pickup_location?: string | null
          pickup_photos?: string[] | null
          receipt_number?: string
          shipment_id: string
          status?: string
          transporter_id?: string | null
          unit?: string | null
          updated_at?: string
          waste_category?: string | null
          waste_type?: string | null
        }
        Update: {
          actual_weight?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          declared_weight?: number | null
          driver_id?: string | null
          driver_signature?: string | null
          generator_id?: string | null
          generator_signature?: string | null
          id?: string
          notes?: string | null
          pickup_coordinates?: Json | null
          pickup_date?: string
          pickup_location?: string | null
          pickup_photos?: string[] | null
          receipt_number?: string
          shipment_id?: string
          status?: string
          transporter_id?: string | null
          unit?: string | null
          updated_at?: string
          waste_category?: string | null
          waste_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_receipts_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          account_notes: string | null
          approved_at: string | null
          auto_approve_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          collection_started_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          disposal_method: string | null
          driver_id: string | null
          expected_delivery_date: string | null
          generator_id: string | null
          generator_notes: string | null
          hazard_level: string | null
          id: string
          in_transit_at: string | null
          is_public_submission: boolean | null
          manual_driver_name: string | null
          manual_generator_name: string | null
          manual_recycler_name: string | null
          manual_transporter_name: string | null
          manual_vehicle_plate: string | null
          notes: string | null
          packaging_method: string | null
          pickup_address: string | null
          pickup_city: string | null
          pickup_date: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          quantity: number | null
          recycler_id: string | null
          recycler_notes: string | null
          shipment_link_id: string | null
          shipment_number: string
          shipment_type: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          submitter_name: string | null
          submitter_phone: string | null
          transporter_id: string
          unit: string | null
          updated_at: string | null
          waste_description: string | null
          waste_state: string | null
          waste_type: Database["public"]["Enums"]["waste_type"] | null
        }
        Insert: {
          account_notes?: string | null
          approved_at?: string | null
          auto_approve_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          collection_started_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          disposal_method?: string | null
          driver_id?: string | null
          expected_delivery_date?: string | null
          generator_id?: string | null
          generator_notes?: string | null
          hazard_level?: string | null
          id?: string
          in_transit_at?: string | null
          is_public_submission?: boolean | null
          manual_driver_name?: string | null
          manual_generator_name?: string | null
          manual_recycler_name?: string | null
          manual_transporter_name?: string | null
          manual_vehicle_plate?: string | null
          notes?: string | null
          packaging_method?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quantity?: number | null
          recycler_id?: string | null
          recycler_notes?: string | null
          shipment_link_id?: string | null
          shipment_number: string
          shipment_type?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          submitter_name?: string | null
          submitter_phone?: string | null
          transporter_id: string
          unit?: string | null
          updated_at?: string | null
          waste_description?: string | null
          waste_state?: string | null
          waste_type?: Database["public"]["Enums"]["waste_type"] | null
        }
        Update: {
          account_notes?: string | null
          approved_at?: string | null
          auto_approve_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          collection_started_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          disposal_method?: string | null
          driver_id?: string | null
          expected_delivery_date?: string | null
          generator_id?: string | null
          generator_notes?: string | null
          hazard_level?: string | null
          id?: string
          in_transit_at?: string | null
          is_public_submission?: boolean | null
          manual_driver_name?: string | null
          manual_generator_name?: string | null
          manual_recycler_name?: string | null
          manual_transporter_name?: string | null
          manual_vehicle_plate?: string | null
          notes?: string | null
          packaging_method?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quantity?: number | null
          recycler_id?: string | null
          recycler_notes?: string | null
          shipment_link_id?: string | null
          shipment_number?: string
          shipment_type?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          submitter_name?: string | null
          submitter_phone?: string | null
          transporter_id?: string
          unit?: string | null
          updated_at?: string | null
          waste_description?: string | null
          waste_state?: string | null
          waste_type?: Database["public"]["Enums"]["waste_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_shipment_link_id_fkey"
            columns: ["shipment_link_id"]
            isOneToOne: false
            referencedRelation: "organization_shipment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "shipments_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          submission_count: number
          submission_type: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          submission_count?: number
          submission_type: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          submission_count?: number
          submission_type?: string
          window_start?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          created_by: string | null
          description: string
          first_response_at: string | null
          id: string
          last_activity_at: string | null
          organization_id: string | null
          partner_organization_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          related_shipment_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          satisfaction_feedback: string | null
          satisfaction_rating: number | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          last_activity_at?: string | null
          organization_id?: string | null
          partner_organization_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_shipment_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          last_activity_at?: string | null
          organization_id?: string | null
          partner_organization_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_shipment_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "support_tickets_partner_organization_id_fkey"
            columns: ["partner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_shipment_id_fkey"
            columns: ["related_shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_metrics: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value?: number
          recorded_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          status?: string
        }
        Relationships: []
      }
      system_health_summary: {
        Row: {
          created_at: string
          critical_checks: number
          database_status: Json | null
          edge_functions_status: Json | null
          id: string
          last_check_at: string
          modules_status: Json | null
          overall_health_score: number
          passed_checks: number
          total_checks: number
          updated_at: string
          warning_checks: number
        }
        Insert: {
          created_at?: string
          critical_checks?: number
          database_status?: Json | null
          edge_functions_status?: Json | null
          id?: string
          last_check_at?: string
          modules_status?: Json | null
          overall_health_score?: number
          passed_checks?: number
          total_checks?: number
          updated_at?: string
          warning_checks?: number
        }
        Update: {
          created_at?: string
          critical_checks?: number
          database_status?: Json | null
          edge_functions_status?: Json | null
          id?: string
          last_check_at?: string
          modules_status?: Json | null
          overall_health_score?: number
          passed_checks?: number
          total_checks?: number
          updated_at?: string
          warning_checks?: number
        }
        Relationships: []
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          created_at: string
          full_name: string
          id: string
          ip_address: string | null
          organization_id: string | null
          organization_name: string
          organization_type: string
          signer_id_back_url: string | null
          signer_id_front_url: string | null
          signer_national_id: string | null
          signer_phone: string | null
          signer_position: string | null
          signer_signature_url: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
          verified_match: boolean | null
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          full_name: string
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          organization_name: string
          organization_type: string
          signer_id_back_url?: string | null
          signer_id_front_url?: string | null
          signer_national_id?: string | null
          signer_phone?: string | null
          signer_position?: string | null
          signer_signature_url?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id: string
          verified_match?: boolean | null
        }
        Update: {
          accepted_at?: string
          created_at?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          organization_name?: string
          organization_type?: string
          signer_id_back_url?: string | null
          signer_id_front_url?: string | null
          signer_national_id?: string | null
          signer_phone?: string | null
          signer_position?: string | null
          signer_signature_url?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
          verified_match?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "terms_acceptances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_from_admin: boolean | null
          is_internal_note: boolean | null
          message: string
          read_at: string | null
          sender_id: string | null
          sender_organization_id: string | null
          ticket_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_from_admin?: boolean | null
          is_internal_note?: boolean | null
          message: string
          read_at?: string | null
          sender_id?: string | null
          sender_organization_id?: string | null
          ticket_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_from_admin?: boolean | null
          is_internal_note?: boolean | null
          message?: string
          read_at?: string | null
          sender_id?: string | null
          sender_organization_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ticket_messages_sender_organization_id_fkey"
            columns: ["sender_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_watchers: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          organization_id: string
          ticket_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          ticket_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_watchers_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_watchers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ticket_watchers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_watchers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          id: string
          ip_address: string | null
          is_successful: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempt_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_successful?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempt_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_successful?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          joined_at: string
          organization_id: string
          role_in_organization: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          joined_at?: string
          organization_id: string
          role_in_organization?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          joined_at?: string
          organization_id?: string
          role_in_organization?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_two_factor_auth: {
        Row: {
          backup_codes_encrypted: string | null
          created_at: string
          id: string
          is_enabled: boolean
          last_used_at: string | null
          secret_encrypted: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes_encrypted?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret_encrypted?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes_encrypted?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret_encrypted?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_admin_dashboard: {
        Row: {
          active_contracts: number | null
          active_users: number | null
          available_drivers: number | null
          confirmed_shipments: number | null
          generator_count: number | null
          open_tickets: number | null
          pending_approvals: number | null
          pending_documents: number | null
          pending_invoices: number | null
          pending_shipments: number | null
          recycler_count: number | null
          refreshed_at: string | null
          total_drivers: number | null
          total_invoiced: number | null
          total_organizations: number | null
          total_paid: number | null
          total_quantity: number | null
          total_shipments: number | null
          transporter_count: number | null
          verified_organizations: number | null
        }
        Relationships: []
      }
      mv_daily_shipment_stats: {
        Row: {
          avg_quantity: number | null
          generator_id: string | null
          recycler_id: string | null
          report_date: string | null
          shipment_count: number | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          total_quantity: number | null
          transporter_id: string | null
          waste_type: Database["public"]["Enums"]["waste_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "shipments_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_monthly_invoice_stats: {
        Row: {
          invoice_count: number | null
          invoice_type: string | null
          month: string | null
          organization_id: string | null
          paid_amount: number | null
          remaining_amount: number | null
          status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_organization_summary: {
        Row: {
          active_contracts_count: number | null
          city: string | null
          driver_count: number | null
          employee_count: number | null
          is_verified: boolean | null
          organization_id: string | null
          organization_name: string | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          refreshed_at: string | null
          total_generated_quantity: number | null
          total_generated_shipments: number | null
          total_invoices_count: number | null
          total_recycled_quantity: number | null
          total_recycled_shipments: number | null
          total_transported_quantity: number | null
          total_transported_shipments: number | null
        }
        Relationships: []
      }
      mv_recycling_summary: {
        Row: {
          certificates_issued: number | null
          month: string | null
          recycler_organization_id: string | null
          unique_shipments: number | null
          waste_category: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recycling_reports_recycler_organization_id_fkey"
            columns: ["recycler_organization_id"]
            isOneToOne: false
            referencedRelation: "mv_organization_summary"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "recycling_reports_recycler_organization_id_fkey"
            columns: ["recycler_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_waste_type_analytics: {
        Row: {
          avg_quantity: number | null
          completion_rate: number | null
          confirmed_count: number | null
          month: string | null
          shipment_count: number | null
          total_quantity: number | null
          unique_generators: number | null
          unique_recyclers: number | null
          waste_type: Database["public"]["Enums"]["waste_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_activity_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      archive_old_chat_messages: {
        Args: { retention_days?: number }
        Returns: number
      }
      archive_old_driver_locations: {
        Args: { retention_days?: number }
        Returns: number
      }
      archive_old_notifications: {
        Args: { retention_days?: number }
        Returns: number
      }
      archive_old_shipments: {
        Args: { retention_days?: number }
        Returns: number
      }
      can_access_contract: {
        Args: { _contract_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_deposit: {
        Args: { _deposit_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_direct_message: {
        Args: {
          _receiver_org_id: string
          _sender_org_id: string
          _user_id: string
        }
        Returns: boolean
      }
      can_access_document: {
        Args: { _doc_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_expense: {
        Args: { _expense_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_external_record: {
        Args: { _record_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_invoice: {
        Args: { _invoice_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_invoice_by_id: {
        Args: { _invoice_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_operational_plan: {
        Args: { _plan_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_org_post: {
        Args: { _post_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_partner_note: {
        Args: { _note_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_recycling_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_shipment: {
        Args: { _shipment_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_shipment_chat: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_ticket: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      check_api_rate_limit: {
        Args: { p_api_key_id: string }
        Returns: {
          allowed: boolean
          limit_per_minute: number
          remaining: number
          reset_at: string
        }[]
      }
      check_brute_force: {
        Args: {
          p_ip_address?: string
          p_threshold?: number
          p_user_id?: string
          p_window_minutes?: number
        }
        Returns: {
          failed_attempts: number
          is_blocked: boolean
          last_attempt: string
        }[]
      }
      cleanup_old_api_request_logs: { Args: never; Returns: number }
      count_recent_2fa_attempts: {
        Args: { _minutes?: number; _user_id: string }
        Returns: number
      }
      driver_belongs_to_user_org: {
        Args: { _driver_id: string; _user_id: string }
        Returns: boolean
      }
      generate_contract_verification_code: { Args: never; Returns: string }
      generate_invitation_token: { Args: never; Returns: string }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_contracts: number
          active_users: number
          available_drivers: number
          confirmed_shipments: number
          generator_count: number
          open_tickets: number
          pending_approvals: number
          pending_documents: number
          pending_invoices: number
          pending_shipments: number
          recycler_count: number
          refreshed_at: string
          total_drivers: number
          total_invoiced: number
          total_organizations: number
          total_paid: number
          total_quantity: number
          total_shipments: number
          transporter_count: number
          verified_organizations: number
        }[]
      }
      get_daily_shipment_stats: {
        Args: { _end_date?: string; _org_id: string; _start_date?: string }
        Returns: {
          avg_quantity: number
          generator_id: string
          recycler_id: string
          report_date: string
          shipment_count: number
          status: string
          total_quantity: number
          transporter_id: string
          waste_type: string
        }[]
      }
      get_monthly_invoice_stats: {
        Args: { _org_id: string }
        Returns: {
          invoice_count: number
          invoice_type: string
          month: string
          organization_id: string
          paid_amount: number
          remaining_amount: number
          status: string
          total_amount: number
        }[]
      }
      get_organization_summary: {
        Args: { _org_id: string }
        Returns: {
          active_contracts_count: number
          city: string
          driver_count: number
          employee_count: number
          is_verified: boolean
          organization_id: string
          organization_name: string
          organization_type: string
          refreshed_at: string
          total_generated_quantity: number
          total_generated_shipments: number
          total_invoices_count: number
          total_recycled_quantity: number
          total_recycled_shipments: number
          total_transported_quantity: number
          total_transported_shipments: number
        }[]
      }
      get_pending_drivers: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_available: boolean
          license_expiry: string
          license_number: string
          phone: string
          profile_id: string
          vehicle_plate: string
          vehicle_type: string
        }[]
      }
      get_rate_limit_info: {
        Args: { p_api_key_id: string }
        Returns: {
          current_usage: number
          limit_per_minute: number
          reset_at: string
          window_start: string
        }[]
      }
      get_recycling_summary: {
        Args: { _org_id: string }
        Returns: {
          certificates_issued: number
          month: string
          recycler_organization_id: string
          unique_shipments: number
          waste_category: string
        }[]
      }
      get_security_summary: {
        Args: { p_days?: number; p_organization_id?: string }
        Returns: {
          api_key_events: number
          critical_events: number
          high_events: number
          login_failures: number
          suspicious_events: number
          total_events: number
          unresolved_events: number
        }[]
      }
      get_user_driver_id: { Args: { _user_id: string }; Returns: string }
      get_user_org_id_safe: { Args: { _user_id: string }; Returns: string }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      get_user_organizations: {
        Args: { _user_id: string }
        Returns: {
          is_active: boolean
          is_primary: boolean
          is_verified: boolean
          organization_id: string
          organization_name: string
          organization_type: string
          role_in_organization: string
        }[]
      }
      get_waste_type_analytics: {
        Args: { _org_id?: string }
        Returns: {
          avg_quantity: number
          completion_rate: number
          confirmed_count: number
          month: string
          shipment_count: number
          total_quantity: number
          unique_generators: number
          unique_recyclers: number
          waste_type: string
        }[]
      }
      has_employee_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_partner_access: {
        Args: {
          _external_partner_id?: string
          _partner_org_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_two_factor_enabled: { Args: { _user_id: string }; Returns: boolean }
      has_waste_access: {
        Args: { _user_id: string; _waste_type: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_or_system_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_driver: {
        Args: { _driver_id: string; _user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: string
          p_is_suspicious?: boolean
          p_organization_id?: string
          p_severity: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      refresh_all_materialized_views: { Args: never; Returns: undefined }
      refresh_materialized_view: {
        Args: { view_name: string }
        Returns: undefined
      }
      resolve_security_event: {
        Args: { p_event_id: string; p_resolution_notes?: string }
        Returns: boolean
      }
      restore_from_archive: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: boolean
      }
      run_full_archive: { Args: never; Returns: Json }
      run_security_audit: { Args: never; Returns: Json }
      switch_organization: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
      user_belongs_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      validate_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          api_key_id: string
          organization_id: string
          rate_limit: number
          scopes: Database["public"]["Enums"]["api_scope"][]
        }[]
      }
    }
    Enums: {
      api_scope:
        | "shipments:read"
        | "shipments:write"
        | "accounts:read"
        | "accounts:write"
        | "reports:read"
        | "organizations:read"
        | "all"
      app_role: "admin" | "company_admin" | "employee" | "driver"
      call_direction: "inbound" | "outbound"
      call_sentiment: "positive" | "neutral" | "negative"
      call_status:
        | "initiated"
        | "ringing"
        | "in-progress"
        | "completed"
        | "busy"
        | "no-answer"
        | "failed"
        | "canceled"
      employee_permission_type:
        | "create_deposits"
        | "view_deposits"
        | "manage_deposits"
        | "create_shipments"
        | "view_shipments"
        | "manage_shipments"
        | "cancel_shipments"
        | "view_accounts"
        | "view_account_details"
        | "export_accounts"
        | "view_partners"
        | "manage_partners"
        | "create_external_partners"
        | "view_reports"
        | "create_reports"
        | "export_reports"
        | "view_drivers"
        | "manage_drivers"
        | "view_settings"
        | "manage_settings"
        | "full_access"
      organization_type: "generator" | "transporter" | "recycler"
      shipment_status:
        | "new"
        | "approved"
        | "collecting"
        | "in_transit"
        | "delivered"
        | "confirmed"
      ticket_category:
        | "bug"
        | "feature_request"
        | "technical_issue"
        | "billing"
        | "general"
        | "complaint"
        | "suggestion"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_response"
        | "resolved"
        | "closed"
      waste_type:
        | "plastic"
        | "paper"
        | "metal"
        | "glass"
        | "electronic"
        | "organic"
        | "chemical"
        | "medical"
        | "construction"
        | "other"
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
      api_scope: [
        "shipments:read",
        "shipments:write",
        "accounts:read",
        "accounts:write",
        "reports:read",
        "organizations:read",
        "all",
      ],
      app_role: ["admin", "company_admin", "employee", "driver"],
      call_direction: ["inbound", "outbound"],
      call_sentiment: ["positive", "neutral", "negative"],
      call_status: [
        "initiated",
        "ringing",
        "in-progress",
        "completed",
        "busy",
        "no-answer",
        "failed",
        "canceled",
      ],
      employee_permission_type: [
        "create_deposits",
        "view_deposits",
        "manage_deposits",
        "create_shipments",
        "view_shipments",
        "manage_shipments",
        "cancel_shipments",
        "view_accounts",
        "view_account_details",
        "export_accounts",
        "view_partners",
        "manage_partners",
        "create_external_partners",
        "view_reports",
        "create_reports",
        "export_reports",
        "view_drivers",
        "manage_drivers",
        "view_settings",
        "manage_settings",
        "full_access",
      ],
      organization_type: ["generator", "transporter", "recycler"],
      shipment_status: [
        "new",
        "approved",
        "collecting",
        "in_transit",
        "delivered",
        "confirmed",
      ],
      ticket_category: [
        "bug",
        "feature_request",
        "technical_issue",
        "billing",
        "general",
        "complaint",
        "suggestion",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_response",
        "resolved",
        "closed",
      ],
      waste_type: [
        "plastic",
        "paper",
        "metal",
        "glass",
        "electronic",
        "organic",
        "chemical",
        "medical",
        "construction",
        "other",
      ],
    },
  },
} as const
