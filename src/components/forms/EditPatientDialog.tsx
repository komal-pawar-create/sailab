import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReferringDoctor {
  id: string;
  doctor_name: string;
  phone: string | null;
}

export interface EditablePatient {
  id: string;
  patient_id: string;
  full_name: string;
  age?: number | null;
  age_in_months?: number | null;
  gender?: string | null;
  phone?: string | null;
  patient_history?: string | null;
  referred_by_doctor_name?: string | null;
  referred_by_doctor_phone?: string | null;
  referring_doctor_id?: string | null;
  lab_id: string;
  branch_id?: string | null;
  created_at?: string;
}

interface EditPatientDialogProps {
  patient: EditablePatient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdated: (patient: EditablePatient) => void;
}

export function EditPatientDialog({ patient, open, onOpenChange, onPatientUpdated }: EditPatientDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [doctorsList, setDoctorsList] = useState<ReferringDoctor[]>([]);
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    ageUnit: "years",
    gender: "",
    phone: "",
    patient_history: "",
    referred_by_doctor_name: "",
    referred_by_doctor_phone: "",
    referring_doctor_id: "",
  });

  useEffect(() => {
    if (!patient || !open) return;

    const ageInMonths = patient.age_in_months;
    const useMonths = typeof ageInMonths === "number" && ageInMonths > 0 && ageInMonths < 12;

    setFormData({
      full_name: patient.full_name || "",
      age: useMonths ? String(ageInMonths) : String(patient.age || ""),
      ageUnit: useMonths ? "months" : "years",
      gender: patient.gender || "",
      phone: patient.phone || "",
      patient_history: patient.patient_history || "",
      referred_by_doctor_name: patient.referred_by_doctor_name || "",
      referred_by_doctor_phone: patient.referred_by_doctor_phone || "",
      referring_doctor_id: patient.referring_doctor_id || "",
    });
  }, [patient, open]);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!patient?.lab_id || !open) return;

      const { data } = await supabase
        .from("referring_doctors" as any)
        .select("id, doctor_name, phone")
        .eq("lab_id", patient.lab_id)
        .eq("is_active", true)
        .order("doctor_name");

      setDoctorsList((data as any as ReferringDoctor[]) || []);
    };

    fetchDoctors();
  }, [patient?.lab_id, open]);

  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const errors: string[] = [];
    const name = formData.full_name.trim();
    const phoneDigits = formData.phone.replace(/\D/g, "");
    const age = Number(formData.age);

    if (!name) errors.push("Patient name is required");
    if (name.length > 100) errors.push("Patient name must be less than 100 characters");
    if (phoneDigits.length !== 10) errors.push("Mobile number must be exactly 10 digits");
    if (!Number.isFinite(age) || age <= 0) errors.push("Age must be a valid positive number");
    if (formData.ageUnit === "years" && age > 150) errors.push("Age must be 150 years or less");
    if (formData.ageUnit === "months" && age > 1800) errors.push("Age must be 1800 months or less");
    if (!["MALE", "FEMALE", "OTHER"].includes(formData.gender)) errors.push("Please select a valid gender");

    return errors;
  };

  const handleSelectDoctor = (doctor: ReferringDoctor) => {
    setFormData((prev) => ({
      ...prev,
      referring_doctor_id: doctor.id,
      referred_by_doctor_name: doctor.doctor_name,
      referred_by_doctor_phone: doctor.phone || "",
    }));
    setDoctorSearchOpen(false);
    setDoctorSearch("");
  };

  const handleClearDoctor = () => {
    setFormData((prev) => ({
      ...prev,
      referring_doctor_id: "",
      referred_by_doctor_name: "",
      referred_by_doctor_phone: "",
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!patient) return;

    const errors = validate();
    if (errors.length) {
      toast({ title: "Validation Error", description: errors.join(". "), variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const age = Number(formData.age);
      const ageInMonths = formData.ageUnit === "years" ? age * 12 : age;
      const payload = {
        full_name: formData.full_name.trim().toUpperCase(),
        age,
        age_in_months: ageInMonths,
        gender: formData.gender,
        phone: formData.phone.replace(/\D/g, ""),
        patient_history: formData.patient_history.trim().toUpperCase() || null,
        referred_by_doctor_name: formData.referred_by_doctor_name.trim().toUpperCase() || null,
        referred_by_doctor_phone: formData.referred_by_doctor_phone.replace(/\D/g, "") || null,
        referring_doctor_id: formData.referring_doctor_id || null,
      };

      const { data, error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", patient.id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Success", description: "Patient details updated successfully." });
      onPatientUpdated(data as EditablePatient);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update patient details.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = doctorsList.filter((doctor) =>
    doctor.doctor_name.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>
        {patient && (
          <ScrollArea className="h-full max-h-[calc(90vh-8rem)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_patient_id">Patient ID</Label>
                <Input id="edit_patient_id" value={patient.patient_id} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Full Name *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(event) => updateForm("full_name", event.target.value.toUpperCase())}
                  placeholder="ENTER FULL NAME"
                  required
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Age *</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="edit_age"
                    type="number"
                    min="1"
                    value={formData.age}
                    onChange={(event) => updateForm("age", event.target.value)}
                    placeholder="Enter age"
                    required
                    className="sm:flex-1"
                  />
                  <RadioGroup
                    value={formData.ageUnit}
                    onValueChange={(value) => updateForm("ageUnit", value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center">
                      <RadioGroupItem value="years" id="edit_age_years" className="mr-1" />
                      <Label htmlFor="edit_age_years" className="cursor-pointer">Years</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="months" id="edit_age_months" className="mr-1" />
                      <Label htmlFor="edit_age_months" className="cursor-pointer">Months</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateForm("gender", value)} required>
                  <SelectTrigger id="edit_gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="MALE">MALE</SelectItem>
                    <SelectItem value="FEMALE">FEMALE</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone">Mobile Number *</Label>
                <Input
                  id="edit_phone"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(event) => updateForm("phone", event.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="ENTER MOBILE NUMBER"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Referred By Doctor</Label>
                {formData.referring_doctor_id ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{formData.referred_by_doctor_name}</span>
                      {formData.referred_by_doctor_phone && (
                        <span className="ml-2 text-muted-foreground">({formData.referred_by_doctor_phone})</span>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearDoctor}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <Popover open={doctorSearchOpen} onOpenChange={setDoctorSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                        {formData.referred_by_doctor_name || "Search or type doctor name..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background z-50" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search registered doctors..."
                          value={doctorSearch}
                          onValueChange={setDoctorSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-center text-sm text-muted-foreground">No registered doctor found.</div>
                          </CommandEmpty>
                          <CommandGroup heading="Registered Doctors">
                            {filteredDoctors.map((doctor) => (
                              <CommandItem key={doctor.id} value={doctor.doctor_name} onSelect={() => handleSelectDoctor(doctor)}>
                                <div>
                                  <div className="text-sm font-medium">{doctor.doctor_name}</div>
                                  {doctor.phone && <div className="text-xs text-muted-foreground">{doctor.phone}</div>}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="border-t p-2">
                        <p className="mb-2 text-xs text-muted-foreground">Or enter manually:</p>
                        <Input
                          value={formData.referred_by_doctor_name}
                          onChange={(event) => updateForm("referred_by_doctor_name", event.target.value.toUpperCase())}
                          placeholder="TYPE DOCTOR NAME"
                          className="text-sm uppercase"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_doctor_phone">Doctor's Mobile Number</Label>
                <Input
                  id="edit_doctor_phone"
                  inputMode="numeric"
                  value={formData.referred_by_doctor_phone}
                  onChange={(event) => updateForm("referred_by_doctor_phone", event.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="ENTER DOCTOR'S PHONE"
                  disabled={!!formData.referring_doctor_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_patient_history">Patient History</Label>
                <Textarea
                  id="edit_patient_history"
                  value={formData.patient_history}
                  onChange={(event) => updateForm("patient_history", event.target.value.toUpperCase())}
                  placeholder="ENTER PATIENT HISTORY"
                  className="min-h-[100px] uppercase"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
