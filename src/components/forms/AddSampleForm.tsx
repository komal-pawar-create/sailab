import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PatientSearchSelect } from "./PatientSearchSelect";

interface AddSampleFormProps {
  onAdded?: () => void;
}

export function AddSampleForm({ onAdded }: AddSampleFormProps) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [testType, setTestType] = useState("");
  const [slaHours, setSlaHours] = useState("24");
  const [notes, setNotes] = useState("");
  const [testTypes, setTestTypes] = useState<{ id: string; test_name: string }[]>([]);
  const [patients, setPatients] = useState<{ id: string; full_name: string; patient_id: string; phone?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchTestTypes = async () => {
    const [ttRes, pRes] = await Promise.all([
      supabase.from("test_types").select("id, test_name").order("test_name"),
      supabase.from("patients").select("id, full_name, patient_id, phone").order("full_name").limit(500),
    ]);
    setTestTypes(ttRes.data || []);
    setPatients(pRes.data || []);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) fetchTestTypes();
  };

  const handleSubmit = async () => {
    if (!patientId || !testType || !user || !profile) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const labId = profile.lab_id;
      if (!labId) throw new Error("Lab ID not found");

      // Generate sample_id via DB function
      const { data: sampleIdData, error: seqError } = await supabase.rpc(
        "get_next_sample_id" as any,
        { p_lab_id: labId }
      );
      if (seqError) throw seqError;

      const barcode = crypto.randomUUID();

      const { error } = await (supabase.from("samples" as any) as any).insert({
        sample_id: sampleIdData,
        patient_id: patientId,
        test_type: testType,
        barcode,
        status: "collected",
        collected_at: new Date().toISOString(),
        collected_by: user.id,
        sla_hours: parseInt(slaHours) || 24,
        notes: notes || null,
        lab_id: labId,
        branch_id: profile.branch_id || null,
      });

      if (error) throw error;

      toast({ title: "Success", description: `Sample ${sampleIdData} collected` });
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      onAdded?.();
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPatientId("");
    setTestType("");
    setSlaHours("24");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Collect Sample
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Collect New Sample</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Patient *</Label>
            <PatientSearchSelect
              patients={patients}
              selectedPatientId={patientId}
              onPatientSelect={setPatientId}
            />
          </div>

          <div className="space-y-2">
            <Label>Test Type *</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {testTypes.map((tt) => (
                  <SelectItem key={tt.id} value={tt.test_name}>
                    {tt.test_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>SLA (hours)</Label>
            <Input
              type="number"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              min={1}
              max={720}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Collecting..." : "Collect Sample"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
