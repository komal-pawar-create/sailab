import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Plus, Printer, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/forms/PaymentForm";
import BillPrintModal from "@/components/bills/BillPrintModal";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { formatDate } from "@/lib/utils";

interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number | null;
  due_amount: number;
  status: string;
  items: any;
  notes?: string;
  branch_id?: string;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
    phone?: string;
    age?: number;
    gender?: string;
  } | null;
}

interface BillsTableProps {
  bills: Bill[];
  onRefresh: () => void;
}

export function BillsTable({ bills, onRefresh }: BillsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const filteredBills = bills.filter((b) =>
    b.bill_number.toLowerCase().includes(search.toLowerCase()) ||
    b.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.patients?.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string, dueAmount: number) => {
    if (dueAmount <= 0 || status === "paid") {
      return <Badge variant="default" className="bg-green-500">Paid</Badge>;
    }
    if (status === "partial") {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Partial</Badge>;
    }
    return <Badge variant="destructive">Pending</Badge>;
  };

  const handlePayment = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPaymentForm(true);
  };

  const handlePrint = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <AddBillForm onBillAdded={onRefresh} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Bill No.</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[100px] text-right">Total</TableHead>
              <TableHead className="w-[100px] text-right">Paid</TableHead>
              <TableHead className="w-[100px] text-right">Due</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No bills found
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.slice(0, 50).map((bill) => (
                <TableRow key={bill.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{bill.bill_number}</TableCell>
                  <TableCell className="font-medium">{bill.patients?.full_name || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(bill.bill_date)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{bill.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    ₹{(bill.paid_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    ₹{bill.due_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(bill.status, bill.due_amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => bill.patients?.id && navigate(`/patient/${bill.patients.id}`)}
                        title="View Patient"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(bill)}
                        title="Print Bill"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {bill.due_amount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePayment(bill)}
                          className="h-8 text-xs"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredBills.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredBills.length} bills.
        </p>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment - {selectedBill?.bill_number}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <PaymentForm
              billId={selectedBill.id}
              dueAmount={selectedBill.due_amount}
              onPaymentAdded={() => {
                setShowPaymentForm(false);
                setSelectedBill(null);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Print Modal */}
      {selectedBill && (
        <BillPrintModal
          bill={selectedBill}
          open={showPrintModal}
          onOpenChange={(open) => {
            setShowPrintModal(open);
            if (!open) setSelectedBill(null);
          }}
        />
      )}
    </div>
  );
}
