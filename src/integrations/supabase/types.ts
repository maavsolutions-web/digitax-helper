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
      communications: {
        Row: {
          ca_id: string
          client_id: string
          delivered: boolean
          delivery_meta: Json
          id: string
          message_content: string
          message_type: Database["public"]["Enums"]["communication_type"]
          sent_at: string
        }
        Insert: {
          ca_id: string
          client_id: string
          delivered?: boolean
          delivery_meta?: Json
          id?: string
          message_content: string
          message_type?: Database["public"]["Enums"]["communication_type"]
          sent_at?: string
        }
        Update: {
          ca_id?: string
          client_id?: string
          delivered?: boolean
          delivery_meta?: Json
          id?: string
          message_content?: string
          message_type?: Database["public"]["Enums"]["communication_type"]
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_errors: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string
          id: string
          job_name: string
          resolved: boolean
          retry_after: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message: string
          id?: string
          job_name: string
          resolved?: boolean
          retry_after?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string
          id?: string
          job_name?: string
          resolved?: boolean
          retry_after?: string | null
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
      firm_members: {
        Row: {
          accepted_at: string | null
          firm_id: string
          id: string
          invited_at: string
          invited_by: string
          invited_email: string | null
          invited_phone: string | null
          member_user_id: string | null
          role: Database["public"]["Enums"]["firm_role"]
        }
        Insert: {
          accepted_at?: string | null
          firm_id: string
          id?: string
          invited_at?: string
          invited_by: string
          invited_email?: string | null
          invited_phone?: string | null
          member_user_id?: string | null
          role?: Database["public"]["Enums"]["firm_role"]
        }
        Update: {
          accepted_at?: string | null
          firm_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          invited_email?: string | null
          invited_phone?: string | null
          member_user_id?: string | null
          role?: Database["public"]["Enums"]["firm_role"]
        }
        Relationships: []
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
          referral_slug: string | null
          referred_by_ca: string | null
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
          referral_slug?: string | null
          referred_by_ca?: string | null
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
          referral_slug?: string | null
          referred_by_ca?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_snapshots: {
        Row: {
          ca_id: string
          client_id: string
          created_at: string
          health_score: number | null
          id: string
          is_stale: boolean
          report_data: Json
          snapshot_month: string
        }
        Insert: {
          ca_id: string
          client_id: string
          created_at?: string
          health_score?: number | null
          id?: string
          is_stale?: boolean
          report_data?: Json
          snapshot_month: string
        }
        Update: {
          ca_id?: string
          client_id?: string
          created_at?: string
          health_score?: number | null
          id?: string
          is_stale?: boolean
          report_data?: Json
          snapshot_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ca_approved: boolean
          client_id: string | null
          created_at: string
          filing_year: string | null
          health_score: number
          id: string
          key_issues: Json
          last_refreshed_at: string | null
          next_refresh_due: string | null
          owner_user_id: string
          parsed_data: Json
          payable_amount: number | null
          refund_amount: number | null
          risk_alerts: Json
          savings: Json
          status: Database["public"]["Enums"]["report_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          ca_approved?: boolean
          client_id?: string | null
          created_at?: string
          filing_year?: string | null
          health_score: number
          id?: string
          key_issues?: Json
          last_refreshed_at?: string | null
          next_refresh_due?: string | null
          owner_user_id: string
          parsed_data?: Json
          payable_amount?: number | null
          refund_amount?: number | null
          risk_alerts?: Json
          savings?: Json
          status?: Database["public"]["Enums"]["report_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          ca_approved?: boolean
          client_id?: string | null
          created_at?: string
          filing_year?: string | null
          health_score?: number
          id?: string
          key_issues?: Json
          last_refreshed_at?: string | null
          next_refresh_due?: string | null
          owner_user_id?: string
          parsed_data?: Json
          payable_amount?: number | null
          refund_amount?: number | null
          risk_alerts?: Json
          savings?: Json
          status?: Database["public"]["Enums"]["report_status"]
          summary?: string | null
          updated_at?: string
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
      firm_role_for: {
        Args: { _firm_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["firm_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_firm_owner: {
        Args: { _firm_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "individual" | "ca"
      communication_type:
        | "document_request"
        | "reminder"
        | "status_update"
        | "invite"
        | "custom"
      document_type:
        | "form_26as"
        | "ais"
        | "form_16"
        | "investment_proof"
        | "other"
      firm_role: "owner" | "senior" | "junior"
      pipeline_stage:
        | "docs_pending"
        | "processing"
        | "ready_for_review"
        | "awaiting_approval"
        | "filed"
      report_status: "draft" | "final" | "failed" | "processing"
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
      communication_type: [
        "document_request",
        "reminder",
        "status_update",
        "invite",
        "custom",
      ],
      document_type: [
        "form_26as",
        "ais",
        "form_16",
        "investment_proof",
        "other",
      ],
      firm_role: ["owner", "senior", "junior"],
      pipeline_stage: [
        "docs_pending",
        "processing",
        "ready_for_review",
        "awaiting_approval",
        "filed",
      ],
      report_status: ["draft", "final", "failed", "processing"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
