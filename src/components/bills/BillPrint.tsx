import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';

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
  patients?: { full_name: string; patient_id: string } | null;
}

interface BillPrintProps {
  bill: Bill;
}

export const BillPrint = ({ bill }: BillPrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Bill ${bill.bill_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .patient-info { margin-bottom: 20px; }
                .bill-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .total { text-align: right; font-weight: bold; font-size: 18px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#22c55e';
      case 'partially_paid': return '#f59e0b';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Bill
          </Button>
        </div>

        <div ref={printRef} className="bg-white p-6">
          <div className="header">
            <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Lab Master</h1>
            <p style={{ margin: '5px 0', fontSize: '16px', color: '#666' }}>Laboratory Services</p>
          </div>

          <div className="bill-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Bill To:</h3>
              <p style={{ margin: '2px 0' }}><strong>{bill.patients?.full_name || 'Unknown Patient'}</strong></p>
              <p style={{ margin: '2px 0' }}>Patient ID: {bill.patients?.patient_id || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Bill Details:</h3>
              <p style={{ margin: '2px 0' }}>Bill Number: <strong>{bill.bill_number}</strong></p>
              <p style={{ margin: '2px 0' }}>Bill Date: {new Date(bill.bill_date).toLocaleDateString()}</p>
              <p style={{ margin: '2px 0' }}>Due Date: {new Date(bill.due_date).toLocaleDateString()}</p>
              <p style={{ margin: '2px 0' }}>
                Status: <span style={{ color: getStatusColor(bill.status), fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {bill.status.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Rate</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(bill.items) ? bill.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.rate?.toFixed(2) || '0.00'}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.amount?.toFixed(2) || '0.00'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}>No items found</td></tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px' }}>
            <div>
              {bill.notes && (
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Notes:</h4>
                  <p style={{ margin: 0, color: '#666' }}>{bill.notes}</p>
                </div>
              )}
            </div>
            <div style={{ minWidth: '200px' }}>
              <table style={{ width: '100%', border: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ border: 'none', fontWeight: 'bold' }}>Total Amount:</td>
                    <td style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }}>₹{bill.total_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: 'none', color: '#22c55e' }}>Paid Amount:</td>
                    <td style={{ border: 'none', textAlign: 'right', color: '#22c55e' }}>₹{bill.paid_amount.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #333' }}>
                    <td style={{ border: 'none', fontWeight: 'bold', fontSize: '16px', color: bill.due_amount > 0 ? '#ef4444' : '#22c55e' }}>
                      Due Amount:
                    </td>
                    <td style={{ border: 'none', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: bill.due_amount > 0 ? '#ef4444' : '#22c55e' }}>
                      ₹{bill.due_amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="footer">
            <p style={{ margin: '10px 0' }}>Thank you for choosing Lab Master</p>
            <p style={{ margin: '5px 0' }}>For any queries, please contact our support team</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};