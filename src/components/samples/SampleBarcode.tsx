import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, QrCode } from "lucide-react";
import { format } from "date-fns";

interface SampleBarcodeProps {
  sampleId: string;
  barcode: string;
  patientName: string;
  testType: string;
  collectedAt: string;
}

export function SampleBarcode({ sampleId, barcode, patientName, testType, collectedAt }: SampleBarcodeProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sample Label - ${sampleId}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .label { border: 1px dashed #ccc; padding: 12px; width: 280px; text-align: center; }
            .label h3 { margin: 8px 0 4px; font-size: 14px; }
            .label p { margin: 2px 0; font-size: 11px; color: #555; }
            .label .sample-id { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
            @media print { .label { border: 1px solid #000; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="sample-id">${sampleId}</div>
            ${content.querySelector('svg')?.outerHTML || ''}
            <h3>${patientName}</h3>
            <p>${testType}</p>
            <p>${format(new Date(collectedAt), "dd/MM/yyyy HH:mm")}</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View QR Code">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Sample Label</DialogTitle>
        </DialogHeader>
        <div ref={printRef} className="flex flex-col items-center gap-3 py-4">
          <p className="text-lg font-bold tracking-wider">{sampleId}</p>
          <QRCodeSVG value={barcode} size={160} level="M" />
          <div className="text-center">
            <p className="font-medium">{patientName}</p>
            <p className="text-sm text-muted-foreground">{testType}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(collectedAt), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} className="w-full">
          <Printer className="h-4 w-4 mr-2" />
          Print Label
        </Button>
      </DialogContent>
    </Dialog>
  );
}
