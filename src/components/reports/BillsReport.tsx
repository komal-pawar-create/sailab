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
import { Receipt } from 'lucide-react';

interface Bill {
  bill_number: string;
  patient_name: string;
  bill_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  branch_name?: string;
}

const columns: ExportColumn[] = [
  { key: 'bill_number', header: 'Bill No', width: 15 },
  { key: 'patient_name', header: 'Patient Name', width: 25 },
  { key: 'bill_date', header: 'Date', width: 12 },
  { key: 'total_amount', header: 'Total', width: 12 },
  { key: 'paid_amount', header: 'Paid', width: 12 },
  { key: 'due_amount', header: 'Due', width: 12 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'branch_name', header: 'Branch', width: 15 },
];

const statusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
];

export function BillsReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Bill[]>([]);
  const [totals, setTotals] = useState({ total: 0, paid: 0, due: 0 });
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
      .from('bills')
      .select(`
        bill_number,
        bill_date,
        total_amount,
        paid_amount,
        due_amount,
        status,
        patients!bills_patient_id_fkey(full_name),
        branches!fk_bills_branch(name)
      `)
      .eq('lab_id', profile.lab_id)
      .order('bill_date', { ascending: true }); // Ascending for chronological order

    if (filters.dateFrom) {
      query = query.gte('bill_date', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      query = query.lte('bill_date', format(filters.dateTo, 'yyyy-MM-dd'));
    }
    
    // Branch isolation - operators can only see their branch
    if (!isAdmin && profile?.branch_id) {
      query = query.eq('branch_id', profile.branch_id);
    } else if (filters.branch && filters.branch !== 'all') {
      query = query.eq('branch_id', filters.branch);
    }
    
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data: bills, error } = await query;

    if (!error && bills) {
      const processedData = bills
        .filter((b: any) => {
          if (!filters.search) return true;
          const searchLower = filters.search.toLowerCase();
          return (
            b.bill_number.toLowerCase().includes(searchLower) ||
            b.patients?.full_name?.toLowerCase().includes(searchLower)
          );
        })
        .map((b: any) => ({
          bill_number: b.bill_number,
          patient_name: b.patients?.full_name || '-',
          bill_date: format(new Date(b.bill_date), 'dd/MM/yyyy'),
          total_amount: b.total_amount,
          paid_amount: b.paid_amount || 0,
          due_amount: b.due_amount,
          status: b.status,
          branch_name: b.branches?.name || '-',
        }));

      setData(processedData);
      setTotals({
        total: processedData.reduce((sum, b) => sum + b.total_amount, 0),
        paid: processedData.reduce((sum, b) => sum + b.paid_amount, 0),
        due: processedData.reduce((sum, b) => sum + b.due_amount, 0),
      });
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      partial: 'secondary',
      pending: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const handleExportExcel = () => {
    const exportData = data.map((b) => ({
      ...b,
      total_amount: formatCurrency(b.total_amount),
      paid_amount: formatCurrency(b.paid_amount),
      due_amount: formatCurrency(b.due_amount),
    }));
    exportToExcel(exportData, columns, {
      filename: `Bills_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Bills Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map((b) => ({
      ...b,
      total_amount: formatCurrency(b.total_amount),
      paid_amount: formatCurrency(b.paid_amount),
      due_amount: formatCurrency(b.due_amount),
    }));
    exportToPDF(exportData, columns, {
      filename: `Bills_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Bills Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    const exportData = data.map((b) => ({
      ...b,
      total_amount: formatCurrency(b.total_amount),
      paid_amount: formatCurrency(b.paid_amount),
      due_amount: formatCurrency(b.due_amount),
    }));
    printReport(exportData, columns, {
      filename: 'Bills_Report',
      title: 'Bills Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bills Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            showStatus
            statusOptions={statusOptions}
            searchPlaceholder="Search by bill no or patient name..."
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-semibold">{formatCurrency(totals.total)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Paid:</span>{' '}
                <span className="font-semibold text-green-600">{formatCurrency(totals.paid)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Due:</span>{' '}
                <span className="font-semibold text-red-600">{formatCurrency(totals.due)}</span>
              </div>
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
                      No bills found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((bill) => (
                    <TableRow key={bill.bill_number}>
                      <TableCell className="font-medium">{bill.bill_number}</TableCell>
                      <TableCell>{bill.patient_name}</TableCell>
                      <TableCell>{bill.bill_date}</TableCell>
                      <TableCell>{formatCurrency(bill.total_amount)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(bill.paid_amount)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(bill.due_amount)}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>{bill.branch_name}</TableCell>
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
