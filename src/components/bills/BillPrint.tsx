import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface BillPrintProps {
  bill: Bill;
}

interface LabProfile {
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
  website?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc_code?: string | null;
  footer_text?: string | null;
  terms_conditions?: string | null;
  bill_print_with_header?: boolean;
}

export const BillPrint = ({ bill }: BillPrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const [labProfile, setLabProfile] = useState<LabProfile | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  useEffect(() => {
    fetchLabProfile();
    fetchPatientDetails();
  }, [profile, bill]);

  const fetchLabProfile = async () => {
    if (!profile) return;

    // Set default lab profile first
    const defaultLabProfile: LabProfile = {
      name: 'Lab Name',
      phone: 'Contact Number',
      logo_url: null,
      signature_url: null,
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
      footer_text: ''
    };

    try {
      // First, try to get branch-specific settings
      let branchData = null;
      if (profile.branch_id) {
        const { data } = await supabase
          .from('branches')
          .select('*')
          .eq('id', profile.branch_id)
          .single();
        
        branchData = data;
      }

      // Then, try to fetch lab profile
      let labData = null;
      
      if (profile.lab_id) {
        const { data } = await supabase
          .from('labs')
          .select('*')
          .eq('id', profile.lab_id)
          .single();
        
        labData = data;
      }

      // If no lab_id but have branch, try to get lab through branch
      if (!labData && branchData?.lab_id) {
        const { data } = await supabase
          .from('labs')
          .select('*')
          .eq('id', branchData.lab_id)
          .single();
        
        labData = data;
      }

      // If still no lab data and have branch, try to get lab through organization
      if (!labData && branchData?.organization_id) {
        const { data } = await supabase
          .from('labs')
          .select('*')
          .eq('organization_id', branchData.organization_id)
          .limit(1)
          .single();
        
        labData = data;
      }

      // Merge branch and lab data, with branch data taking priority
      const mergedProfile: LabProfile = {
        name: branchData?.name || labData?.name || defaultLabProfile.name,
        phone: branchData?.phone || labData?.phone || defaultLabProfile.phone,
        address_line1: branchData?.address_line1 || labData?.address_line1 || defaultLabProfile.address_line1,
        address_line2: branchData?.address_line2 || labData?.address_line2 || defaultLabProfile.address_line2,
        city: branchData?.city || labData?.city || defaultLabProfile.city,
        state: branchData?.state || labData?.state || defaultLabProfile.state,
        postal_code: branchData?.postal_code || labData?.postal_code || defaultLabProfile.postal_code,
        logo_url: branchData?.logo_url || labData?.logo_url || defaultLabProfile.logo_url,
        signature_url: branchData?.signature_url || labData?.signature_url || defaultLabProfile.signature_url,
        website: branchData?.website || labData?.website || defaultLabProfile.website,
        registration_number: branchData?.registration_number || labData?.registration_number || defaultLabProfile.registration_number,
        gst_number: branchData?.gst_number || labData?.gst_number || defaultLabProfile.gst_number,
        bank_name: branchData?.bank_name || labData?.bank_name || defaultLabProfile.bank_name,
        bank_account_number: branchData?.bank_account_number || labData?.bank_account_number || defaultLabProfile.bank_account_number,
        bank_ifsc_code: branchData?.bank_ifsc_code || labData?.bank_ifsc_code || defaultLabProfile.bank_ifsc_code,
        footer_text: branchData?.footer_text || labData?.footer_text || defaultLabProfile.footer_text,
        terms_conditions: branchData?.terms_conditions || labData?.terms_conditions || defaultLabProfile.terms_conditions,
        bill_print_with_header: branchData?.bill_print_with_header ?? true
      };

      setLabProfile(mergedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLabProfile(defaultLabProfile);
    }
  };

  const fetchPatientDetails = async () => {
    if (!bill.patients) return;

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
          <title>Bill - ${bill.bill_number}</title>
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="p-6 bg-white">
          {/* Header with Lab Info - conditionally shown */}
          {labProfile?.bill_print_with_header !== false && (
            <div className="header">
              {labProfile?.logo_url && (
                <img src={labProfile.logo_url} alt="Lab Logo" className="logo mx-auto" />
              )}
              <h1 className="lab-name">{labProfile?.name || 'Laboratory'}</h1>
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
          
          {/* Letterhead mode indicator in preview */}
          {labProfile?.bill_print_with_header === false && (
            <div className="text-center mb-4 p-2 bg-blue-50 text-blue-700 rounded text-sm border border-blue-200">
              Letterhead Mode: Header will be hidden when printing. Content starts below to accommodate pre-printed letterhead.
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

        <div className="flex justify-end mt-4">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};