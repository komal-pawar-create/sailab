import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { Users } from 'lucide-react';

interface PatientReportRow {
  sr_no: number;
  date: string;
  patient_name: string;
  study: string;
  doctor_name: string;
  paid: number;
  unpaid: number;
  discount: number;
  branch_name?: string;
}

// Helper to extract test names from bill items
const extractStudyFromItems = (items: any): string => {
  if (!items) return '-';
  try {
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    if (!Array.isArray(parsedItems)) return '-';
    return parsedItems.map((item: any) => item.name || item.test_name || item.description || '').filter(Boolean).join(', ') || '-';
  } catch {
    return '-';
  }
};

export function PatientReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PatientReportRow[]>([]);
  const [totals, setTotals] = useState({ paid: 0, unpaid: 0, discount: 0 });
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: subDays(new Date(), 29),
    dateTo: new Date(),
    branch: 'all',
    status: 'all',
    search: '',
  });

  // Check if user is admin/lab_admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  // Columns for display (without branch for non-admins)
  const getColumns = (): ExportColumn[] => {
    const baseColumns: ExportColumn[] = [
      { key: 'sr_no', header: 'NO.', width: 8 },
      { key: 'date', header: 'DATE', width: 12 },
      { key: 'patient_name', header: 'PATIENTS NAME', width: 25 },
      { key: 'study', header: 'STUDY', width: 20 },
      { key: 'doctor_name', header: 'DOCTORS NAME', width: 20 },
      { key: 'paid', header: 'PAID', width: 12 },
      { key: 'unpaid', header: 'UNPAID', width: 12 },
      { key: 'discount', header: 'DISCOUNT', width: 12 },
    ];
    
    if (isAdmin) {
      baseColumns.push({ key: 'branch_name', header: 'BRANCH', width: 15 });
    }
    
    return baseColumns;
  };

  const columns = getColumns();

  const fetchData = async () => {
    if (!profile?.lab_id) return;
    setLoading(true);

    let query = supabase
      .from('bills')
      .select(`
        id,
        bill_date,
        total_amount,
        paid_amount,
        due_amount,
        items,
        patients!bills_patient_id_fkey(
          full_name,
          referred_by_doctor_name
        ),
        branches!fk_bills_branch(name)
      `)
      .eq('lab_id', profile.lab_id)
      .order('bill_date', { ascending: true }); // Ascending for chronological order (1st, 2nd, 3rd...)

    // Date filters
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

    // Search filter
    if (filters.search) {
      query = query.or(`patients.full_name.ilike.%${filters.search}%`);
    }

    const { data: bills, error } = await query;

    if (!error && bills) {
      // Process and add serial numbers
      const processedData: PatientReportRow[] = bills.map((b: any, index: number) => {
        // Calculate discount (total - paid - unpaid if discount exists, or 0)
        const paidAmount = b.paid_amount || 0;
        const dueAmount = b.due_amount || 0;
        
        return {
          sr_no: index + 1,
          date: format(new Date(b.bill_date), 'dd-MM-yyyy'),
          patient_name: b.patients?.full_name || '-',
          study: extractStudyFromItems(b.items),
          doctor_name: b.patients?.referred_by_doctor_name || 'SELF',
          paid: paidAmount,
          unpaid: dueAmount,
          discount: 0, // We'll need to calculate this if it's tracked separately
          branch_name: b.branches?.name || '-',
        };
      });

      // Apply client-side search if needed
      const filteredData = filters.search
        ? processedData.filter(row => 
            row.patient_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            row.doctor_name.toLowerCase().includes(filters.search.toLowerCase())
          )
        : processedData;

      setData(filteredData);
      setTotals({
        paid: filteredData.reduce((sum, r) => sum + r.paid, 0),
        unpaid: filteredData.reduce((sum, r) => sum + r.unpaid, 0),
        discount: filteredData.reduce((sum, r) => sum + r.discount, 0),
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
      paid: formatCurrency(r.paid),
      unpaid: formatCurrency(r.unpaid),
      discount: formatCurrency(r.discount),
    }));
    exportToExcel(exportData, columns, {
      filename: `Patient_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Patient Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map((r) => ({
      ...r,
      paid: formatCurrency(r.paid),
      unpaid: formatCurrency(r.unpaid),
      discount: formatCurrency(r.discount),
    }));
    exportToPDF(exportData, columns, {
      filename: `Patient_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Patient Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    const exportData = data.map((r) => ({
      ...r,
      paid: formatCurrency(r.paid),
      unpaid: formatCurrency(r.unpaid),
      discount: formatCurrency(r.discount),
    }));
    printReport(exportData, columns, {
      filename: 'Patient_Report',
      title: 'Patient Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            searchPlaceholder="Search by patient or doctor name..."
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-6 text-sm">
              <p className="text-muted-foreground">
                {loading ? 'Loading...' : `${data.length} records found`}
              </p>
              <div>
                <span className="text-muted-foreground">Total Paid:</span>{' '}
                <span className="font-semibold text-green-600">{formatCurrency(totals.paid)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Unpaid:</span>{' '}
                <span className="font-semibold text-red-600">{formatCurrency(totals.unpaid)}</span>
              </div>
              {totals.discount > 0 && (
                <div>
                  <span className="text-muted-foreground">Total Discount:</span>{' '}
                  <span className="font-semibold">{formatCurrency(totals.discount)}</span>
                </div>
              )}
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
                      No records found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.sr_no}>
                      <TableCell className="font-medium">{row.sr_no}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.patient_name}</TableCell>
                      <TableCell>{row.study}</TableCell>
                      <TableCell>{row.doctor_name}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(row.paid)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(row.unpaid)}</TableCell>
                      <TableCell>{formatCurrency(row.discount)}</TableCell>
                      {isAdmin && <TableCell>{row.branch_name}</TableCell>}
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
