import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, UserPlus, TestTube, FileText, Receipt, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddPatientForm } from "@/components/forms/AddPatientForm";
import { AddTestReportForm } from "@/components/forms/AddTestReportForm";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { AddDocumentForm } from "@/components/forms/AddDocumentForm";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);

  const actions = [
    {
      label: t('app.quickActions.newPatient'),
      icon: UserPlus,
      onClick: () => setShowPatientDialog(true),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: t('app.quickActions.newTest'),
      icon: TestTube,
      onClick: () => setShowTestDialog(true),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: t('app.quickActions.newBill'),
      icon: Receipt,
      onClick: () => setShowBillDialog(true),
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: t('app.quickActions.uploadDoc'),
      icon: FileText,
      onClick: () => setShowDocumentDialog(true),
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      label: t('app.common.search'),
      icon: Search,
      onClick: () => {
        // Trigger command palette
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        window.dispatchEvent(event);
      },
      color: "bg-gray-500 hover:bg-gray-600",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 mr-4">
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{t('app.quickActions.title')}</span>
        </div>
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            className={`${action.color} text-white`}
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </div>

      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('app.quickActions.addPatient')}</DialogTitle>
          </DialogHeader>
          <AddPatientForm onPatientAdded={() => {
            setShowPatientDialog(false);
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('app.quickActions.addTestReport')}</DialogTitle>
          </DialogHeader>
          <AddTestReportForm onReportAdded={() => {
            setShowTestDialog(false);
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('app.quickActions.createBill')}</DialogTitle>
          </DialogHeader>
          <AddBillForm onBillAdded={() => {
            setShowBillDialog(false);
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('app.quickActions.uploadDocument')}</DialogTitle>
          </DialogHeader>
          <AddDocumentForm onDocumentAdded={() => {
            setShowDocumentDialog(false);
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>
    </>
  );
}
