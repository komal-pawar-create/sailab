import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Receipt, Phone, Calendar, User, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

interface MobilePatientCardProps {
  patient: Patient;
  onAddReport: (patient: Patient) => void;
  onAddBill: (patient: Patient) => void;
  onDeletePatient?: (patient: Patient) => void;
  canDeletePatient?: boolean;
}

export const MobilePatientCard = memo(function MobilePatientCard({
  patient,
  onAddReport,
  onAddBill,
  onDeletePatient,
  canDeletePatient = false,
}: MobilePatientCardProps) {
  const navigate = useNavigate();

  const formatAge = (patient: Patient) => {
    if (patient.age_in_months && patient.age_in_months < 12) {
      return `${patient.age_in_months} months`;
    }
    return patient.age ? `${patient.age} years` : "-";
  };

  return (
    <Card className="touch-manipulation active:scale-[0.98] transition-transform">
      <CardContent className="p-4 space-y-3">
        {/* Header with patient info */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{patient.full_name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{patient.patient_id}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {formatAge(patient)}/{patient.gender?.charAt(0).toUpperCase() || "-"}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-mono">{patient.phone}</span>
          </div>
          {patient.referred_by_doctor_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Dr. {patient.referred_by_doctor_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Registered {formatDate(patient.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10"
            onClick={() => navigate(`/patient/${patient.id}`)}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10"
            onClick={() => onAddReport(patient)}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10"
            onClick={() => onAddBill(patient)}
          >
            <Receipt className="h-4 w-4 mr-1.5" />
            Bill
          </Button>
          {canDeletePatient && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 h-10"
              onClick={() => onDeletePatient?.(patient)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

interface MobileCardViewProps {
  patients: Patient[];
  onAddReport: (patient: Patient) => void;
  onAddBill: (patient: Patient) => void;
  onDeletePatient?: (patient: Patient) => void;
  canDeletePatient?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const MobileCardView = memo(function MobileCardView({
  patients,
  onAddReport,
  onAddBill,
  onDeletePatient,
  canDeletePatient = false,
  isLoading = false,
  emptyMessage = "No patients found",
}: MobileCardViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <MobilePatientCard
          key={patient.id}
          patient={patient}
          onAddReport={onAddReport}
          onAddBill={onAddBill}
          onDeletePatient={onDeletePatient}
          canDeletePatient={canDeletePatient}
        />
      ))}
    </div>
  );
});
