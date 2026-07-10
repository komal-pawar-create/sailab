import { ReactNode, useEffect, useMemo, useState } from "react";
import { FlaskConical, Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CapitalizedInput } from "@/components/ui/capitalized-input";
import { CapitalizedTextarea } from "@/components/ui/capitalized-textarea";
import { PatientSearchSelect } from "@/components/forms/PatientSearchSelect";
import { OperatorSelect } from "@/components/forms/OperatorSelect";
import { PathologyReportEditor } from "@/components/pathology/PathologyReportEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import type { PathologyReportPayload, PathologyResultRow } from "@/lib/pathologyTypes";

interface Patient { id: string; full_name: string; patient_id: string; phone?: string | null; }
interface ReferringDoctor { id: string; doctor_name: string; specialization?: string | null; branch_id?: string | null; }

interface PathologyReportFormProps {
  onReportAdded: () => void;
  preSelectedPatientId?: string;
  reportId?: string;
  trigger?: ReactNode;
}

const today = () => new Date().toISOString().split("T")[0];

const buildDefaultComments = (shortNames: string[]) => {
  const codes = new Set(shortNames.map((value) => value.toUpperCase()));
  const comments: string[] = [];
  if (codes.has("WIDAL")) comments.push("WIDAL INTERPRETATION: A single Widal result should be correlated with clinical findings and local baseline titres. A rising titre in paired samples is more significant.");
  if (codes.has("DENGUE_RAPID")) comments.push("DENGUE RAPID INTERPRETATION: This is a screening test. Correlate clinically and confirm reactive or doubtful results using an appropriate confirmatory method.");
  if (codes.has("MP_RAPID")) comments.push("MALARIA RAPID COMMENTS: This antigen test is an initial screen for P. vivax and P. falciparum. Correlate clinically and confirm reactive or doubtful cases by peripheral smear where required.");
  return comments.join("\n\n");
};

export function PathologyReportForm({ onReportAdded, preSelectedPatientId, reportId, trigger }: PathologyReportFormProps) {
  const { profile } = useAuth();
  const editing = !!reportId;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<ReferringDoctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeLabId, setActiveLabId] = useState<string | null>(null);
  const [payload, setPayload] = useState<PathologyReportPayload | null>(null);
  const [initialTestNames, setInitialTestNames] = useState<string[]>([]);
  const [initialRows, setInitialRows] = useState<PathologyResultRow[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("self");
  const [sampleType, setSampleType] = useState("OUTSIDE");
  const [reportStatus, setReportStatus] = useState("completed");
  const [reportDate, setReportDate] = useState(today());
  const [technician, setTechnician] = useState("");
  const [comments, setComments] = useState("");
  const [commentsTouched, setCommentsTouched] = useState(false);
  const [createBillAfterSave, setCreateBillAfterSave] = useState(false);
  const [paidNow, setPaidNow] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const selectedCount = payload?.selectedTestIds.length ?? 0;
  const totalPrice = payload?.totalPrice ?? 0;
  const canChooseOperator = profile?.role === "admin" || profile?.role === "lab_admin" || profile?.role === "super_admin";

  useEffect(() => { if (open && profile) loadContext(); }, [open, selectedOperator, profile?.branch_id, profile?.lab_id, profile?.user_id]);
  useEffect(() => {
    if (preSelectedPatientId && patients.length) setSelectedPatient(patients.find((item) => item.id === preSelectedPatientId) || null);
  }, [preSelectedPatientId, patients]);
  useEffect(() => { if (payload && !commentsTouched && !editing) setComments(buildDefaultComments(payload.selectedTestShortNames)); }, [payload?.selectedTestShortNames.join("|"), commentsTouched, editing]);

  const loadContext = async () => {
    try {
      let branchId = profile?.branch_id ?? null;
      let labId = profile?.lab_id ?? null;
      if (canChooseOperator && selectedOperator) {
        const { data, error } = await supabase.from("profiles").select("branch_id, lab_id").eq("user_id", selectedOperator).maybeSingle();
        if (error) throw error;
        branchId = data?.branch_id ?? branchId; labId = data?.lab_id ?? labId;
      }
      setActiveBranchId(branchId); setActiveLabId(labId);
      let patientQuery = supabase.from("patients").select("id, full_name, patient_id, phone, branch_id, lab_id").order("created_at", { ascending: false });
      if (branchId) patientQuery = patientQuery.eq("branch_id", branchId); else if (labId) patientQuery = patientQuery.eq("lab_id", labId);
      let doctorQuery = supabase.from("referring_doctors").select("id, doctor_name, specialization, branch_id").eq("is_active", true).order("doctor_name");
      if (labId) doctorQuery = doctorQuery.eq("lab_id", labId);
      const [patientsResult, doctorsResult] = await Promise.all([patientQuery, doctorQuery]);
      if (patientsResult.error) throw patientsResult.error; if (doctorsResult.error) throw doctorsResult.error;
      setPatients((patientsResult.data || []) as Patient[]);
      setDoctors(((doctorsResult.data || []) as ReferringDoctor[]).filter((doctor) => !branchId || !doctor.branch_id || doctor.branch_id === branchId));
      if (editing && reportId) await loadExistingReport(reportId, patientsResult.data || []);
    } catch (error: any) {
      toast({ title: "Unable to load report setup", description: error?.message || "Patients and doctors could not be loaded.", variant: "destructive" });
    }
  };

  const loadExistingReport = async (id: string, contextPatients: any[]) => {
    setLoadingReport(true);
    try {
      const { data, error } = await (supabase as any).from("test_reports").select("*").eq("id", id).single();
      if (error) throw error;
      const report = data as any;
      const resultRows = Array.isArray(report.results) ? report.results as PathologyResultRow[] : [];
      const names = [...new Set(resultRows.map((row) => row.categoryName).filter(Boolean))];
      const patient = (contextPatients as Patient[]).find((item) => item.id === report.patient_id);
      setSelectedPatient(patient || null);
      setSelectedDoctorId(report.referring_doctor_id || "self");
      setSampleType(report.modality || "OUTSIDE"); setReportStatus(report.status || "completed");
      setReportDate(report.test_date || today()); setTechnician(report.technician_name || "");
      setComments(report.study_notes || ""); setCommentsTouched(true);
      setInitialRows(resultRows); setInitialTestNames(names);
    } catch (error: any) {
      toast({ title: "Unable to open report", description: error?.message || "The report could not be loaded.", variant: "destructive" });
      setOpen(false);
    } finally { setLoadingReport(false); }
  };

  const resetForm = () => {
    setPayload(null); setInitialRows([]); setInitialTestNames([]); setSelectedDoctorId("self"); setSampleType("OUTSIDE"); setReportStatus("completed"); setReportDate(today()); setTechnician(profile?.full_name || ""); setComments(""); setCommentsTouched(false); setCreateBillAfterSave(false); setPaidNow("0");
    if (!preSelectedPatientId) setSelectedPatient(null);
  };
  const handleOpenChange = (nextOpen: boolean) => { setOpen(nextOpen); if (!nextOpen) resetForm(); };

  const updateBillAndCommission = async (billId: string, amount: number, patientId: string, doctorId: string | null, paidAmount?: number) => {
    const { data: bill, error: billError } = await (supabase as any).from("bills").select("id, paid_amount").eq("id", billId).single();
    if (billError) throw billError;
    const paid = Number(paidAmount ?? bill.paid_amount ?? 0);
    const items = (payload?.selectedTestShortNames || []).map((name) => ({ description: name, quantity: 1, rate: amount / Math.max(1, payload?.selectedTestIds.length || 1), amount: amount / Math.max(1, payload?.selectedTestIds.length || 1) }));
    const { error } = await (supabase as any).from("bills").update({ total_amount: amount, due_amount: Math.max(0, amount - paid), paid_amount: paid, items, status: paid >= amount ? "paid" : paid > 0 ? "partial" : "pending" }).eq("id", billId);
    if (error) throw error;
    if (!doctorId) return;
    const { data: doctor } = await (supabase as any).from("referring_doctors").select("commission_percentage, commission_type, fixed_commission_amount").eq("id", doctorId).maybeSingle();
    if (!doctor) return;
    const commissionAmount = doctor.commission_type === "percentage" ? amount * Number(doctor.commission_percentage || 0) / 100 : Number(doctor.fixed_commission_amount || 0);
    const { data: existing } = await (supabase as any).from("doctor_commissions").select("id, status").eq("bill_id", billId).eq("status", "pending").maybeSingle();
    const values = { doctor_id: doctorId, patient_id: patientId, bill_amount: amount, commission_rate: doctor.commission_type === "percentage" ? Number(doctor.commission_percentage || 0) : Number(doctor.fixed_commission_amount || 0), commission_amount: commissionAmount };
    if (existing) await (supabase as any).from("doctor_commissions").update(values).eq("id", existing.id); else await (supabase as any).from("doctor_commissions").insert({ ...values, bill_id: billId, lab_id: activeLabId, branch_id: activeBranchId, status: "pending", source: "cloud" });
  };

  const createOrUpdateBill = async (report: any, shouldCreate: boolean, paymentAmount: number) => {
    let billId = report.bill_id as string | null;
    if (!billId && !shouldCreate) return null;
    if (!billId) {
      const { data: billNumber, error: numberError } = await supabase.rpc("generate_bill_number", { p_lab_id: activeLabId! });
      if (numberError) throw numberError;
      const { data: bill, error } = await (supabase as any).from("bills").insert({ bill_number: billNumber, patient_id: report.patient_id, total_amount: totalPrice, due_amount: Math.max(0, totalPrice - paymentAmount), paid_amount: paymentAmount, due_date: report.test_date, items: (payload?.selectedTestShortNames || []).map((name) => ({ description: name, quantity: 1, rate: totalPrice / Math.max(1, selectedCount), amount: totalPrice / Math.max(1, selectedCount) })), lab_id: activeLabId, branch_id: activeBranchId, created_by: report.created_by, status: paymentAmount >= totalPrice ? "paid" : paymentAmount > 0 ? "partial" : "pending", source: "cloud" }).select("id").single();
      if (error) throw error;
      billId = bill.id;
      const { error: linkError } = await (supabase as any).from("test_reports").update({ bill_id: billId }).eq("id", report.id);
      if (linkError) throw linkError;
      if (paymentAmount > 0) {
        const { error: paymentError } = await (supabase as any).from("bill_payments").insert({ bill_id: billId, branch_id: activeBranchId, created_by: report.created_by, payment_amount: paymentAmount, payment_method: paymentMethod, source: "cloud" });
        if (paymentError) throw paymentError;
      }
    } else {
      await updateBillAndCommission(billId, totalPrice, report.patient_id, selectedDoctorId === "self" ? null : selectedDoctorId);
    }
    await updateBillAndCommission(billId, totalPrice, report.patient_id, selectedDoctorId === "self" ? null : selectedDoctorId, billId ? undefined : paymentAmount);
    return billId;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPatient || !activeLabId || !activeBranchId || !payload || !selectedCount || !payload.rows.length) {
      toast({ title: "Report details incomplete", description: "Select a branch, patient, and at least one pathology test.", variant: "destructive" }); return;
    }
    setSaving(true);
    const createdBy = canChooseOperator && selectedOperator ? selectedOperator : profile?.user_id;
    try {
      const { data: saveResult, error: saveError } = await (supabase as any).rpc("save_pathology_report", {
        p_report_id: reportId || null,
        p_patient_id: selectedPatient.id,
        p_branch_id: activeBranchId,
        p_lab_id: activeLabId,
        p_doctor_id: selectedDoctorId === "self" ? null : selectedDoctorId,
        p_test_type: payload.testTypeLabel,
        p_results: payload.rows,
        p_test_date: reportDate,
        p_status: reportStatus,
        p_technician_name: technician || profile?.full_name || "",
        p_modality: sampleType,
        p_study_notes: comments.trim() || null,
        p_total_amount: totalPrice,
        p_created_by: createdBy || null,
        p_create_bill: createBillAfterSave,
        p_paid_amount: Math.min(totalPrice, Math.max(0, Number(paidNow) || 0)),
        p_payment_method: paymentMethod,
      });
      if (saveError) throw saveError;
      const reportIdToGenerate = saveResult?.reportId || reportId;
      if (!reportIdToGenerate) throw new Error("The report was saved without an identifier");
      if (reportStatus === "completed") {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke("generate-pathology-report-pdf", { body: { reportId: reportIdToGenerate } });
        if (pdfError || !pdfData?.success) throw new Error(pdfError?.message || pdfData?.error || "PDF generation failed");
        if (pdfData.pdfUrl) window.open(pdfData.pdfUrl, "_blank", "noopener,noreferrer");
      }
      toast({ title: editing ? "Pathology report updated" : "Pathology report generated", description: `${selectedCount} test${selectedCount === 1 ? "" : "s"} saved for ${selectedPatient.full_name}.` });
      onReportAdded(); handleOpenChange(false);
    } catch (error: any) {
      toast({ title: "Report could not be saved", description: error?.message || "Please review the report and try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const defaultTrigger = <Button><FlaskConical className="mr-2 h-4 w-4" />{editing ? "Edit Pathology Report" : "New Pathology Report"}</Button>;
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="h-[94vh] w-[96vw] max-w-[96vw] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-background px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><DialogTitle>{editing ? "Edit Pathology Report" : "Create Pathology Report"}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Select panels, enter results, and generate the professional pathology report.</p></div><div className="flex items-center gap-2"><Badge variant="outline">Pathology</Badge><Badge variant="secondary">{selectedCount} selected</Badge></div></div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b bg-muted/20 px-4 py-3">{canChooseOperator && <div className="mb-3 max-w-md"><OperatorSelect selectedOperator={selectedOperator} onOperatorChange={setSelectedOperator} /></div>}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-1.5 xl:col-span-2"><Label>Patient *</Label><PatientSearchSelect patients={patients} selectedPatientId={selectedPatient?.id || ""} onPatientSelect={(id) => setSelectedPatient(patients.find((item) => item.id === id) || null)} placeholder="Type patient name, ID, or phone" required /></div>
              <div className="space-y-1.5"><Label>Referring Doctor</Label><Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="self">Self / Walk-in</SelectItem>{doctors.map((doctor) => <SelectItem key={doctor.id} value={doctor.id}>{doctor.doctor_name}{doctor.specialization ? ` - ${doctor.specialization}` : ""}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Sample Type</Label><Select value={sampleType} onValueChange={setSampleType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["OUTSIDE", "INSIDE", "SERUM", "WHOLE BLOOD EDTA", "URINE"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="pathology_test_date">Report Date</Label><CapitalizedInput id="pathology_test_date" name="test_date" type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} capitalize={false} required /></div>
              <div className="space-y-1.5"><Label htmlFor="pathology_technician">Technician</Label><CapitalizedInput id="pathology_technician" name="technician_name" value={technician} onChange={(event) => setTechnician(event.target.value)} placeholder="Technician name" required /></div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">{loadingReport ? <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading report...</div> : <PathologyReportEditor key={`${reportId || "new"}-${open}`} branchId={activeBranchId} labId={activeLabId} initialTestNames={initialTestNames} initialRows={initialRows} onChange={setPayload} onResultsComplete={() => document.getElementById("pathology_comments")?.focus()} />}</div>
          <div className="grid gap-4 border-t bg-background px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div className="space-y-2"><div className="space-y-1.5"><Label htmlFor="pathology_comments">Comments</Label><CapitalizedTextarea id="pathology_comments" name="comments" value={comments} onChange={(event) => { setComments(event.target.value); setCommentsTouched(true); }} rows={2} placeholder="Interpretation or clinical comments" /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={createBillAfterSave} onCheckedChange={(value) => setCreateBillAfterSave(value === true)} />Create or update bill after saving</label>{createBillAfterSave && <div className="flex flex-wrap items-end gap-3"><div className="w-36 space-y-1"><Label>Payment now</Label><CapitalizedInput type="number" min="0" max={totalPrice} value={paidNow} onChange={(event) => setPaidNow(event.target.value)} capitalize={false} /></div><div className="w-40 space-y-1"><Label>Payment method</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["cash", "card", "upi", "bank_transfer"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>}</div><div className="flex flex-col gap-2 sm:flex-row sm:items-end"><div className="min-w-[150px] space-y-1.5"><Label>Report Status</Label><Select value={reportStatus} onValueChange={setReportStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Save Draft</SelectItem><SelectItem value="completed">Final Report</SelectItem></SelectContent></Select></div><div className="rounded-md border bg-muted/30 px-4 py-2 text-right"><div className="text-xs text-muted-foreground">Estimated total</div><div className="text-lg font-semibold">Rs. {totalPrice.toFixed(0)}</div></div><Button type="submit" size="lg" disabled={saving || selectedCount === 0 || !selectedPatient} className="min-w-[220px]">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Saving..." : reportStatus === "completed" ? editing ? "Update & Generate Report" : "Save & Generate Report" : "Save Draft"}</Button></div></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
