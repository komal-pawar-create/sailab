import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

interface PatientSearchSelectProps {
  patients: Patient[];
  selectedPatientId: string;
  onPatientSelect: (patientId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showAnonymous?: boolean;
  required?: boolean;
}

export function PatientSearchSelect({
  patients,
  selectedPatientId,
  onPatientSelect,
  placeholder = "Select patient",
  disabled = false,
  showAnonymous = false,
  required = false,
}: PatientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const isAnonymous = selectedPatientId === "anonymous";

  // Filter patients based on search (by name or patient_id)
  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(search.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const displayValue = isAnonymous
    ? "Anonymous"
    : selectedPatient
    ? `${selectedPatient.full_name} (${selectedPatient.patient_id})`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className={cn(!selectedPatient && !isAnonymous && "text-muted-foreground")}>
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or ID..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No patients found.</CommandEmpty>
            <CommandGroup>
              {showAnonymous && (
                <CommandItem
                  value="anonymous"
                  onSelect={() => {
                    onPatientSelect("anonymous");
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isAnonymous ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Anonymous
                </CommandItem>
              )}
              {filteredPatients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => {
                    onPatientSelect(patient.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {patient.full_name} ({patient.patient_id})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
