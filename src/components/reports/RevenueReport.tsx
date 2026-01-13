import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface RevenueRow {
  date: string;
  bills_count: number;
  total_revenue: number;
  collections: number;
  outstanding: number;
}

const columns: ExportColumn[] = [
  { key: 'date', header: 'Date', width: 15 },
  { key: 'bills_count', header: 'Bills', width: 10 },
  { key: 'total_revenue', header: 'Revenue', width: 15 },
  { key: 'collections', header: 'Collections', width: 15 },
  { key: 'outstanding', header: 'Outstanding', width: 15 },
];

export function RevenueReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RevenueRow[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, collections: 0, outstanding: 0, bills: 0 });
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
    if (!profile?.lab_id || !filters.dateFrom || !filters.dateTo) return;
    setLoading(true);

    // Determine branch filter
    const branchFilter = !isAdmin && profile?.branch_id 
      ? profile.branch_id 
      : (filters.branch !== 'all' ? filters.branch : null);

    // Fetch bills
    let billsQuery = supabase
      .from('bills')
      .select('bill_date, total_amount, paid_amount, due_amount')
      .eq('lab_id', profile.lab_id)
      .gte('bill_date', format(filters.dateFrom, 'yyyy-MM-dd'))
      .lte('bill_date', format(filters.dateTo, 'yyyy-MM-dd'));

    if (branchFilter) {
      billsQuery = billsQuery.eq('branch_id', branchFilter);
    }

    // Fetch payments - join with bills to filter by lab_id
    let paymentsQuery = supabase
      .from('bill_payments')
      .select('payment_date, payment_amount, bills!inner(lab_id, branch_id)')
      .gte('payment_date', format(filters.dateFrom, 'yyyy-MM-dd'))
      .lte('payment_date', format(filters.dateTo, 'yyyy-MM-dd'))
      .eq('bills.lab_id', profile.lab_id);

    if (branchFilter) {
      paymentsQuery = paymentsQuery.eq('bills.branch_id', branchFilter);
    }

    const [billsResult, paymentsResult] = await Promise.all([billsQuery, paymentsQuery]);

    if (billsResult.data && paymentsResult.data) {
      const days = eachDayOfInterval({ start: filters.dateFrom, end: filters.dateTo });
      
      const revenueByDate: Record<string, RevenueRow> = {};
      
      // Initialize all days
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        revenueByDate[dateKey] = {
          date: format(day, 'dd/MM/yyyy'),
          bills_count: 0,
          total_revenue: 0,
          collections: 0,
          outstanding: 0,
        };
      });

      // Aggregate bills
      billsResult.data.forEach((bill: any) => {
        const dateKey = bill.bill_date;
        if (revenueByDate[dateKey]) {
          revenueByDate[dateKey].bills_count++;
          revenueByDate[dateKey].total_revenue += bill.total_amount;
          revenueByDate[dateKey].outstanding += bill.due_amount;
        }
      });

      // Aggregate payments
      paymentsResult.data.forEach((payment: any) => {
        const dateKey = payment.payment_date;
        if (revenueByDate[dateKey]) {
          revenueByDate[dateKey].collections += payment.payment_amount;
        }
      });

      // Sort by date ascending (chronological order)
      const processedData = Object.entries(revenueByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => value);
        
      setData(processedData);
      setTotals({
        revenue: processedData.reduce((sum, r) => sum + r.total_revenue, 0),
        collections: processedData.reduce((sum, r) => sum + r.collections, 0),
        outstanding: processedData.reduce((sum, r) => sum + r.outstanding, 0),
        bills: processedData.reduce((sum, r) => sum + r.bills_count, 0),
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

  const handleExportExcel = () => {
    const exportData = data.map((r) => ({
      ...r,
      total_revenue: formatCurrency(r.total_revenue),
      collections: formatCurrency(r.collections),
      outstanding: formatCurrency(r.outstanding),
    }));
    exportToExcel(exportData, columns, {
      filename: `Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Revenue Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map((r) => ({
      ...r,
      total_revenue: formatCurrency(r.total_revenue),
      collections: formatCurrency(r.collections),
      outstanding: formatCurrency(r.outstanding),
    }));
    exportToPDF(exportData, columns, {
      filename: `Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Revenue Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    const exportData = data.map((r) => ({
      ...r,
      total_revenue: formatCurrency(r.total_revenue),
      collections: formatCurrency(r.collections),
      outstanding: formatCurrency(r.outstanding),
    }));
    printReport(exportData, columns, {
      filename: 'Revenue_Report',
      title: 'Revenue Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            showSearch={false}
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Bills:</span>{' '}
                <span className="font-semibold">{totals.bills}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revenue:</span>{' '}
                <span className="font-semibold">{formatCurrency(totals.revenue)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Collections:</span>{' '}
                <span className="font-semibold text-green-600">{formatCurrency(totals.collections)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Outstanding:</span>{' '}
                <span className="font-semibold text-red-600">{formatCurrency(totals.outstanding)}</span>
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
                      No data found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell>{row.bills_count}</TableCell>
                      <TableCell>{formatCurrency(row.total_revenue)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(row.collections)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(row.outstanding)}</TableCell>
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
