import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';

interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  items: any;
  notes?: string;
  branch_id?: string;
  patients?: { full_name: string; patient_id: string; phone?: string; email?: string; age?: number; gender?: string } | null;
}

interface BillPrintModalProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LabProfile {
  name: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  logo_url?: string;
  signature_url?: string;
  registration_number?: string;
  gst_number?: string;
  website?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  footer_text?: string;
  terms_conditions?: string;
  bill_print_with_header?: boolean;
}

const BillPrintModal = ({ bill, open, onOpenChange }: BillPrintModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [labProfile, setLabProfile] = useState<LabProfile | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  useEffect(() => {
    if (bill && open) {
      fetchLabProfile();
      fetchPatientDetails();
    }
  }, [bill, open]);

  const fetchLabProfile = async () => {
    // Set default lab profile first
    const defaultLabProfile: LabProfile = {
      name: '',
      phone: '',
      logo_url: undefined,
      signature_url: undefined,
      terms_conditions: 'Terms and conditions apply',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      website: '',
      bank_name: '',
      bank_account_number: '',
      bank_ifsc_code: '',
      registration_number: '',
      gst_number: '',
      bill_print_with_header: true
    };

    // Fetch branch data using the BILL's branch_id (not user's profile branch)
    let branchData = null;
    if (bill?.branch_id) {
      try {
        const { data } = await supabase
          .from('branches')
          .select('*')
          .eq('id', bill.branch_id)
          .single();
        branchData = data;
      } catch (error) {
        console.error('Error fetching branch:', error);
      }
    }

    if (!branchData) {
      setLabProfile(defaultLabProfile);
      return;
    }

    // Build profile from branch data (branch takes priority)
    const mergedProfile: LabProfile = {
      name: branchData.name || defaultLabProfile.name,
      phone: branchData.phone || defaultLabProfile.phone,
      address_line1: branchData.address_line1 || defaultLabProfile.address_line1,
      address_line2: branchData.address_line2 || defaultLabProfile.address_line2,
      city: branchData.city || defaultLabProfile.city,
      state: branchData.state || defaultLabProfile.state,
      postal_code: branchData.postal_code || defaultLabProfile.postal_code,
      logo_url: branchData.logo_url || defaultLabProfile.logo_url,
      signature_url: branchData.signature_url || defaultLabProfile.signature_url,
      website: branchData.website || defaultLabProfile.website,
      registration_number: branchData.registration_number || defaultLabProfile.registration_number,
      gst_number: branchData.gst_number || defaultLabProfile.gst_number,
      bank_name: branchData.bank_name || defaultLabProfile.bank_name,
      bank_account_number: branchData.bank_account_number || defaultLabProfile.bank_account_number,
      bank_ifsc_code: branchData.bank_ifsc_code || defaultLabProfile.bank_ifsc_code,
      footer_text: branchData.footer_text || defaultLabProfile.footer_text,
      terms_conditions: branchData.terms_conditions || defaultLabProfile.terms_conditions,
      bill_print_with_header: branchData.bill_print_with_header ?? true
    };

    setLabProfile(mergedProfile);
  };

  const fetchPatientDetails = async () => {
    if (!bill?.patients) return;

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', bill.patients.patient_id)
        .single();

      if (!error && data) {
        setPatientDetails(data);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill?.bill_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              padding: 20px;
              padding-top: ${labProfile?.bill_print_with_header === false ? '120px' : '20px'};
              background: white;
              color: #333;
            }
            .header-hidden {
              display: none !important;
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #2563eb;
            }
            .header-top {
              display: flex;
              align-items: flex-start;
              gap: 20px;
            }
            .logo {
              width: 90px;
              height: 90px;
              object-fit: contain;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .lab-info {
              flex: 1;
            }
            .lab-name {
              font-size: 26px;
              font-weight: 700;
              color: #1e40af;
              margin: 0 0 4px 0;
              letter-spacing: -0.5px;
            }
            .lab-tagline {
              font-size: 13px;
              color: #6b7280;
              margin: 0 0 10px 0;
            }
            .contact-row {
              font-size: 12px;
              color: #4b5563;
              line-height: 1.8;
            }
            .contact-row span {
              margin-right: 20px;
            }
            .registration-row {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #d1d5db;
              font-size: 11px;
              color: #6b7280;
            }
            .registration-row strong {
              color: #374151;
            }
            .invoice-title {
              text-align: center;
              margin: 20px 0 15px 0;
            }
            .invoice-badge {
              display: inline-block;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 8px 30px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 50px;
              letter-spacing: 1px;
            }
            .bill-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              gap: 20px;
            }
            .info-box {
              flex: 1;
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .info-box h3 {
              font-size: 14px;
              font-weight: 600;
              color: #1e40af;
              margin: 0 0 12px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #2563eb;
            }
            .info-row {
              margin: 6px 0;
              font-size: 12px;
              color: #4b5563;
            }
            .info-label {
              font-weight: 600;
              display: inline-block;
              width: 100px;
              color: #374151;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
            }
            td {
              border: 1px solid #e5e7eb;
              padding: 10px 8px;
              font-size: 12px;
            }
            .total-row {
              font-weight: 600;
              background-color: #f1f5f9;
            }
            .total-row td {
              font-size: 13px;
            }
            .payment-info {
              margin: 20px 0;
              padding: 15px;
              background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
              border-radius: 8px;
              border: 1px solid #bbf7d0;
            }
            .payment-info h3 {
              font-size: 13px;
              font-weight: 600;
              color: #166534;
              margin: 0 0 10px 0;
            }
            .payment-summary {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
            }
            .payment-summary .paid { color: #16a34a; }
            .payment-summary .due { color: #dc2626; font-weight: 600; }
            .bank-details {
              margin: 20px 0;
              padding: 15px;
              background: #eff6ff;
              border-radius: 8px;
              border: 1px solid #bfdbfe;
            }
            .bank-details h3 {
              font-size: 13px;
              font-weight: 600;
              color: #1e40af;
              margin: 0 0 10px 0;
            }
            .signature-section {
              margin-top: 40px;
              text-align: right;
            }
            .signature-img {
              max-height: 50px;
              margin-bottom: 5px;
            }
            .terms {
              margin: 20px 0;
              font-size: 10px;
              color: #6b7280;
              line-height: 1.6;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #6b7280;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 50px;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-partially_paid { background: #ffedd5; color: #c2410c; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'partially_paid': return 'status-partially_paid';
      case 'overdue': return 'status-overdue';
      default: return '';
    }
  };

  const formatAddress = () => {
    if (!labProfile) return '';
    const parts = [
      labProfile.address_line1,
      labProfile.address_line2,
      labProfile.city,
      labProfile.state,
      labProfile.postal_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill Preview - Ready to Print</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-6 bg-white" style={{ paddingTop: labProfile?.bill_print_with_header === false ? '20px' : undefined }}>
          {/* Professional Header - conditionally shown */}
          {labProfile?.bill_print_with_header !== false && (
            <div className="header">
              <div className="header-top">
                {labProfile?.logo_url && (
                  <img src={labProfile.logo_url} alt="Lab Logo" className="logo" />
                )}
                <div className="lab-info">
                  {labProfile?.name && <h1 className="lab-name">{labProfile.name}</h1>}
                  <p className="lab-tagline">Diagnostic & Pathology Center</p>
                  <div className="contact-row">
                    {formatAddress() && <span>📍 {formatAddress()}</span>}
                    {labProfile?.phone && <span>📞 {labProfile.phone}</span>}
                    {labProfile?.website && <span>🌐 {labProfile.website}</span>}
                  </div>
                </div>
              </div>
              {(labProfile?.registration_number || labProfile?.gst_number) && (
                <div className="registration-row">
                  {labProfile?.registration_number && (
                    <span>Registration No: <strong>{labProfile.registration_number}</strong></span>
                  )}
                  {labProfile?.registration_number && labProfile?.gst_number && <span> | </span>}
                  {labProfile?.gst_number && (
                    <span>GST: <strong>{labProfile.gst_number}</strong></span>
                  )}
                </div>
              )}
              <div className="invoice-title">
                <span className="invoice-badge">📋 INVOICE</span>
              </div>
            </div>
          )}
          

          {/* Bill and Patient Information */}
          <div className="bill-info">
            <div className="info-box patient-info">
              <h3>Patient Details</h3>
              <div className="info-row">
                <span className="info-label">Patient ID:</span>
                {bill.patients?.patient_id || 'N/A'}
              </div>
              <div className="info-row">
                <span className="info-label">Name:</span>
                {bill.patients?.full_name || 'N/A'}
              </div>
              {patientDetails && (
                <>
                  <div className="info-row">
                    <span className="info-label">Age/Gender:</span>
                    {patientDetails.age || 'N/A'} / {patientDetails.gender || 'N/A'}
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    {patientDetails.phone || 'N/A'}
                  </div>
                </>
              )}
            </div>
            
            <div className="info-box bill-meta">
              <h3>Bill Details</h3>
              <div className="info-row">
                <span className="info-label">Bill Number:</span>
                <strong>{bill.bill_number}</strong>
              </div>
              <div className="info-row">
                <span className="info-label">Bill Date:</span>
                {formatDate(bill.bill_date)}
              </div>
              <div className="info-row">
                <span className="info-label">Due Date:</span>
                {formatDate(bill.due_date)}
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className={`status-badge ${getStatusColor(bill.status)}`}>
                  {bill.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>S.No</th>
                <th>Description</th>
                <th style={{ width: '100px' }}>Quantity</th>
                <th style={{ width: '120px' }}>Rate (₹)</th>
                <th style={{ width: '120px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bill.items && bill.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{(item.quantity * item.rate).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={4} style={{ textAlign: 'right' }}>Total Amount:</td>
                <td style={{ textAlign: 'right' }}>₹{bill.total_amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Summary */}
          <div className="payment-info">
            <h3 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Payment Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>Total Amount: ₹{bill.total_amount.toFixed(2)}</div>
              <div style={{ color: 'green' }}>Paid Amount: ₹{bill.paid_amount.toFixed(2)}</div>
              <div style={{ color: 'red', fontWeight: 'bold' }}>Due Amount: ₹{bill.due_amount.toFixed(2)}</div>
            </div>
          </div>

          {/* Bank Details */}
          {labProfile?.bank_name && (
            <div className="bank-details">
              <h3 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Bank Details for Payment</h3>
              <div className="info-row">
                <span className="info-label">Bank Name:</span>
                {labProfile.bank_name}
              </div>
              <div className="info-row">
                <span className="info-label">Account Number:</span>
                {labProfile.bank_account_number}
              </div>
              <div className="info-row">
                <span className="info-label">IFSC Code:</span>
                {labProfile.bank_ifsc_code}
              </div>
            </div>
          )}

          {/* Notes */}
          {bill.notes && (
            <div style={{ margin: '20px 0', padding: '10px', background: '#fffbf0', borderRadius: '5px' }}>
              <strong>Notes:</strong> {bill.notes}
            </div>
          )}

          {/* Terms & Conditions */}
          {labProfile?.terms_conditions && (
            <div className="terms">
              <strong>Terms & Conditions:</strong><br />
              {labProfile.terms_conditions.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}

          {/* Signature */}
          <div className="signature-section">
            {labProfile?.signature_url && (
              <img src={labProfile.signature_url} alt="Signature" className="signature-img" />
            )}
            <div style={{ borderTop: '1px solid #333', width: '200px', display: 'inline-block' }}></div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>Authorized Signature</div>
          </div>

          {/* Footer */}
          <div className="footer">
            {labProfile?.footer_text || 'Thank you for choosing our services!'}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillPrintModal;