import { supabase } from "@/integrations/supabase/client";

export interface Sample {
  id: string;
  sample_id: string;
  patient_id: string;
  bill_id: string | null;
  test_report_id: string | null;
  test_type: string;
  barcode: string;
  status: string;
  rejection_reason: string | null;
  collected_at: string;
  collected_by: string;
  received_at: string | null;
  received_by: string | null;
  processing_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  sla_hours: number;
  sla_breached: boolean;
  notes: string | null;
  lab_id: string;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SampleWithPatient extends Sample {
  patients: { id: string; full_name: string; patient_id: string } | null;
}

export type SampleInsert = Omit<Sample, 'id' | 'created_at' | 'updated_at' | 'sla_breached'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  sla_breached?: boolean;
};

export type SampleUpdate = Partial<Omit<Sample, 'id'>>;

/**
 * Typed helper for querying the `samples` table which isn't in the generated Supabase types.
 */
export function samplesTable() {
  return (supabase.from("samples" as any) as any);
}
