import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, ScanBarcode } from "lucide-react";
import { format } from "date-fns";

interface SampleBarcodeProps {
  sampleId: string;
  barcode: string;
  patientName: string;
  patientId?: string;
  testType: string;
  collectedAt: string;
  labName?: string;
  branchName?: string;
  buttonText?: string;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export function SampleBarcode({ sampleId, barcode, patientName, patientId, testType, collectedAt, labName, branchName, buttonText }: SampleBarcodeProps) {
  const previewRef = useRef<SVGSVGElement>(null);
  const value = barcode || sampleId;

  useEffect(() => {
    if (!previewRef.current || !value) return;
    JsBarcode(previewRef.current, value, {
      format: "CODE128",
      displayValue: false,
      lineColor: "#000000",
      width: 1.15,
      height: 24,
      margin: 0,
    });
  }, [value]);

  const handlePrint = () => {
    const barcodeSvg = previewRef.current?.outerHTML || "";
    const safeLab = escapeHtml([labName, branchName].filter(Boolean).join(" - ") || "LabFlow");
    const safeSample = escapeHtml(sampleId);
    const safePatient = escapeHtml(patientName || "Patient");
    const safePatientId = escapeHtml(patientId || "");
    const safeTest = escapeHtml(testType || "Diagnostic Test");
    const collected = escapeHtml(format(new Date(collectedAt), "dd/MM/yyyy HH:mm"));
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=420,height=260");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Sample Label - ${safeSample}</title>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            * { box-sizing: border-box; }
            html, body { width: 50mm; height: 25mm; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; color: #000; }
            .label { width: 50mm; height: 25mm; padding: 1.1mm 1.5mm 0.8mm; overflow: hidden; }
            .top { display: flex; justify-content: space-between; gap: 1mm; font-size: 5.8pt; font-weight: 700; line-height: 1; white-space: nowrap; }
            .sample { font-size: 7.8pt; font-weight: 800; letter-spacing: .2px; margin-top: .6mm; line-height: 1; }
            .barcode { display: block; width: 47mm; height: 7mm; margin: .7mm 0 .4mm; }
            .barcode svg { width: 47mm; height: 7mm; }
            .details { display: grid; grid-template-columns: 1fr 1fr; column-gap: 1.5mm; font-size: 5.8pt; line-height: 1.12; white-space: nowrap; overflow: hidden; }
            .details div { overflow: hidden; text-overflow: ellipsis; }
            .test { grid-column: 1 / -1; font-weight: 700; }
            .handwrite { margin-top: 1mm; border-top: .25mm solid #000; padding-top: .6mm; font-size: 5.5pt; line-height: 1; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="top"><span>${safeLab}</span><span>${collected}</span></div>
            <div class="sample">${safeSample}</div>
            <div class="barcode">${barcodeSvg}</div>
            <div class="details">
              <div>Patient: ${safePatient}</div>
              <div>ID: ${safePatientId}</div>
              <div class="test">Test: ${safeTest}</div>
            </div>
            <div class="handwrite">Handwritten note: __________________________</div>
          </div>
          <script>window.onload = function () { window.print(); setTimeout(function () { window.close(); }, 250); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonText ? "outline" : "ghost"} size={buttonText ? "default" : "icon"} title="Print 50 x 25 mm label">
          <ScanBarcode className="h-4 w-4" />
          {buttonText && <span className="ml-2">{buttonText}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Sample Label (50 x 25 mm)</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center overflow-auto py-3">
          <div className="h-[25mm] w-[50mm] overflow-hidden border border-dashed border-muted-foreground/50 bg-white p-1 text-black">
            <div className="flex justify-between gap-1 truncate text-[7px] font-bold leading-none">
              <span className="truncate">{[labName, branchName].filter(Boolean).join(" - ") || "LabFlow"}</span>
              <span className="shrink-0">{format(new Date(collectedAt), "dd/MM/yy HH:mm")}</span>
            </div>
            <div className="mt-1 truncate text-[10px] font-extrabold leading-none">{sampleId}</div>
            <svg ref={previewRef} className="mt-1 h-[7mm] w-full" aria-label={`Barcode for ${sampleId}`} />
            <div className="grid grid-cols-2 gap-x-1 truncate text-[7px] leading-tight">
              <span>Patient: {patientName || "Patient"}</span>
              <span>ID: {patientId || "-"}</span>
              <span className="col-span-2 font-bold">Test: {testType || "Diagnostic Test"}</span>
            </div>
            <div className="mt-1 truncate border-t border-black pt-0.5 text-[6px] leading-none">Handwritten note: __________________</div>
          </div>
        </div>
        <Button onClick={handlePrint} className="w-full">
          <Printer className="mr-2 h-4 w-4" />
          Print 50 x 25 mm Label
        </Button>
      </DialogContent>
    </Dialog>
  );
}
