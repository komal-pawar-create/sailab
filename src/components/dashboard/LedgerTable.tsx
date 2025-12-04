import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Receipt } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  bills?: {
    id: string;
    bill_number: string;
    total_amount: number;
    patients?: {
      id: string;
      full_name: string;
      patient_id: string;
    };
  };
}

interface LedgerTableProps {
  payments: Payment[];
  onRefresh: () => void;
}

export function LedgerTable({ payments, onRefresh }: LedgerTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Sort payments by date descending and filter
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );

  const filteredPayments = sortedPayments.filter((p) =>
    p.bills?.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.bills?.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.payment_method.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate running balance (total collected)
  const totalCollected = payments.reduce((sum, p) => sum + p.payment_amount, 0);

  // Calculate running balance for display (oldest to newest for running total)
  const paymentsWithBalance = [...filteredPayments].reverse().reduce<(Payment & { runningBalance: number })[]>(
    (acc, payment) => {
      const previousBalance = acc.length > 0 ? acc[acc.length - 1].runningBalance : 0;
      acc.push({
        ...payment,
        runningBalance: previousBalance + payment.payment_amount,
      });
      return acc;
    },
    []
  ).reverse(); // Reverse back to show newest first

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: "bg-green-500",
      card: "bg-blue-500",
      upi: "bg-purple-500",
      bank_transfer: "bg-orange-500",
      cheque: "bg-yellow-600",
    };
    return (
      <Badge variant="secondary" className={`${colors[method] || "bg-muted"} text-white`}>
        {method.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Collected: </span>
            <span className="font-bold text-green-600">₹{totalCollected.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[100px]">Bill No.</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-[100px]">Method</TableHead>
              <TableHead className="w-[120px]">Reference</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[120px] text-right">Running Balance</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              paymentsWithBalance.slice(0, 100).map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm">
                    {format(new Date(payment.payment_date), "dd MMM yy")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.bills?.bill_number || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.bills?.patients?.full_name || "-"}
                  </TableCell>
                  <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {payment.reference_number || "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    +₹{payment.payment_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{payment.runningBalance.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      {payment.bills?.patients?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/patient/${payment.bills!.patients!.id}`)}
                          title="View Patient"
                        >
                          <Eye className="h-4 w-4" />
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

      {paymentsWithBalance.length > 100 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 100 of {paymentsWithBalance.length} payments.
        </p>
      )}
    </div>
  );
}
