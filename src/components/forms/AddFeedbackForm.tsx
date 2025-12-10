import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Star } from 'lucide-react';
import { OperatorSelect } from './OperatorSelect';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

interface AddFeedbackFormProps {
  onFeedbackAdded: () => void;
}

export const AddFeedbackForm = ({ onFeedbackAdded }: AddFeedbackFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: '',
    feedback_type: '',
    message: '',
    rating: 5
  });

  const [selectedOperator, setSelectedOperator] = useState('');

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open, selectedOperator, profile?.branch_id]);

  const fetchPatients = async () => {
    try {
      let targetBranchId: string | null = null;

      // For admins, use selected operator's branch
      if (profile?.role === 'admin' && selectedOperator) {
        const { data: opProfile } = await supabase
          .from('profiles')
          .select('branch_id')
          .eq('user_id', selectedOperator)
          .maybeSingle();
        targetBranchId = opProfile?.branch_id ?? null;
      } else if (profile?.branch_id) {
        targetBranchId = profile.branch_id;
      }

      let query = supabase
        .from('patients')
        .select('id, full_name, patient_id')
        .order('full_name');

      if (targetBranchId) {
        query = query.eq('branch_id', targetBranchId);
      }

      const { data } = await query;
      setPatients((data || []).filter(p => p.id && p.id.trim() !== ''));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          patient_id: formData.patient_id === 'anonymous' || formData.patient_id === '' ? null : formData.patient_id,
          feedback_type: formData.feedback_type,
          message: formData.message,
          rating: formData.rating,
          lab_id: profile?.lab_id,
          created_by: profile?.role === 'admin' && selectedOperator ? selectedOperator : profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Feedback added successfully",
      });

      setFormData({
        patient_id: '',
        feedback_type: '',
        message: '',
        rating: 5
      });
      setSelectedOperator('');
      setOpen(false);
      onFeedbackAdded();
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
          Add Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <OperatorSelect 
            selectedOperator={selectedOperator} 
            onOperatorChange={setSelectedOperator} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient (Optional)</Label>
            <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anonymous">Anonymous</SelectItem>
                {patients
                  .filter((patient) => patient.id && patient.id.trim() !== '')
                  .map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name} ({patient.patient_id})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback_type">Feedback Type</Label>
            <Select value={formData.feedback_type} onValueChange={(value) => setFormData({ ...formData, feedback_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service Quality</SelectItem>
                <SelectItem value="wait_time">Wait Time</SelectItem>
                <SelectItem value="staff">Staff Behavior</SelectItem>
                <SelectItem value="facilities">Facilities</SelectItem>
                <SelectItem value="overall">Overall Experience</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`p-1 ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.rating}/5
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter feedback message"
              rows={4}
              required
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};