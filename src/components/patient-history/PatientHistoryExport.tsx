import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Printer, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PatientHistoryExportProps {
  patient: {
    id: string;
    patient_id: string;
    full_name: string;
    phone?: string;
    age?: number;
    gender?: string;
    patient_history?: string;
    referred_by_doctor_name?: string;
    branch_id?: string;
  };
}

interface BranchProfile {
  name: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  logo_url?: string;
}

const getStorageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const { data } = supabase.storage.from('lab-assets').getPublicUrl(path);
  return data?.publicUrl;
};

export default function PatientHistoryExport({ patient }: PatientHistoryExportProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchProfile, setBranchProfile] = useState<BranchProfile | null>(null);
  const [testReports, setTestReports] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open, patient.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch branch profile
      if (patient.branch_id) {
        const { data: branch } = await supabase
          .from('branches')
          .select('name, phone, address_line1, city, state, logo_url')
          .eq('id', patient.branch_id)
          .single();
        if (branch) {
          setBranchProfile({
            ...branch,
            logo_url: getStorageUrl(branch.logo_url)
          });
        }
      }

      // Fetch all patient data in parallel
      const [reportsRes, billsRes, followupsRes, docsRes] = await Promise.all([
        supabase
          .from('test_reports')
          .select('*')
          .eq('patient_id', patient.id)
          .order('test_date', { ascending: false }),
        supabase
          .from('bills')
          .select('*')
          .eq('patient_id', patient.id)
          .order('bill_date', { ascending: false }),
        supabase
          .from('patient_followups')
          .select('*')
          .eq('patient_id', patient.id)
          .order('due_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })
      ]);

      setTestReports(reportsRes.data || []);
      setBills(billsRes.data || []);
      setFollowups(followupsRes.data || []);
      setDocuments(docsRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load patient data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient History - ${patient.full_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              padding: 24px;
              background: white;
              color: #1f2937;
              font-size: 12px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              align-items: center;
              gap: 16px;
              padding-bottom: 16px;
              border-bottom: 2px solid #2563eb;
              margin-bottom: 20px;
            }
            .logo { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }
            .header-info h1 { font-size: 20px; color: #1e40af; margin-bottom: 4px; }
            .header-info p { font-size: 11px; color: #6b7280; }
            .title-badge {
              display: inline-block;
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 6px 20px;
              font-size: 13px;
              font-weight: 600;
              border-radius: 20px;
              margin: 16px 0;
            }
            .patient-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .patient-card h2 { font-size: 16px; color: #1e40af; margin-bottom: 12px; }
            .patient-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .patient-field label { font-size: 10px; color: #6b7280; display: block; }
            .patient-field span { font-size: 12px; font-weight: 500; color: #1f2937; }
            .section { margin-bottom: 24px; }
            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: #1e40af;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 12px;
            }
            table { width: 100%; border-collapse: collapse; }
            th {
              background: #f1f5f9;
              padding: 8px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              color: #374151;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 8px;
              font-size: 11px;
              border-bottom: 1px solid #f1f5f9;
              color: #4b5563;
            }
            .status { 
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 500;
            }
            .status-completed, .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .empty-state { 
              text-align: center;
              padding: 20px;
              color: #9ca3af;
              font-style: italic;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .summary-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              text-align: center;
            }
            .summary-card .value { font-size: 20px; font-weight: 700; color: #1e40af; }
            .summary-card .label { font-size: 10px; color: #6b7280; }
            .amount-due { color: #dc2626 !important; }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
            }
            @media print {
              body { padding: 12px; }
              .section { page-break-inside: avoid; }
            }
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

  const totalBilled = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const totalDue = bills.reduce((sum, b) => sum + (b.due_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Patient History Summary</span>
            <Button onClick={handlePrint} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Print / Save PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div ref={printRef} className="bg-white p-6">
            {/* Header */}
            <div className="header">
              {branchProfile?.logo_url && (
                <img src={branchProfile.logo_url} alt="Logo" className="logo" />
              )}
              <div className="header-info">
                <h1>{branchProfile?.name || 'Medical Laboratory'}</h1>
                <p>
                  {[branchProfile?.address_line1, branchProfile?.city, branchProfile?.state]
                    .filter(Boolean)
                    .join(', ')}
                  {branchProfile?.phone && ` • ${branchProfile.phone}`}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span className="title-badge">📋 PATIENT HISTORY SUMMARY</span>
            </div>

            {/* Patient Info Card */}
            <div className="patient-card">
              <h2>Patient Information</h2>
              <div className="patient-grid">
                <div className="patient-field">
                  <label>Patient ID</label>
                  <span>{patient.patient_id}</span>
                </div>
                <div className="patient-field">
                  <label>Full Name</label>
                  <span>{patient.full_name}</span>
                </div>
                <div className="patient-field">
                  <label>Phone</label>
                  <span>{patient.phone || 'N/A'}</span>
                </div>
                <div className="patient-field">
                  <label>Age</label>
                  <span>{patient.age ? `${patient.age} years` : 'N/A'}</span>
                </div>
                <div className="patient-field">
                  <label>Gender</label>
                  <span>{patient.gender || 'N/A'}</span>
                </div>
                <div className="patient-field">
                  <label>Referred By</label>
                  <span>{patient.referred_by_doctor_name || 'N/A'}</span>
                </div>
              </div>
              {patient.patient_history && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '10px', color: '#6b7280' }}>Medical History</label>
                  <p style={{ fontSize: '11px', marginTop: '4px' }}>{patient.patient_history}</p>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="value">{testReports.length}</div>
                <div className="label">Test Reports</div>
              </div>
              <div className="summary-card">
                <div className="value">₹{totalBilled.toLocaleString()}</div>
                <div className="label">Total Billed</div>
              </div>
              <div className="summary-card">
                <div className="value">₹{totalPaid.toLocaleString()}</div>
                <div className="label">Paid</div>
              </div>
              <div className="summary-card">
                <div className={`value ${totalDue > 0 ? 'amount-due' : ''}`}>
                  ₹{totalDue.toLocaleString()}
                </div>
                <div className="label">Due Amount</div>
              </div>
            </div>

            {/* Test Reports Section */}
            <div className="section">
              <div className="section-title">Test Reports ({testReports.length})</div>
              {testReports.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Test Type</th>
                      <th>Technician</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testReports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatDate(report.test_date)}</td>
                        <td>{report.test_type}</td>
                        <td>{report.technician_name || 'N/A'}</td>
                        <td>
                          <span className={`status status-${report.status}`}>
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No test reports found</div>
              )}
            </div>

            {/* Bills Section */}
            <div className="section">
              <div className="section-title">Bills ({bills.length})</div>
              {bills.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Bill No.</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id}>
                        <td>{bill.bill_number}</td>
                        <td>{formatDate(bill.bill_date)}</td>
                        <td>₹{bill.total_amount?.toLocaleString()}</td>
                        <td>₹{bill.paid_amount?.toLocaleString()}</td>
                        <td style={{ color: bill.due_amount > 0 ? '#dc2626' : undefined }}>
                          ₹{bill.due_amount?.toLocaleString()}
                        </td>
                        <td>
                          <span className={`status status-${bill.status}`}>
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No bills found</div>
              )}
            </div>

            {/* Documents Section */}
            <div className="section">
              <div className="section-title">Documents ({documents.length})</div>
              {documents.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.file_name}</td>
                        <td>{doc.file_type}</td>
                        <td>{formatDate(doc.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No documents found</div>
              )}
            </div>

            {/* Follow-ups Section */}
            <div className="section">
              <div className="section-title">Follow-ups ({followups.length})</div>
              {followups.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followups.map((followup) => (
                      <tr key={followup.id}>
                        <td>{followup.title}</td>
                        <td>{formatDate(followup.due_at)}</td>
                        <td>{followup.priority}</td>
                        <td>
                          <span className={`status status-${followup.status}`}>
                            {followup.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No follow-ups found</div>
              )}
            </div>

            {/* Footer */}
            <div className="footer">
              Generated on {formatDate(new Date().toISOString(), true)} • This is a computer-generated document
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}