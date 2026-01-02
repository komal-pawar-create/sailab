import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { FileText } from 'lucide-react';

interface TestReport {
  patient_id: string;
  patient_name: string;
  test_type: string;
  test_date: string;
  technician_name: string | null;
  status: string;
  branch_name?: string;
}

const columns: ExportColumn[] = [
  { key: 'patient_id', header: 'Patient ID', width: 15 },
  { key: 'patient_name', header: 'Patient Name', width: 25 },
  { key: 'test_type', header: 'Test Type', width: 20 },
  { key: 'test_date', header: 'Test Date', width: 12 },
  { key: 'technician_name', header: 'Technician', width: 20 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'branch_name', header: 'Branch', width: 15 },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
];

export function TestReportsReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestReport[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: subDays(new Date(), 29),
    dateTo: new Date(),
    branch: 'all',
    status: 'all',
    search: '',
  });

  const fetchData = async () => {
    if (!profile?.lab_id) return;
    setLoading(true);

    let query = supabase
      .from('test_reports')
      .select(`
        test_type,
        test_date,
        technician_name,
        status,
        patients!test_reports_patient_id_fkey(patient_id, full_name),
        branches!fk_test_reports_branch(name)
      `)
      .eq('lab_id', profile.lab_id)
      .order('test_date', { ascending: false });

    if (filters.dateFrom) {
      query = query.gte('test_date', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      query = query.lte('test_date', format(filters.dateTo, 'yyyy-MM-dd'));
    }
    if (filters.branch && filters.branch !== 'all') {
      query = query.eq('branch_id', filters.branch);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data: reports, error } = await query;

    if (!error && reports) {
      const processedData = reports
        .filter((r: any) => {
          if (!filters.search) return true;
          const searchLower = filters.search.toLowerCase();
          return (
            r.test_type.toLowerCase().includes(searchLower) ||
            r.patients?.full_name?.toLowerCase().includes(searchLower) ||
            r.patients?.patient_id?.toLowerCase().includes(searchLower)
          );
        })
        .map((r: any) => ({
          patient_id: r.patients?.patient_id || '-',
          patient_name: r.patients?.full_name || '-',
          test_type: r.test_type,
          test_date: format(new Date(r.test_date), 'dd/MM/yyyy'),
          technician_name: r.technician_name || '-',
          status: r.status,
          branch_name: r.branches?.name || '-',
        }));

      setData(processedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.lab_id]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      in_progress: 'secondary',
      pending: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const handleExportExcel = () => {
    exportToExcel(data, columns, {
      filename: `Test_Reports_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Test Reports',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    exportToPDF(data, columns, {
      filename: `Test_Reports_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Test Reports',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    printReport(data, columns, {
      filename: 'Test_Reports',
      title: 'Test Reports',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            showStatus
            statusOptions={statusOptions}
            searchPlaceholder="Search by patient or test type..."
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${data.length} reports found`}
            </p>
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
                      No test reports found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((report, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{report.patient_id}</TableCell>
                      <TableCell>{report.patient_name}</TableCell>
                      <TableCell>{report.test_type}</TableCell>
                      <TableCell>{report.test_date}</TableCell>
                      <TableCell>{report.technician_name}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{report.branch_name}</TableCell>
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
