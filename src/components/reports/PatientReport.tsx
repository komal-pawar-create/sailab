import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { Users } from 'lucide-react';

interface Patient {
  patient_id: string;
  full_name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  referred_by_doctor_name: string | null;
  created_at: string;
  branch_name?: string;
}

const columns: ExportColumn[] = [
  { key: 'patient_id', header: 'Patient ID', width: 15 },
  { key: 'full_name', header: 'Name', width: 25 },
  { key: 'phone', header: 'Phone', width: 15 },
  { key: 'age', header: 'Age', width: 8 },
  { key: 'gender', header: 'Gender', width: 10 },
  { key: 'referred_by_doctor_name', header: 'Referred By', width: 20 },
  { key: 'created_at', header: 'Registered On', width: 15 },
  { key: 'branch_name', header: 'Branch', width: 15 },
];

export function PatientReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Patient[]>([]);
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
      .from('patients')
      .select(`
        patient_id,
        full_name,
        phone,
        age,
        gender,
        referred_by_doctor_name,
        created_at,
        branches!fk_patients_branch(name)
      `)
      .eq('lab_id', profile.lab_id)
      .order('created_at', { ascending: false });

    if (filters.dateFrom) {
      query = query.gte('created_at', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      query = query.lte('created_at', format(filters.dateTo, 'yyyy-MM-dd') + 'T23:59:59');
    }
    if (filters.branch && filters.branch !== 'all') {
      query = query.eq('branch_id', filters.branch);
    }
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,patient_id.ilike.%${filters.search}%`);
    }

    const { data: patients, error } = await query;

    if (!error && patients) {
      setData(
        patients.map((p: any) => ({
          ...p,
          branch_name: p.branches?.name || '-',
          created_at: format(new Date(p.created_at), 'dd/MM/yyyy'),
          age: p.age || '-',
          gender: p.gender || '-',
          referred_by_doctor_name: p.referred_by_doctor_name || '-',
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.lab_id]);

  const handleExportExcel = () => {
    exportToExcel(data, columns, {
      filename: `Patient_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Patient Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    exportToPDF(data, columns, {
      filename: `Patient_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Patient Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    printReport(data, columns, {
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
            searchPlaceholder="Search by name, phone, or ID..."
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${data.length} patients found`}
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
                      No patients found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((patient) => (
                    <TableRow key={patient.patient_id}>
                      <TableCell className="font-medium">{patient.patient_id}</TableCell>
                      <TableCell>{patient.full_name}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.referred_by_doctor_name}</TableCell>
                      <TableCell>{patient.created_at}</TableCell>
                      <TableCell>{patient.branch_name}</TableCell>
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
