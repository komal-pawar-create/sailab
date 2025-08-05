import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Calendar, Download } from 'lucide-react';

interface LedgerEntry {
  id: string;
  type: 'bill' | 'payment';
  date: string;
  bill_number?: string;
  patient_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  payment_method?: string;
  reference_number?: string;
}

export const LedgerHistory = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    patient: '',
    type: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLedgerData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, filters]);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      // Fetch bills
      const { data: billsData } = await supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          bill_date,
          total_amount,
          patient_id
        `)
        .order('bill_date', { ascending: false });

      // Fetch patients for name mapping
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, full_name');

      const patientMap = new Map();
      patientsData?.forEach(patient => {
        patientMap.set(patient.id, patient.full_name);
      });

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('bill_payments')
        .select(`
          id,
          payment_amount,
          payment_date,
          payment_method,
          reference_number,
          bill_id
        `)
        .order('payment_date', { ascending: false });

      // Fetch bills for payment mapping
      const { data: billsForPayments } = await supabase
        .from('bills')
        .select('id, bill_number, patient_id');

      const billMap = new Map();
      billsForPayments?.forEach(bill => {
        billMap.set(bill.id, bill);
      });

      // Combine and transform data
      const ledgerEntries: LedgerEntry[] = [];
      let runningBalance = 0;

      // Add bills as debit entries
      billsData?.forEach(bill => {
        runningBalance += bill.total_amount;
        ledgerEntries.push({
          id: bill.id,
          type: 'bill',
          date: bill.bill_date,
          bill_number: bill.bill_number,
          patient_name: patientMap.get(bill.patient_id) || 'Unknown',
          description: `Bill ${bill.bill_number}`,
          debit_amount: bill.total_amount,
          credit_amount: 0,
          balance: runningBalance
        });
      });

      // Add payments as credit entries
      paymentsData?.forEach(payment => {
        const bill = billMap.get(payment.bill_id);
        runningBalance -= payment.payment_amount;
        ledgerEntries.push({
          id: payment.id,
          type: 'payment',
          date: payment.payment_date.split('T')[0],
          bill_number: bill?.bill_number,
          patient_name: patientMap.get(bill?.patient_id) || 'Unknown',
          description: `Payment - ${payment.payment_method}`,
          debit_amount: 0,
          credit_amount: payment.payment_amount,
          balance: runningBalance,
          payment_method: payment.payment_method,
          reference_number: payment.reference_number
        });
      });

      // Sort by date
      ledgerEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Recalculate running balance in correct order
      let balance = 0;
      for (let i = ledgerEntries.length - 1; i >= 0; i--) {
        if (ledgerEntries[i].type === 'bill') {
          balance += ledgerEntries[i].debit_amount;
        } else {
          balance -= ledgerEntries[i].credit_amount;
        }
        ledgerEntries[i].balance = balance;
      }

      setEntries(ledgerEntries);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch ledger data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (filters.fromDate) {
      filtered = filtered.filter(entry => entry.date >= filters.fromDate);
    }

    if (filters.toDate) {
      filtered = filtered.filter(entry => entry.date <= filters.toDate);
    }

    if (filters.patient) {
      filtered = filtered.filter(entry => 
        entry.patient_name.toLowerCase().includes(filters.patient.toLowerCase()) ||
        entry.bill_number?.toLowerCase().includes(filters.patient.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }

    setFilteredEntries(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Bill Number', 'Patient', 'Description', 'Debit', 'Credit', 'Balance'],
      ...filteredEntries.map(entry => [
        entry.date,
        entry.type,
        entry.bill_number || '',
        entry.patient_name,
        entry.description,
        entry.debit_amount.toFixed(2),
        entry.credit_amount.toFixed(2),
        entry.balance.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTotalDebit = () => filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
  const getTotalCredit = () => filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
  const getCurrentBalance = () => getTotalDebit() - getTotalCredit();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Ledger History</CardTitle>
            <CardDescription>Complete transaction history and financial ledger</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="fromDate">From Date</Label>
            <Input
              id="fromDate"
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">To Date</Label>
            <Input
              id="toDate"
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient">Search Patient/Bill</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="patient"
                placeholder="Patient name or bill number"
                value={filters.patient}
                onChange={(e) => setFilters({ ...filters, patient: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="bill">Bills Only</SelectItem>
                <SelectItem value="payment">Payments Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">₹{getTotalDebit().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">₹{getTotalCredit().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${getCurrentBalance() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Math.abs(getCurrentBalance()).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCurrentBalance() >= 0 ? 'Outstanding' : 'Overpaid'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Bill #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading ledger data...
                  </TableCell>
                </TableRow>
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'bill' ? 'destructive' : 'default'}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.bill_number || '-'}</TableCell>
                    <TableCell>{entry.patient_name}</TableCell>
                    <TableCell>
                      {entry.description}
                      {entry.reference_number && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {entry.reference_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${entry.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Math.abs(entry.balance).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};