import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    gender: '',
    phone: '',
    email: ''
  });

  const [selectedOperator, setSelectedOperator] = useState('');

  // Generate patient ID when dialog opens
  useEffect(() => {
    const generatePatientId = async () => {
      if (open && profile?.branch_id && profile?.lab_id) {
        setGeneratingId(true);
        try {
          const { data, error } = await supabase
            .rpc('get_next_patient_id', {
              p_branch_id: profile.branch_id,
              p_lab_id: profile.lab_id
            });

          if (error) throw error;
          
          setFormData(prev => ({ ...prev, patient_id: data }));
        } catch (error: any) {
          toast({
            title: "Error",
            description: "Failed to generate patient ID: " + error.message,
            variant: "destructive",
          });
        } finally {
          setGeneratingId(false);
        }
      }
    };

    generatePatientId();
  }, [open, profile, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('patients')
        .insert({
          patient_id: formData.patient_id,
          full_name: formData.full_name,
          age: parseInt(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
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
        gender: '',
        phone: '',
        email: ''
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <OperatorSelect 
            selectedOperator={selectedOperator} 
            onOperatorChange={setSelectedOperator} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient ID (Auto-generated)</Label>
            <div className="relative">
              <Input
                id="patient_id"
                value={formData.patient_id}
                placeholder={generatingId ? "Generating..." : "Auto-generated"}
                disabled
                className="pr-10"
              />
              {generatingId && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Enter age"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Patient'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};