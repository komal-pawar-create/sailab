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
import { Stethoscope } from 'lucide-react';

interface DoctorReferral {
  doctor_name: string;
  doctor_phone: string | null;
  patients_count: number;
  total_revenue: number;
}

const columns: ExportColumn[] = [
  { key: 'doctor_name', header: 'Doctor Name', width: 30 },
  { key: 'doctor_phone', header: 'Phone', width: 15 },
  { key: 'patients_count', header: 'Patients', width: 12 },
  { key: 'total_revenue', header: 'Total Revenue', width: 15 },
];

export function DoctorReferralReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DoctorReferral[]>([]);
  const [totals, setTotals] = useState({ patients: 0, revenue: 0 });
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

    // Fetch patients with referrals
    let patientsQuery = supabase
      .from('patients')
      .select('id, referred_by_doctor_name, referred_by_doctor_phone, created_at')
      .eq('lab_id', profile.lab_id)
      .not('referred_by_doctor_name', 'is', null);

    if (filters.dateFrom) {
      patientsQuery = patientsQuery.gte('created_at', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      patientsQuery = patientsQuery.lte('created_at', format(filters.dateTo, 'yyyy-MM-dd') + 'T23:59:59');
    }
    if (filters.branch && filters.branch !== 'all') {
      patientsQuery = patientsQuery.eq('branch_id', filters.branch);
    }

    const { data: patients, error: patientsError } = await patientsQuery;

    if (patientsError || !patients) {
      setLoading(false);
      return;
    }

    // Get patient IDs to fetch bills
    const patientIds = patients.map((p) => p.id);

    // Fetch bills for these patients
    let billsQuery = supabase
      .from('bills')
      .select('patient_id, total_amount')
      .in('patient_id', patientIds);

    if (filters.dateFrom) {
      billsQuery = billsQuery.gte('bill_date', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      billsQuery = billsQuery.lte('bill_date', format(filters.dateTo, 'yyyy-MM-dd'));
    }

    const { data: bills } = await billsQuery;

    // Aggregate by doctor
    const doctorMap: Record<string, DoctorReferral> = {};

    patients.forEach((patient: any) => {
      const doctorName = patient.referred_by_doctor_name;
      if (!doctorName) return;

      if (!doctorMap[doctorName]) {
        doctorMap[doctorName] = {
          doctor_name: doctorName,
          doctor_phone: patient.referred_by_doctor_phone || '-',
          patients_count: 0,
          total_revenue: 0,
        };
      }
      doctorMap[doctorName].patients_count++;

      // Add revenue from bills
      const patientBills = bills?.filter((b: any) => b.patient_id === patient.id) || [];
      patientBills.forEach((bill: any) => {
        doctorMap[doctorName].total_revenue += bill.total_amount;
      });
    });

    let processedData = Object.values(doctorMap).sort((a, b) => b.patients_count - a.patients_count);

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      processedData = processedData.filter(
        (d) =>
          d.doctor_name.toLowerCase().includes(searchLower) ||
          d.doctor_phone?.toLowerCase().includes(searchLower)
      );
    }

    setData(processedData);
    setTotals({
      patients: processedData.reduce((sum, d) => sum + d.patients_count, 0),
      revenue: processedData.reduce((sum, d) => sum + d.total_revenue, 0),
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.lab_id]);

  const handleExportExcel = () => {
    const exportData = data.map((d) => ({
      ...d,
      total_revenue: formatCurrency(d.total_revenue),
    }));
    exportToExcel(exportData, columns, {
      filename: `Doctor_Referral_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Doctor Referral Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map((d) => ({
      ...d,
      total_revenue: formatCurrency(d.total_revenue),
    }));
    exportToPDF(exportData, columns, {
      filename: `Doctor_Referral_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Doctor Referral Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    const exportData = data.map((d) => ({
      ...d,
      total_revenue: formatCurrency(d.total_revenue),
    }));
    printReport(exportData, columns, {
      filename: 'Doctor_Referral_Report',
      title: 'Doctor Referral Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Doctor Referral Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            searchPlaceholder="Search by doctor name or phone..."
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Doctors:</span>{' '}
                <span className="font-semibold">{data.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Patients:</span>{' '}
                <span className="font-semibold">{totals.patients}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Revenue:</span>{' '}
                <span className="font-semibold text-green-600">{formatCurrency(totals.revenue)}</span>
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
                      No referrals found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((doctor, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{doctor.doctor_name}</TableCell>
                      <TableCell>{doctor.doctor_phone}</TableCell>
                      <TableCell>{doctor.patients_count}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(doctor.total_revenue)}
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
