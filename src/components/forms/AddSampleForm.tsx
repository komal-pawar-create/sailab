import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { samplesTable } from "@/types/samples";
import { loadSampleTestCatalog, type SampleCatalogOption } from "@/lib/sampleCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PatientSearchSelect } from "./PatientSearchSelect";
import { SampleBarcode } from "@/components/samples/SampleBarcode";

interface AddSampleFormProps {
  onAdded?: () => void;
}

interface PatientOption {
  id: string;
  full_name: string;
  patient_id: string;
  phone?: string | null;
  branch_id?: string | null;
}

interface CreatedSample {
  sampleId: string;
  barcode: string;
  patientName: string;
  patientId: string;
  testType: string;
  collectedAt: string;
}

export function AddSampleForm({ onAdded }: AddSampleFormProps) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [testTypeId, setTestTypeId] = useState("");
  const [slaHours, setSlaHours] = useState("24");
  const [notes, setNotes] = useState("");
  const [testTypes, setTestTypes] = useState<SampleCatalogOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdSample, setCreatedSample] = useState<CreatedSample | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedPatient = patients.find((patient) => patient.id === patientId);
  const selectedTest = testTypes.find((test) => test.id === testTypeId);

  const fetchCatalog = async () => {
    if (!profile) return;
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const [catalog, patientResult] = await Promise.all([
        loadSampleTestCatalog(profile.branch_id || null, profile.lab_id || null),
        (() => {
          let query = supabase
            .from("patients")
            .select("id, full_name, patient_id, phone, branch_id")
            .order("full_name")
            .limit(500);
          if (profile.branch_id) query = query.eq("branch_id", profile.branch_id);
          else if (profile.lab_id) query = query.eq("lab_id", profile.lab_id);
          return query;
        })(),
      ]);
      if (patientResult.error) throw patientResult.error;
      setTestTypes(catalog);
      setPatients((patientResult.data || []) as PatientOption[]);
    } catch (error: any) {
      setCatalogError(error?.message || "Available tests could not be loaded.");
      toast({ title: "Unable to load sample setup", description: error?.message || "Available tests and patients could not be loaded.", variant: "destructive" });
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (open && profile) fetchCatalog();
  }, [open, profile?.branch_id, profile?.lab_id]);

  const resetForm = () => {
    setPatientId("");
    setTestTypeId("");
    setSlaHours("24");
    setNotes("");
    setCreatedSample(null);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const handleSubmit = async () => {
    if (!patientId || !selectedTest || !user || !profile) {
      toast({ title: "Required details missing", description: "Select a patient and test before collecting the sample.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const labId = profile.lab_id;
      if (!labId) throw new Error("Lab ID not found for this operator");
      if (!profile.branch_id) throw new Error("Branch is not assigned to this operator");

      const { data: sampleIdData, error: sequenceError } = await supabase.rpc("get_next_sample_id" as any, { p_lab_id: labId });
      if (sequenceError) throw sequenceError;
      const sampleId = String(sampleIdData || "").trim();
      if (!sampleId) throw new Error("The sample number could not be generated");
      const collectedAt = new Date().toISOString();

      const { error } = await samplesTable().insert({
        sample_id: sampleId,
        patient_id: patientId,
        test_type: selectedTest.test_name,
        barcode: sampleId,
        status: "collected",
        collected_at: collectedAt,
        collected_by: user.id,
        sla_hours: parseInt(slaHours, 10) || 24,
        notes: notes.trim() || null,
        lab_id: labId,
        branch_id: profile.branch_id,
      });
      if (error) throw error;

      setCreatedSample({
        sampleId,
        barcode: sampleId,
        patientName: selectedPatient?.full_name || "Patient",
        patientId: selectedPatient?.patient_id || "",
        testType: selectedTest.test_name,
        collectedAt,
      });
      toast({ title: "Sample collected", description: `${sampleId} is ready for labeling.` });
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      onAdded?.();
    } catch (error: any) {
      toast({ title: "Sample could not be collected", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const emptyCatalog = !catalogLoading && !catalogError && testTypes.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" />Collect Sample</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader><DialogTitle>{createdSample ? "Sample Collected" : "Collect New Sample"}</DialogTitle></DialogHeader>

        {createdSample ? (
          <div className="space-y-4 pt-2">
            <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Sample {createdSample.sampleId} was collected successfully.</AlertDescription></Alert>
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <div className="font-medium">{createdSample.patientName}</div>
              <div className="text-muted-foreground">{createdSample.patientId} | {createdSample.testType}</div>
              <div className="mt-1 text-xs text-muted-foreground">Collected: {format(new Date(createdSample.collectedAt), "dd MMM yyyy, hh:mm a")}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Collect Another</Button>
              <SampleBarcode {...createdSample} buttonText="Print 50 x 25 mm Label" />
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Patient *</Label><PatientSearchSelect patients={patients} selectedPatientId={patientId} onPatientSelect={setPatientId} /></div>

            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Test Type *</Label><Button type="button" variant="ghost" size="sm" onClick={fetchCatalog} disabled={catalogLoading}><RefreshCw className={`mr-1 h-3.5 w-3.5 ${catalogLoading ? "animate-spin" : ""}`} />Refresh</Button></div>
              <Select value={testTypeId} onValueChange={setTestTypeId} disabled={catalogLoading || !!catalogError}>
                <SelectTrigger><SelectValue placeholder={catalogLoading ? "Loading available tests..." : "Select test type"} /></SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {testTypes.map((test) => <SelectItem key={test.id} value={test.id}>{test.short_name ? `${test.short_name} - ` : ""}{test.test_name} ({test.department})</SelectItem>)}
                </SelectContent>
              </Select>
              {catalogError && <Alert variant="destructive"><AlertDescription>{catalogError} Refresh and try again.</AlertDescription></Alert>}
              {emptyCatalog && <Alert><AlertDescription>No active tests configured for this branch. Enable tests in Branch Settings &gt; Test Library.</AlertDescription></Alert>}
            </div>

            <div className="space-y-2"><Label>SLA (hours)</Label><Input type="number" value={slaHours} onChange={(event) => setSlaHours(event.target.value)} min={1} max={720} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes..." rows={3} /></div>
            <Button onClick={handleSubmit} disabled={saving || catalogLoading || !patientId || !selectedTest} className="w-full">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Collecting..." : "Collect Sample"}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
