import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Loader2 } from 'lucide-react';
import { OperatorSelect } from './OperatorSelect';
import { FeatureTooltip } from '@/components/ui/feature-tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ReferringDoctor {
  id: string;
  doctor_name: string;
  phone: string | null;
}

interface AddPatientFormProps {
  onPatientAdded: () => void;
}

export const AddPatientForm = ({ onPatientAdded }: AddPatientFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: '',
    full_name: '',
    age: '',
    ageUnit: 'years',
    gender: '',
    phone: '',
    patient_history: '',
    referred_by_doctor_name: '',
    referred_by_doctor_phone: '',
    referring_doctor_id: '' as string,
  });

  const [selectedOperator, setSelectedOperator] = useState('');
  const [operatorLabId, setOperatorLabId] = useState<string | null>(null);
  const [operatorBranchId, setOperatorBranchId] = useState<string | null>(null);

  // Doctor search
  const [doctorsList, setDoctorsList] = useState<ReferringDoctor[]>([]);
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');

  // Fetch registered doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!profile?.lab_id) return;
      const { data } = await supabase
        .from('referring_doctors' as any)
        .select('id, doctor_name, phone')
        .eq('lab_id', profile.lab_id)
        .eq('is_active', true)
        .order('doctor_name');
      setDoctorsList((data as any as ReferringDoctor[]) || []);
    };
    if (open) fetchDoctors();
  }, [open, profile?.lab_id]);

  // Fetch operator's lab and branch when selected (for admins/lab_admins)
  useEffect(() => {
    const fetchOperatorDetails = async () => {
      if (selectedOperator && profile?.role && ['admin', 'lab_admin'].includes(profile.role)) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('lab_id, branch_id')
            .eq('user_id', selectedOperator)
            .single();

          if (error) throw error;
          
          setOperatorLabId(data.lab_id);
          setOperatorBranchId(data.branch_id);
        } catch (error: any) {
          console.error('Error fetching operator details:', error);
          setOperatorLabId(null);
          setOperatorBranchId(null);
        }
      } else {
        setOperatorLabId(null);
        setOperatorBranchId(null);
      }
    };

    fetchOperatorDetails();
  }, [selectedOperator, profile]);

  // Generate preview patient ID when dialog opens or operator changes
  useEffect(() => {
    const generatePreviewPatientId = async () => {
      if (!open) return;

      let targetLabId: string | null = null;
      let targetBranchId: string | null = null;

      if (profile?.role && ['admin', 'lab_admin'].includes(profile.role)) {
        if (selectedOperator && operatorLabId && operatorBranchId) {
          targetLabId = operatorLabId;
          targetBranchId = operatorBranchId;
        } else {
          setFormData(prev => ({ ...prev, patient_id: '' }));
          return;
        }
      } else {
        if (profile?.lab_id && profile?.branch_id) {
          targetLabId = profile.lab_id;
          targetBranchId = profile.branch_id;
        } else {
          toast({
            title: "Configuration Error",
            description: "Your profile is missing lab or branch assignment. Please contact an administrator.",
            variant: "destructive",
          });
          return;
        }
      }

      setGeneratingId(true);
      try {
        const { data, error } = await supabase
          .rpc('preview_patient_id', {
            p_branch_id: targetBranchId,
            p_lab_id: targetLabId
          });

        if (error) throw error;
        setFormData(prev => ({ ...prev, patient_id: data }));
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to generate patient ID preview: " + error.message,
          variant: "destructive",
        });
      } finally {
        setGeneratingId(false);
      }
    };

    generatePreviewPatientId();
  }, [open, profile, selectedOperator, operatorLabId, operatorBranchId, toast]);

  const validatePatientData = (): string[] => {
    const errors: string[] = [];
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) errors.push('Phone number must be exactly 10 digits');
    const trimmedName = formData.full_name.trim();
    if (trimmedName.length < 2) errors.push('Patient name must be at least 2 characters');
    if (trimmedName.length > 100) errors.push('Patient name must be less than 100 characters');
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 0 || age > 150) errors.push('Age must be between 0 and 150');
    if (!formData.gender || !['MALE', 'FEMALE', 'OTHER'].includes(formData.gender)) errors.push('Please select a valid gender');
    return errors;
  };

  const handleSelectDoctor = (doctor: ReferringDoctor) => {
    setFormData(prev => ({
      ...prev,
      referring_doctor_id: doctor.id,
      referred_by_doctor_name: doctor.doctor_name,
      referred_by_doctor_phone: doctor.phone || '',
    }));
    setDoctorSearchOpen(false);
  };

  const handleClearDoctor = () => {
    setFormData(prev => ({
      ...prev,
      referring_doctor_id: '',
      referred_by_doctor_name: '',
      referred_by_doctor_phone: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validatePatientData();
    if (validationErrors.length > 0) {
      toast({ title: "Validation Error", description: validationErrors.join('. '), variant: "destructive" });
      return;
    }
    
    setLoading(true);

    try {
      let targetLabId: string | null = null;
      let targetBranchId: string | null = null;
      let createdBy: string | undefined = profile?.user_id;

      if (profile?.role && ['admin', 'lab_admin'].includes(profile.role)) {
        if (!selectedOperator || !operatorLabId || !operatorBranchId) {
          toast({ title: "Operator Required", description: "Please select an operator before adding a patient.", variant: "destructive" });
          setLoading(false);
          return;
        }
        targetLabId = operatorLabId;
        targetBranchId = operatorBranchId;
        createdBy = selectedOperator;
      } else {
        if (!profile?.lab_id || !profile?.branch_id) {
          toast({ title: "Configuration Error", description: "Your profile is missing lab or branch assignment.", variant: "destructive" });
          setLoading(false);
          return;
        }
        targetLabId = profile.lab_id;
        targetBranchId = profile.branch_id;
      }

      const ageInMonths = formData.ageUnit === 'years'
        ? parseInt(formData.age) * 12
        : parseInt(formData.age);

      const { data: actualPatientId, error: idError } = await supabase
        .rpc('generate_patient_id', { p_branch_id: targetBranchId, p_lab_id: targetLabId });
      if (idError) throw idError;

      const insertData: any = {
        patient_id: actualPatientId,
        full_name: formData.full_name.toUpperCase(),
        age: parseInt(formData.age),
        age_in_months: ageInMonths,
        gender: formData.gender,
        phone: formData.phone,
        patient_history: formData.patient_history?.toUpperCase() || null,
        referred_by_doctor_name: formData.referred_by_doctor_name?.toUpperCase() || null,
        referred_by_doctor_phone: formData.referred_by_doctor_phone || null,
        referring_doctor_id: formData.referring_doctor_id || null,
        lab_id: targetLabId,
        branch_id: targetBranchId,
        created_by: createdBy,
      };

      const { error } = await supabase.from('patients').insert(insertData);
      if (error) throw error;

      toast({ title: "Success", description: "Patient added successfully" });

      setFormData({
        patient_id: '', full_name: '', age: '', ageUnit: 'years', gender: '',
        phone: '', patient_history: '', referred_by_doctor_name: '',
        referred_by_doctor_phone: '', referring_doctor_id: '',
      });
      setSelectedOperator('');
      setOpen(false);
      onPatientAdded();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        patient_id: '', full_name: '', age: '', ageUnit: 'years', gender: '',
        phone: '', patient_history: '', referred_by_doctor_name: '',
        referred_by_doctor_phone: '', referring_doctor_id: '',
      });
      setSelectedOperator('');
    }
    setOpen(newOpen);
  };

  const filteredDoctors = doctorsList.filter(d =>
    d.doctor_name.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <FeatureTooltip featureKey="add-patient" title="Register Patients" description="Add new patients to your lab's database. Patient IDs are auto-generated based on your branch settings." side="bottom">
        <DialogTrigger asChild>
          <Button data-tour="add-patient">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </DialogTrigger>
      </FeatureTooltip>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <OperatorSelect selectedOperator={selectedOperator} onOperatorChange={setSelectedOperator} />
            
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient ID (Auto-generated)</Label>
              <div className="relative">
                <CapitalizedInput
                  id="patient_id"
                  value={formData.patient_id}
                  placeholder={
                    generatingId ? "Generating..."
                      : (profile?.role && ['admin', 'lab_admin'].includes(profile.role) && !selectedOperator)
                        ? "Select operator to generate ID" : "Auto-generated"
                  }
                  disabled
                  className="pr-10"
                  capitalize={false}
                />
                {generatingId && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <CapitalizedInput id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="ENTER FULL NAME" required />
            </div>
            
            <div className="space-y-2">
              <Label>Age *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CapitalizedInput id="age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Enter age" required capitalize={false} />
                </div>
                <RadioGroup value={formData.ageUnit} onValueChange={(value) => setFormData({ ...formData, ageUnit: value })} className="flex gap-4">
                  <div className="flex items-center">
                    <RadioGroupItem value="years" id="years" className="mr-1" />
                    <Label htmlFor="years" className="cursor-pointer">Years</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="months" id="months" className="mr-1" />
                    <Label htmlFor="months" className="cursor-pointer">Months</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} required>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="MALE">MALE</SelectItem>
                  <SelectItem value="FEMALE">FEMALE</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <CapitalizedInput id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="ENTER PHONE NUMBER" required capitalize={false} />
            </div>

            {/* Doctor Referral - Searchable Select */}
            <div className="space-y-2">
              <Label>Referred By Doctor</Label>
              {formData.referring_doctor_id ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{formData.referred_by_doctor_name}</span>
                    {formData.referred_by_doctor_phone && (
                      <span className="text-muted-foreground ml-2">({formData.referred_by_doctor_phone})</span>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearDoctor} className="text-xs">
                    Change
                  </Button>
                </div>
              ) : (
                <Popover open={doctorSearchOpen} onOpenChange={setDoctorSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground" type="button">
                      {formData.referred_by_doctor_name || 'Search or type doctor name...'}
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
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No registered doctor found.
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Registered Doctors">
                          {filteredDoctors.map(doc => (
                            <CommandItem
                              key={doc.id}
                              value={doc.doctor_name}
                              onSelect={() => handleSelectDoctor(doc)}
                            >
                              <div>
                                <div className="font-medium text-sm">{doc.doctor_name}</div>
                                {doc.phone && <div className="text-xs text-muted-foreground">{doc.phone}</div>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <div className="border-t p-2">
                      <p className="text-xs text-muted-foreground mb-2">Or enter manually:</p>
                      <CapitalizedInput
                        value={formData.referred_by_doctor_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, referred_by_doctor_name: e.target.value, referring_doctor_id: '' }))}
                        placeholder="TYPE DOCTOR NAME"
                        className="text-sm"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referred_by_doctor_phone">Doctor's Mobile Number</Label>
              <CapitalizedInput
                id="referred_by_doctor_phone"
                value={formData.referred_by_doctor_phone}
                onChange={(e) => setFormData({ ...formData, referred_by_doctor_phone: e.target.value })}
                placeholder="ENTER DOCTOR'S PHONE"
                capitalize={false}
                disabled={!!formData.referring_doctor_id}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patient_history">Patient History *</Label>
              <CapitalizedTextarea id="patient_history" value={formData.patient_history} onChange={(e) => setFormData({ ...formData, patient_history: e.target.value })} placeholder="ENTER PATIENT HISTORY" required className="min-h-[100px]" />
            </div>
            
            <Button
              type="submit"
              disabled={loading || (profile?.role && ['admin', 'lab_admin'].includes(profile.role) && !selectedOperator)}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Patient'}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
