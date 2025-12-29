import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Calendar, Receipt, Download, Pencil } from "lucide-react";
import { format } from "date-fns";
import { BillPrint } from "@/components/bills/BillPrint";
import { EditBillForm } from "@/components/forms/EditBillForm";

interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  items: any[];
  notes?: string;
}

interface BillPayment {
  id: string;
  bill_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
}

interface PatientBillsProps {
  patientId: string;
}

export default function PatientBills({ patientId }: PatientBillsProps) {
  const { profile } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  useEffect(() => {
    fetchBills();
    fetchPayments();
  }, [patientId]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("patient_id", patientId)
        .order("bill_date", { ascending: false });

      if (error) throw error;
      setBills((data || []).map(bill => ({
        ...bill,
        items: Array.isArray(bill.items) ? bill.items : []
      })));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      // First get bill IDs for this patient
      const { data: billsData } = await supabase
        .from("bills")
        .select("id")
        .eq("patient_id", patientId);

      if (billsData && billsData.length > 0) {
        const billIds = billsData.map(b => b.id);
        
        const { data: paymentsData, error } = await supabase
          .from("bill_payments")
          .select("*")
          .in("bill_id", billIds)
          .order("payment_date", { ascending: false });

        if (error) throw error;
        setPayments(paymentsData || []);
      }
    } catch (error: any) {
      console.error("Error fetching payments:", error);
    }
  };

  const handlePrintBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPrint(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditBill(bill);
    setShowEditForm(true);
  };

  const handleBillUpdated = () => {
    fetchBills();
    fetchPayments();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "partially_paid":
        return "secondary";
      case "pending":
        return "destructive";
      default:
        return "outline";
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
  const paidAmount = bills.reduce((sum, bill) => sum + Number(bill.paid_amount), 0);
  const pendingAmount = bills.reduce((sum, bill) => sum + Number(bill.due_amount), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{paidAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">₹{pendingAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading bills...</div>
            ) : bills.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.bill_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(bill.bill_date), "PPP")}
                        </div>
                      </TableCell>
                      <TableCell>₹{Number(bill.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">
                        ₹{Number(bill.paid_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-destructive">
                        ₹{Number(bill.due_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(bill.status)}>
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditBill(bill)}
                              title="Edit Bill"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintBill(bill)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Print
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bills found for this patient
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const bill = bills.find(b => b.id === payment.bill_id);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.payment_date), "PPP")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {bill?.bill_number || "N/A"}
                        </TableCell>
                        <TableCell className="text-green-600">
                          ₹{Number(payment.payment_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_method}</Badge>
                        </TableCell>
                        <TableCell>{payment.reference_number || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bill Print Dialog */}
      {showPrint && selectedBill && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Print Bill</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPrint(false);
                  setSelectedBill(null);
                }}
              >
                Close
              </Button>
            </div>
            <BillPrint bill={selectedBill} />
          </div>
        </div>
      )}

      {/* Edit Bill Form (Admin Only) */}
      {editBill && (
        <EditBillForm
          bill={editBill}
          open={showEditForm}
          onOpenChange={(open) => {
            setShowEditForm(open);
            if (!open) setEditBill(null);
          }}
          onBillUpdated={handleBillUpdated}
        />
      )}
    </>
  );
}