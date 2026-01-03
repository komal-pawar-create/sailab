import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PatientSearchSelect } from './PatientSearchSelect';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  role: string;
}

interface AddFollowupFormProps {
  onFollowupAdded: () => void;
  preSelectedPatientId?: string;
  triggerButton?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddFollowupForm({ onFollowupAdded, preSelectedPatientId, triggerButton, defaultOpen, onOpenChange }: AddFollowupFormProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(defaultOpen || false);
  
  // Sync with external open state
  useEffect(() => {
    if (defaultOpen !== undefined) {
      setOpen(defaultOpen);
    }
  }, [defaultOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    patient_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: undefined as Date | undefined,
    due_time: '09:00',
    remind_date: undefined as Date | undefined,
    remind_time: '09:00',
  });

  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchTeamMembers();
    }
  }, [open, profile?.branch_id]);

  // Auto-select patient when preSelectedPatientId changes
  useEffect(() => {
    if (preSelectedPatientId && patients.length > 0) {
      setFormData(prev => ({ ...prev, patient_id: preSelectedPatientId }));
    }
  }, [preSelectedPatientId, patients]);

  const fetchPatients = async () => {
    try {
      let query = supabase
        .from('patients')
        .select('id, full_name, patient_id')
        .order('created_at', { ascending: false });

      // Filter by branch for non-admin users
      if (profile?.branch_id) {
        query = query.eq('branch_id', profile.branch_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPatients((data || []).filter(p => p.id && p.id.trim() !== ''));
    } catch (error) {
      toast.error('Failed to fetch patients');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .order('full_name');

      // If not admin, only show team members from same lab
      if (profile?.role !== 'admin' && profile?.lab_id) {
        query = query.eq('lab_id', profile.lab_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      toast.error('Failed to fetch team members');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.patient_id || !formData.assigned_to || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // Combine date and time
      const dueDateTime = new Date(formData.due_date);
      const [dueHours, dueMinutes] = formData.due_time.split(':');
      dueDateTime.setHours(parseInt(dueHours), parseInt(dueMinutes));

      let remindDateTime: Date | null = null;
      if (formData.remind_date) {
        remindDateTime = new Date(formData.remind_date);
        const [remindHours, remindMinutes] = formData.remind_time.split(':');
        remindDateTime.setHours(parseInt(remindHours), parseInt(remindMinutes));
      }

      const followupData = {
        title: formData.title.trim(),
        details: formData.details.trim() || null,
        patient_id: formData.patient_id,
        assigned_to: formData.assigned_to,
        priority: formData.priority,
        due_at: dueDateTime.toISOString(),
        remind_at: remindDateTime?.toISOString() || null,
        lab_id: profile?.lab_id,
        created_by: profile?.user_id,
      };

      const { error } = await supabase
        .from('patient_followups')
        .insert([followupData]);

      if (error) throw error;

      toast.success('Follow-up created successfully');
      handleOpenChange(false);
      setFormData({
        title: '',
        details: '',
        patient_id: '',
        assigned_to: '',
        priority: 'medium',
        due_date: undefined,
        due_time: '09:00',
        remind_date: undefined,
        remind_time: '09:00',
      });
      onFollowupAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerButton ? (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-up
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Follow-up title"
              required
            />
          </div>

          <div>
            <Label htmlFor="patient">Patient *</Label>
            <PatientSearchSelect
              patients={patients}
              selectedPatientId={formData.patient_id}
              onPatientSelect={(value) => setFormData({ ...formData, patient_id: value })}
              placeholder="Search and select patient"
              required
            />
          </div>

          <div>
            <Label htmlFor="assigned_to">Assign to *</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.full_name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData({ ...formData, due_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="due_time">Due Time</Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Remind Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.remind_date ? format(formData.remind_date, 'PPP') : 'Optional'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.remind_date}
                    onSelect={(date) => setFormData({ ...formData, remind_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="remind_time">Remind Time</Label>
              <Input
                id="remind_time"
                type="time"
                value={formData.remind_time}
                onChange={(e) => setFormData({ ...formData, remind_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Follow-up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}