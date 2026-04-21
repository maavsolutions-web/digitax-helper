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
      clients: {
        Row: {
          ca_id: string
          created_at: string
          full_name: string
          health_score: number | null
          id: string
          income_type: string | null
          last_activity_at: string
          pan: string | null
          risk: Database["public"]["Enums"]["risk_level"]
          source_user_id: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
        }
        Insert: {
          ca_id: string
          created_at?: string
          full_name: string
          health_score?: number | null
          id?: string
          income_type?: string | null
          last_activity_at?: string
          pan?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          source_user_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
        }
        Update: {
          ca_id?: string
          created_at?: string
          full_name?: string
          health_score?: number | null
          id?: string
          income_type?: string | null
          last_activity_at?: string
          pan?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          source_user_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string | null
          id: string
          owner_user_id: string
          size_bytes: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path?: string | null
          id?: string
          owner_user_id: string
          size_bytes?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string | null
          id?: string
          owner_user_id?: string
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          ca_id: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          body: string
          ca_id: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          body?: string
          ca_id?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          firm_name: string | null
          full_name: string | null
          id: string
          income_type: string | null
          pan: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          firm_name?: string | null
          full_name?: string | null
          id: string
          income_type?: string | null
          pan?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          firm_name?: string | null
          full_name?: string | null
          id?: string
          income_type?: string | null
          pan?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_id: string | null
          created_at: string
          health_score: number
          id: string
          key_issues: Json
          owner_user_id: string
          payable_amount: number | null
          refund_amount: number | null
          risk_alerts: Json
          savings: Json
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          health_score: number
          id?: string
          key_issues?: Json
          owner_user_id: string
          payable_amount?: number | null
          refund_amount?: number | null
          risk_alerts?: Json
          savings?: Json
        }
        Update: {
          client_id?: string | null
          created_at?: string
          health_score?: number
          id?: string
          key_issues?: Json
          owner_user_id?: string
          payable_amount?: number | null
          refund_amount?: number | null
          risk_alerts?: Json
          savings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      app_role: "individual" | "ca"
      document_type:
        | "form_26as"
        | "ais"
        | "form_16"
        | "investment_proof"
        | "other"
      pipeline_stage:
        | "docs_pending"
        | "processing"
        | "ready_for_review"
        | "awaiting_approval"
        | "filed"
      risk_level: "low" | "medium" | "high"
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
      app_role: ["individual", "ca"],
      document_type: [
        "form_26as",
        "ais",
        "form_16",
        "investment_proof",
        "other",
      ],
      pipeline_stage: [
        "docs_pending",
        "processing",
        "ready_for_review",
        "awaiting_approval",
        "filed",
      ],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
