import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Calendar, Trash2, Search, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  bill_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  bill_number?: string;
}

interface PatientPaymentsProps {
  patientId: string;
}

export default function PatientPayments({ patientId }: PatientPaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if user is admin
  const isAdmin = profile?.role && ['admin', 'lab_admin', 'super_admin'].includes(profile.role);

  useEffect(() => {
    fetchPayments();
  }, [patientId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // First get bill IDs for this patient with bill numbers
      const { data: billsData, error: billsError } = await supabase
        .from("bills")
        .select("id, bill_number")
        .eq("patient_id", patientId);

      if (billsError) throw billsError;

      if (billsData && billsData.length > 0) {
        const billIds = billsData.map(b => b.id);
        const billMap = new Map(billsData.map(b => [b.id, b.bill_number]));
        
        const { data: paymentsData, error } = await supabase
          .from("bill_payments")
          .select("*")
          .in("bill_id", billIds)
          .order("payment_date", { ascending: false });

        if (error) throw error;
        
        // Add bill number to each payment
        const paymentsWithBillNumber = (paymentsData || []).map(p => ({
          ...p,
          bill_number: billMap.get(p.bill_id) || "N/A"
        }));
        
        setPayments(paymentsWithBillNumber);
      } else {
        setPayments([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (payment: Payment) => {
    setDeletePayment(payment);
    setConfirmStep(1);
    setConfirmText("");
  };

  const handleCancelDelete = () => {
    setDeletePayment(null);
    setConfirmStep(1);
    setConfirmText("");
  };

  const handleContinueToStep2 = () => {
    setConfirmStep(2);
  };

  const handleConfirmDelete = async () => {
    if (!deletePayment || confirmText !== "DELETE") return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("bill_payments")
        .delete()
        .eq("id", deletePayment.id);

      if (error) throw error;

      toast({
        title: "Payment Deleted",
        description: "The payment has been deleted and the bill has been updated.",
      });

      // Refresh payments list
      await fetchPayments();
      handleCancelDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Payment Date", "Bill Number", "Amount", "Method", "Reference", "Notes"];
    const rows = filteredPayments.map(p => [
      format(new Date(p.payment_date), "yyyy-MM-dd"),
      p.bill_number,
      p.payment_amount.toFixed(2),
      p.payment_method,
      p.reference_number || "",
      p.notes || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `patient_payments_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const filteredPayments = payments.filter(payment =>
    payment.bill_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.payment_amount), 0);
  const transactionCount = payments.length;
  const averagePayment = transactionCount > 0 ? totalPayments / transactionCount : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalPayments.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{averagePayment.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                {payments.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
            ) : filteredPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(payment.payment_date), "PPP")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{payment.bill_number}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ₹{Number(payment.payment_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_method}</Badge>
                      </TableCell>
                      <TableCell>{payment.reference_number || "-"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {payment.notes || "-"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(payment)}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No payments match your search" : "No payments found for this patient"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Step 1: Initial Warning Dialog */}
      <AlertDialog open={!!deletePayment && confirmStep === 1} onOpenChange={() => handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Payment?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>You are about to delete this payment:</p>
                {deletePayment && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bill:</span>
                      <span className="font-medium">{deletePayment.bill_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium text-green-600">₹{Number(deletePayment.payment_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(deletePayment.payment_date), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium">{deletePayment.payment_method}</span>
                    </div>
                  </div>
                )}
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-sm text-destructive font-medium">This action will:</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Remove the payment record permanently</li>
                    <li>Increase the bill's due amount</li>
                    <li>Update the bill status if needed</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleContinueToStep2();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Type Confirmation Dialog */}
      <AlertDialog open={!!deletePayment && confirmStep === 2} onOpenChange={() => handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="font-medium">This action cannot be undone.</p>
                <p>
                  Type <span className="font-bold text-foreground">DELETE</span> to confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={confirmText !== "DELETE" || deleting}
            >
              {deleting ? "Deleting..." : "Delete Payment"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
