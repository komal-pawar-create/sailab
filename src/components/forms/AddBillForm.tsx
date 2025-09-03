import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';
import { OperatorSelect } from './OperatorSelect';
import BillPrintModal from '@/components/bills/BillPrintModal';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

interface BillItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface AddBillFormProps {
  onBillAdded: () => void;
}

export const AddBillForm = ({ onBillAdded }: AddBillFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [createdBill, setCreatedBill] = useState<any>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: '',
    bill_number: '',
    due_date: '',
    notes: ''
  });

  const [items, setItems] = useState<BillItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  const [selectedOperator, setSelectedOperator] = useState('');

  useEffect(() => {
    if (open) {
      fetchPatients();
      generateBillNumber();
    }
  }, [open]);

  const fetchPatients = async () => {
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, patient_id')
        .order('full_name');
      setPatients(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    }
  };

  const generateBillNumber = () => {
    const now = new Date();
    const billNumber = `BILL-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setFormData(prev => ({ ...prev, bill_number: billNumber }));
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate amount for the item
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setItems(updatedItems);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let labId = profile?.lab_id;
      let branchId = profile?.branch_id;
      let createdBy = profile?.user_id;

      // For admins, get lab_id and branch_id from selected operator
      if (profile?.role === 'admin') {
        if (!selectedOperator) {
          toast({
            title: "Error", 
            description: "Please select an operator to create the bill for.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Get the selected operator's lab_id and branch_id
        const { data: operatorProfile } = await supabase
          .from('profiles')
          .select('lab_id, branch_id')
          .eq('user_id', selectedOperator)
          .single();
          
        if (!operatorProfile?.lab_id) {
          toast({
            title: "Error",
            description: "Selected operator is not assigned to a lab. Please contact your administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!operatorProfile?.branch_id) {
          toast({
            title: "Error",
            description: "Selected operator is not assigned to a branch. Please contact your administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        labId = operatorProfile.lab_id;
        branchId = operatorProfile.branch_id;
        createdBy = selectedOperator;
      } else {
        // For non-admins, validate they have a lab_id and branch_id
        if (!profile?.lab_id) {
          toast({
            title: "Error",
            description: "You must be assigned to a lab to create bills. Please contact your administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!profile?.branch_id) {
          toast({
            title: "Error",
            description: "You must be assigned to a branch to create bills. Please contact your administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const totalAmount = getTotalAmount();
      
      const { data: newBill, error } = await supabase
        .from('bills')
        .insert({
          bill_number: formData.bill_number,
          patient_id: formData.patient_id,
          total_amount: totalAmount,
          due_amount: totalAmount,
          due_date: formData.due_date,
          items: items as any,
          notes: formData.notes,
          lab_id: labId,
          branch_id: branchId,
          created_by: createdBy
        })
        .select('*, patients(full_name, patient_id, phone, email, age, gender)')
        .single();

      if (error) throw error;

      // Set the created bill for print preview
      setCreatedBill({
        ...newBill,
        bill_date: new Date().toISOString(),
        paid_amount: 0,
        due_amount: totalAmount
      });
      
      // Show print preview instead of closing
      setShowPrintPreview(true);
      
      toast({
        title: "Success",
        description: "Bill created successfully. You can now print it.",
      });

      // Reset form data after showing preview
      setFormData({
        patient_id: '',
        bill_number: '',
        due_date: '',
        notes: ''
      });
      setItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
      setSelectedOperator('');
      generateBillNumber(); // Generate new bill number for next bill
      onBillAdded();
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

  const handlePrintPreviewClose = () => {
    setShowPrintPreview(false);
    setCreatedBill(null);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <OperatorSelect 
              selectedOperator={selectedOperator} 
              onOperatorChange={setSelectedOperator} 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_id">Patient</Label>
                <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients
                      .filter(patient => patient.id && patient.id.trim() !== '')
                      .map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} ({patient.patient_id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bill_number">Bill Number *</Label>
                <CapitalizedInput
                  id="bill_number"
                  value={formData.bill_number}
                  onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                  required
                  readOnly
                  capitalize={false}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <CapitalizedInput
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                capitalize={false}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Bill Items</Label>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Description *</Label>
                    <CapitalizedInput
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="ITEM DESCRIPTION"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Qty *</Label>
                    <CapitalizedInput
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                      capitalize={false}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Rate *</Label>
                    <CapitalizedInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      required
                      capitalize={false}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Amount</Label>
                    <CapitalizedInput
                      value={item.amount.toFixed(2)}
                      readOnly
                      className="bg-muted"
                      capitalize={false}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                Total: ₹{getTotalAmount().toFixed(2)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes *</Label>
              <CapitalizedTextarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ADDITIONAL NOTES"
                rows={3}
                required
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Bill'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Print Preview Modal */}
      <BillPrintModal 
        bill={createdBill} 
        open={showPrintPreview} 
        onOpenChange={handlePrintPreviewClose}
      />
    </>
  );
};