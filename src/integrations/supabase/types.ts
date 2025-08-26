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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bill_payments: {
        Row: {
          bill_id: string
          branch_id: string | null
          created_at: string
          created_by: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          reference_number: string | null
        }
        Insert: {
          bill_id: string
          branch_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
        }
        Update: {
          bill_id?: string
          branch_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bill_payments_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_date: string
          bill_number: string
          branch_id: string | null
          created_at: string
          created_by: string
          due_amount: number
          due_date: string
          id: string
          items: Json
          lab_id: string
          notes: string | null
          paid_amount: number | null
          patient_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_date?: string
          bill_number: string
          branch_id?: string | null
          created_at?: string
          created_by: string
          due_amount: number
          due_date: string
          id?: string
          items?: Json
          lab_id: string
          notes?: string | null
          paid_amount?: number | null
          patient_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          bill_date?: string
          bill_number?: string
          branch_id?: string | null
          created_at?: string
          created_by?: string
          due_amount?: number
          due_date?: string
          id?: string
          items?: Json
          lab_id?: string
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bills_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          branch_code: string
          city: string | null
          created_at: string
          created_by: string
          id: string
          lab_id: string | null
          location: string | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          branch_code: string
          city?: string | null
          created_at?: string
          created_by: string
          id?: string
          lab_id?: string | null
          location?: string | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          branch_code?: string
          city?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lab_id?: string | null
          location?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_branches_lab"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_branches_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          branch_id: string | null
          created_at: string
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string
          id: string
          lab_id: string
          patient_id: string
          uploaded_by: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          id?: string
          lab_id: string
          patient_id: string
          uploaded_by: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          id?: string
          lab_id?: string
          patient_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          feedback_type: string
          id: string
          lab_id: string
          message: string
          patient_id: string | null
          rating: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          feedback_type: string
          id?: string
          lab_id: string
          message: string
          patient_id?: string | null
          rating?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          feedback_type?: string
          id?: string
          lab_id?: string
          message?: string
          patient_id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_feedback_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          city: string | null
          created_at: string
          footer_text: string | null
          gst_number: string | null
          id: string
          initials: string
          location: string | null
          logo_url: string | null
          name: string
          organization_id: string | null
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          signature_url: string | null
          state: string | null
          terms_conditions: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          footer_text?: string | null
          gst_number?: string | null
          id?: string
          initials: string
          location?: string | null
          logo_url?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          signature_url?: string | null
          state?: string | null
          terms_conditions?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          footer_text?: string | null
          gst_number?: string | null
          id?: string
          initials?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          signature_url?: string | null
          state?: string | null
          terms_conditions?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_labs_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_followups: {
        Row: {
          assigned_to: string
          branch_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          details: string | null
          due_at: string
          id: string
          lab_id: string
          patient_id: string
          priority: string
          remind_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          branch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          details?: string | null
          due_at: string
          id?: string
          lab_id: string
          patient_id: string
          priority?: string
          remind_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          branch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          details?: string | null
          due_at?: string
          id?: string
          lab_id?: string
          patient_id?: string
          priority?: string
          remind_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_followups_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_id_sequences: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          last_sequence: number
          sequence_date: string
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          last_sequence?: number
          sequence_date: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          last_sequence?: number
          sequence_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_id_sequences_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          branch_id: string | null
          created_at: string
          created_by: string
          full_name: string
          gender: string | null
          id: string
          lab_id: string
          patient_history: string | null
          patient_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          branch_id?: string | null
          created_at?: string
          created_by: string
          full_name: string
          gender?: string | null
          id?: string
          lab_id: string
          patient_history?: string | null
          patient_id: string
          phone: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          branch_id?: string | null
          created_at?: string
          created_by?: string
          full_name?: string
          gender?: string | null
          id?: string
          lab_id?: string
          patient_history?: string | null
          patient_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_patients_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          lab_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          lab_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          lab_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reports: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          id: string
          lab_id: string
          patient_id: string
          results: Json | null
          status: string
          technician_name: string | null
          test_date: string
          test_type: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          lab_id: string
          patient_id: string
          results?: Json | null
          status?: string
          technician_name?: string | null
          test_date: string
          test_type: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lab_id?: string
          patient_id?: string
          results?: Json | null
          status?: string
          technician_name?: string | null
          test_date?: string
          test_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_test_reports_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      test_types: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          id: string
          lab_id: string
          test_name: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          lab_id: string
          test_name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lab_id?: string
          test_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_patient_id: {
        Args: { p_branch_id: string; p_lab_id: string }
        Returns: string
      }
      get_next_patient_id: {
        Args: { p_branch_id: string; p_lab_id: string }
        Returns: string
      }
      get_user_branch: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_lab: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_organization: {
        Args: { user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      is_lab_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role:
        | "admin"
        | "operator_1"
        | "operator_2"
        | "operator_3"
        | "super_admin"
        | "lab_admin"
        | "branch_operator"
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
      user_role: [
        "admin",
        "operator_1",
        "operator_2",
        "operator_3",
        "super_admin",
        "lab_admin",
        "branch_operator",
      ],
    },
  },
} as const
