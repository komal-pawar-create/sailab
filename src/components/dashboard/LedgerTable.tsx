import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TablePagination } from "./TablePagination";
import { Skeleton } from "@/components/ui/skeleton";

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
  totalCount: number;
  totalCollected: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (search: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function LedgerTable({ 
  payments, 
  totalCount,
  totalCollected,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRefresh,
  isLoading = false 
}: LedgerTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

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
            onChange={(e) => handleSearchChange(e.target.value)}
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
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm">
                    {formatDate(payment.payment_date)}
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

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
    </div>
  );
}
