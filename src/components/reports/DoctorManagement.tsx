import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Plus, Pencil, Loader2 } from 'lucide-react';

export interface ReferringDoctor {
  id: string;
  doctor_name: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  commission_percentage: number;
  commission_type: string;
  fixed_commission_amount: number;
  is_active: boolean;
  lab_id: string;
  branch_id: string | null;
}

interface DoctorFormData {
  doctor_name: string;
  phone: string;
  email: string;
  specialization: string;
  commission_percentage: number;
  commission_type: string;
  fixed_commission_amount: number;
  is_active: boolean;
}

const emptyForm: DoctorFormData = {
  doctor_name: '',
  phone: '',
  email: '',
  specialization: '',
  commission_percentage: 10,
  commission_type: 'percentage',
  fixed_commission_amount: 0,
  is_active: true,
};

interface DoctorManagementProps {
  onDoctorsChanged?: () => void;
}

export function DoctorManagement({ onDoctorsChanged }: DoctorManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [doctors, setDoctors] = useState<ReferringDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DoctorFormData>(emptyForm);

  const fetchDoctors = async () => {
    if (!profile?.lab_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('referring_doctors' as any)
      .select('*')
      .eq('lab_id', profile.lab_id)
      .order('doctor_name');

    if (!error && data) {
      setDoctors(data as any as ReferringDoctor[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchDoctors();
  }, [open, profile?.lab_id]);

  const handleSave = async () => {
    if (!form.doctor_name.trim()) {
      toast({ title: 'Error', description: 'Doctor name is required', variant: 'destructive' });
      return;
    }
    if (!profile?.lab_id) return;
    setSaving(true);

    const payload = {
      doctor_name: form.doctor_name.toUpperCase(),
      phone: form.phone || null,
      email: form.email || null,
      specialization: form.specialization?.toUpperCase() || null,
      commission_percentage: form.commission_type === 'percentage' ? form.commission_percentage : 0,
      commission_type: form.commission_type,
      fixed_commission_amount: form.commission_type === 'fixed' ? form.fixed_commission_amount : 0,
      is_active: form.is_active,
      lab_id: profile.lab_id,
      branch_id: profile.branch_id || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from('referring_doctors' as any)
        .update(payload as any)
        .eq('id', editingId));
    } else {
      ({ error } = await supabase
        .from('referring_doctors' as any)
        .insert({ ...payload, created_by: profile.user_id } as any));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: editingId ? 'Doctor updated' : 'Doctor added' });
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchDoctors();
      onDoctorsChanged?.();
    }
    setSaving(false);
  };

  const startEdit = (doctor: ReferringDoctor) => {
    setEditingId(doctor.id);
    setForm({
      doctor_name: doctor.doctor_name,
      phone: doctor.phone || '',
      email: doctor.email || '',
      specialization: doctor.specialization || '',
      commission_percentage: doctor.commission_percentage,
      commission_type: doctor.commission_type,
      fixed_commission_amount: doctor.fixed_commission_amount,
      is_active: doctor.is_active,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Doctors
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Referring Doctors</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm && (
            <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Doctor
            </Button>
          )}

          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h4 className="font-medium text-sm">{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Doctor Name *</Label>
                  <Input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} placeholder="DR. NAME" className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit phone" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Specialization</Label>
                  <Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="e.g. CARDIOLOGY" className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Commission Type</Label>
                  <Select value={form.commission_type} onValueChange={v => setForm(f => ({ ...f, commission_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.commission_type === 'percentage' ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Commission %</Label>
                    <Input type="number" min={0} max={100} value={form.commission_percentage} onChange={e => setForm(f => ({ ...f, commission_percentage: parseFloat(e.target.value) || 0 }))} />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs">Fixed Amount (₹)</Label>
                    <Input type="number" min={0} value={form.fixed_commission_amount} onChange={e => setForm(f => ({ ...f, fixed_commission_amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-xs">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editingId ? 'Update' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelForm}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No doctors registered yet. Add your first referring doctor above.
                    </TableCell>
                  </TableRow>
                ) : (
                  doctors.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.doctor_name}</TableCell>
                      <TableCell>{doc.phone || '-'}</TableCell>
                      <TableCell>{doc.specialization || '-'}</TableCell>
                      <TableCell>
                        {doc.commission_type === 'percentage'
                          ? `${doc.commission_percentage}%`
                          : `₹${doc.fixed_commission_amount}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                          {doc.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(doc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
