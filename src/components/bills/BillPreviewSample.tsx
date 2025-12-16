import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BillPreviewSampleProps {
  branchData: {
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
  };
  logoPreview?: string | null;
  signaturePreview?: string | null;
}

export const BillPreviewSample = ({ branchData, logoPreview, signaturePreview }: BillPreviewSampleProps) => {
  const formatAddress = () => {
    const parts = [
      branchData.address_line1,
      branchData.address_line2,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatCityState = () => {
    const parts = [
      branchData.city,
      branchData.state,
      branchData.postal_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  const showHeader = branchData.bill_print_with_header !== false;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="w-5 h-5" />
          Bill Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This is how your bills will look when printed {showHeader ? 'on plain paper' : 'on letterhead paper'}
        </p>
      </CardHeader>
      <CardContent>
        <div 
          className="border rounded-lg bg-white overflow-hidden shadow-sm"
          style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142.85%', height: '500px' }}
        >
          <div className="p-6" style={{ paddingTop: showHeader ? '24px' : '100px' }}>
            {/* Professional Header */}
            {showHeader && (
              <div className="mb-6">
                {/* Main Header Row */}
                <div className="flex items-start gap-4 pb-4 border-b-2 border-primary">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Lab Logo" 
                        className="h-20 w-20 object-contain rounded-lg border"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs text-center">
                        Logo
                      </div>
                    )}
                  </div>
                  
                  {/* Lab Info */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary mb-1">
                      {branchData.name || 'Laboratory Name'}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-2">Diagnostic & Pathology Center</p>
                    
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {formatAddress() && (
                        <p>📍 {formatAddress()}</p>
                      )}
                      {formatCityState() && (
                        <p className="pl-4">{formatCityState()}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1">
                        {branchData.phone && <span>📞 {branchData.phone}</span>}
                        {branchData.website && <span>🌐 {branchData.website}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Registration Details Row */}
                {(branchData.registration_number || branchData.gst_number) && (
                  <div className="flex gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed">
                    {branchData.registration_number && (
                      <span>Reg No: <strong>{branchData.registration_number}</strong></span>
                    )}
                    {branchData.gst_number && (
                      <span>GST: <strong>{branchData.gst_number}</strong></span>
                    )}
                  </div>
                )}
                
                {/* Invoice Title */}
                <div className="text-center mt-4 mb-2">
                  <span className="inline-block bg-primary text-primary-foreground px-6 py-1.5 text-sm font-semibold rounded-full">
                    INVOICE / BILL
                  </span>
                </div>
              </div>
            )}

            {/* Letterhead mode notice */}
            {!showHeader && (
              <div className="text-center mb-4 p-2 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200">
                Letterhead Mode - Header hidden for pre-printed paper
              </div>
            )}

            {/* Bill & Patient Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-2 text-primary">Patient Details</h3>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><span className="font-medium">Patient ID:</span> SAMPLE-001</p>
                  <p><span className="font-medium">Name:</span> John Doe</p>
                  <p><span className="font-medium">Age/Gender:</span> 35 / Male</p>
                  <p><span className="font-medium">Phone:</span> +91 98765 43210</p>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-2 text-primary">Bill Details</h3>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><span className="font-medium">Bill No:</span> <strong>INV-2024-0001</strong></p>
                  <p><span className="font-medium">Date:</span> {formatDate(new Date())}</p>
                  <p><span className="font-medium">Due Date:</span> {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</p>
                  <p><span className="font-medium">Status:</span> <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px]">PENDING</span></p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs mb-4 border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-2 text-left border">S.No</th>
                  <th className="p-2 text-left border">Description</th>
                  <th className="p-2 text-center border">Qty</th>
                  <th className="p-2 text-right border">Rate (₹)</th>
                  <th className="p-2 text-right border">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 border">1</td>
                  <td className="p-2 border">Complete Blood Count (CBC)</td>
                  <td className="p-2 text-center border">1</td>
                  <td className="p-2 text-right border">500.00</td>
                  <td className="p-2 text-right border">500.00</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 border">2</td>
                  <td className="p-2 border">Thyroid Profile (T3, T4, TSH)</td>
                  <td className="p-2 text-center border">1</td>
                  <td className="p-2 text-right border">800.00</td>
                  <td className="p-2 text-right border">800.00</td>
                </tr>
                <tr className="font-semibold bg-muted">
                  <td colSpan={4} className="p-2 text-right border">Total Amount:</td>
                  <td className="p-2 text-right border">₹1,300.00</td>
                </tr>
              </tbody>
            </table>

            {/* Payment Summary */}
            <div className="bg-muted/50 p-3 rounded-lg mb-4">
              <div className="flex justify-between text-xs">
                <span>Total: ₹1,300.00</span>
                <span className="text-green-600">Paid: ₹500.00</span>
                <span className="text-red-600 font-semibold">Due: ₹800.00</span>
              </div>
            </div>

            {/* Bank Details */}
            {branchData.bank_name && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-xs">
                <h4 className="font-semibold text-blue-900 mb-1">Bank Details</h4>
                <p className="text-blue-800">
                  {branchData.bank_name} | A/C: {branchData.bank_account_number || 'XXXXXXXXXXXX'} | IFSC: {branchData.bank_ifsc_code || 'XXXXXXXXX'}
                </p>
              </div>
            )}

            {/* Signature */}
            <div className="flex justify-end mt-4">
              <div className="text-center">
                {signaturePreview ? (
                  <img src={signaturePreview} alt="Signature" className="h-10 object-contain mx-auto mb-1" />
                ) : (
                  <div className="h-10 w-24 border-b border-dashed mb-1" />
                )}
                <p className="text-[10px] text-muted-foreground">Authorized Signature</p>
              </div>
            </div>

            {/* Footer */}
            {branchData.footer_text && (
              <div className="text-center text-[10px] text-muted-foreground mt-4 pt-2 border-t">
                {branchData.footer_text}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
