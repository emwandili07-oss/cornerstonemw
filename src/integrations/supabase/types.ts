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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_notices: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          message: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          message: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_applications: {
        Row: {
          business_name: string | null
          created_at: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["landlord_status"]
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["landlord_status"]
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["landlord_status"]
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user: string
          id: string
          property_id: string | null
          read: boolean
          to_user: string
        }
        Insert: {
          body: string
          created_at?: string
          from_user: string
          id?: string
          property_id?: string | null
          read?: boolean
          to_user: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user?: string
          id?: string
          property_id?: string | null
          read?: boolean
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_notes: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          id_document_url: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id: string
          id_document_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_document_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[]
          bathrooms: number
          bedrooms: number
          cover_image: string | null
          created_at: string
          description: string
          district: string
          featured: boolean
          id: string
          images: string[]
          latitude: number | null
          location: string
          longitude: number | null
          owner_id: string
          price_mwk: number
          property_type: Database["public"]["Enums"]["property_type"]
          purpose: Database["public"]["Enums"]["property_purpose"]
          sqft: number | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          video_url: string | null
          views_count: number
        }
        Insert: {
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          cover_image?: string | null
          created_at?: string
          description?: string
          district: string
          featured?: boolean
          id?: string
          images?: string[]
          latitude?: number | null
          location: string
          longitude?: number | null
          owner_id: string
          price_mwk: number
          property_type: Database["public"]["Enums"]["property_type"]
          purpose: Database["public"]["Enums"]["property_purpose"]
          sqft?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          video_url?: string | null
          views_count?: number
        }
        Update: {
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          cover_image?: string | null
          created_at?: string
          description?: string
          district?: string
          featured?: boolean
          id?: string
          images?: string[]
          latitude?: number | null
          location?: string
          longitude?: number | null
          owner_id?: string
          price_mwk?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          purpose?: Database["public"]["Enums"]["property_purpose"]
          sqft?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_mwk: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          amount_mwk: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          amount_mwk?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
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
      viewing_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          owner_id: string
          preferred_date: string | null
          property_id: string
          seeker_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          owner_id: string
          preferred_date?: string | null
          property_id: string
          seeker_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          owner_id?: string
          preferred_date?: string | null
          property_id?: string
          seeker_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "landlord" | "seeker"
      landlord_status: "pending" | "approved" | "suspended"
      property_purpose: "rent" | "sale"
      property_status: "draft" | "active" | "suspended"
      property_type:
        | "apartment"
        | "house"
        | "villa"
        | "land"
        | "commercial"
        | "office"
      subscription_plan: "landlord_monthly" | "seeker_weekly" | "seeker_monthly"
      subscription_status: "pending" | "active" | "expired" | "rejected"
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
      app_role: ["admin", "landlord", "seeker"],
      landlord_status: ["pending", "approved", "suspended"],
      property_purpose: ["rent", "sale"],
      property_status: ["draft", "active", "suspended"],
      property_type: [
        "apartment",
        "house",
        "villa",
        "land",
        "commercial",
        "office",
      ],
      subscription_plan: [
        "landlord_monthly",
        "seeker_weekly",
        "seeker_monthly",
      ],
      subscription_status: ["pending", "active", "expired", "rejected"],
    },
  },
} as const
