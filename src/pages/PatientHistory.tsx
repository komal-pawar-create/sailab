import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRecentPatients } from "@/hooks/useRecentPatients";
import { Search, FileText, IndianRupee, Clock, Activity, ArrowLeft, User, ChevronDown, Beaker, Pencil } from "lucide-react";
import QuickStatsBar from "@/components/patient-history/QuickStatsBar";
import PatientBadge from "@/components/patient-history/PatientBadge";
import PatientReportsTab from "@/components/patient-history/PatientReportsTab";
import PatientBills from "@/components/patient-history/PatientBills";
import PatientFollowups from "@/components/patient-history/PatientFollowups";
import PatientTimeline from "@/components/patient-history/PatientTimeline";
import QuickActions from "@/components/patient-history/QuickActions";
import PatientHistoryExport from "@/components/patient-history/PatientHistoryExport";
import PatientSamples from "@/components/patient-history/PatientSamples";
import PatientHistoryTour from "@/components/patient-history/PatientHistoryTour";
import { EditPatientDialog, EditablePatient } from "@/components/forms/EditPatientDialog";
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
  patient_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  age?: number;
  age_in_months?: number;
  gender?: string;
  patient_history?: string;
  referred_by_doctor_name?: string;
  referred_by_doctor_phone?: string;
  lab_id: string;
  branch_id?: string;
  created_at: string;
}

export default function PatientHistory() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("reports");
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { addRecentPatient } = useRecentPatients();
  const canEditPatient = !!profile?.role && ['admin', 'lab_admin', 'branch_operator', 'operator_1', 'operator_2', 'operator_3'].includes(profile.role);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handlePatientUpdated = (updatedPatient: EditablePatient) => {
    setPatients((prev) => prev.map((patient) => patient.id === updatedPatient.id ? { ...patient, ...updatedPatient } : patient));
    setSelectedPatient((prev) => prev?.id === updatedPatient.id ? { ...prev, ...updatedPatient } : prev);
    handleDataRefresh();
    fetchPatients();
  };

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [patientId, patients]);

  // Track recently viewed patients
  useEffect(() => {
    if (selectedPatient) {
      addRecentPatient({
        id: selectedPatient.id,
        patient_id: selectedPatient.patient_id,
        full_name: selectedPatient.full_name,
        phone: selectedPatient.phone,
      });
    }
  }, [selectedPatient?.id, addRecentPatient]);

  // Keyboard shortcuts for tab navigation (Alt+1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPatient || !e.altKey) return;
      
      const tabMap: Record<string, string> = {
        "1": "reports",
        "2": "billing",
        "3": "followups",
        "4": "activity",
      };
      
      if (tabMap[e.key]) {
        e.preventDefault();
        setActiveTab(tabMap[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPatient]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      const isBranchOperator =
        profile && ["operator_1", "operator_2", "operator_3"].includes(profile.role);

      if (isBranchOperator && profile?.branch_id) {
        query = query.eq("branch_id", profile.branch_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone?.includes(searchQuery)
  );

  const handleStatClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patient History</h1>
        <div className="flex items-center gap-2">
          {selectedPatient && (
            <>
              {canEditPatient && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Patient
                </Button>
              )}
              <div data-tour="export-pdf">
                <PatientHistoryExport patient={selectedPatient} />
              </div>
              <div data-tour="quick-actions">
                <QuickActions patientId={selectedPatient.id} onDataChanged={handleDataRefresh} />
              </div>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Patient History Tour */}
      <PatientHistoryTour hasPatientSelected={!!selectedPatient} />

      {/* Patient Search + Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3" data-tour="patient-search">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full sm:w-[280px] justify-between"
            >
              {selectedPatient ? (
                <span className="truncate">{selectedPatient.full_name}</span>
              ) : (
                <span className="text-muted-foreground">Search patient...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search by name, ID, phone..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No patient found.</CommandEmpty>
                <CommandGroup>
                  {filteredPatients.slice(0, 50).map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={`${patient.full_name} ${patient.patient_id} ${patient.phone || ""}`}
                      onSelect={() => {
                        setSelectedPatient(patient);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{patient.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {patient.patient_id} {patient.phone && `• ${patient.phone}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedPatient && (
          <PatientBadge
            patient={selectedPatient}
            onClear={() => setSelectedPatient(null)}
          />
        )}
      </div>

      {/* Quick Stats Bar */}
      {selectedPatient && (
        <div data-tour="quick-stats">
          <QuickStatsBar patientId={selectedPatient.id} onStatClick={handleStatClick} key={`stats-${refreshKey}`} />
        </div>
      )}

      {/* Consolidated 4 Tabs */}
      {selectedPatient ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex">
            <TabsTrigger value="reports" className="gap-1.5 text-xs sm:text-sm" data-tour="ph-reports-tab">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm" data-tour="ph-billing-tab">
              <IndianRupee className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="followups" className="gap-1.5 text-xs sm:text-sm" data-tour="ph-followups-tab">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Follow-ups</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="samples" className="gap-1.5 text-xs sm:text-sm">
              <Beaker className="h-4 w-4" />
              <span className="hidden sm:inline">Samples</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="reports" className="m-0">
              <PatientReportsTab
                key={`reports-${refreshKey}`}
                patientId={selectedPatient.id}
                patientName={selectedPatient.full_name}
                doctorName={selectedPatient.referred_by_doctor_name}
                doctorPhone={selectedPatient.referred_by_doctor_phone}
              />
            </TabsContent>

            <TabsContent value="billing" className="m-0">
              <PatientBills patientId={selectedPatient.id} key={`bills-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="followups" className="m-0">
              <PatientFollowups patientId={selectedPatient.id} key={`followups-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="activity" className="m-0">
              <PatientTimeline patientId={selectedPatient.id} key={`timeline-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="samples" className="m-0">
              <PatientSamples patientId={selectedPatient.id} key={`samples-${refreshKey}`} />
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-lg font-medium">Select a patient</p>
            <p className="text-sm">Search and select a patient to view their history</p>
          </CardContent>
        </Card>
      )}

      <EditPatientDialog
        patient={selectedPatient}
        open={editOpen}
        onOpenChange={setEditOpen}
        onPatientUpdated={handlePatientUpdated}
      />
    </div>
  );
}
