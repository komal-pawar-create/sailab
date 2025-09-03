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
    referred_by_doctor_phone: ''
  });

  const [selectedOperator, setSelectedOperator] = useState('');

  // Generate preview patient ID when dialog opens
  useEffect(() => {
    const generatePreviewPatientId = async () => {
      if (open && profile?.branch_id && profile?.lab_id) {
        setGeneratingId(true);
        try {
          const { data, error } = await supabase
            .rpc('preview_patient_id', {
              p_branch_id: profile.branch_id,
              p_lab_id: profile.lab_id
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
      }
    };

    generatePreviewPatientId();
  }, [open, profile, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert age to months for storage
      const ageInMonths = formData.ageUnit === 'years' 
        ? parseInt(formData.age) * 12 
        : parseInt(formData.age);

      // Generate actual patient ID (consumes sequence)
      const { data: actualPatientId, error: idError } = await supabase
        .rpc('generate_patient_id', {
          p_branch_id: profile?.branch_id,
          p_lab_id: profile?.lab_id
        });

      if (idError) throw idError;

      const { error } = await supabase
        .from('patients')
        .insert({
          patient_id: actualPatientId,
          full_name: formData.full_name.toUpperCase(),
          age: parseInt(formData.age), // Keep original age for legacy compatibility
          age_in_months: ageInMonths,
          gender: formData.gender,
          phone: formData.phone,
          patient_history: formData.patient_history?.toUpperCase() || null,
          referred_by_doctor_name: formData.referred_by_doctor_name?.toUpperCase() || null,
          referred_by_doctor_phone: formData.referred_by_doctor_phone || null,
          lab_id: profile?.lab_id,
          branch_id: profile?.branch_id,
          created_by: profile?.role === 'admin' && selectedOperator ? selectedOperator : profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient added successfully",
      });

      setFormData({
        patient_id: '',
        full_name: '',
        age: '',
        ageUnit: 'years',
        gender: '',
        phone: '',
        patient_history: '',
        referred_by_doctor_name: '',
        referred_by_doctor_phone: ''
      });
      setSelectedOperator('');
      setOpen(false);
      onPatientAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing without saving
      setFormData({
        patient_id: '',
        full_name: '',
        age: '',
        ageUnit: 'years',
        gender: '',
        phone: '',
        patient_history: '',
        referred_by_doctor_name: '',
        referred_by_doctor_phone: ''
      });
      setSelectedOperator('');
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <OperatorSelect 
              selectedOperator={selectedOperator} 
              onOperatorChange={setSelectedOperator} 
            />
            
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient ID (Auto-generated)</Label>
              <div className="relative">
                <CapitalizedInput
                  id="patient_id"
                  value={formData.patient_id}
                  placeholder={generatingId ? "Generating..." : "Auto-generated"}
                  disabled
                  className="pr-10"
                  capitalize={false}
                />
                {generatingId && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <CapitalizedInput
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="ENTER FULL NAME"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Age *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CapitalizedInput
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Enter age"
                    required
                    capitalize={false}
                  />
                </div>
                <RadioGroup 
                  value={formData.ageUnit} 
                  onValueChange={(value) => setFormData({ ...formData, ageUnit: value })}
                  className="flex gap-4"
                >
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
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">MALE</SelectItem>
                  <SelectItem value="FEMALE">FEMALE</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <CapitalizedInput
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="ENTER PHONE NUMBER"
                required
                capitalize={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referred_by_doctor_name">Referred By Doctor Name</Label>
              <CapitalizedInput
                id="referred_by_doctor_name"
                value={formData.referred_by_doctor_name}
                onChange={(e) => setFormData({ ...formData, referred_by_doctor_name: e.target.value })}
                placeholder="ENTER DOCTOR'S NAME"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referred_by_doctor_phone">Doctor's Mobile Number</Label>
              <CapitalizedInput
                id="referred_by_doctor_phone"
                value={formData.referred_by_doctor_phone}
                onChange={(e) => setFormData({ ...formData, referred_by_doctor_phone: e.target.value })}
                placeholder="ENTER DOCTOR'S PHONE"
                capitalize={false}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patient_history">Patient History *</Label>
              <CapitalizedTextarea
                id="patient_history"
                value={formData.patient_history}
                onChange={(e) => setFormData({ ...formData, patient_history: e.target.value })}
                placeholder="ENTER PATIENT HISTORY"
                required
                className="min-h-[100px]"
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Patient'}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};