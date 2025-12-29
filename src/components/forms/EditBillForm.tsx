import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

interface BillItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number | null;
  due_amount: number;
  status: string;
  items: BillItem[] | any;
  notes?: string;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
  } | null;
}

interface EditBillFormProps {
  bill: Bill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBillUpdated: () => void;
}

interface FormData {
  due_date: string;
  notes: string;
  items: BillItem[];
}

export function EditBillForm({ bill, open, onOpenChange, onBillUpdated }: EditBillFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [showConfirmStep1, setShowConfirmStep1] = useState(false);
  const [showConfirmStep2, setShowConfirmStep2] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  // Parse items from bill
  const parseItems = (): BillItem[] => {
    if (Array.isArray(bill.items)) {
      return bill.items.map((item: any) => ({
        description: item.description || item.name || '',
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || Number(item.price) || 0,
        amount: Number(item.amount) || (Number(item.quantity || 1) * Number(item.rate || item.price || 0))
      }));
    }
    return [{ description: '', quantity: 1, rate: 0, amount: 0 }];
  };

  const { register, control, watch, setValue, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      due_date: bill.due_date,
      notes: bill.notes || '',
      items: parseItems()
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  // Calculate new totals
  const newTotalAmount = watchedItems?.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.rate));
  }, 0) || 0;

  const paidAmount = Number(bill.paid_amount) || 0;
  const newDueAmount = newTotalAmount - paidAmount;
  
  const getNewStatus = () => {
    if (paidAmount >= newTotalAmount) return 'paid';
    if (paidAmount > 0) return 'partially_paid';
    return 'pending';
  };

  const hasChanges = () => {
    return newTotalAmount !== bill.total_amount ||
           newDueAmount !== bill.due_amount ||
           getNewStatus() !== bill.status;
  };

  const isOverpayment = newTotalAmount < paidAmount;

  // Reset form when bill changes
  useEffect(() => {
    if (open) {
      reset({
        due_date: bill.due_date,
        notes: bill.notes || '',
        items: parseItems()
      });
      setConfirmText("");
    }
  }, [bill, open, reset]);

  // Update item amount when quantity or rate changes
  const updateItemAmount = (index: number) => {
    const item = watchedItems[index];
    if (item) {
      const amount = Number(item.quantity) * Number(item.rate);
      setValue(`items.${index}.amount`, amount);
    }
  };

  const handleAddItem = () => {
    append({ description: '', quantity: 1, rate: 0, amount: 0 });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmitForm = (data: FormData) => {
    // Validate at least one item
    if (data.items.length === 0 || !data.items.some(item => item.description && item.rate > 0)) {
      toast({
        title: "Validation Error",
        description: "At least one valid item is required",
        variant: "destructive",
      });
      return;
    }

    // Show first confirmation
    setShowConfirmStep1(true);
  };

  const handleConfirmStep1 = () => {
    setShowConfirmStep1(false);
    setShowConfirmStep2(true);
  };

  const handleFinalConfirm = async () => {
    if (confirmText !== "CONFIRM") {
      toast({
        title: "Confirmation Required",
        description: "Please type CONFIRM to proceed",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = watch();
      
      // Prepare items with proper format
      const formattedItems = formData.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate)
      }));

      const { error } = await supabase
        .from('bills')
        .update({
          items: formattedItems,
          total_amount: newTotalAmount,
          due_amount: newDueAmount,
          due_date: formData.due_date,
          notes: formData.notes,
          status: getNewStatus(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bill.id);

      if (error) throw error;

      toast({
        title: "Bill Updated",
        description: `Bill ${bill.bill_number} has been updated successfully`,
      });

      setShowConfirmStep2(false);
      setConfirmText("");
      onOpenChange(false);
      onBillUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bill",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill - {bill.bill_number}</DialogTitle>
            <DialogDescription>
              Modify bill items and details. Changes will be logged in audit trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-muted-foreground text-xs">Patient</Label>
                <p className="font-medium">{bill.patients?.full_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Bill Date</Label>
                <p className="font-medium">{new Date(bill.bill_date).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Paid Amount</Label>
                <p className="font-medium text-green-600">₹{paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Current Status</Label>
                <Badge variant={bill.status === 'paid' ? 'default' : bill.status === 'partially_paid' ? 'secondary' : 'destructive'}>
                  {bill.status}
                </Badge>
              </div>
            </div>

            {/* Editable Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Bill Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {index === 0 && <Label className="text-xs">Description</Label>}
                      <Input
                        {...register(`items.${index}.description`)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && <Label className="text-xs">Qty</Label>}
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        onChange={(e) => {
                          register(`items.${index}.quantity`).onChange(e);
                          setTimeout(() => updateItemAmount(index), 0);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && <Label className="text-xs">Rate</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register(`items.${index}.rate`, { valueAsNumber: true })}
                        onChange={(e) => {
                          register(`items.${index}.rate`).onChange(e);
                          setTimeout(() => updateItemAmount(index), 0);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && <Label className="text-xs">Amount</Label>}
                      <Input
                        value={`₹${((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.rate || 0)).toLocaleString()}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Due Date and Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register("due_date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Summary Preview */}
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold">Summary Preview</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Current Total:</div>
                <div className="text-right">₹{bill.total_amount.toLocaleString()}</div>
                <div>New Total:</div>
                <div className="text-right font-medium">₹{newTotalAmount.toLocaleString()}</div>
                <div>Paid Amount:</div>
                <div className="text-right text-green-600">₹{paidAmount.toLocaleString()}</div>
                <div>New Due Amount:</div>
                <div className={`text-right font-medium ${newDueAmount < 0 ? 'text-yellow-600' : 'text-destructive'}`}>
                  ₹{newDueAmount.toLocaleString()}
                </div>
                <div>New Status:</div>
                <div className="text-right">
                  <Badge variant={getNewStatus() === 'paid' ? 'default' : getNewStatus() === 'partially_paid' ? 'secondary' : 'destructive'}>
                    {getNewStatus()}
                  </Badge>
                </div>
              </div>

              {isOverpayment && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md mt-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Warning: New total is less than paid amount. This will create a credit/overpayment.
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!hasChanges() && watchedItems?.length > 0}>
                Update Bill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* First Confirmation Dialog */}
      <AlertDialog open={showConfirmStep1} onOpenChange={setShowConfirmStep1}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirm Bill Changes
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>You are about to modify bill <strong>{bill.bill_number}</strong>:</p>
                
                <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>₹{bill.total_amount.toLocaleString()} → ₹{newTotalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Amount:</span>
                    <span>₹{bill.due_amount.toLocaleString()} → ₹{newDueAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span>{bill.status} → {getNewStatus()}</span>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  This action will be logged in the audit trail.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmStep1}>Continue</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Confirmation Dialog */}
      <AlertDialog open={showConfirmStep2} onOpenChange={setShowConfirmStep2}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This action cannot be undone easily. All changes will be recorded.</p>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmText">Type "CONFIRM" to proceed:</Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type CONFIRM"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
            <Button 
              onClick={handleFinalConfirm}
              disabled={confirmText !== "CONFIRM" || isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? "Updating..." : "Update Bill"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}