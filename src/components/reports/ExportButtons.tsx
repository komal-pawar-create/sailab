import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ExportButtons({
  onExportExcel,
  onExportPDF,
  onPrint,
  loading = false,
  disabled = false,
}: ExportButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportExcel}
        disabled={disabled || loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {t('app.export.excel')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPDF}
        disabled={disabled || loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {t('app.export.pdf')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        disabled={disabled || loading}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        {t('app.export.print')}
      </Button>
    </div>
  );
}
