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
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          description: string | null
          hero_url: string | null
          id: string
          is_verified: boolean
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_url?: string | null
          id?: string
          is_verified?: boolean
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_url?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      claims: {
        Row: {
          business_role: string | null
          contact_email: string
          contact_phone: string | null
          id: string
          proof_notes: string | null
          provider_place_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          business_role?: string | null
          contact_email: string
          contact_phone?: string | null
          id?: string
          proof_notes?: string | null
          provider_place_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          business_role?: string | null
          contact_email?: string
          contact_phone?: string | null
          id?: string
          proof_notes?: string | null
          provider_place_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_provider_place_id_fkey"
            columns: ["provider_place_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["place_id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          phone: string | null
          provider_place_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          phone?: string | null
          provider_place_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          phone?: string | null
          provider_place_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          provider_place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          provider_place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          provider_place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_provider_place_id_fkey"
            columns: ["provider_place_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["place_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          business_role: string | null
          contact_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          business_role?: string | null
          contact_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          business_role?: string | null
          contact_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          provider_place_id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          provider_place_id: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          provider_place_id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_faqs_provider_place_id_fkey"
            columns: ["provider_place_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["place_id"]
          },
        ]
      }
      provider_update_requests: {
        Row: {
          created_at: string
          id: string
          patch: Json
          provider_place_id: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          patch: Json
          provider_place_id: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          patch?: Json
          provider_place_id?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_update_requests_provider_place_id_fkey"
            columns: ["provider_place_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["place_id"]
          },
        ]
      }
      provider_views: {
        Row: {
          id: number
          provider_place_id: string
          referrer: string | null
          viewed_at: string
        }
        Insert: {
          id?: number
          provider_place_id: string
          referrer?: string | null
          viewed_at?: string
        }
        Update: {
          id?: number
          provider_place_id?: string
          referrer?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_views_provider_place_id_fkey"
            columns: ["provider_place_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["place_id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          badges: string[]
          before_after_urls: string[] | null
          branch_label: string | null
          brand_id: string | null
          business_status: string
          city: string
          city_slug: string
          claimed_by: string | null
          created_at: string
          credentials: string | null
          email: string | null
          featured: boolean
          google_maps_url: string | null
          hero_photo_url: string | null
          hours: Json | null
          hours_json: Json | null
          is_verified: boolean
          last_synced_at: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          personality: Json | null
          phone: string | null
          photos_json: Json | null
          place_id: string
          postal_code: string | null
          price_level: number | null
          price_ranges: Json | null
          published: boolean
          rating: number | null
          recovery_tags: string[] | null
          review_count: number | null
          services: string[] | null
          services_raw: string[] | null
          skin_types: string[] | null
          slug: string
          social_links: Json | null
          specialists: string | null
          state: string
          team: Json | null
          updated_at: string
          view_count: number
          website: string | null
        }
        Insert: {
          address?: string | null
          badges?: string[]
          before_after_urls?: string[] | null
          branch_label?: string | null
          brand_id?: string | null
          business_status?: string
          city: string
          city_slug: string
          claimed_by?: string | null
          created_at?: string
          credentials?: string | null
          email?: string | null
          featured?: boolean
          google_maps_url?: string | null
          hero_photo_url?: string | null
          hours?: Json | null
          hours_json?: Json | null
          is_verified?: boolean
          last_synced_at?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          personality?: Json | null
          phone?: string | null
          photos_json?: Json | null
          place_id: string
          postal_code?: string | null
          price_level?: number | null
          price_ranges?: Json | null
          published?: boolean
          rating?: number | null
          recovery_tags?: string[] | null
          review_count?: number | null
          services?: string[] | null
          services_raw?: string[] | null
          skin_types?: string[] | null
          slug: string
          social_links?: Json | null
          specialists?: string | null
          state?: string
          team?: Json | null
          updated_at?: string
          view_count?: number
          website?: string | null
        }
        Update: {
          address?: string | null
          badges?: string[]
          before_after_urls?: string[] | null
          branch_label?: string | null
          brand_id?: string | null
          business_status?: string
          city?: string
          city_slug?: string
          claimed_by?: string | null
          created_at?: string
          credentials?: string | null
          email?: string | null
          featured?: boolean
          google_maps_url?: string | null
          hero_photo_url?: string | null
          hours?: Json | null
          hours_json?: Json | null
          is_verified?: boolean
          last_synced_at?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          personality?: Json | null
          phone?: string | null
          photos_json?: Json | null
          place_id?: string
          postal_code?: string | null
          price_level?: number | null
          price_ranges?: Json | null
          published?: boolean
          rating?: number | null
          recovery_tags?: string[] | null
          review_count?: number | null
          services?: string[] | null
          services_raw?: string[] | null
          skin_types?: string[] | null
          slug?: string
          social_links?: Json | null
          specialists?: string | null
          state?: string
          team?: Json | null
          updated_at?: string
          view_count?: number
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          body: string
          created_at: string
          owner_id: string
          review_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          owner_id: string
          review_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          owner_id?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string | null
          author_photo: string | null
          created_at: string
          id: string
          provider_place_id: string
          published_at: string | null
          rating: number | null
          relative_time: string | null
          text: string | null
        }
        Insert: {
          author_name?: string | null
          author_photo?: string | null
          created_at?: string
          id?: string
          provider_place_id: string
          published_at?: string | null
          rating?: number | null
          relative_time?: string | null
          text?: string | null
        }
        Update: {
          author_name?: string | null
          author_photo?: string | null
          created_at?: string
          id?: string
          provider_place_id?: string
          published_at?: string | null
          rating?: number | null
          relative_time?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_provider_place_id_fkey"
            columns: ["provider_place_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["place_id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          address: string | null
          business_name: string
          city: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          license_doc_path: string | null
          license_number: string | null
          license_type: string | null
          notes: string | null
          npi: string | null
          resulting_place_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          license_doc_path?: string | null
          license_number?: string | null
          license_type?: string | null
          notes?: string | null
          npi?: string | null
          resulting_place_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          license_doc_path?: string | null
          license_number?: string | null
          license_type?: string | null
          notes?: string | null
          npi?: string | null
          resulting_place_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author: string
          created_at: string
          featured: boolean
          id: string
          location: string | null
          photo_url: string | null
          quote: string
          rating: number
          treatment: string | null
        }
        Insert: {
          author: string
          created_at?: string
          featured?: boolean
          id?: string
          location?: string | null
          photo_url?: string | null
          quote: string
          rating?: number
          treatment?: string | null
        }
        Update: {
          author?: string
          created_at?: string
          featured?: boolean
          id?: string
          location?: string | null
          photo_url?: string | null
          quote?: string
          rating?: number
          treatment?: string | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "user"
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
      app_role: ["admin", "owner", "user"],
    },
  },
} as const
