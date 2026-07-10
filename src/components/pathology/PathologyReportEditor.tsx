import { useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { applyPathologyFormulas, isValueOutsideRange } from "@/lib/pathologyFormulaRegistry";
import type { PathologyParameter, PathologyReportPayload, PathologyResultRow, PathologyTestType } from "@/lib/pathologyTypes";

interface PathologyReportEditorProps {
  branchId?: string | null;
  labId?: string | null;
  onChange: (payload: PathologyReportPayload) => void;
  initialTestNames?: string[];
  initialRows?: PathologyResultRow[];
  onResultsComplete?: () => void;
}

const buildRefRange = (parameter: PathologyParameter) => {
  const min = parameter.override?.ref_range_min ?? parameter.ref_range_min;
  const max = parameter.override?.ref_range_max ?? parameter.ref_range_max;
  const text = parameter.override?.ref_range_text ?? parameter.ref_range_text;
  if (text) return text;
  if (min && max) return `${min} - ${max}`;
  if (min) return `>= ${min}`;
  if (max) return `<= ${max}`;
  return "";
};

const parameterName = (parameter: PathologyParameter) => parameter.override?.parameter_name || parameter.parameter_name;
const parameterUnit = (parameter: PathologyParameter) => parameter.override?.unit ?? parameter.unit ?? "";
const parameterRefText = (parameter: PathologyParameter) => parameter.override?.ref_range_text ?? parameter.ref_range_text ?? "";
export const resolvePathologyDefault = (parameter: PathologyParameter) => {
  const configuredDefault = parameter.override?.default_value ?? parameter.default_value ?? "";
  if (configuredDefault) return configuredDefault;

  const name = parameterName(parameter).trim().toLowerCase();
  const rangeText = parameterRefText(parameter);
  const lowerRange = rangeText.toLowerCase();

  if (["method", "interpretation", "comments"].includes(name)) return rangeText;
  if (lowerRange.includes("nil")) return "Nil";
  if (lowerRange.includes("negative")) return "Negative";
  if (lowerRange.includes("non-reactive")) return "Non-Reactive";
  if (lowerRange.includes("clear")) return "Clear";
  if (lowerRange.includes("pale straw")) return "Pale Straw";
  return "";
};
const CORE_ENABLED_SHORT_NAMES = new Set(["CBC", "KFT", "LFT", "LIPID", "WIDAL", "URINE", "SUGAR", "THYROID", "SEROLOGY", "DENGUE_RAPID", "BIO", "RA_PANEL", "MP_RAPID"]);

export function PathologyReportEditor({ branchId, labId, onChange, initialTestNames = [], initialRows = [], onResultsComplete }: PathologyReportEditorProps) {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<PathologyTestType[]>([]);
  const [parameters, setParameters] = useState<PathologyParameter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<PathologyResultRow[]>([]);
  const [search, setSearch] = useState("");
  const initialRowsRef = useRef(initialRows);
  const hydratedRef = useRef(false);
  const resultInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const selectedTests = useMemo(
    () => selectedIds.map((id) => tests.find((test) => test.id === id)).filter(Boolean) as PathologyTestType[],
    [selectedIds, tests],
  );

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((test) => {
      if (!q) return true;
      return `${test.short_name ?? ""} ${test.test_name} ${test.library_group ?? ""}`.toLowerCase().includes(q);
    });
  }, [search, tests]);

  useEffect(() => {
    if (branchId) {
      hydratedRef.current = false;
      initialRowsRef.current = initialRows;
      fetchEnabledLibrary();
    }
  }, [branchId]);

  useEffect(() => {
    rebuildRows();
  }, [selectedIds, parameters]);

  useEffect(() => {
    emitChange(rows);
  }, [rows, selectedIds, tests]);

  const fetchEnabledLibrary = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data: globalRows, error: globalError } = await (supabase as any)
        .from("global_test_types")
        .select("id, test_name, short_name, library_group, default_price, sort_order")
        .eq("department", "pathology")
        .eq("is_default_library", true)
        .order("sort_order", { ascending: true });
      if (globalError) throw globalError;

      const ids = (globalRows || []).map((row: PathologyTestType) => row.id);
      const [{ data: settings, error: settingsError }, { data: params, error: paramsError }, { data: overrides, error: overridesError }] = await Promise.all([
        (supabase as any)
          .from("branch_test_library_settings")
          .select("global_test_type_id, is_enabled, price, display_name")
          .eq("branch_id", branchId),
        ids.length
          ? (supabase as any)
              .from("global_test_parameters")
              .select("*")
              .in("global_test_type_id", ids)
              .order("sort_order", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        branchId
          ? (supabase as any)
              .from("branch_test_parameter_overrides")
              .select("global_parameter_id, parameter_name, unit, ref_range_min, ref_range_max, ref_range_text, default_value")
              .eq("branch_id", branchId)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (settingsError) throw settingsError;
      if (paramsError) throw paramsError;
      if (overridesError) throw overridesError;

      const settingsByTest = new Map((settings || []).map((setting: any) => [setting.global_test_type_id, setting]));
      const overrideByParam = new Map((overrides || []).map((override: any) => [override.global_parameter_id, override]));

      const mergedTests = (globalRows || [])
        .map((test: PathologyTestType) => {
          const setting = settingsByTest.get(test.id) as any;
          const enabled = setting ? !!setting.is_enabled : CORE_ENABLED_SHORT_NAMES.has(test.short_name || "");
          return {
            ...test,
            is_enabled: enabled,
            branch_price: setting?.price ?? test.default_price ?? 0,
            display_name: setting?.display_name ?? null,
          };
        })
        .filter((test: PathologyTestType) => test.is_enabled);

      setTests(mergedTests);
      setParameters((params || []).map((param: PathologyParameter) => ({ ...param, override: overrideByParam.get(param.id) as any })));

      const byName = new Map<string, PathologyTestType>();
      mergedTests.forEach((test: PathologyTestType) => {
        [test.short_name, test.test_name, test.display_name].filter(Boolean).forEach((name) => {
          byName.set(String(name).trim().toLowerCase(), test);
        });
      });
      const initialIds = initialTestNames
        .map((name) => byName.get(name.trim().toLowerCase())?.id)
        .filter((id): id is string => !!id)
        .filter((id, index, ids) => ids.indexOf(id) === index);
      if (!hydratedRef.current) {
        setSelectedIds(initialIds);
        setRows(initialRowsRef.current || []);
        hydratedRef.current = true;
      }
    } catch (error: any) {
      toast({
        title: "Pathology library unavailable",
        description: error?.message || "Failed to load enabled pathology tests for this branch.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rebuildRows = () => {
    const selectedSet = new Set(selectedIds);
    const selectedById = new Map(tests.map((test) => [test.id, test]));
    const previousRows = rows.length > 0 ? rows : initialRowsRef.current;
    const previousByKey = new Map(previousRows.map((row) => [`${row.categoryName}|${row.testName}`, row]));
    const nextRows: PathologyResultRow[] = [];

    selectedIds.forEach((testId, testIndex) => {
      if (!selectedSet.has(testId)) return;
      const test = selectedById.get(testId);
      if (!test) return;
      const categoryName = test.display_name || test.test_name;
      const testParameters = parameters
        .filter((parameter) => parameter.global_test_type_id === testId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      testParameters.forEach((parameter) => {
        const sortOrder = (testIndex + 1) * 1000 + (parameter.sort_order ?? 0);
        const name = parameterName(parameter);
        const previous = previousByKey.get(`${categoryName}|${name}`);
        const refRange = buildRefRange(parameter);
        const result = previous?.result ?? resolvePathologyDefault(parameter);
        nextRows.push({
          testName: name,
          categoryName,
          result,
          unit: parameterUnit(parameter),
          refRange,
          isAbnormal: previous?.isAbnormal ?? isValueOutsideRange(result, refRange),
          sortOrder,
          formulaKey: parameter.formula_key,
          isCalculated: previous?.isCalculated ?? false,
          isOverridden: previous?.isOverridden ?? false,
          isSectionHeader: !!parameter.is_section_header,
        });
      });
    });

    setRows(applyPathologyFormulas(nextRows));
  };

  const emitChange = (nextRows: PathologyResultRow[]) => {
    const testTypeLabel = selectedTests.map((test) => test.display_name || test.test_name).join(", ");
    const totalPrice = selectedTests.reduce((sum, test) => sum + Number(test.branch_price ?? test.default_price ?? 0), 0);
    onChange({
      testTypeLabel,
      selectedTestIds: selectedIds,
      selectedTestShortNames: selectedTests.map((test) => test.short_name || test.test_name),
      rows: nextRows,
      totalPrice,
    });
  };

  const toggleTest = (testId: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, testId] : prev.filter((id) => id !== testId)));
  };

  const updateRow = (index: number, field: "result" | "isAbnormal", value: string | boolean) => {
    setRows((prev) => {
      const next = prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === "result") {
          updated.isAbnormal = isValueOutsideRange(String(value), row.refRange);
          if (row.formulaKey) {
            updated.isOverridden = true;
            updated.isCalculated = false;
          }
        }
        return updated;
      });
      return applyPathologyFormulas(next);
    });
  };

  const moveResultFocus = (index: number, direction: -1 | 1) => {
    let nextIndex = index + direction;
    while (nextIndex >= 0 && nextIndex < rows.length && !resultInputRefs.current[nextIndex]) {
      nextIndex += direction;
    }
    if (nextIndex >= 0 && nextIndex < rows.length) {
      requestAnimationFrame(() => {
        const input = resultInputRefs.current[nextIndex];
        input?.focus();
        input?.select();
      });
    } else if (direction === 1) {
      onResultsComplete?.();
    }
  };

  const handleResultKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    moveResultFocus(index, event.shiftKey ? -1 : 1);
  };

  const selectedPrice = selectedTests.reduce((sum, test) => sum + Number(test.branch_price ?? test.default_price ?? 0), 0);

  return (
    <div className="rounded-lg border bg-muted/20">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label className="text-base font-semibold">Pathology Test Library</Label>
          <p className="text-xs text-muted-foreground">Enabled branch tests are shown here. Enable more from Branch Settings &gt; Test Library.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={fetchEnabledLibrary} disabled={loading || !branchId}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="border-b p-3 lg:border-b-0 lg:border-r">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tests..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-2">
              {filteredTests.map((test) => {
                const checked = selectedIds.includes(test.id);
                return (
                  <label
                    key={test.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md border bg-background p-2 text-sm hover:bg-accent"
                  >
                    <Checkbox checked={checked} onCheckedChange={(value) => toggleTest(test.id, value === true)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{test.short_name ? `${test.short_name} - ` : ""}{test.display_name || test.test_name}</span>
                      <span className="block text-xs text-muted-foreground">{test.library_group || "Pathology"} | Rs. {Number(test.branch_price ?? 0).toFixed(0)}</span>
                    </span>
                  </label>
                );
              })}
              {!loading && filteredTests.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No enabled tests found for this branch.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{selectedIds.length} selected</span>
            <Badge variant="secondary">Rs. {selectedPrice.toFixed(0)}</Badge>
          </div>
        </div>

        <div className="min-w-0 p-3">
          <div className="overflow-x-auto rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Parameter</TableHead>
                  <TableHead className="min-w-[180px]">Result</TableHead>
                  <TableHead className="w-[120px]">Unit</TableHead>
                  <TableHead className="min-w-[180px]">Reference Range</TableHead>
                  <TableHead className="w-[90px]">Abnormal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Select one or more pathology tests to load parameters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={`${row.categoryName}-${row.testName}-${row.sortOrder}`} className={row.isSectionHeader ? "bg-muted/70" : undefined}>
                      <TableCell className={row.isSectionHeader ? "font-semibold uppercase text-muted-foreground" : "font-medium"}>
                        {row.isSectionHeader ? row.testName.replace(/-/g, "").trim() : row.testName}
                        <div className="text-xs font-normal text-muted-foreground">{row.categoryName}</div>
                      </TableCell>
                      <TableCell>
                        {row.isSectionHeader ? (
                          <span className="text-xs text-muted-foreground">Section</span>
                        ) : (
                          <Input
                            ref={(input) => { resultInputRefs.current[index] = input; }}
                            value={row.result}
                            onChange={(event) => updateRow(index, "result", event.target.value)}
                            onKeyDown={(event) => handleResultKeyDown(event, index)}
                            aria-label={`${row.categoryName} ${row.testName} result`}
                            className={row.isAbnormal ? "border-destructive text-destructive" : ""}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.unit}</TableCell>
                      <TableCell className="text-sm">{row.refRange}</TableCell>
                      <TableCell>
                        {!row.isSectionHeader && (
                          <Checkbox checked={row.isAbnormal} onCheckedChange={(value) => updateRow(index, "isAbnormal", value === true)} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
