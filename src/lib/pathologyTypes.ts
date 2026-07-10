export interface PathologyTestType {
  id: string;
  test_name: string;
  short_name: string | null;
  library_group: string | null;
  default_price: number | null;
  sort_order: number | null;
  is_enabled?: boolean;
  branch_price?: number | null;
  display_name?: string | null;
}

export interface PathologyParameter {
  id: string;
  global_test_type_id: string;
  parameter_name: string;
  unit: string | null;
  ref_range_min: string | null;
  ref_range_max: string | null;
  ref_range_text: string | null;
  default_value: string | null;
  formula_key: string | null;
  sort_order: number | null;
  is_section_header?: boolean | null;
  override?: {
    parameter_name?: string | null;
    unit?: string | null;
    ref_range_min?: string | null;
    ref_range_max?: string | null;
    ref_range_text?: string | null;
    default_value?: string | null;
  } | null;
}

export interface PathologyResultRow {
  testName: string;
  categoryName: string;
  result: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  sortOrder: number;
  formulaKey?: string | null;
  isCalculated?: boolean;
  isOverridden?: boolean;
  isSectionHeader?: boolean;
}

export interface PathologyReportPayload {
  testTypeLabel: string;
  selectedTestIds: string[];
  selectedTestShortNames: string[];
  rows: PathologyResultRow[];
  totalPrice: number;
}
