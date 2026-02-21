import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DoctorSettlementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  pendingAmount: number;
  onSettled: () => void;
}

export function DoctorSettlementForm({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  pendingAmount,
  onSettled,
}: DoctorSettlementFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    amount: pendingAmount,
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    period_from: '',
    period_to: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.lab_id || !doctorId) return;
    if (form.amount <= 0) {
      toast({ title: 'Error', description: 'Amount must be greater than 0', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      // Create settlement record
      const { data: settlement, error: settlementError } = await supabase
        .from('doctor_settlements' as any)
        .insert({
          doctor_id: doctorId,
          settlement_date: format(new Date(), 'yyyy-MM-dd'),
          total_amount: form.amount,
          payment_method: form.payment_method,
          reference_number: form.reference_number || null,
          notes: form.notes || null,
          period_from: form.period_from || null,
          period_to: form.period_to || null,
          lab_id: profile.lab_id,
          branch_id: profile.branch_id || null,
          created_by: profile.user_id,
        } as any)
        .select()
        .single();

      if (settlementError) throw settlementError;

      // Mark pending commissions as settled (up to the settlement amount)
      const { data: pendingCommissions } = await supabase
        .from('doctor_commissions' as any)
        .select('id, commission_amount')
        .eq('doctor_id', doctorId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (pendingCommissions && (settlement as any)?.id) {
        let remaining = form.amount;
        const idsToSettle: string[] = [];

        for (const comm of pendingCommissions as any[]) {
          if (remaining <= 0) break;
          idsToSettle.push(comm.id);
          remaining -= comm.commission_amount;
        }

        if (idsToSettle.length > 0) {
          await supabase
            .from('doctor_commissions' as any)
            .update({
              status: 'settled',
              settled_in_settlement_id: (settlement as any).id,
            } as any)
            .in('id', idsToSettle);
        }
      }

      toast({ title: 'Success', description: `Settlement of ₹${form.amount} recorded for ${doctorName}` });
      onSettled();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Record Settlement — {doctorName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Pending Commission:</span>{' '}
            <span className="font-semibold text-orange-600">₹{pendingAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label>Settlement Amount (₹) *</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference Number</Label>
            <Input
              value={form.reference_number}
              onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
              placeholder="Cheque/Transaction number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Period From</Label>
              <Input type="date" value={form.period_from} onChange={e => setForm(f => ({ ...f, period_from: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Period To</Label>
              <Input type="date" value={form.period_to} onChange={e => setForm(f => ({ ...f, period_to: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Settlement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
