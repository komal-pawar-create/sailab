import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

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

interface SettlementReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement;
  doctorName: string;
  doctorPhone?: string | null;
  doctorSpecialization?: string | null;
}

interface BranchInfo {
  name: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  logo_url?: string | null;
  signature_url?: string | null;
  registration_number?: string | null;
  gst_number?: string | null;
  footer_text?: string | null;
}

const getStorageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const { data } = supabase.storage.from('lab-assets').getPublicUrl(path);
  return data?.publicUrl;
};

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  online: 'Online Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
};

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

export function SettlementReceipt({
  open,
  onOpenChange,
  settlement,
  doctorName,
  doctorPhone,
  doctorSpecialization,
}: SettlementReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const [branch, setBranch] = useState<BranchInfo | null>(null);

  useEffect(() => {
    if (!open || !profile?.branch_id) return;
    const fetchBranch = async () => {
      const { data } = await supabase
        .from('branches')
        .select('name, phone, address_line1, address_line2, city, state, postal_code, logo_url, signature_url, registration_number, gst_number, footer_text')
        .eq('id', profile.branch_id)
        .single();
      setBranch(data as any);
    };
    fetchBranch();
  }, [open, profile?.branch_id]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Settlement Receipt - ${doctorName}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
          .receipt { max-width: 700px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .lab-info { flex: 1; }
          .lab-name { font-size: 20px; font-weight: 700; color: #1e40af; margin: 0; }
          .lab-detail { font-size: 11px; color: #555; margin: 2px 0; }
          .lab-logo { width: 70px; height: 70px; object-fit: contain; }
          .receipt-title { text-align: center; background: #eff6ff; padding: 10px; border-radius: 6px; margin-bottom: 20px; }
          .receipt-title h2 { margin: 0; font-size: 16px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
          .receipt-title .receipt-no { font-size: 11px; color: #666; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
          .info-box h4 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
          .info-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px; }
          .info-label { color: #6b7280; }
          .info-value { font-weight: 600; color: #1a1a1a; }
          .amount-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
          .amount-label { font-size: 11px; text-transform: uppercase; color: #16a34a; letter-spacing: 1px; }
          .amount-value { font-size: 28px; font-weight: 700; color: #15803d; margin: 4px 0; }
          .amount-words { font-size: 11px; color: #555; font-style: italic; }
          .period-box { background: #fefce8; border: 1px solid #eab308; border-radius: 6px; padding: 10px; margin-bottom: 16px; text-align: center; font-size: 12px; }
          .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-bottom: 20px; font-size: 12px; }
          .notes-box .label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .signature-area { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 10px; }
          .sig-block { text-align: center; width: 200px; }
          .sig-line { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #555; }
          .sig-img { height: 50px; object-fit: contain; margin-bottom: 4px; }
          .footer { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 30px; font-size: 10px; color: #999; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const receiptNo = `SR-${settlement.id.substring(0, 8).toUpperCase()}`;
  const logoUrl = getStorageUrl(branch?.logo_url);
  const signatureUrl = getStorageUrl(branch?.signature_url);
  const address = [branch?.address_line1, branch?.address_line2, branch?.city, branch?.state, branch?.postal_code].filter(Boolean).join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Settlement Receipt</span>
            <Button onClick={handlePrint} size="sm" className="gap-2">
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          <div className="receipt">
            {/* Header */}
            <div className="header">
              <div className="lab-info">
                <p className="lab-name">{branch?.name || 'Laboratory'}</p>
                {address && <p className="lab-detail">{address}</p>}
                {branch?.phone && <p className="lab-detail">Phone: {branch.phone}</p>}
                {branch?.registration_number && <p className="lab-detail">Reg No: {branch.registration_number}</p>}
                {branch?.gst_number && <p className="lab-detail">GST: {branch.gst_number}</p>}
              </div>
              {logoUrl && <img src={logoUrl} alt="Logo" className="lab-logo" crossOrigin="anonymous" />}
            </div>

            {/* Title */}
            <div className="receipt-title">
              <h2>Commission Settlement Receipt</h2>
              <div className="receipt-no">Receipt No: {receiptNo} | Date: {format(new Date(settlement.settlement_date), 'dd MMMM yyyy')}</div>
            </div>

            {/* Doctor & Payment info */}
            <div className="info-grid">
              <div className="info-box">
                <h4>Doctor Details</h4>
                <div className="info-row"><span className="info-label">Name</span><span className="info-value">Dr. {doctorName}</span></div>
                {doctorSpecialization && <div className="info-row"><span className="info-label">Specialization</span><span className="info-value">{doctorSpecialization}</span></div>}
                {doctorPhone && <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{doctorPhone}</span></div>}
              </div>
              <div className="info-box">
                <h4>Payment Details</h4>
                <div className="info-row"><span className="info-label">Method</span><span className="info-value">{methodLabels[settlement.payment_method] || settlement.payment_method}</span></div>
                {settlement.reference_number && <div className="info-row"><span className="info-label">Reference</span><span className="info-value">{settlement.reference_number}</span></div>}
                <div className="info-row"><span className="info-label">Date</span><span className="info-value">{format(new Date(settlement.settlement_date), 'dd/MM/yyyy')}</span></div>
              </div>
            </div>

            {/* Period */}
            {settlement.period_from && settlement.period_to && (
              <div className="period-box">
                <strong>Settlement Period:</strong> {format(new Date(settlement.period_from), 'dd MMM yyyy')} — {format(new Date(settlement.period_to), 'dd MMM yyyy')}
              </div>
            )}

            {/* Amount */}
            <div className="amount-box">
              <div className="amount-label">Total Settlement Amount</div>
              <div className="amount-value">₹{settlement.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="amount-words">{numberToWords(settlement.total_amount)}</div>
            </div>

            {/* Notes */}
            {settlement.notes && (
              <div className="notes-box">
                <div className="label">Notes</div>
                {settlement.notes}
              </div>
            )}

            {/* Signatures */}
            <div className="signature-area">
              <div className="sig-block">
                <div className="sig-line">Receiver's Signature<br />(Dr. {doctorName})</div>
              </div>
              <div className="sig-block">
                {signatureUrl && <img src={signatureUrl} alt="Authorized Signature" className="sig-img" crossOrigin="anonymous" />}
                <div className="sig-line">Authorized Signatory<br />({branch?.name || 'Laboratory'})</div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              {branch?.footer_text || 'This is a computer-generated receipt.'}
              <br />Generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
