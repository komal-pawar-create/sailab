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
      alert_history: {
        Row: {
          id: string
          metric_value: number
          notification_error: string | null
          notification_sent: boolean
          resolved_at: string | null
          rule_id: string
          triggered_at: string
        }
        Insert: {
          id?: string
          metric_value: number
          notification_error?: string | null
          notification_sent?: boolean
          resolved_at?: string | null
          rule_id: string
          triggered_at?: string
        }
        Update: {
          id?: string
          metric_value?: number
          notification_error?: string | null
          notification_sent?: boolean
          resolved_at?: string | null
          rule_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          comparison: string
          created_at: string
          id: string
          is_active: boolean
          metric_type: string
          notification_channels: string[] | null
          rule_name: string
          threshold_value: number
          time_window_minutes: number
          updated_at: string
        }
        Insert: {
          comparison?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metric_type: string
          notification_channels?: string[] | null
          rule_name: string
          threshold_value: number
          time_window_minutes?: number
          updated_at?: string
        }
        Update: {
          comparison?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metric_type?: string
          notification_channels?: string[] | null
          rule_name?: string
          threshold_value?: number
          time_window_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          error_message: string | null
          id: string
          reminder_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id: string
          error_message?: string | null
          id?: string
          reminder_type: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string
          error_message?: string | null
          id?: string
          reminder_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          assigned_collector: string | null
          branch_id: string | null
          collection_address: string | null
          collection_latitude: number | null
          collection_longitude: number | null
          collection_phone: string | null
          created_at: string | null
          created_by: string
          id: string
          lab_id: string
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          status: string
          test_types: string[] | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          assigned_collector?: string | null
          branch_id?: string | null
          collection_address?: string | null
          collection_latitude?: number | null
          collection_longitude?: number | null
          collection_phone?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          lab_id: string
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          status?: string
          test_types?: string[] | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          assigned_collector?: string | null
          branch_id?: string | null
          collection_address?: string | null
          collection_latitude?: number | null
          collection_longitude?: number | null
          collection_phone?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          lab_id?: string
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          status?: string
          test_types?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          branch_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          lab_id: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string
          user_id: string
          user_role: string
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          lab_id?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email: string
          user_id: string
          user_role: string
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          lab_id?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_number_sequences: {
        Row: {
          created_at: string | null
          id: string
          lab_id: string
          last_sequence: number
          updated_at: string | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lab_id: string
          last_sequence?: number
          updated_at?: string | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lab_id?: string
          last_sequence?: number
          updated_at?: string | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_number_sequences_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          bill_id: string
          branch_id: string | null
          created_at: string
          created_by: string
          id: string
          is_refund: boolean | null
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          reference_number: string | null
          refund_reason: string | null
        }
        Insert: {
          bill_id: string
          branch_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_refund?: boolean | null
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          refund_reason?: string | null
        }
        Update: {
          bill_id?: string
          branch_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_refund?: boolean | null
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          refund_reason?: string | null
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
            foreignKeyName: "fk_bill_payments_bill"
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
          discount_amount: number | null
          discount_type: string | null
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
          discount_amount?: number | null
          discount_type?: string | null
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
          discount_amount?: number | null
          discount_type?: string | null
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
            foreignKeyName: "bills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
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
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          bill_print_with_header: boolean
          branch_code: string
          city: string | null
          created_at: string
          created_by: string
          footer_text: string | null
          gst_number: string | null
          id: string
          lab_id: string | null
          letterhead_url: string | null
          location: string | null
          logo_url: string | null
          name: string
          organization_id: string
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
          bill_print_with_header?: boolean
          branch_code: string
          city?: string | null
          created_at?: string
          created_by: string
          footer_text?: string | null
          gst_number?: string | null
          id?: string
          lab_id?: string | null
          letterhead_url?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          organization_id: string
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
          bill_print_with_header?: boolean
          branch_code?: string
          city?: string | null
          created_at?: string
          created_by?: string
          footer_text?: string | null
          gst_number?: string | null
          id?: string
          lab_id?: string | null
          letterhead_url?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string
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
      data_clear_logs: {
        Row: {
          cleared_at: string
          cleared_by: string
          deleted_counts: Json
          id: string
          lab_id: string
          lab_name: string
          options: Json
        }
        Insert: {
          cleared_at?: string
          cleared_by: string
          deleted_counts: Json
          id?: string
          lab_id: string
          lab_name: string
          options: Json
        }
        Update: {
          cleared_at?: string
          cleared_by?: string
          deleted_counts?: Json
          id?: string
          lab_id?: string
          lab_name?: string
          options?: Json
        }
        Relationships: []
      }
      demo_videos: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          display_order: number | null
          duration: string | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_type: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_type: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_type?: string
          video_url?: string
        }
        Relationships: []
      }
      doctor_commissions: {
        Row: {
          bill_amount: number
          bill_id: string
          branch_id: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          doctor_id: string
          id: string
          lab_id: string
          patient_id: string
          settled_in_settlement_id: string | null
          status: string | null
        }
        Insert: {
          bill_amount?: number
          bill_id: string
          branch_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          doctor_id: string
          id?: string
          lab_id: string
          patient_id: string
          settled_in_settlement_id?: string | null
          status?: string | null
        }
        Update: {
          bill_amount?: number
          bill_id?: string
          branch_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          doctor_id?: string
          id?: string
          lab_id?: string
          patient_id?: string
          settled_in_settlement_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_commissions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_commissions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_commissions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "referring_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_commissions_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_commissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_commissions_settlement_fkey"
            columns: ["settled_in_settlement_id"]
            isOneToOne: false
            referencedRelation: "doctor_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_settlements: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          doctor_id: string
          id: string
          lab_id: string
          notes: string | null
          payment_method: string | null
          period_from: string | null
          period_to: string | null
          reference_number: string | null
          settlement_date: string
          total_amount: number
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id: string
          id?: string
          lab_id: string
          notes?: string | null
          payment_method?: string | null
          period_from?: string | null
          period_to?: string | null
          reference_number?: string | null
          settlement_date?: string
          total_amount?: number
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string
          id?: string
          lab_id?: string
          notes?: string | null
          payment_method?: string | null
          period_from?: string | null
          period_to?: string | null
          reference_number?: string | null
          settlement_date?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_settlements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_settlements_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "referring_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_settlements_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          generated_pdf_url: string | null
          id: string
          lab_id: string
          metadata: Json | null
          original_document_id: string | null
          template_type: string
          template_url: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          generated_pdf_url?: string | null
          id?: string
          lab_id: string
          metadata?: Json | null
          original_document_id?: string | null
          template_type: string
          template_url: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          generated_pdf_url?: string | null
          id?: string
          lab_id?: string
          metadata?: Json | null
          original_document_id?: string | null
          template_type?: string
          template_url?: string
          updated_at?: string
        }
        Relationships: []
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
      endpoint_metrics: {
        Row: {
          endpoint: string
          id: string
          lab_id: string | null
          method: string
          recorded_at: string
          response_time_ms: number
          status_code: number
        }
        Insert: {
          endpoint: string
          id?: string
          lab_id?: string | null
          method?: string
          recorded_at?: string
          response_time_ms: number
          status_code: number
        }
        Update: {
          endpoint?: string
          id?: string
          lab_id?: string | null
          method?: string
          recorded_at?: string
          response_time_ms?: number
          status_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_metrics_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          branch_id: string | null
          created_at: string
          endpoint: string | null
          error_code: string
          id: string
          lab_id: string | null
          message: string
          metadata: Json | null
          severity: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          endpoint?: string | null
          error_code: string
          id?: string
          lab_id?: string | null
          message: string
          metadata?: Json | null
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          endpoint?: string | null
          error_code?: string
          id?: string
          lab_id?: string | null
          message?: string
          metadata?: Json | null
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_logs_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      global_test_types: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          test_name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          test_name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          test_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lab_license_alerts: {
        Row: {
          alert_type: string
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          lab_id: string
          sent_at: string | null
          sent_to: string
          status: string | null
        }
        Insert: {
          alert_type: string
          channel: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lab_id: string
          sent_at?: string | null
          sent_to: string
          status?: string | null
        }
        Update: {
          alert_type?: string
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lab_id?: string
          sent_at?: string | null
          sent_to?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_license_alerts_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          admin_mobile_number: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          city: string | null
          created_at: string
          footer_text: string | null
          gst_number: string | null
          id: string
          initials: string
          last_license_alert_sent_at: string | null
          letterhead_url: string | null
          license_document_url: string | null
          license_expiry_date: string | null
          license_issue_date: string | null
          license_notes: string | null
          license_number: string | null
          license_reminder_days: number | null
          license_status: string | null
          license_type: string | null
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
          admin_mobile_number?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          footer_text?: string | null
          gst_number?: string | null
          id?: string
          initials: string
          last_license_alert_sent_at?: string | null
          letterhead_url?: string | null
          license_document_url?: string | null
          license_expiry_date?: string | null
          license_issue_date?: string | null
          license_notes?: string | null
          license_number?: string | null
          license_reminder_days?: number | null
          license_status?: string | null
          license_type?: string | null
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
          admin_mobile_number?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          footer_text?: string | null
          gst_number?: string | null
          id?: string
          initials?: string
          last_license_alert_sent_at?: string | null
          letterhead_url?: string | null
          license_document_url?: string | null
          license_expiry_date?: string | null
          license_issue_date?: string | null
          license_notes?: string | null
          license_number?: string | null
          license_reminder_days?: number | null
          license_status?: string | null
          license_type?: string | null
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
      landing_benefits: {
        Row: {
          benefit_text: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          benefit_text: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          benefit_text?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      landing_cta: {
        Row: {
          button_text: string | null
          button_url: string | null
          footer_text: string | null
          id: string
          is_active: boolean | null
          section_key: string
          subtitle: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          section_key: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      landing_faqs: {
        Row: {
          answer: string
          answer_hi: string | null
          answer_mr: string | null
          category: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          question_hi: string | null
          question_mr: string | null
        }
        Insert: {
          answer: string
          answer_hi?: string | null
          answer_mr?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          question_hi?: string | null
          question_mr?: string | null
        }
        Update: {
          answer?: string
          answer_hi?: string | null
          answer_mr?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          question_hi?: string | null
          question_mr?: string | null
        }
        Relationships: []
      }
      landing_features: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon_name: string
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      landing_footer: {
        Row: {
          brand_name: string
          copyright_text: string
          id: string
          is_active: boolean | null
          nav_links: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          brand_name?: string
          copyright_text?: string
          id?: string
          is_active?: boolean | null
          nav_links?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          brand_name?: string
          copyright_text?: string
          id?: string
          is_active?: boolean | null
          nav_links?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      landing_hero: {
        Row: {
          badge_text: string | null
          cta_primary_text: string | null
          cta_secondary_text: string | null
          id: string
          is_active: boolean | null
          main_headline: string | null
          sub_headline: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          badge_text?: string | null
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          id?: string
          is_active?: boolean | null
          main_headline?: string | null
          sub_headline?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          badge_text?: string | null
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          id?: string
          is_active?: boolean | null
          main_headline?: string | null
          sub_headline?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      landing_pricing: {
        Row: {
          amc_price: number
          created_at: string | null
          created_by: string | null
          discount: number | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_enterprise: boolean | null
          is_popular: boolean | null
          min_labs: number | null
          name: string
          price: number
        }
        Insert: {
          amc_price: number
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_enterprise?: boolean | null
          is_popular?: boolean | null
          min_labs?: number | null
          name: string
          price: number
        }
        Update: {
          amc_price?: number
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_enterprise?: boolean | null
          is_popular?: boolean | null
          min_labs?: number | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      landing_sections: {
        Row: {
          content: string
          id: string
          is_active: boolean | null
          section_key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: string
          id?: string
          is_active?: boolean | null
          section_key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          is_active?: boolean | null
          section_key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      landing_stats: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          suffix: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          suffix?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          suffix?: string | null
          value?: number
        }
        Relationships: []
      }
      landing_steps: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          step_number: number
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          step_number: number
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          step_number?: number
          title?: string
        }
        Relationships: []
      }
      landing_testimonials: {
        Row: {
          avatar_initials: string | null
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          rating: number | null
          role: string | null
          testimonial_text: string
        }
        Insert: {
          avatar_initials?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          rating?: number | null
          role?: string | null
          testimonial_text: string
        }
        Update: {
          avatar_initials?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          rating?: number | null
          role?: string | null
          testimonial_text?: string
        }
        Relationships: []
      }
      landing_tour_steps: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon_name: string
          id: string
          is_active: boolean | null
          mockup_type: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          mockup_type: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          mockup_type?: string
          title?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          lead_id: string
          new_status: string | null
          old_status: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          lead_id: string
          new_status?: string | null
          old_status?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          lead_id?: string
          new_status?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          converted_to_lab_id: string | null
          created_at: string | null
          created_by: string
          demo_date: string | null
          expected_value: number | null
          follow_up_date: string | null
          id: string
          lab_name: string
          last_activity_at: string | null
          location: string | null
          notes: string | null
          priority: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          converted_to_lab_id?: string | null
          created_at?: string | null
          created_by: string
          demo_date?: string | null
          expected_value?: number | null
          follow_up_date?: string | null
          id?: string
          lab_name: string
          last_activity_at?: string | null
          location?: string | null
          notes?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          converted_to_lab_id?: string | null
          created_at?: string | null
          created_by?: string
          demo_date?: string | null
          expected_value?: number | null
          follow_up_date?: string | null
          id?: string
          lab_name?: string
          last_activity_at?: string | null
          location?: string | null
          notes?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_to_lab_id_fkey"
            columns: ["converted_to_lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
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
      password_reset_otps: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          mobile_number: string
          otp_code: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          mobile_number: string
          otp_code: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          mobile_number?: string
          otp_code?: string
          used?: boolean | null
          user_id?: string
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
          {
            foreignKeyName: "fk_patient_followups_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
          age_in_months: number | null
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
          referred_by_doctor_name: string | null
          referred_by_doctor_phone: string | null
          referring_doctor_id: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          age_in_months?: number | null
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
          referred_by_doctor_name?: string | null
          referred_by_doctor_phone?: string | null
          referring_doctor_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          age_in_months?: number | null
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
          referred_by_doctor_name?: string | null
          referred_by_doctor_phone?: string | null
          referring_doctor_id?: string | null
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
          {
            foreignKeyName: "patients_referring_doctor_id_fkey"
            columns: ["referring_doctor_id"]
            isOneToOne: false
            referencedRelation: "referring_doctors"
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
          is_active: boolean | null
          lab_id: string | null
          last_login_at: string | null
          mobile_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          lab_id?: string | null
          last_login_at?: string | null
          mobile_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          lab_id?: string | null
          last_login_at?: string | null
          mobile_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
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
      referring_doctors: {
        Row: {
          branch_id: string | null
          commission_percentage: number | null
          commission_type: string | null
          created_at: string | null
          created_by: string | null
          doctor_name: string
          email: string | null
          fixed_commission_amount: number | null
          id: string
          is_active: boolean | null
          lab_id: string
          phone: string | null
          specialization: string | null
        }
        Insert: {
          branch_id?: string | null
          commission_percentage?: number | null
          commission_type?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_name: string
          email?: string | null
          fixed_commission_amount?: number | null
          id?: string
          is_active?: boolean | null
          lab_id: string
          phone?: string | null
          specialization?: string | null
        }
        Update: {
          branch_id?: string | null
          commission_percentage?: number | null
          commission_type?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_name?: string
          email?: string | null
          fixed_commission_amount?: number | null
          id?: string
          is_active?: boolean | null
          lab_id?: string
          phone?: string | null
          specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referring_doctors_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referring_doctors_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_id_sequences: {
        Row: {
          date_key: string
          id: string
          lab_id: string
          last_number: number
        }
        Insert: {
          date_key: string
          id?: string
          lab_id: string
          last_number?: number
        }
        Update: {
          date_key?: string
          id?: string
          lab_id?: string
          last_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sample_id_sequences_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          barcode: string
          bill_id: string | null
          branch_id: string | null
          collected_at: string
          collected_by: string
          completed_at: string | null
          created_at: string
          id: string
          lab_id: string
          notes: string | null
          patient_id: string
          processing_at: string | null
          received_at: string | null
          received_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sample_id: string
          sla_breached: boolean
          sla_hours: number
          status: string
          test_report_id: string | null
          test_type: string
          updated_at: string
        }
        Insert: {
          barcode: string
          bill_id?: string | null
          branch_id?: string | null
          collected_at?: string
          collected_by: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lab_id: string
          notes?: string | null
          patient_id: string
          processing_at?: string | null
          received_at?: string | null
          received_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sample_id: string
          sla_breached?: boolean
          sla_hours?: number
          status?: string
          test_report_id?: string | null
          test_type: string
          updated_at?: string
        }
        Update: {
          barcode?: string
          bill_id?: string | null
          branch_id?: string | null
          collected_at?: string
          collected_by?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lab_id?: string
          notes?: string | null
          patient_id?: string
          processing_at?: string | null
          received_at?: string | null
          received_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sample_id?: string
          sla_breached?: boolean
          sla_hours?: number
          status?: string
          test_report_id?: string | null
          test_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_test_report_id_fkey"
            columns: ["test_report_id"]
            isOneToOne: false
            referencedRelation: "test_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean | null
          billing_cycle: string | null
          created_at: string | null
          created_by: string
          currency: string | null
          end_date: string | null
          id: string
          lab_id: string
          notes: string | null
          payment_method: string | null
          plan_name: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          created_by: string
          currency?: string | null
          end_date?: string | null
          id?: string
          lab_id: string
          notes?: string | null
          payment_method?: string | null
          plan_name: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          lab_id?: string
          notes?: string | null
          payment_method?: string | null
          plan_name?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          id: string
          lab_id: string | null
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          recorded_at: string
          status: string
        }
        Insert: {
          id?: string
          lab_id?: string | null
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          recorded_at?: string
          status?: string
        }
        Update: {
          id?: string
          lab_id?: string | null
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          recorded_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_health_lab_id_fkey"
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
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity_at: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      walk_in_tokens: {
        Row: {
          branch_id: string
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          id: string
          lab_id: string
          patient_id: string | null
          patient_name: string
          patient_phone: string
          service_type: string
          status: string
          token_date: string
          token_number: number
        }
        Insert: {
          branch_id: string
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          lab_id: string
          patient_id?: string | null
          patient_name: string
          patient_phone: string
          service_type?: string
          status?: string
          token_date?: string
          token_number: number
        }
        Update: {
          branch_id?: string
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          lab_id?: string
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string
          service_type?: string
          status?: string
          token_date?: string
          token_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "walk_in_tokens_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_in_tokens_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_in_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_daily_stats: {
        Row: {
          branch_id: string | null
          collections: number | null
          document_count: number | null
          jpeg_count: number | null
          lab_id: string | null
          patient_count: number | null
          pending_reports: number | null
          revenue: number | null
          stat_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_login_rate_limit: {
        Args: { p_ip_address: unknown; p_username: string }
        Returns: Json
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_error_logs: { Args: never; Returns: number }
      cleanup_test_environment: { Args: never; Returns: Json }
      clear_lab_data: {
        Args: {
          p_clear_bills?: boolean
          p_clear_documents?: boolean
          p_clear_feedback?: boolean
          p_clear_followups?: boolean
          p_clear_patients?: boolean
          p_clear_payments?: boolean
          p_clear_sequences?: boolean
          p_clear_test_reports?: boolean
          p_clear_test_types?: boolean
          p_lab_id: string
        }
        Returns: Json
      }
      create_user_session: {
        Args: {
          p_expires_at: string
          p_ip_address: unknown
          p_token_hash: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: string
      }
      generate_bill_number: { Args: { p_lab_id: string }; Returns: string }
      generate_patient_id: {
        Args: { p_branch_id: string; p_lab_id: string }
        Returns: string
      }
      get_current_lab_id: { Args: never; Returns: string }
      get_dashboard_stats: {
        Args: {
          p_branch_ids?: string[]
          p_date_from?: string
          p_date_to?: string
          p_lab_id: string
        }
        Returns: Json
      }
      get_email_by_username: {
        Args: { input_username: string }
        Returns: string
      }
      get_monitoring_metrics: {
        Args: { p_lab_id?: string; p_time_range?: string }
        Returns: Json
      }
      get_next_patient_id: {
        Args: { p_branch_id: string; p_lab_id: string }
        Returns: string
      }
      get_next_sample_id: { Args: { p_lab_id: string }; Returns: string }
      get_next_token_number: {
        Args: { p_branch_id: string; p_token_date: string }
        Returns: number
      }
      get_user_branch: { Args: { user_id: string }; Returns: string }
      get_user_by_username: {
        Args: { p_username: string }
        Returns: {
          admin_mobile: string
          email: string
          lab_id: string
          mobile_number: string
          user_id: string
        }[]
      }
      get_user_lab: { Args: { user_id: string }; Returns: string }
      get_user_organization: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      is_lab_admin: { Args: { user_id: string }; Returns: boolean }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      log_application_error: {
        Args: {
          p_branch_id?: string
          p_endpoint?: string
          p_error_code: string
          p_lab_id?: string
          p_message: string
          p_metadata?: Json
          p_severity?: string
          p_stack_trace?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
      log_login_attempt: {
        Args: {
          p_failure_reason?: string
          p_ip_address: unknown
          p_success: boolean
          p_user_agent: string
          p_user_id?: string
          p_username: string
        }
        Returns: string
      }
      logout_user: {
        Args: {
          p_logout_all?: boolean
          p_session_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      prepare_bills_partitioning: { Args: never; Returns: string }
      preview_bill_number: { Args: { p_lab_id: string }; Returns: string }
      preview_patient_id: {
        Args: { p_branch_id: string; p_lab_id: string }
        Returns: string
      }
      record_health_check: {
        Args: {
          p_metadata?: Json
          p_metric_type: string
          p_metric_value: number
          p_status: string
        }
        Returns: string
      }
      refresh_daily_stats: { Args: never; Returns: undefined }
      refresh_user_session: { Args: { p_token_hash: string }; Returns: Json }
      setup_test_environment: { Args: never; Returns: Json }
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
