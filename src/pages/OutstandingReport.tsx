import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Download, 
  Eye, 
  Printer, 
  CreditCard,
  AlertCircle,
  Users,
  IndianRupee,
  ArrowUpDown,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import BillPrintModal from "@/components/bills/BillPrintModal";
import { EditBillForm } from "@/components/forms/EditBillForm";

interface OutstandingBill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  patient_id: string;
  branch_id: string | null;
  patients: {
    id: string;
    patient_id: string;
    full_name: string;
    phone: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

type SortField = 'due_amount' | 'bill_date' | 'due_date' | 'patient_name';
type SortOrder = 'asc' | 'desc';

export default function OutstandingReport() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const [bills, setBills] = useState<OutstandingBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<OutstandingBill[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('due_amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Payment modal state
  const [paymentBill, setPaymentBill] = useState<OutstandingBill | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Print modal state
  const [printBill, setPrintBill] = useState<OutstandingBill | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Edit modal state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editBill, setEditBill] = useState<OutstandingBill | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchOutstandingBills();
      if (isAdmin) {
        fetchBranches();
      }
    }
  }, [user, profile]);

  useEffect(() => {
    filterAndSortBills();
  }, [bills, searchQuery, selectedBranch, sortField, sortOrder]);

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setBranches(data);
    }
  };

  const fetchOutstandingBills = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          bill_date,
          due_date,
          total_amount,
          paid_amount,
          due_amount,
          status,
          patient_id,
          branch_id,
          patients (
            id,
            patient_id,
            full_name,
            phone
          )
        `)
        .gt('due_amount', 0)
        .order('due_amount', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setBills((data as unknown as OutstandingBill[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch outstanding bills",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortBills = () => {
    let filtered = [...bills];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bill => 
        bill.patients?.full_name?.toLowerCase().includes(query) ||
        bill.patients?.patient_id?.toLowerCase().includes(query) ||
        bill.bill_number?.toLowerCase().includes(query) ||
        bill.patients?.phone?.includes(query)
      );
    }

    // Branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(bill => bill.branch_id === selectedBranch);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'due_amount':
          comparison = a.due_amount - b.due_amount;
          break;
        case 'bill_date':
          comparison = new Date(a.bill_date).getTime() - new Date(b.bill_date).getTime();
          break;
        case 'due_date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'patient_name':
          comparison = (a.patients?.full_name || '').localeCompare(b.patients?.full_name || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBills(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Patient ID', 'Patient Name', 'Phone', 'Bill Number', 'Bill Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Due Amount', 'Status'];
    const rows = filteredBills.map(bill => [
      bill.patients?.patient_id || '',
      bill.patients?.full_name || '',
      bill.patients?.phone || '',
      bill.bill_number,
      format(new Date(bill.bill_date), 'dd/MM/yyyy'),
      format(new Date(bill.due_date), 'dd/MM/yyyy'),
      bill.total_amount,
      bill.paid_amount || 0,
      bill.due_amount,
      bill.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outstanding-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setPaymentBill(null);
    fetchOutstandingBills();
    toast({
      title: "Payment Recorded",
      description: "Payment has been recorded successfully",
    });
  };

  const totalOutstanding = filteredBills.reduce((sum, bill) => sum + bill.due_amount, 0);
  const uniquePatients = new Set(filteredBills.map(bill => bill.patient_id)).size;

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            Outstanding Payments Report
          </h1>
          <p className="text-muted-foreground mt-1">
            View all patients with pending bill payments
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Aging Analysis */}
      {(() => {
        const today = new Date();
        const aging = {
          current: { count: 0, amount: 0 },
          days30: { count: 0, amount: 0 },
          days60: { count: 0, amount: 0 },
          days90: { count: 0, amount: 0 },
        };

        filteredBills.forEach(bill => {
          const billDate = new Date(bill.bill_date);
          const daysDiff = Math.floor((today.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 30) {
            aging.current.count++;
            aging.current.amount += bill.due_amount;
          } else if (daysDiff <= 60) {
            aging.days30.count++;
            aging.days30.amount += bill.due_amount;
          } else if (daysDiff <= 90) {
            aging.days60.count++;
            aging.days60.amount += bill.due_amount;
          } else {
            aging.days90.count++;
            aging.days90.amount += bill.due_amount;
          }
        });

        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  ₹{totalOutstanding.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{uniquePatients} patients</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Current (0-30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-green-600">
                  ₹{aging.current.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{aging.current.count} bills</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  31-60 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-yellow-600">
                  ₹{aging.days30.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{aging.days30.count} bills</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  61-90 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-orange-600">
                  ₹{aging.days60.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{aging.days60.count} bills</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  90+ days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-600">
                  ₹{aging.days90.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{aging.days90.count} bills</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, ID, bill number, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isAdmin && branches.length > 0 && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('patient_name')}
                  >
                    <div className="flex items-center gap-1">
                      Patient Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Bill Number</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('bill_date')}
                  >
                    <div className="flex items-center gap-1">
                      Bill Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('due_date')}
                  >
                    <div className="flex items-center gap-1">
                      Due Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('due_amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Due Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      {searchQuery || selectedBranch !== 'all' 
                        ? 'No outstanding bills match your search criteria'
                        : 'No outstanding bills found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-sm">
                        {bill.patients?.patient_id}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/patient/${bill.patients?.id}`)}
                          className="text-primary hover:underline font-medium"
                        >
                          {bill.patients?.full_name}
                        </button>
                      </TableCell>
                      <TableCell>{bill.patients?.phone}</TableCell>
                      <TableCell className="font-mono text-sm">{bill.bill_number}</TableCell>
                      <TableCell>{format(new Date(bill.bill_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(new Date(bill.due_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">₹{bill.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{(bill.paid_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">
                        ₹{bill.due_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bill.status === 'partial' ? 'secondary' : 'destructive'}>
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/patient/${bill.patients?.id}`)}
                            title="View Patient"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditBill(bill);
                                setShowEditForm(true);
                              }}
                              title="Edit Bill"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPrintBill(bill);
                              setShowPrintModal(true);
                            }}
                            title="Print Bill"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPaymentBill(bill);
                              setShowPaymentForm(true);
                            }}
                            title="Record Payment"
                            className="text-primary"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      {paymentBill && (
        <Dialog open={showPaymentForm} onOpenChange={(open) => {
          setShowPaymentForm(open);
          if (!open) setPaymentBill(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record Payment - {paymentBill.bill_number}</DialogTitle>
            </DialogHeader>
            <QuickPaymentForm
              billId={paymentBill.id}
              dueAmount={paymentBill.due_amount}
              onSuccess={handlePaymentSuccess}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Print Modal */}
      <BillPrintModal
        bill={printBill ? {
          id: printBill.id,
          bill_number: printBill.bill_number,
          bill_date: printBill.bill_date,
          due_date: printBill.due_date,
          total_amount: printBill.total_amount,
          paid_amount: printBill.paid_amount || 0,
          due_amount: printBill.due_amount,
          status: printBill.status,
          items: [],
          branch_id: printBill.branch_id || undefined,
          patients: printBill.patients,
        } : null}
        open={showPrintModal}
        onOpenChange={(open) => {
          setShowPrintModal(open);
          if (!open) setPrintBill(null);
        }}
      />

      {/* Edit Bill Form (Admin Only) */}
      {editBill && (
        <EditBillForm
          bill={{
            id: editBill.id,
            bill_number: editBill.bill_number,
            bill_date: editBill.bill_date,
            due_date: editBill.due_date,
            total_amount: editBill.total_amount,
            paid_amount: editBill.paid_amount,
            due_amount: editBill.due_amount,
            status: editBill.status,
            items: [],
            patients: editBill.patients
          }}
          open={showEditForm}
          onOpenChange={(open) => {
            setShowEditForm(open);
            if (!open) setEditBill(null);
          }}
          onBillUpdated={fetchOutstandingBills}
        />
      )}
    </div>
  );
}

// Quick Payment Form Component for the dialog
function QuickPaymentForm({ 
  billId, 
  dueAmount, 
  onSuccess 
}: { 
  billId: string; 
  dueAmount: number; 
  onSuccess: () => void;
}) {
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

      onSuccess();
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
  );
}
