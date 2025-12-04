import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus, FileText, Receipt, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddTestReportForm } from "@/components/forms/AddTestReportForm";
import { AddBillForm } from "@/components/forms/AddBillForm";

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
  onRefresh: () => void;
}

export function PatientsTable({ patients, onRefresh }: PatientsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => navigate('/index')} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

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
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.slice(0, 50).map((patient) => (
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
                    {format(new Date(patient.created_at), "dd MMM yy")}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredPatients.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredPatients.length} patients. Use search to find specific patients.
        </p>
      )}

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
    </div>
  );
}
