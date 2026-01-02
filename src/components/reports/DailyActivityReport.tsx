import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Calendar, Users, Receipt, FileText, Wallet } from 'lucide-react';

interface DailyActivity {
  metric: string;
  count: number;
  amount?: number;
}

const columns: ExportColumn[] = [
  { key: 'metric', header: 'Activity', width: 30 },
  { key: 'count', header: 'Count', width: 15 },
  { key: 'amount', header: 'Amount', width: 20 },
];

export function DailyActivityReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyActivity[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: new Date(),
    dateTo: new Date(),
    branch: 'all',
    status: 'all',
    search: '',
  });

  const fetchData = async () => {
    if (!profile?.lab_id || !filters.dateFrom) return;
    setLoading(true);

    const dateStr = format(filters.dateFrom, 'yyyy-MM-dd');
    const branchFilter = filters.branch !== 'all' ? filters.branch : null;

    // Parallel queries
    const [patientsResult, billsResult, testsResult, paymentsResult] = await Promise.all([
      // New patients
      supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .eq('lab_id', profile.lab_id)
        .gte('created_at', dateStr)
        .lte('created_at', dateStr + 'T23:59:59')
        .then((res) => {
          if (branchFilter) {
            return supabase
              .from('patients')
              .select('id', { count: 'exact' })
              .eq('lab_id', profile.lab_id)
              .eq('branch_id', branchFilter)
              .gte('created_at', dateStr)
              .lte('created_at', dateStr + 'T23:59:59');
          }
          return res;
        }),

      // Bills
      supabase
        .from('bills')
        .select('total_amount')
        .eq('lab_id', profile.lab_id)
        .eq('bill_date', dateStr)
        .then((res) => {
          if (branchFilter && !res.error) {
            return supabase
              .from('bills')
              .select('total_amount')
              .eq('lab_id', profile.lab_id)
              .eq('branch_id', branchFilter)
              .eq('bill_date', dateStr);
          }
          return res;
        }),

      // Test reports
      supabase
        .from('test_reports')
        .select('id', { count: 'exact' })
        .eq('lab_id', profile.lab_id)
        .eq('test_date', dateStr)
        .then((res) => {
          if (branchFilter && !res.error) {
            return supabase
              .from('test_reports')
              .select('id', { count: 'exact' })
              .eq('lab_id', profile.lab_id)
              .eq('branch_id', branchFilter)
              .eq('test_date', dateStr);
          }
          return res;
        }),

      // Payments
      supabase
        .from('bill_payments')
        .select('payment_amount')
        .eq('payment_date', dateStr)
        .then((res) => {
          if (branchFilter && !res.error) {
            return supabase
              .from('bill_payments')
              .select('payment_amount')
              .eq('branch_id', branchFilter)
              .eq('payment_date', dateStr);
          }
          return res;
        }),
    ]);

    const billsTotal = billsResult.data?.reduce((sum: number, b: any) => sum + b.total_amount, 0) || 0;
    const paymentsTotal = paymentsResult.data?.reduce((sum: number, p: any) => sum + p.payment_amount, 0) || 0;

    setData([
      { metric: 'New Patients Registered', count: patientsResult.count || 0 },
      { metric: 'Bills Generated', count: billsResult.data?.length || 0, amount: billsTotal },
      { metric: 'Test Reports Created', count: testsResult.count || 0 },
      { metric: 'Payments Received', count: paymentsResult.data?.length || 0, amount: paymentsTotal },
    ]);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.lab_id]);

  const handleExportExcel = () => {
    const exportData = data.map((d) => ({
      ...d,
      amount: d.amount !== undefined ? formatCurrency(d.amount) : '-',
    }));
    exportToExcel(exportData, columns, {
      filename: `Daily_Activity_Report_${format(filters.dateFrom!, 'yyyy-MM-dd')}`,
      title: 'Daily Activity Report',
      subtitle: format(filters.dateFrom!, 'dd MMMM yyyy'),
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map((d) => ({
      ...d,
      amount: d.amount !== undefined ? formatCurrency(d.amount) : '-',
    }));
    exportToPDF(exportData, columns, {
      filename: `Daily_Activity_Report_${format(filters.dateFrom!, 'yyyy-MM-dd')}`,
      title: 'Daily Activity Report',
      subtitle: format(filters.dateFrom!, 'dd MMMM yyyy'),
    });
  };

  const handlePrint = () => {
    const exportData = data.map((d) => ({
      ...d,
      amount: d.amount !== undefined ? formatCurrency(d.amount) : '-',
    }));
    printReport(exportData, columns, {
      filename: 'Daily_Activity_Report',
      title: `Daily Activity Report - ${format(filters.dateFrom!, 'dd MMMM yyyy')}`,
    });
  };

  const getIcon = (metric: string) => {
    if (metric.includes('Patient')) return <Users className="h-4 w-4" />;
    if (metric.includes('Bill')) return <Receipt className="h-4 w-4" />;
    if (metric.includes('Test')) return <FileText className="h-4 w-4" />;
    if (metric.includes('Payment')) return <Wallet className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Activity Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            showSearch={false}
          />

          <div className="flex items-center justify-end">
            <ExportButtons
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onPrint={handlePrint}
              disabled={data.length === 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((activity, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getIcon(activity.metric)}
                </div>
                <div>
                  <p className="text-2xl font-bold">{activity.count}</p>
                  <p className="text-sm text-muted-foreground">{activity.metric}</p>
                  {activity.amount !== undefined && (
                    <p className="text-sm font-medium text-green-600">{formatCurrency(activity.amount)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  data.map((activity, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {getIcon(activity.metric)}
                        {activity.metric}
                      </TableCell>
                      <TableCell>{activity.count}</TableCell>
                      <TableCell>
                        {activity.amount !== undefined ? formatCurrency(activity.amount) : '-'}
                      </TableCell>
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
