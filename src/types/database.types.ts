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
      access_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          resource_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string | null
          esignature_api_id: string | null
          family_group_id: string | null
          id: string
          is_primary_lead: boolean | null
          stripe_checkout_id: string | null
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          esignature_api_id?: string | null
          family_group_id?: string | null
          id?: string
          is_primary_lead?: boolean | null
          stripe_checkout_id?: string | null
          total_value: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          esignature_api_id?: string | null
          family_group_id?: string | null
          id?: string
          is_primary_lead?: boolean | null
          stripe_checkout_id?: string | null
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dependents: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          parent_user_id: string
          type: string
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          parent_user_id: string
          type: string
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          parent_user_id?: string
          type?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependents_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          error_log: string | null
          id: string
          payload: Json
          processed_at: string | null
          retry_count: number
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          error_log?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
          type: string
        }
        Update: {
          created_at?: string | null
          error_log?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
          type?: string
        }
        Relationships: []
      }
      family_groups: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          source: string | null
          status: string | null
          triage_answers: Json
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          source?: string | null
          status?: string | null
          triage_answers?: Json
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          source?: string | null
          status?: string | null
          triage_answers?: Json
          whatsapp?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          erp_sync_status: string
          id: string
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          erp_sync_status?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          erp_sync_status?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string | null
          id: string
          status_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          consent_date: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          gdpr_consent: boolean | null
          id: string
          lead_id: string | null
          name: string | null
          needs_password_update: boolean | null
          payment_status: string | null
          privacy_policy_version: string | null
          rg: string | null
          role: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          consent_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          gdpr_consent?: boolean | null
          id: string
          lead_id?: string | null
          name?: string | null
          needs_password_update?: boolean | null
          payment_status?: string | null
          privacy_policy_version?: string | null
          rg?: string | null
          role?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          consent_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          gdpr_consent?: boolean | null
          id?: string
          lead_id?: string | null
          name?: string | null
          needs_password_update?: boolean | null
          payment_status?: string | null
          privacy_policy_version?: string | null
          rg?: string | null
          role?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string | null
          expiration_date: string
          family_group_id: string | null
          id: string
          uuid: string
        }
        Insert: {
          created_at?: string | null
          expiration_date: string
          family_group_id?: string | null
          id?: string
          uuid?: string
        }
        Update: {
          created_at?: string | null
          expiration_date?: string
          family_group_id?: string | null
          id?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          order_index: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
