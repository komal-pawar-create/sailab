import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Phone, Calendar, Info, X } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  phone?: string;
  age?: number;
  age_in_months?: number;
  gender?: string;
  patient_history?: string;
  referred_by_doctor_name?: string;
  referred_by_doctor_phone?: string;
  created_at: string;
}

interface PatientBadgeProps {
  patient: Patient;
  onClear?: () => void;
}

export default function PatientBadge({ patient, onClear }: PatientBadgeProps) {
  const getAge = () => {
    if (patient.age_in_months) {
      return patient.age_in_months < 24
        ? `${patient.age_in_months}mo`
        : `${Math.floor(patient.age_in_months / 12)}y`;
    }
    return patient.age ? `${patient.age}y` : null;
  };

  const age = getAge();
  const hasExtraInfo = patient.patient_history || patient.referred_by_doctor_name;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-full">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm leading-tight">{patient.full_name}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-mono">
              {patient.patient_id}
            </Badge>
            {patient.phone && (
              <span className="flex items-center gap-0.5">
                <Phone className="h-3 w-3" />
                {patient.phone}
              </span>
            )}
            {age && (
              <span>
                {age} {patient.gender ? `• ${patient.gender}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasExtraInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2 text-xs">
                {patient.patient_history && (
                  <div>
                    <span className="font-medium">History:</span>
                    <p className="text-muted-foreground">{patient.patient_history}</p>
                  </div>
                )}
                {patient.referred_by_doctor_name && (
                  <div>
                    <span className="font-medium">Referred by:</span>
                    <p className="text-muted-foreground">
                      {patient.referred_by_doctor_name}
                      {patient.referred_by_doctor_phone && ` (${patient.referred_by_doctor_phone})`}
                    </p>
                  </div>
                )}
                <div className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Registered: {format(new Date(patient.created_at), "PP")}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {onClear && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-auto"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
