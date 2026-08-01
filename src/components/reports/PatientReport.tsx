import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { Eye, MoreHorizontal, Trash2, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientReportRow {
  bill_id: string;
  patient_db_id: string;
  patient_id: string;
  sr_no: number;
  date: string;
  patient_name: string;
  study: string;
  doctor_name: string;
  paid: number;
  unpaid: number;
  discount: number;
  payment_method: string;
  payment_method_keys: string[];
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

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
];

const normalizePaymentMethod = (method?: string | null): string => {
  return method?.trim().toLowerCase() || 'not_specified';
};

const formatPaymentMethod = (method?: string | null): string => {
  const normalized = normalizePaymentMethod(method);
  const labels: Record<string, string> = {
    cash: 'Cash',
    online: 'Online',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    not_specified: 'Not Specified',
  };

  return labels[normalized] || normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export function PatientReport() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<PatientReportRow[]>([]);
  const [data, setData] = useState<PatientReportRow[]>([]);
  const [totals, setTotals] = useState({ paid: 0, unpaid: 0, discount: 0 });
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [highlightedBillId, setHighlightedBillId] = useState<string | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<PatientReportRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: subDays(new Date(), 29),
    dateTo: new Date(),
    branch: 'all',
    status: 'all',
    search: '',
  });

  // Check if user is admin/lab_admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';
  const canDeletePatient = profile?.role === 'admin' || profile?.role === 'lab_admin';

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
      { key: 'payment_method', header: 'PAYMENT METHOD', width: 18 },
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
          id,
          patient_id,
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
      const billIds = bills.map((bill: any) => bill.id);
      const paymentMethodsByBill = new Map<string, string[]>();

      if (billIds.length > 0) {
        const { data: billPayments } = await supabase
          .from('bill_payments')
          .select('bill_id, payment_method, is_refund')
          .in('bill_id', billIds);

        billPayments
          ?.filter((payment: any) => !payment.is_refund)
          .forEach((payment: any) => {
            const billMethods = paymentMethodsByBill.get(payment.bill_id) || [];
            billMethods.push(payment.payment_method);
            paymentMethodsByBill.set(payment.bill_id, billMethods);
          });
      }

      // Process and add serial numbers
      const processedData: PatientReportRow[] = bills.map((b: any, index: number) => {
        // Calculate discount (total - paid - unpaid if discount exists, or 0)
        const paidAmount = b.paid_amount || 0;
        const dueAmount = b.due_amount || 0;
        const paymentMethodKeys = Array.from(
          new Set((paymentMethodsByBill.get(b.id) || []).map(normalizePaymentMethod))
        );
        const displayMethodKeys = paymentMethodKeys.length > 0 ? paymentMethodKeys : ['not_specified'];
        
        return {
          bill_id: b.id,
          patient_db_id: b.patients?.id || '',
          patient_id: b.patients?.patient_id || '-',
          sr_no: index + 1,
          date: format(new Date(b.bill_date), 'dd-MM-yyyy'),
          patient_name: b.patients?.full_name || '-',
          study: extractStudyFromItems(b.items),
          doctor_name: b.patients?.referred_by_doctor_name || 'SELF',
          paid: paidAmount,
          unpaid: dueAmount,
          payment_method: displayMethodKeys.map(formatPaymentMethod).join(' + '),
          payment_method_keys: displayMethodKeys,
          discount: 0, // We'll need to calculate this if it's tracked separately
          branch_name: b.branches?.name || '-',
        };
      });

      const filteredData = processedData
        .filter(row => {
          if (!filters.search) return true;
          const searchLower = filters.search.toLowerCase();
          return (
            row.patient_name.toLowerCase().includes(searchLower) ||
            row.doctor_name.toLowerCase().includes(searchLower)
          );
        })
        .filter(row => {
          if (!filters.status || filters.status === 'all') return true;
          return row.payment_method_keys.includes(normalizePaymentMethod(filters.status));
        });

      setAllData(filteredData.map((row, index) => ({ ...row, sr_no: index + 1 })));
    } else if (error) {
      toast({
        title: 'Unable to load patient report',
        description: error.message,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    const visibleRows = unpaidOnly ? allData.filter((row) => row.unpaid > 0) : allData;
    setData(visibleRows.map((row, index) => ({ ...row, sr_no: index + 1 })));
    setTotals({
      paid: allData.reduce((sum, r) => sum + r.paid, 0),
      unpaid: allData.reduce((sum, r) => sum + r.unpaid, 0),
      discount: allData.reduce((sum, r) => sum + r.discount, 0),
    });
  }, [allData, unpaidOnly]);

  useEffect(() => {
    if (!unpaidOnly) return;

    const timer = window.setTimeout(() => {
      if (data.length > 0) {
        const firstUnpaidRow = data[0];
        rowRefs.current[firstUnpaidRow.bill_id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedBillId(firstUnpaidRow.bill_id);
        window.setTimeout(() => setHighlightedBillId(null), 1800);
      } else {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [data, unpaidOnly]);

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
    // Use plain numbers for Excel (no currency formatting)
    exportToExcel(data, columns, {
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

  const handleToggleUnpaidOnly = () => {
    if (unpaidOnly) {
      setUnpaidOnly(false);
      return;
    }

    const unpaidRows = allData.filter((row) => row.unpaid > 0);
    setUnpaidOnly(true);

    if (unpaidRows.length === 0) {
      toast({
        title: 'No unpaid patients',
        description: 'No patients with unpaid balance found.',
      });
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete || !canDeletePatient || !profile?.lab_id) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientToDelete.patient_db_id)
      .eq('lab_id', profile.lab_id);

    setIsDeleting(false);

    if (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setAllData((rows) => rows.filter((row) => row.patient_db_id !== patientToDelete.patient_db_id));
    toast({
      title: 'Patient deleted successfully.',
      description: `${patientToDelete.patient_name} has been removed from the report.`,
    });
    setPatientToDelete(null);
  };

  const renderRowActions = (row: PatientReportRow, menuType: 'context' | 'dropdown') => {
    const Item = menuType === 'context' ? ContextMenuItem : DropdownMenuItem;
    const Separator = menuType === 'context' ? ContextMenuSeparator : DropdownMenuSeparator;

    return (
      <>
        <Item onClick={() => navigate(`/patient/${row.patient_db_id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Item>
        {canDeletePatient && (
          <>
            <Separator />
            <Item
              className="text-destructive focus:text-destructive"
              onClick={() => setPatientToDelete(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Patient
            </Item>
          </>
        )}
      </>
    );
  };

  const renderReportRow = (row: PatientReportRow) => (
    <ContextMenu key={row.bill_id}>
      <ContextMenuTrigger asChild>
        <TableRow
          ref={(element) => {
            rowRefs.current[row.bill_id] = element;
          }}
          className={cn(
            'hover:bg-muted/50',
            highlightedBillId === row.bill_id && 'bg-yellow-100 transition-colors'
          )}
        >
          <TableCell className="font-medium">{row.sr_no}</TableCell>
          <TableCell>{row.date}</TableCell>
          <TableCell>
            <div className="font-medium">{row.patient_name}</div>
            <div className="text-xs text-muted-foreground">{row.patient_id}</div>
          </TableCell>
          <TableCell>{row.study}</TableCell>
          <TableCell>{row.doctor_name}</TableCell>
          <TableCell className="text-green-600">{formatCurrency(row.paid)}</TableCell>
          <TableCell className="text-red-600">{formatCurrency(row.unpaid)}</TableCell>
          <TableCell>{row.payment_method}</TableCell>
          <TableCell>{formatCurrency(row.discount)}</TableCell>
          {isAdmin && <TableCell>{row.branch_name}</TableCell>}
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Patient actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {renderRowActions(row, 'dropdown')}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {renderRowActions(row, 'context')}
      </ContextMenuContent>
    </ContextMenu>
  );

  const tableColumnCount = columns.length + 1;

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
            showStatus
            statusLabel="Payment Method"
            statusAllLabel="All Methods"
            statusOptions={paymentMethodOptions}
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
              <button
                type="button"
                onClick={handleToggleUnpaidOnly}
                aria-pressed={unpaidOnly}
                className={cn(
                  'rounded-md px-2 py-1 text-left transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200',
                  unpaidOnly && 'bg-red-50 ring-1 ring-red-200'
                )}
              >
                <span className="text-muted-foreground">Total Unpaid:</span>{' '}
                <span className="font-semibold text-red-600">{formatCurrency(totals.unpaid)}</span>
              </button>
              {totals.discount > 0 && (
                <div>
                  <span className="text-muted-foreground">Total Discount:</span>{' '}
                  <span className="font-semibold">{formatCurrency(totals.discount)}</span>
                </div>
              )}
            </div>
            {unpaidOnly && (
              <Badge variant="outline" className="gap-2 border-red-200 text-red-700">
                Unpaid Only
                <button
                  type="button"
                  onClick={() => setUnpaidOnly(false)}
                  className="rounded-sm hover:bg-red-100"
                  aria-label="Clear unpaid filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
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
          <div ref={tableRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                  <TableHead className="text-right">ACTIONS</TableHead>
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
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount} className="text-center py-8 text-muted-foreground">
                      {unpaidOnly ? 'No patients with unpaid balance found.' : 'No records found for the selected filters'}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map(renderReportRow)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && !isDeleting && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete patient {patientToDelete?.patient_name}? This action may affect associated
              reports, bills, samples, payments, and patient history.
              <span className="mt-3 block rounded-md bg-muted p-3 text-sm text-foreground">
                Patient ID: <span className="font-mono">{patientToDelete?.patient_id}</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Patient'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
