import { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddPatientForm } from "@/components/forms/AddPatientForm";
import { AddTestReportForm } from "@/components/forms/AddTestReportForm";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { AddDocumentForm } from "@/components/forms/AddDocumentForm";
import { AddFollowupForm } from "@/components/forms/AddFollowupForm";

type DialogType = 'patient' | 'report' | 'bill' | 'document' | 'followup' | null;

interface GlobalActionsContextType {
  openDialog: (type: DialogType) => void;
  closeDialog: () => void;
}

const GlobalActionsContext = createContext<GlobalActionsContextType | undefined>(undefined);

export function GlobalActionsProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const openDialog = (type: DialogType) => setActiveDialog(type);
  const closeDialog = () => setActiveDialog(null);

  const handleSuccess = () => {
    closeDialog();
    // Dispatch event for dashboard refresh
    window.dispatchEvent(new CustomEvent('global-data-refresh'));
  };

  return (
    <GlobalActionsContext.Provider value={{ openDialog, closeDialog }}>
      {children}

      {/* Add Patient Dialog */}
      <Dialog open={activeDialog === 'patient'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <AddPatientForm onPatientAdded={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Add Test Report Dialog */}
      <Dialog open={activeDialog === 'report'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Test Report</DialogTitle>
          </DialogHeader>
          <AddTestReportForm onReportAdded={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Create Bill Dialog */}
      <Dialog open={activeDialog === 'bill'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bill</DialogTitle>
          </DialogHeader>
          <AddBillForm onBillAdded={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={activeDialog === 'document'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <AddDocumentForm onDocumentAdded={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Add Follow-up Dialog */}
      <Dialog open={activeDialog === 'followup'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Follow-up</DialogTitle>
          </DialogHeader>
          <AddFollowupForm onFollowupAdded={handleSuccess} />
        </DialogContent>
      </Dialog>
    </GlobalActionsContext.Provider>
  );
}

export function useGlobalActions() {
  const context = useContext(GlobalActionsContext);
  if (!context) {
    throw new Error('useGlobalActions must be used within a GlobalActionsProvider');
  }
  return context;
}
