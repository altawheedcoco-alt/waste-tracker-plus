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
            referencedRelation: "organizations"
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
            referencedRelation: "organizations"
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
      contracts: {
        Row: {
          attachment_url: string | null
          contract_number: string
          contract_type: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          notes: string | null
          organization_id: string
          partner_name: string | null
          partner_organization_id: string | null
          start_date: string | null
          status: string
          terms: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          attachment_url?: string | null
          contract_number: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          partner_name?: string | null
          partner_organization_id?: string | null
          start_date?: string | null
          status?: string
          terms?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          attachment_url?: string | null
          contract_number?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          partner_name?: string | null
          partner_organization_id?: string | null
          start_date?: string | null
          status?: string
          terms?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          organization_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          organization_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          activity_type: string | null
          address: string
          agent_email: string | null
          agent_name: string | null
          agent_national_id: string | null
          agent_phone: string | null
          city: string
          client_code: string | null
          commercial_register: string | null
          cover_url: string | null
          created_at: string | null
          delegate_email: string | null
          delegate_name: string | null
          delegate_national_id: string | null
          delegate_phone: string | null
          email: string
          environmental_approval_number: string | null
          environmental_license: string | null
          establishment_registration: string | null
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
          wmra_license: string | null
        }
        Insert: {
          activity_type?: string | null
          address: string
          agent_email?: string | null
          agent_name?: string | null
          agent_national_id?: string | null
          agent_phone?: string | null
          city: string
          client_code?: string | null
          commercial_register?: string | null
          cover_url?: string | null
          created_at?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          delegate_national_id?: string | null
          delegate_phone?: string | null
          email: string
          environmental_approval_number?: string | null
          environmental_license?: string | null
          establishment_registration?: string | null
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
          wmra_license?: string | null
        }
        Update: {
          activity_type?: string | null
          address?: string
          agent_email?: string | null
          agent_name?: string | null
          agent_national_id?: string | null
          agent_phone?: string | null
          city?: string
          client_code?: string | null
          commercial_register?: string | null
          cover_url?: string | null
          created_at?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          delegate_national_id?: string | null
          delegate_phone?: string | null
          email?: string
          environmental_approval_number?: string | null
          environmental_license?: string | null
          establishment_registration?: string | null
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
          wmra_license?: string | null
        }
        Relationships: []
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
      profiles: {
        Row: {
          active_organization_id: string | null
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
      shipments: {
        Row: {
          approved_at: string | null
          auto_approve_at: string | null
          collection_started_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string
          delivered_at: string | null
          delivery_address: string
          disposal_method: string | null
          driver_id: string | null
          expected_delivery_date: string | null
          generator_id: string | null
          generator_notes: string | null
          hazard_level: string | null
          id: string
          in_transit_at: string | null
          manual_driver_name: string | null
          manual_generator_name: string | null
          manual_recycler_name: string | null
          manual_transporter_name: string | null
          manual_vehicle_plate: string | null
          notes: string | null
          packaging_method: string | null
          pickup_address: string
          pickup_date: string | null
          quantity: number
          recycler_id: string | null
          recycler_notes: string | null
          shipment_number: string
          shipment_type: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          transporter_id: string
          unit: string | null
          updated_at: string | null
          waste_description: string | null
          waste_state: string | null
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Insert: {
          approved_at?: string | null
          auto_approve_at?: string | null
          collection_started_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by: string
          delivered_at?: string | null
          delivery_address: string
          disposal_method?: string | null
          driver_id?: string | null
          expected_delivery_date?: string | null
          generator_id?: string | null
          generator_notes?: string | null
          hazard_level?: string | null
          id?: string
          in_transit_at?: string | null
          manual_driver_name?: string | null
          manual_generator_name?: string | null
          manual_recycler_name?: string | null
          manual_transporter_name?: string | null
          manual_vehicle_plate?: string | null
          notes?: string | null
          packaging_method?: string | null
          pickup_address: string
          pickup_date?: string | null
          quantity: number
          recycler_id?: string | null
          recycler_notes?: string | null
          shipment_number: string
          shipment_type?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          transporter_id: string
          unit?: string | null
          updated_at?: string | null
          waste_description?: string | null
          waste_state?: string | null
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Update: {
          approved_at?: string | null
          auto_approve_at?: string | null
          collection_started_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string
          delivered_at?: string | null
          delivery_address?: string
          disposal_method?: string | null
          driver_id?: string | null
          expected_delivery_date?: string | null
          generator_id?: string | null
          generator_notes?: string | null
          hazard_level?: string | null
          id?: string
          in_transit_at?: string | null
          manual_driver_name?: string | null
          manual_generator_name?: string | null
          manual_recycler_name?: string | null
          manual_transporter_name?: string | null
          manual_vehicle_plate?: string | null
          notes?: string | null
          packaging_method?: string | null
          pickup_address?: string
          pickup_date?: string | null
          quantity?: number
          recycler_id?: string | null
          recycler_notes?: string | null
          shipment_number?: string
          shipment_type?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          transporter_id?: string
          unit?: string | null
          updated_at?: string | null
          waste_description?: string | null
          waste_state?: string | null
          waste_type?: Database["public"]["Enums"]["waste_type"]
        }
        Relationships: [
          {
            foreignKeyName: "shipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_generator_id_fkey"
            columns: ["generator_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_recycler_id_fkey"
            columns: ["recycler_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_user_org_id_safe: { Args: { _user_id: string }; Returns: string }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      switch_organization: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "company_admin" | "employee" | "driver"
      organization_type: "generator" | "transporter" | "recycler"
      shipment_status:
        | "new"
        | "approved"
        | "collecting"
        | "in_transit"
        | "delivered"
        | "confirmed"
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
      app_role: ["admin", "company_admin", "employee", "driver"],
      organization_type: ["generator", "transporter", "recycler"],
      shipment_status: [
        "new",
        "approved",
        "collecting",
        "in_transit",
        "delivered",
        "confirmed",
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
