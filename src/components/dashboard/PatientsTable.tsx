import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, FileText, Receipt, Search, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddTestReportForm } from "@/components/forms/AddTestReportForm";
import { AddBillForm } from "@/components/forms/AddBillForm";
import { AddPatientForm } from "@/components/forms/AddPatientForm";
import { TablePagination } from "./TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCardView } from "./MobileCardView";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  age: number | null;
  age_in_months: number | null;
  gender: string | null;
  phone: string;
  referred_by_doctor_name: string | null;
  created_at: string;
}

interface PatientsTableProps {
  patients: Patient[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (search: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function PatientsTable({ 
  patients, 
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRefresh,
  isLoading = false 
}: PatientsTableProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);

  const canDeletePatient = profile?.role === 'admin' || profile?.role === 'lab_admin';
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const formatAge = (patient: Patient) => {
    if (patient.age_in_months && patient.age_in_months < 12) {
      return `${patient.age_in_months}m`;
    }
    return patient.age ? `${patient.age}y` : "-";
  };

  const handleAddReport = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowReportForm(true);
  };

  const handleAddBill = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowBillForm(true);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete || !canDeletePatient) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientToDelete.id);

    setIsDeleting(false);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Patient deleted",
      description: `${patientToDelete.full_name} has been removed from the system.`,
    });
    setPatientToDelete(null);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-11"
            inputMode="search"
          />
        </div>
        <AddPatientForm onPatientAdded={onRefresh} />
      </div>

      {/* Mobile Card View */}
      {isMobile ? (
        <MobileCardView
          patients={patients}
          onAddReport={handleAddReport}
          onAddBill={handleAddBill}
          onDeletePatient={setPatientToDelete}
          canDeletePatient={canDeletePatient}
          isLoading={isLoading}
        />
      ) : (
        /* Desktop Table View */
        <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[80px]">Age/Sex</TableHead>
              <TableHead className="w-[120px]">Phone</TableHead>
              <TableHead>Referring Doctor</TableHead>
              <TableHead className="w-[100px]">Registered</TableHead>
              <TableHead className="w-[240px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{patient.patient_id}</TableCell>
                  <TableCell className="font-medium">{patient.full_name}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatAge(patient)}/{patient.gender?.charAt(0).toUpperCase() || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{patient.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {patient.referred_by_doctor_name || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(patient.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/patient/${patient.id}`)}
                        title="View History"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddReport(patient)}
                        className="h-8 text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Report
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddBill(patient)}
                        className="h-8 text-xs"
                      >
                        <Receipt className="h-3 w-3 mr-1" />
                        Bill
                      </Button>
                      {canDeletePatient && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setPatientToDelete(patient)}
                          className="h-8 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      )}

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />

      {/* Add Report Dialog */}
      <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Test Report for {selectedPatient?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <AddTestReportForm
              preSelectedPatientId={selectedPatient.id}
              onReportAdded={() => {
                setShowReportForm(false);
                setSelectedPatient(null);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bill Dialog */}
      <Dialog open={showBillForm} onOpenChange={setShowBillForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bill for {selectedPatient?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <AddBillForm
              preSelectedPatientId={selectedPatient.id}
              onBillAdded={() => {
                setShowBillForm(false);
                setSelectedPatient(null);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && !isDeleting && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patientToDelete?.full_name} ({patientToDelete?.patient_id}) and related
              patient records such as bills, reports, documents, follow-ups, and feedback where linked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete patient"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
