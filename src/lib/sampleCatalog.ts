import { supabase } from "@/integrations/supabase/client";

export interface SampleCatalogOption {
  id: string;
  test_name: string;
  short_name: string | null;
  department: string;
  library_group: string | null;
  sort_order: number;
  price: number | null;
  source: "branch" | "global";
}

const departmentOrder: Record<string, number> = {
  pathology: 1,
  radiology: 2,
  sonography: 3,
};

const keyFor = (test: { short_name?: string | null; test_name: string }) =>
  (test.short_name || test.test_name).trim().toLowerCase();

/** Loads the same active branch/global catalog used by the other diagnostic workflows. */
export async function loadSampleTestCatalog(branchId: string | null, labId: string | null) {
  let localQuery = supabase
    .from("test_types")
    .select("id, test_name, short_name, department, library_group, sort_order, price, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("test_name", { ascending: true });
  if (branchId) localQuery = localQuery.eq("branch_id", branchId);
  else if (labId) localQuery = localQuery.eq("lab_id", labId);

  const [localResult, globalResult, settingResult] = await Promise.all([
    localQuery,
    supabase
      .from("global_test_types")
      .select("id, test_name, short_name, department, library_group, sort_order, default_price, is_active, is_default_library")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("test_name", { ascending: true }),
    branchId
      ? (supabase as any)
          .from("branch_test_library_settings")
          .select("global_test_type_id, is_enabled, price, display_name")
          .eq("branch_id", branchId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (localResult.error) throw localResult.error;
  if (globalResult.error) throw globalResult.error;
  if (settingResult.error) throw settingResult.error;

  const settings = new Map<string, any>((settingResult.data || []).map((setting: any) => [setting.global_test_type_id, setting]));
  const hasBranchLibrarySettings = settings.size > 0;
  const merged = new Map<string, SampleCatalogOption>();

  for (const local of (localResult.data || []) as any[]) {
    merged.set(keyFor(local), {
      id: local.id,
      test_name: local.test_name,
      short_name: local.short_name || null,
      department: local.department || "Pathology",
      library_group: local.library_group || null,
      sort_order: Number(local.sort_order || 0),
      price: local.price ?? null,
      source: "branch",
    });
  }

  for (const global of (globalResult.data || []) as any[]) {
    const setting = settings.get(global.id);
    const isPathologyLibrary = String(global.department || "").toLowerCase() === "pathology" && global.is_default_library;
    if (isPathologyLibrary && hasBranchLibrarySettings && !setting?.is_enabled) continue;
    if (merged.has(keyFor(global))) continue;
    merged.set(keyFor(global), {
      id: global.id,
      test_name: setting?.display_name || global.test_name,
      short_name: global.short_name || null,
      department: global.department || "Pathology",
      library_group: global.library_group || null,
      sort_order: Number(global.sort_order || 0),
      price: setting?.price ?? global.default_price ?? null,
      source: "global",
    });
  }

  return [...merged.values()].sort((a, b) =>
    (departmentOrder[a.department.toLowerCase()] || 99) - (departmentOrder[b.department.toLowerCase()] || 99)
    || a.sort_order - b.sort_order
    || a.test_name.localeCompare(b.test_name),
  );
}
