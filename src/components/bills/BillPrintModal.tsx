import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { profile } = useAuth();
  const [labProfile, setLabProfile] = useState<LabProfile | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  useEffect(() => {
    if (bill && open) {
      fetchLabProfile();
      fetchPatientDetails();
    }
  }, [profile, bill, open]);

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

    // First fetch branch data for bill_print_with_header setting
    let branchData = null;
    if (profile?.branch_id) {
      try {
        const { data } = await supabase
          .from('branches')
          .select('*')
          .eq('id', profile.branch_id)
          .single();
        branchData = data;
      } catch (error) {
        console.error('Error fetching branch:', error);
      }
    }

    if (!profile?.lab_id) {
      // If no lab_id, try to fetch any lab in the organization
      if (branchData?.organization_id) {
        try {
          const { data: labsData } = await supabase
            .from('labs')
            .select('*')
            .eq('organization_id', branchData.organization_id)
            .limit(1)
            .single();

          if (labsData) {
            setLabProfile({ 
              ...defaultLabProfile, 
              ...labsData,
              bill_print_with_header: branchData?.bill_print_with_header ?? true
            });
            return;
          }
        } catch (error) {
          console.error('Error fetching lab by organization:', error);
        }
      }
      
      setLabProfile({
        ...defaultLabProfile,
        bill_print_with_header: branchData?.bill_print_with_header ?? true
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('labs')
        .select('*')
        .eq('id', profile.lab_id)
        .single();

      if (!error && data) {
        setLabProfile({ 
          ...defaultLabProfile, 
          ...data,
          bill_print_with_header: branchData?.bill_print_with_header ?? true
        });
      } else {
        setLabProfile({
          ...defaultLabProfile,
          bill_print_with_header: branchData?.bill_print_with_header ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching lab profile:', error);
      setLabProfile({
        ...defaultLabProfile,
        bill_print_with_header: branchData?.bill_print_with_header ?? true
      });
    }
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
              font-family: Arial, sans-serif;
              padding: 20px;
              padding-top: ${labProfile?.bill_print_with_header === false ? '150px' : '20px'};
              background: white;
            }
            .header-hidden {
              display: none !important;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .logo {
              max-height: 80px;
              margin-bottom: 10px;
            }
            .lab-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin: 10px 0;
            }
            .lab-details {
              font-size: 12px;
              color: #666;
              line-height: 1.6;
            }
            .registration-details {
              font-size: 11px;
              color: #555;
              margin-top: 5px;
            }
            .bill-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
            }
            .patient-info, .bill-meta {
              flex: 1;
            }
            .info-row {
              margin: 5px 0;
              font-size: 13px;
            }
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 120px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .payment-info {
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .bank-details {
              margin: 20px 0;
              padding: 15px;
              background: #f0f8ff;
              border-radius: 5px;
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
              font-size: 11px;
              color: #666;
              line-height: 1.5;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-partially_paid { background: #ffe5cc; color: #cc5200; }
            .status-overdue { background: #f8d7da; color: #721c24; }
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
          {/* Header with Lab Info - conditionally shown */}
          {labProfile?.bill_print_with_header !== false && (
            <div className="header">
              {labProfile?.logo_url && (
                <img src={labProfile.logo_url} alt="Lab Logo" className="logo mx-auto" />
              )}
              {labProfile?.name && <h1 className="lab-name">{labProfile.name}</h1>}
              <div className="lab-details">
                {formatAddress() && <div>{formatAddress()}</div>}
                {labProfile?.phone && <div>Phone: {labProfile.phone}</div>}
                {labProfile?.website && <div>Website: {labProfile.website}</div>}
              </div>
              <div className="registration-details">
                {labProfile?.registration_number && (
                  <span>Registration No: {labProfile.registration_number} </span>
                )}
                {labProfile?.gst_number && (
                  <span>| GST: {labProfile.gst_number}</span>
                )}
              </div>
            </div>
          )}
          

          {/* Bill and Patient Information */}
          <div className="bill-info">
            <div className="patient-info">
              <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>Patient Details</h3>
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
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    {patientDetails.email || 'N/A'}
                  </div>
                </>
              )}
            </div>
            
            <div className="bill-meta">
              <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>Bill Details</h3>
              <div className="info-row">
                <span className="info-label">Bill Number:</span>
                <strong>{bill.bill_number}</strong>
              </div>
              <div className="info-row">
                <span className="info-label">Bill Date:</span>
                {new Date(bill.bill_date).toLocaleDateString()}
              </div>
              <div className="info-row">
                <span className="info-label">Due Date:</span>
                {new Date(bill.due_date).toLocaleDateString()}
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