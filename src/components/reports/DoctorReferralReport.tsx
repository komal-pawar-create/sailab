import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReportFilters, FilterValues } from './ReportFilters';
import { ExportButtons } from './ExportButtons';
import { DoctorManagement } from './DoctorManagement';
import { DoctorSettlementForm } from './DoctorSettlementForm';
import { DoctorSettlementHistory } from './DoctorSettlementHistory';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { Stethoscope, ChevronDown, ChevronRight, Banknote } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DoctorReferralRow {
  doctor_id: string | null;
  doctor_name: string;
  doctor_phone: string | null;
  patients_count: number;
  total_revenue: number;
  commission_rate: string;
  commission_earned: number;
  commission_paid: number;
  balance_due: number;
  is_registered: boolean;
}

const columns: ExportColumn[] = [
  { key: 'doctor_name', header: 'Doctor Name', width: 25 },
  { key: 'doctor_phone', header: 'Phone', width: 15 },
  { key: 'patients_count', header: 'Patients', width: 10 },
  { key: 'total_revenue', header: 'Revenue', width: 15 },
  { key: 'commission_rate', header: 'Commission Rate', width: 15 },
  { key: 'commission_earned', header: 'Commission Earned', width: 15 },
  { key: 'commission_paid', header: 'Paid', width: 12 },
  { key: 'balance_due', header: 'Balance Due', width: 12 },
];

export function DoctorReferralReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DoctorReferralRow[]>([]);
  const [totals, setTotals] = useState({ patients: 0, revenue: 0, earned: 0, paid: 0, pending: 0 });
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [settlementDoctor, setSettlementDoctor] = useState<DoctorReferralRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: subDays(new Date(), 29),
    dateTo: new Date(),
    branch: 'all',
    status: 'all',
    search: '',
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    if (!profile?.lab_id) return;
    setLoading(true);

    const branchFilter = !isAdmin && profile?.branch_id
      ? profile.branch_id
      : (filters.branch !== 'all' ? filters.branch : null);

    // Fetch registered doctors
    let doctorsQuery = supabase
      .from('referring_doctors' as any)
      .select('*')
      .eq('lab_id', profile.lab_id);
    if (branchFilter) doctorsQuery = doctorsQuery.eq('branch_id', branchFilter);
    const { data: registeredDoctors } = await doctorsQuery;

    // Fetch patients with referrals
    let patientsQuery = supabase
      .from('patients')
      .select('id, referred_by_doctor_name, referred_by_doctor_phone, referring_doctor_id, created_at')
      .eq('lab_id', profile.lab_id);
    if (filters.dateFrom) patientsQuery = patientsQuery.gte('created_at', format(filters.dateFrom, 'yyyy-MM-dd'));
    if (filters.dateTo) patientsQuery = patientsQuery.lte('created_at', format(filters.dateTo, 'yyyy-MM-dd') + 'T23:59:59');
    if (branchFilter) patientsQuery = patientsQuery.eq('branch_id', branchFilter);

    // Get patients that have either a registered doctor or free-text referral
    const { data: allPatients } = await patientsQuery;
    const patients = (allPatients || []).filter(
      (p: any) => p.referred_by_doctor_name || p.referring_doctor_id
    );

    const patientIds = patients.map((p: any) => p.id);

    // Fetch bills
    let billsData: any[] = [];
    if (patientIds.length > 0) {
      let billsQuery = supabase.from('bills').select('patient_id, total_amount').in('patient_id', patientIds);
      if (filters.dateFrom) billsQuery = billsQuery.gte('bill_date', format(filters.dateFrom, 'yyyy-MM-dd'));
      if (filters.dateTo) billsQuery = billsQuery.lte('bill_date', format(filters.dateTo, 'yyyy-MM-dd'));
      const { data: bills } = await billsQuery;
      billsData = bills || [];
    }

    // Fetch commissions
    let commissionsData: any[] = [];
    if (registeredDoctors && (registeredDoctors as any[]).length > 0) {
      const doctorIds = (registeredDoctors as any[]).map((d: any) => d.id);
      const { data: commissions } = await supabase
        .from('doctor_commissions' as any)
        .select('doctor_id, commission_amount, status')
        .in('doctor_id', doctorIds);
      commissionsData = (commissions as any[]) || [];
    }

    // Fetch settlements
    let settlementsData: any[] = [];
    if (registeredDoctors && (registeredDoctors as any[]).length > 0) {
      const doctorIds = (registeredDoctors as any[]).map((d: any) => d.id);
      const { data: settlements } = await supabase
        .from('doctor_settlements' as any)
        .select('doctor_id, total_amount')
        .in('doctor_id', doctorIds);
      settlementsData = (settlements as any[]) || [];
    }

    // Build doctor map
    const doctorMap: Record<string, DoctorReferralRow> = {};

    // Add registered doctors first
    (registeredDoctors as any[] || []).forEach((doc: any) => {
      doctorMap[`reg_${doc.id}`] = {
        doctor_id: doc.id,
        doctor_name: doc.doctor_name,
        doctor_phone: doc.phone || '-',
        patients_count: 0,
        total_revenue: 0,
        commission_rate: doc.commission_type === 'percentage' ? `${doc.commission_percentage}%` : `₹${doc.fixed_commission_amount}`,
        commission_earned: 0,
        commission_paid: 0,
        balance_due: 0,
        is_registered: true,
      };
    });

    // Process patients
    patients.forEach((patient: any) => {
      const regDoctorId = patient.referring_doctor_id;
      const doctorName = patient.referred_by_doctor_name;

      let key: string;
      if (regDoctorId && doctorMap[`reg_${regDoctorId}`]) {
        key = `reg_${regDoctorId}`;
      } else if (doctorName) {
        key = `free_${doctorName}`;
        if (!doctorMap[key]) {
          doctorMap[key] = {
            doctor_id: null,
            doctor_name: doctorName,
            doctor_phone: patient.referred_by_doctor_phone || '-',
            patients_count: 0,
            total_revenue: 0,
            commission_rate: '-',
            commission_earned: 0,
            commission_paid: 0,
            balance_due: 0,
            is_registered: false,
          };
        }
      } else {
        return;
      }

      doctorMap[key].patients_count++;
      const patientBills = billsData.filter((b: any) => b.patient_id === patient.id);
      patientBills.forEach((bill: any) => {
        doctorMap[key].total_revenue += bill.total_amount;
      });
    });

    // Add commission data for registered doctors
    commissionsData.forEach((comm: any) => {
      const key = `reg_${comm.doctor_id}`;
      if (doctorMap[key]) {
        doctorMap[key].commission_earned += comm.commission_amount;
      }
    });

    // Add settlement data
    settlementsData.forEach((s: any) => {
      const key = `reg_${s.doctor_id}`;
      if (doctorMap[key]) {
        doctorMap[key].commission_paid += s.total_amount;
      }
    });

    // Calculate balance
    Object.values(doctorMap).forEach(doc => {
      doc.balance_due = doc.commission_earned - doc.commission_paid;
    });

    let processedData = Object.values(doctorMap).sort((a, b) => b.patients_count - a.patients_count);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      processedData = processedData.filter(
        d => d.doctor_name.toLowerCase().includes(searchLower) ||
          d.doctor_phone?.toLowerCase().includes(searchLower)
      );
    }

    setData(processedData);
    setTotals({
      patients: processedData.reduce((s, d) => s + d.patients_count, 0),
      revenue: processedData.reduce((s, d) => s + d.total_revenue, 0),
      earned: processedData.reduce((s, d) => s + d.commission_earned, 0),
      paid: processedData.reduce((s, d) => s + d.commission_paid, 0),
      pending: processedData.reduce((s, d) => s + d.balance_due, 0),
    });
    setLoading(false);
  }, [profile?.lab_id, profile?.branch_id, isAdmin, filters]);

  useEffect(() => { fetchData(); }, [profile?.lab_id, refreshKey]);

  useEffect(() => {
    if (!isAdmin && profile?.branch_id && filters.branch === 'all') {
      setFilters(prev => ({ ...prev, branch: profile.branch_id! }));
    }
  }, [isAdmin, profile?.branch_id]);

  const handleSettled = () => {
    setRefreshKey(k => k + 1);
    setSettlementDoctor(null);
    fetchData();
  };

  const handleExportExcel = () => {
    const exportData = data.map(d => ({
      ...d,
      total_revenue: d.total_revenue,
      commission_earned: d.commission_earned,
      commission_paid: d.commission_paid,
      balance_due: d.balance_due,
    }));
    exportToExcel(exportData, columns, {
      filename: `Doctor_Referral_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Doctor Referral & Commission Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handleExportPDF = () => {
    const exportData = data.map(d => ({
      ...d,
      total_revenue: formatCurrency(d.total_revenue),
      commission_earned: formatCurrency(d.commission_earned),
      commission_paid: formatCurrency(d.commission_paid),
      balance_due: formatCurrency(d.balance_due),
    }));
    exportToPDF(exportData, columns, {
      filename: `Doctor_Referral_Report_${format(new Date(), 'yyyy-MM-dd')}`,
      title: 'Doctor Referral & Commission Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  const handlePrint = () => {
    const exportData = data.map(d => ({
      ...d,
      total_revenue: formatCurrency(d.total_revenue),
      commission_earned: formatCurrency(d.commission_earned),
      commission_paid: formatCurrency(d.commission_paid),
      balance_due: formatCurrency(d.balance_due),
    }));
    printReport(exportData, columns, {
      filename: 'Doctor_Referral_Report',
      title: 'Doctor Referral & Commission Report',
      dateRange: { from: filters.dateFrom, to: filters.dateTo },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Referral & Commission Report
            </CardTitle>
            <DoctorManagement onDoctorsChanged={fetchData} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={fetchData}
            searchPlaceholder="Search by doctor name or phone..."
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Doctors:</span>{' '}
                <span className="font-semibold">{data.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Patients:</span>{' '}
                <span className="font-semibold">{totals.patients}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revenue:</span>{' '}
                <span className="font-semibold">{formatCurrency(totals.revenue)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Commission Earned:</span>{' '}
                <span className="font-semibold text-orange-600">{formatCurrency(totals.earned)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Paid:</span>{' '}
                <span className="font-semibold text-green-600">{formatCurrency(totals.paid)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pending:</span>{' '}
                <span className="font-semibold text-destructive">{formatCurrency(totals.pending)}</span>
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
                  <TableHead className="w-8"></TableHead>
                  {columns.map(col => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      {columns.map(col => (
                        <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                      No referrals found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((doctor, idx) => {
                    const isExpanded = expandedDoctor === (doctor.doctor_id || doctor.doctor_name);
                    const toggleKey = doctor.doctor_id || doctor.doctor_name;

                    return (
                      <Collapsible key={idx} open={isExpanded} onOpenChange={() => setExpandedDoctor(isExpanded ? null : toggleKey)} asChild>
                        <>
                          <TableRow className="group">
                            <TableCell>
                              {doctor.is_registered && (
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {doctor.doctor_name}
                              {doctor.is_registered && (
                                <Badge variant="outline" className="ml-2 text-xs">Registered</Badge>
                              )}
                            </TableCell>
                            <TableCell>{doctor.doctor_phone}</TableCell>
                            <TableCell>{doctor.patients_count}</TableCell>
                            <TableCell>{formatCurrency(doctor.total_revenue)}</TableCell>
                            <TableCell>{doctor.commission_rate}</TableCell>
                            <TableCell className="text-orange-600 font-medium">
                              {formatCurrency(doctor.commission_earned)}
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(doctor.commission_paid)}
                            </TableCell>
                            <TableCell className={`font-medium ${doctor.balance_due > 0 ? 'text-destructive' : ''}`}>
                              {formatCurrency(doctor.balance_due)}
                            </TableCell>
                            <TableCell>
                              {doctor.is_registered && doctor.balance_due > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs"
                                  onClick={() => setSettlementDoctor(doctor)}
                                >
                                  <Banknote className="h-3.5 w-3.5" />
                                  Settle
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {doctor.is_registered && (
                            <CollapsibleContent asChild>
                              <TableRow>
                                <TableCell colSpan={columns.length + 2} className="bg-muted/30 p-0">
                                  <div className="p-3">
                                    <h5 className="text-xs font-semibold mb-2 text-muted-foreground">Settlement History</h5>
                                    <DoctorSettlementHistory doctorId={doctor.doctor_id!} refreshKey={refreshKey} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          )}
                        </>
                      </Collapsible>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {settlementDoctor && (
        <DoctorSettlementForm
          open={!!settlementDoctor}
          onOpenChange={(open) => { if (!open) setSettlementDoctor(null); }}
          doctorId={settlementDoctor.doctor_id!}
          doctorName={settlementDoctor.doctor_name}
          pendingAmount={settlementDoctor.balance_due}
          onSettled={handleSettled}
        />
      )}
    </div>
  );
}
