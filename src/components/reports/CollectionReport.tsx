import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { Wallet } from 'lucide-react';

interface Collection {
  payment_date: string;
  bill_number: string;
  patient_name: string;
  payment_amount: number;
  payment_method: string;
  reference_number: string | null;
  branch_name?: string;
}

const columns: ExportColumn[] = [
  { key: 'payment_date', header: 'Date', width: 12 },
  { key: 'bill_number', header: 'Bill No', width: 15 },
  { key: 'patient_name', header: 'Patient', width: 25 },
  { key: 'payment_amount', header: 'Amount', width: 12 },
  { key: 'payment_method', header: 'Method', width: 12 },
  { key: 'reference_number', header: 'Reference', width: 15 },
  { key: 'branch_name', header: 'Branch', width: 15 },
];

const methodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
];

export function CollectionReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Collection[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: subDays(new Date(), 29),
    dateTo: new Date(),
    branch: 'all',
    status: 'all',
    search: '',
  });

  // Check if user is admin/lab_admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  const fetchData = async () => {
    if (!profile?.lab_id) return;
    setLoading(true);

    let query = supabase
      .from('bill_payments')
      .select(`
        payment_date,
        payment_amount,
        payment_method,
        reference_number,
        bills!fk_bill_payments_bill(bill_number, patients!bills_patient_id_fkey(full_name)),
        branches!fk_bill_payments_branch(name)
      `)
      .order('payment_date', { ascending: true }); // Ascending for chronological order

    if (filters.dateFrom) {
      query = query.gte('payment_date', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      query = query.lte('payment_date', format(filters.dateTo, 'yyyy-MM-dd'));
    }
    
    // Branch isolation - operators can only see their branch
    if (!isAdmin && profile?.branch_id) {
      query = query.eq('branch_id', profile.branch_id);
    } else if (filters.branch && filters.branch !== 'all') {
      query = query.eq('branch_id', filters.branch);
    }
    
    if (filters.status && filters.status !== 'all') {
      query = query.eq('payment_method', filters.status);
    }

    const { data: payments, error } = await query;

    if (!error && payments) {
      const processedData = payments
        .filter((p: any) => {
          if (!filters.search) return true;
          const searchLower = filters.search.toLowerCase();
          return (
            p.bills?.bill_number?.toLowerCase().includes(searchLower) ||
            p.bills?.patients?.full_name?.toLowerCase().includes(searchLower)
          );
        })
        .map((p: any) => ({
          payment_date: format(new Date(p.payment_date), 'dd/MM/yyyy'),
          bill_number: p.bills?.bill_number || '-',
          patient_name: p.bills?.patients?.full_name || '-',
          payment_amount: p.payment_amount,
          payment_method: p.payment_method,
          reference_number: p.reference_number || '-',
          branch_name: p.branches?.name || '-',
        }));

      setData(processedData);

      // Calculate totals by method
      const methodTotals: Record<string, number> = {};
      processedData.forEach((p) => {
        methodTotals[p.payment_method] = (methodTotals[p.payment_method] || 0) + p.payment_amount;
      });
      setTotals(methodTotals);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.lab_id]);

  // Auto-apply branch filter for non-admins
  useEffect(() => {
    if (!isAdmin && profile?.branch_id && filters.branch === 'all') {
      setFilters(prev => ({ ...prev, branch: profile.branch_id! }));
    }
  }, [isAdmin, profile?.branch_id]);

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      upi: 'bg-purple-100 text-purple-800',
      bank_transfer: 'bg-orange-100 text-orange-800',
      cheque: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[method] || 'bg-gray-100 text-gray-800'}>
        {method.replace('_', ' ')}
      </Badge>
    );
  };

  const handleExportExcel = () => {
    const exportData = data.map((c) => ({
      ...c,
      payment_amount: formatCurrency(c.payment_amount),
    }));
    exportToExcel(exportData, columns, {
      filename: `Collection_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Collection Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map((c) => ({
      ...c,
      payment_amount: formatCurrency(c.payment_amount),
    }));
    exportToPDF(exportData, columns, {
      filename: `Collection_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Collection Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    const exportData = data.map((c) => ({
      ...c,
      payment_amount: formatCurrency(c.payment_amount),
    }));
    printReport(exportData, columns, {
      filename: 'Collection_Report',
      title: 'Collection Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const totalCollection = Object.values(totals).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Collection Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            showStatus
            statusOptions={methodOptions}
            searchPlaceholder="Search by bill no or patient..."
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-4 text-sm flex-wrap">
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-semibold text-green-600">{formatCurrency(totalCollection)}</span>
              </div>
              {Object.entries(totals).map(([method, amount]) => (
                <div key={method}>
                  <span className="text-muted-foreground capitalize">{method.replace('_', ' ')}:</span>{' '}
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
            <ExportButtons
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
              disabled={data.length === 0}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      No collections found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((collection, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{collection.payment_date}</TableCell>
                      <TableCell className="font-medium">{collection.bill_number}</TableCell>
                      <TableCell>{collection.patient_name}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(collection.payment_amount)}
                      </TableCell>
                      <TableCell>{getMethodBadge(collection.payment_method)}</TableCell>
                      <TableCell>{collection.reference_number}</TableCell>
                      <TableCell>{collection.branch_name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
