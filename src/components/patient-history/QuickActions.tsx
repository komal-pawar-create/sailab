import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, FlaskConical, Receipt, Clock, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { CapitalizedInput } from "@/components/ui/capitalized-input";
import { CapitalizedTextarea } from "@/components/ui/capitalized-textarea";
import { JpgUpload } from "@/components/ui/jpg-upload";
import { DocUpload } from "@/components/ui/doc-upload";
import { AddFollowupForm } from "@/components/forms/AddFollowupForm";

interface QuickActionsProps {
  patientId: string;
  onDataChanged: () => void;
}

export default function QuickActions({ patientId, onDataChanged }: QuickActionsProps) {
  const [activeAction, setActiveAction] = useState<"test" | "bill" | "followup" | null>(null);

  const handleClose = () => {
    setActiveAction(null);
    onDataChanged();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setActiveAction("test")}>
            <FlaskConical className="h-4 w-4 mr-2" />
            New Test Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveAction("bill")}>
            <Receipt className="h-4 w-4 mr-2" />
            New Bill
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveAction("followup")}>
            <Clock className="h-4 w-4 mr-2" />
            New Follow-up
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Test Report Dialog */}
      <Dialog open={activeAction === "test"} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Test Report</DialogTitle>
          </DialogHeader>
          <TestReportFormContent patientId={patientId} onComplete={handleClose} />
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={activeAction === "bill"} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
          </DialogHeader>
          <BillFormContent patientId={patientId} onComplete={handleClose} />
        </DialogContent>
      </Dialog>

      {/* Follow-up Form */}
      <AddFollowupForm
        onFollowupAdded={handleClose}
        preSelectedPatientId={patientId}
        defaultOpen={activeAction === "followup"}
        onOpenChange={(open) => !open && setActiveAction(null)}
      />
    </>
  );
}

// Test Report Form Content
interface TestType {
  id: string;
  test_name: string;
  is_global?: boolean;
}

function TestReportFormContent({ patientId, onComplete }: { patientId: string; onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file_name: string; file_path: string; file_type: string; file_size: number }>>([]);
  const { profile } = useAuth();

  useEffect(() => {
    fetchTestTypes();
  }, []);

  const fetchTestTypes = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("branch_id")
        .eq("user_id", userData.user.id)
        .single();

      if (!profileData) return;

      const [localRes, globalRes] = await Promise.all([
        supabase.from("test_types").select("*").eq("branch_id", profileData.branch_id).order("test_name"),
        supabase.from("global_test_types").select("*").eq("is_active", true).order("test_name"),
      ]);

      setTestTypes([
        ...(globalRes.data || []).map((t) => ({ ...t, is_global: true })),
        ...(localRes.data || []).map((t) => ({ ...t, is_global: false })),
      ]);
    } catch (error) {
      console.error("Error fetching test types:", error);
    }
  };

  const handleFileUploaded = (file: { file_name: string; file_path: string; file_type: string; file_size: number }) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const results = formData.get("results") as string;
      let parsedResults = null;
      if (results) {
        try {
          parsedResults = JSON.parse(results);
        } catch {
          parsedResults = results;
        }
      }

      const { data: reportData, error: reportError } = await supabase
        .from("test_reports")
        .insert({
          patient_id: patientId,
          test_type: formData.get("test_type") as string,
          test_date: formData.get("test_date") as string,
          status: formData.get("status") as string,
          technician_name: formData.get("technician_name") as string,
          results: parsedResults,
          lab_id: profile?.lab_id,
          branch_id: profile?.branch_id,
          created_by: profile?.user_id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      if (uploadedFiles.length > 0 && reportData) {
        const documents = uploadedFiles.map((file) => ({
          patient_id: patientId,
          lab_id: profile?.lab_id,
          branch_id: profile?.branch_id,
          file_name: file.file_name,
          file_path: file.file_path,
          file_type: file.file_type,
          file_size: file.file_size,
          uploaded_by: profile?.user_id,
        }));
        await supabase.from("documents").insert(documents);
      }

      toast({ title: "Success", description: "Test report added successfully" });
      onComplete();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add test report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const todayDate = new Date().toISOString().split("T")[0];

  return (
    <ScrollArea className="h-full max-h-[calc(90vh-8rem)] pr-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test_type">Test Type *</Label>
          <Select name="test_type" required>
            <SelectTrigger>
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              {testTypes.filter((t) => t.is_global).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Platform Tests</div>
                  {testTypes.filter((t) => t.is_global).map((testType) => (
                    <SelectItem key={testType.id} value={testType.test_name}>{testType.test_name}</SelectItem>
                  ))}
                </>
              )}
              {testTypes.filter((t) => !t.is_global).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Branch Tests</div>
                  {testTypes.filter((t) => !t.is_global).map((testType) => (
                    <SelectItem key={testType.id} value={testType.test_name}>{testType.test_name}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test_date">Test Date *</Label>
          <CapitalizedInput type="date" name="test_date" defaultValue={todayDate} required capitalize={false} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="technician_name">Technician Name *</Label>
          <CapitalizedInput name="technician_name" placeholder="Enter technician name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select name="status" defaultValue="pending" required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Upload Test Images/Documents</Label>
          <div className="space-y-3">
            <JpgUpload onFileUploaded={handleFileUploaded} label="Upload JPG" />
            <DocUpload onFileUploaded={handleFileUploaded} label="Upload Word Doc" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="results">Results</Label>
          <CapitalizedTextarea name="results" placeholder="Enter test results (optional)" rows={3} required={false} />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Adding..." : "Add Test Report"}
        </Button>
      </form>
    </ScrollArea>
  );
}

// Bill Form Content
interface BillItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

function BillFormContent({ patientId, onComplete }: { patientId: string; onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    bill_number: "",
    due_date: "",
    notes: "",
  });
  const [items, setItems] = useState<BillItem[]>([{ description: "", quantity: 1, rate: 0, amount: 0 }]);

  useEffect(() => {
    generateBillNumber();
  }, []);

  const generateBillNumber = () => {
    const now = new Date();
    const billNumber = `BILL-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setFormData((prev) => ({ ...prev, bill_number: billNumber }));
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setItems(updated);
  };
  const getTotalAmount = () => items.reduce((t, i) => t + i.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = getTotalAmount();
      const { error } = await supabase.from("bills").insert({
        bill_number: formData.bill_number,
        patient_id: patientId,
        total_amount: totalAmount,
        due_amount: totalAmount,
        due_date: formData.due_date,
        items: items as any,
        notes: formData.notes,
        lab_id: profile?.lab_id,
        branch_id: profile?.branch_id,
        created_by: profile?.user_id,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Bill created successfully" });
      onComplete();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Bill Number *</Label>
          <CapitalizedInput value={formData.bill_number} readOnly capitalize={false} />
        </div>
        <div className="space-y-2">
          <Label>Due Date *</Label>
          <CapitalizedInput
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
            capitalize={false}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Bill Items</Label>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <CapitalizedInput
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="ITEM DESCRIPTION"
                required
              />
            </div>
            <div className="col-span-2">
              <CapitalizedInput
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                required
                capitalize={false}
              />
            </div>
            <div className="col-span-2">
              <CapitalizedInput
                type="number"
                min="0"
                step="0.01"
                value={item.rate}
                onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                required
                capitalize={false}
              />
            </div>
            <div className="col-span-2">
              <CapitalizedInput value={item.amount.toFixed(2)} readOnly className="bg-muted" capitalize={false} />
            </div>
            <div className="col-span-1">
              <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="text-lg font-semibold">Total: ₹{getTotalAmount().toFixed(2)}</div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <CapitalizedTextarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="ADDITIONAL NOTES"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Bill"}
      </Button>
    </form>
  );
}
