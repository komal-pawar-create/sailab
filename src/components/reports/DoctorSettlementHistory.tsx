import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/exportUtils';
import { Printer } from 'lucide-react';
import { SettlementReceipt } from './SettlementReceipt';

interface Settlement {
  id: string;
  settlement_date: string;
  total_amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  period_from: string | null;
  period_to: string | null;
  created_at: string;
}

interface DoctorSettlementHistoryProps {
  doctorId: string;
  doctorName: string;
  doctorPhone?: string | null;
  doctorSpecialization?: string | null;
  refreshKey?: number;
}

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  online: 'Online',
  cheque: 'Cheque',
  upi: 'UPI',
};

export function DoctorSettlementHistory({ doctorId, doctorName, doctorPhone, doctorSpecialization, refreshKey }: DoctorSettlementHistoryProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptSettlement, setReceiptSettlement] = useState<Settlement | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('doctor_settlements' as any)
        .select('*')
        .eq('doctor_id', doctorId)
        .order('settlement_date', { ascending: false });

      setSettlements((data as any as Settlement[]) || []);
      setLoading(false);
    };
    fetch();
  }, [doctorId, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-3 px-2">No settlements recorded yet.</p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Method</TableHead>
              <TableHead className="text-xs">Reference</TableHead>
              <TableHead className="text-xs">Period</TableHead>
              <TableHead className="text-xs w-[60px]">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements.map(s => (
              <TableRow key={s.id}>
                <TableCell className="text-xs">{format(new Date(s.settlement_date), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-xs font-medium text-green-600">{formatCurrency(s.total_amount)}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-xs">
                    {methodLabels[s.payment_method] || s.payment_method}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{s.reference_number || '-'}</TableCell>
                <TableCell className="text-xs">
                  {s.period_from && s.period_to
                    ? `${format(new Date(s.period_from), 'dd/MM')} - ${format(new Date(s.period_to), 'dd/MM')}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setReceiptSettlement(s)}
                    title="Print Receipt"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {receiptSettlement && (
        <SettlementReceipt
          open={!!receiptSettlement}
          onOpenChange={(open) => { if (!open) setReceiptSettlement(null); }}
          settlement={receiptSettlement}
          doctorName={doctorName}
          doctorPhone={doctorPhone}
          doctorSpecialization={doctorSpecialization}
        />
      )}
    </>
  );
}
