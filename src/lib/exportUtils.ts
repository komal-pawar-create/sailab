import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  dateRange?: { from: Date | null; to: Date | null };
}

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format number for Excel (plain number, no currency symbol or commas)
export const formatNumberForExcel = (amount: number): number => {
  return amount;
};

// Export to Excel
export const exportToExcel = (
  data: Record<string, any>[],
  columns: ExportColumn[],
  options: ExportOptions
): void => {
  // Transform data to use column headers
  const exportData = data.map((row) => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col.header] = row[col.key] ?? '';
    });
    return newRow;
  });

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, `${options.filename}.xlsx`);
};

// Export to PDF
export const exportToPDF = (
  data: Record<string, any>[],
  columns: ExportColumn[],
  options: ExportOptions
): void => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(options.title || 'Report', pageWidth / 2, 15, { align: 'center' });

  // Subtitle with date range
  if (options.subtitle || options.dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let subtitle = options.subtitle || '';
    if (options.dateRange?.from && options.dateRange?.to) {
      subtitle += subtitle ? ' | ' : '';
      subtitle += `${formatDate(options.dateRange.from)} to ${formatDate(options.dateRange.to)}`;
    }
    doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });
  }

  // Generated date
  doc.setFontSize(8);
  doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 14, 10, { align: 'right' });

  // Table data
  const tableHeaders = columns.map((col) => col.header);
  const tableData = data.map((row) => columns.map((col) => row[col.key] ?? ''));

  // Auto table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 28,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 28 },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  doc.save(`${options.filename}.pdf`);
};

// Print table
export const printReport = (
  data: Record<string, any>[],
  columns: ExportColumn[],
  options: ExportOptions
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const tableHeaders = columns.map((col) => `<th style="border: 1px solid #ddd; padding: 8px; background-color: #3b82f6; color: white;">${col.header}</th>`).join('');
  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td style="border: 1px solid #ddd; padding: 8px;">${row[col.key] ?? ''}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.title || 'Report'}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${options.title || 'Report'}</h1>
      ${options.dateRange?.from && options.dateRange?.to ? `<p class="subtitle">${formatDate(options.dateRange.from)} to ${formatDate(options.dateRange.to)}</p>` : ''}
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <p class="footer">Generated on ${formatDate(new Date())}</p>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
