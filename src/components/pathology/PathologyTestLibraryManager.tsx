import { useEffect, useMemo, useState } from "react";
import { Edit2, RefreshCw, Search, Save, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import type { PathologyTestType } from "@/lib/pathologyTypes";

interface PathologyTestLibraryManagerProps {
  branchId: string;
  labId?: string | null;
}

type Row = PathologyTestType & {
  settings_id?: string | null;
};

type ParameterRow = {
  id: string;
  parameter_name: string;
  unit: string | null;
  ref_range_min: string | null;
  ref_range_max: string | null;
  ref_range_text: string | null;
  default_value: string | null;
  sort_order: number | null;
  override?: {
    parameter_name?: string | null;
    unit?: string | null;
    ref_range_min?: string | null;
    ref_range_max?: string | null;
    ref_range_text?: string | null;
    default_value?: string | null;
  } | null;
};

const CORE_ENABLED_SHORT_NAMES = new Set(["CBC", "KFT", "LFT", "LIPID", "WIDAL", "URINE", "SUGAR", "THYROID", "SEROLOGY", "DENGUE_RAPID", "BIO", "RA_PANEL", "MP_RAPID"]);

export function PathologyTestLibraryManager({ branchId, labId }: PathologyTestLibraryManagerProps) {
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [parameterTest, setParameterTest] = useState<Row | null>(null);
  const [parameters, setParameters] = useState<ParameterRow[]>([]);
  const [parametersLoading, setParametersLoading] = useState(false);

  useEffect(() => {
    if (branchId) fetchLibrary();
  }, [branchId]);

  const groups = useMemo(() => {
    const set = new Set(rows.map((row) => row.library_group || "General"));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesGroup = group === "all" || (row.library_group || "General") === group;
      const haystack = `${row.short_name ?? ""} ${row.test_name} ${row.library_group ?? ""}`.toLowerCase();
      return matchesGroup && (!q || haystack.includes(q));
    });
  }, [group, rows, search]);

  const fetchLibrary = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [{ data: tests, error: testsError }, { data: settings, error: settingsError }] = await Promise.all([
        (supabase as any)
          .from("global_test_types")
          .select("id, test_name, short_name, library_group, default_price, sort_order")
          .eq("department", "pathology")
          .eq("is_default_library", true)
          .order("sort_order", { ascending: true }),
        (supabase as any)
          .from("branch_test_library_settings")
          .select("id, global_test_type_id, is_enabled, price, display_name")
          .eq("branch_id", branchId),
      ]);
      if (testsError) throw testsError;
      if (settingsError) throw settingsError;

      const settingsByTest = new Map((settings || []).map((setting: any) => [setting.global_test_type_id, setting]));
      setRows((tests || []).map((test: PathologyTestType) => {
        const setting = settingsByTest.get(test.id) as any;
        return {
          ...test,
          settings_id: setting?.id ?? null,
          is_enabled: setting ? !!setting.is_enabled : CORE_ENABLED_SHORT_NAMES.has(test.short_name || ""),
          branch_price: setting?.price ?? test.default_price ?? 0,
          display_name: setting?.display_name ?? "",
        };
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load pathology test library.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocalRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const saveRow = async (row: Row) => {
    if (!branchId || !labId) {
      toast({ title: "Branch missing", description: "Select a valid branch before saving.", variant: "destructive" });
      return;
    }
    setSavingId(row.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        lab_id: labId,
        branch_id: branchId,
        global_test_type_id: row.id,
        is_enabled: !!row.is_enabled,
        price: Number(row.branch_price ?? row.default_price ?? 0),
        display_name: row.display_name || null,
        is_user_modified: true,
        updated_by: userData.user?.id ?? null,
      };

      const { data, error } = await (supabase as any)
        .from("branch_test_library_settings")
        .upsert(payload, { onConflict: "branch_id,global_test_type_id" })
        .select("id")
        .single();
      if (error) throw error;
      updateLocalRow(row.id, { settings_id: data?.id ?? row.settings_id });
      toast({ title: "Saved", description: `${row.test_name} updated for this branch.` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save test setting.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const openParameters = async (row: Row) => {
    setParameterTest(row);
    setParametersLoading(true);
    try {
      const [{ data: defaults, error: defaultsError }, { data: overrides, error: overridesError }] = await Promise.all([
        (supabase as any)
          .from("global_test_parameters")
          .select("id, parameter_name, unit, ref_range_min, ref_range_max, ref_range_text, default_value, sort_order")
          .eq("global_test_type_id", row.id)
          .order("sort_order", { ascending: true }),
        (supabase as any)
          .from("branch_test_parameter_overrides")
          .select("global_parameter_id, parameter_name, unit, ref_range_min, ref_range_max, ref_range_text, default_value")
          .eq("branch_id", branchId),
      ]);
      if (defaultsError) throw defaultsError;
      if (overridesError) throw overridesError;
      const overrideById = new Map((overrides || []).map((override: any) => [override.global_parameter_id, override]));
      setParameters((defaults || []).map((parameter: ParameterRow) => ({ ...parameter, override: overrideById.get(parameter.id) as any })));
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to load parameter ranges.", variant: "destructive" });
    } finally {
      setParametersLoading(false);
    }
  };

  const updateParameter = (id: string, field: keyof NonNullable<ParameterRow["override"]>, value: string) => {
    setParameters((prev) => prev.map((parameter) => {
      if (parameter.id !== id) return parameter;
      return { ...parameter, override: { ...(parameter.override || {}), [field]: value } };
    }));
  };

  const saveParameters = async () => {
    if (!branchId || !labId || !parameterTest) return;
    setParametersLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = parameters.map((parameter) => ({
        lab_id: labId,
        branch_id: branchId,
        global_parameter_id: parameter.id,
        parameter_name: parameter.override?.parameter_name ?? parameter.parameter_name,
        unit: parameter.override?.unit ?? parameter.unit,
        ref_range_min: parameter.override?.ref_range_min ?? parameter.ref_range_min,
        ref_range_max: parameter.override?.ref_range_max ?? parameter.ref_range_max,
        ref_range_text: parameter.override?.ref_range_text ?? parameter.ref_range_text,
        default_value: parameter.override?.default_value ?? parameter.default_value,
        is_user_modified: true,
        updated_by: userData.user?.id ?? null,
      }));
      const { error } = await (supabase as any)
        .from("branch_test_parameter_overrides")
        .upsert(payload, { onConflict: "branch_id,global_parameter_id" });
      if (error) throw error;
      toast({ title: "Saved", description: `${parameterTest.test_name} parameters updated for this branch.` });
      setParameterTest(null);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save parameters.", variant: "destructive" });
    } finally {
      setParametersLoading(false);
    }
  };

  const activeCount = rows.filter((row) => row.is_enabled).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Pathology Test Library</CardTitle>
              <CardDescription>
                Enable tests branch-wise. Only enabled tests appear while creating pathology reports.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchLibrary} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Repair / Reload Library
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_260px_auto] md:items-end">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CBC, dengue, ferritin..." className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "all" ? "All groups" : item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="justify-center py-2">
              {activeCount} enabled / {rows.length} total
            </Badge>
          </div>

          <ScrollArea className="h-[560px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Active</TableHead>
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead className="w-[220px]">Group</TableHead>
                  <TableHead className="w-[140px]">Price</TableHead>
                  <TableHead className="w-[230px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox checked={!!row.is_enabled} onCheckedChange={(checked) => updateLocalRow(row.id, { is_enabled: checked === true })} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.short_name || "-"}</TableCell>
                    <TableCell>
                      <Input
                        value={row.display_name || row.test_name}
                        onChange={(event) => updateLocalRow(row.id, { display_name: event.target.value })}
                      />
                      <div className="mt-1 text-xs text-muted-foreground">Default: {row.test_name}</div>
                    </TableCell>
                    <TableCell>{row.library_group || "General"}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={Number(row.branch_price ?? 0)}
                        onChange={(event) => updateLocalRow(row.id, { branch_price: Number(event.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openParameters(row)}>
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Parameters
                        </Button>
                        <Button size="sm" onClick={() => saveRow(row)} disabled={savingId === row.id}>
                          <Save className="mr-2 h-4 w-4" />
                          {savingId === row.id ? "Saving" : "Save"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No tests match the current filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!parameterTest} onOpenChange={(open) => !open && setParameterTest(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Parameters - {parameterTest?.test_name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Parameter</TableHead>
                  <TableHead className="w-[120px]">Unit</TableHead>
                  <TableHead className="w-[110px]">Min</TableHead>
                  <TableHead className="w-[110px]">Max</TableHead>
                  <TableHead className="min-w-[220px]">Range Text</TableHead>
                  <TableHead className="min-w-[180px]">Default Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parameters.map((parameter) => (
                  <TableRow key={parameter.id}>
                    <TableCell>
                      <Input
                        value={parameter.override?.parameter_name ?? parameter.parameter_name}
                        onChange={(event) => updateParameter(parameter.id, "parameter_name", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parameter.override?.unit ?? parameter.unit ?? ""}
                        onChange={(event) => updateParameter(parameter.id, "unit", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parameter.override?.ref_range_min ?? parameter.ref_range_min ?? ""}
                        onChange={(event) => updateParameter(parameter.id, "ref_range_min", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parameter.override?.ref_range_max ?? parameter.ref_range_max ?? ""}
                        onChange={(event) => updateParameter(parameter.id, "ref_range_max", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parameter.override?.ref_range_text ?? parameter.ref_range_text ?? ""}
                        onChange={(event) => updateParameter(parameter.id, "ref_range_text", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={parameter.override?.default_value ?? parameter.default_value ?? ""}
                        onChange={(event) => updateParameter(parameter.id, "default_value", event.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!parametersLoading && parameters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No parameters found for this test.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParameterTest(null)}>Cancel</Button>
            <Button onClick={saveParameters} disabled={parametersLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Parameters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}