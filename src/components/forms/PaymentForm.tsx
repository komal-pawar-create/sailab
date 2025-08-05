import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard } from 'lucide-react';

interface PaymentFormProps {
  billId: string;
  dueAmount: number;
  onPaymentAdded: () => void;
}

export const PaymentForm = ({ billId, dueAmount, onPaymentAdded }: PaymentFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    payment_amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentAmount = parseFloat(formData.payment_amount);
      
      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }
      
      if (paymentAmount > dueAmount) {
        throw new Error('Payment amount cannot exceed due amount');
      }

      const { error } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: billId,
          payment_amount: paymentAmount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          created_by: profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      setFormData({
        payment_amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: ''
      });
      setOpen(false);
      onPaymentAdded();
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
        <Button size="sm">
          <CreditCard className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_amount">Payment Amount</Label>
            <Input
              id="payment_amount"
              type="number"
              step="0.01"
              min="0.01"
              max={dueAmount}
              value={formData.payment_amount}
              onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
              placeholder={`Max: ₹${dueAmount.toFixed(2)}`}
              required
            />
            <p className="text-sm text-muted-foreground">
              Due Amount: ₹{dueAmount.toFixed(2)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online Transfer</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Transaction/Cheque number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment notes"
              rows={3}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};