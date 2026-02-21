import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ExportButtons } from './ExportButtons';
import { exportToExcel, exportToPDF, printReport, formatCurrency, ExportColumn } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, BarChart3 } from 'lucide-react';

interface CommissionSummaryRow {
  doctor_name: string;
  doctor_phone: string;
  specialization: string;
  patients_referred: number;
  total_bill_amount: number;
  commission_earned: number;
  commission_settled: number;
  balance_due: number;
}

const columns: ExportColumn[] = [
  { key: 'doctor_name', header: 'Doctor Name', width: 25 },
  { key: 'doctor_phone', header: 'Phone', width: 15 },
  { key: 'specialization', header: 'Specialization', width: 15 },
  { key: 'patients_referred', header: 'Patients', width: 10 },
  { key: 'total_bill_amount', header: 'Bill Amount', width: 15 },
  { key: 'commission_earned', header: 'Earned', width: 15 },
  { key: 'commission_settled', header: 'Settled', width: 15 },
  { key: 'balance_due', header: 'Balance Due', width: 15 },
];

const months = [
  { value: '0', label: 'January' }, { value: '1', label: 'February' },
  { value: '2', label: 'March' }, { value: '3', label: 'April' },
  { value: '4', label: 'May' }, { value: '5', label: 'June' },
  { value: '6', label: 'July' }, { value: '7', label: 'August' },
  { value: '8', label: 'September' }, { value: '9', label: 'October' },
  { value: '10', label: 'November' }, { value: '11', label: 'December' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function CommissionSummaryReport() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommissionSummaryRow[]>([]);
  const [totals, setTotals] = useState({ patients: 0, billAmount: 0, earned: 0, settled: 0, balance: 0 });
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.lab_id) return;
    setLoading(true);

    try {
      const monthDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      const from = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const to = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      // Fetch all registered doctors for this lab
      const { data: doctors } = await supabase
        .from('referring_doctors' as any)
        .select('id, doctor_name, phone, specialization')
        .eq('lab_id', profile.lab_id)
        .eq('is_active', true);

      if (!doctors || doctors.length === 0) {
        setData([]);
        setTotals({ patients: 0, billAmount: 0, earned: 0, settled: 0, balance: 0 });
        setHasLoaded(true);
        setLoading(false);
        return;
      }

      const doctorIds = (doctors as any[]).map(d => d.id);

      // Fetch commissions for the month
      const { data: commissions } = await supabase
        .from('doctor_commissions' as any)
        .select('doctor_id, commission_amount, status, bill_id')
        .in('doctor_id', doctorIds)
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59');

      // Fetch settlements for the month
      const { data: settlements } = await supabase
        .from('doctor_settlements' as any)
        .select('doctor_id, total_amount')
        .in('doctor_id', doctorIds)
        .gte('settlement_date', from)
        .lte('settlement_date', to);

      // Fetch bill amounts for commission bills
      const billIds = [...new Set((commissions as any[] || []).map(c => c.bill_id).filter(Boolean))];
      let billAmountMap: Record<string, number> = {};
      if (billIds.length > 0) {
        const { data: bills } = await supabase
          .from('bills')
          .select('id, total_amount')
          .in('id', billIds);
        (bills || []).forEach(b => { billAmountMap[b.id] = b.total_amount || 0; });
      }

      // Aggregate per doctor
      const rows: CommissionSummaryRow[] = (doctors as any[]).map(doc => {
        const docCommissions = (commissions as any[] || []).filter(c => c.doctor_id === doc.id);
        const docSettlements = (settlements as any[] || []).filter(s => s.doctor_id === doc.id);

        const earned = docCommissions.reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);
        const settled = docSettlements.reduce((s: number, st: any) => s + (st.total_amount || 0), 0);
        const billAmount = docCommissions.reduce((s: number, c: any) => s + (billAmountMap[c.bill_id] || 0), 0);
        const uniqueBills = new Set(docCommissions.map((c: any) => c.bill_id));

        return {
          doctor_name: doc.doctor_name,
          doctor_phone: doc.phone || '-',
          specialization: doc.specialization || '-',
          patients_referred: uniqueBills.size,
          total_bill_amount: billAmount,
          commission_earned: earned,
          commission_settled: settled,
          balance_due: earned - settled,
        };
      }).filter(r => r.commission_earned > 0 || r.commission_settled > 0);

      // Sort by earned descending
      rows.sort((a, b) => b.commission_earned - a.commission_earned);

      setData(rows);
      setTotals({
        patients: rows.reduce((s, r) => s + r.patients_referred, 0),
        billAmount: rows.reduce((s, r) => s + r.total_bill_amount, 0),
        earned: rows.reduce((s, r) => s + r.commission_earned, 0),
        settled: rows.reduce((s, r) => s + r.commission_settled, 0),
        balance: rows.reduce((s, r) => s + r.balance_due, 0),
      });
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching commission summary:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.lab_id, selectedMonth, selectedYear]);

  const monthLabel = months[parseInt(selectedMonth)]?.label || '';
  const reportTitle = `Commission Summary - ${monthLabel} ${selectedYear}`;

  const exportOptions = {
    filename: `commission-summary-${monthLabel.toLowerCase()}-${selectedYear}`,
    title: reportTitle,
  };

  const exportData = data.map(row => ({
    ...row,
    total_bill_amount: row.total_bill_amount,
    commission_earned: row.commission_earned,
    commission_settled: row.commission_settled,
    balance_due: row.balance_due,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monthly Commission Summary
        </CardTitle>
        {hasLoaded && data.length > 0 && (
          <ExportButtons
            onExportExcel={() => exportToExcel(exportData, columns, exportOptions)}
            onExportPDF={() => exportToPDF(exportData, columns, exportOptions)}
            onPrint={() => printReport(exportData, columns, exportOptions)}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month/Year picker */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background z-50">
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData} disabled={loading} size="sm">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Report
          </Button>
        </div>

        {/* Summary stats */}
        {hasLoaded && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Bills', value: totals.patients },
              { label: 'Bill Amount', value: formatCurrency(totals.billAmount) },
              { label: 'Earned', value: formatCurrency(totals.earned), className: 'text-amber-600' },
              { label: 'Settled', value: formatCurrency(totals.settled), className: 'text-green-600' },
              { label: 'Balance', value: formatCurrency(totals.balance), className: totals.balance > 0 ? 'text-destructive' : 'text-green-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.className || ''}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : hasLoaded ? (
          data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commission data found for {monthLabel} {selectedYear}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    {columns.map(col => (
                      <TableHead key={col.key} className="text-xs">{col.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{row.doctor_name}</TableCell>
                      <TableCell className="text-xs">{row.doctor_phone}</TableCell>
                      <TableCell className="text-xs">{row.specialization}</TableCell>
                      <TableCell className="text-xs">{row.patients_referred}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(row.total_bill_amount)}</TableCell>
                      <TableCell className="text-xs font-medium text-amber-600">{formatCurrency(row.commission_earned)}</TableCell>
                      <TableCell className="text-xs font-medium text-green-600">{formatCurrency(row.commission_settled)}</TableCell>
                      <TableCell className={`text-xs font-medium ${row.balance_due > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatCurrency(row.balance_due)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell className="text-xs" colSpan={4}>TOTAL</TableCell>
                    <TableCell className="text-xs">{totals.patients}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(totals.billAmount)}</TableCell>
                    <TableCell className="text-xs text-amber-600">{formatCurrency(totals.earned)}</TableCell>
                    <TableCell className="text-xs text-green-600">{formatCurrency(totals.settled)}</TableCell>
                    <TableCell className={`text-xs ${totals.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(totals.balance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Select a month and click "Generate Report" to view the commission summary.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
