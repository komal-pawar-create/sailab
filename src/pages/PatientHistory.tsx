import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Download, FileText, Calendar, DollarSign, ClipboardList, User, Search, Clock, Star, ArrowLeft } from "lucide-react";
import PatientOverview from "@/components/patient-history/PatientOverview";
import PatientTestReports from "@/components/patient-history/PatientTestReports";
import PatientDocuments from "@/components/patient-history/PatientDocuments";
import PatientBills from "@/components/patient-history/PatientBills";
import PatientPayments from "@/components/patient-history/PatientPayments";
import PatientFollowups from "@/components/patient-history/PatientFollowups";
import PatientTimeline from "@/components/patient-history/PatientTimeline";

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
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  // Auto-select patient from URL param
  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [patientId, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      // Check if user is a branch operator (operator_1, operator_2, operator_3)
      const isBranchOperator = profile && ['operator_1', 'operator_2', 'operator_3'].includes(profile.role);
      
      if (isBranchOperator && profile?.branch_id) {
        // Branch operators only see patients from their branch
        query = query.eq("branch_id", profile.branch_id);
      }
      // Lab admins will see all organizational data via RLS policies
      
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

  const filteredPatients = patients.filter(patient => 
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Patient History</h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, ID, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedPatient?.id || ""}
                onValueChange={(value) => {
                  const patient = patients.find(p => p.id === value);
                  setSelectedPatient(patient || null);
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{patient.full_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {patient.patient_id}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPatient && (
              <div className="flex flex-col gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedPatient.full_name}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>ID: {selectedPatient.patient_id}</span>
                      {selectedPatient.phone && <span>Phone: {selectedPatient.phone}</span>}
                      {selectedPatient.age_in_months ? (
                        <span>Age: {selectedPatient.age_in_months < 24 
                          ? `${selectedPatient.age_in_months} months` 
                          : `${Math.floor(selectedPatient.age_in_months / 12)} years`}
                        </span>
                      ) : selectedPatient.age && (
                        <span>Age: {selectedPatient.age} years</span>
                      )}
                      {selectedPatient.gender && <span>Gender: {selectedPatient.gender}</span>}
                    </div>
                  </div>
                </div>
                {selectedPatient.patient_history && (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">History:</span>
                    <p className="mt-1 text-foreground">{selectedPatient.patient_history}</p>
                  </div>
                )}
                {(selectedPatient.referred_by_doctor_name || selectedPatient.referred_by_doctor_phone) && (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Referred by:</span>
                    <div className="mt-1 text-foreground">
                      {selectedPatient.referred_by_doctor_name && <p>{selectedPatient.referred_by_doctor_name}</p>}
                      {selectedPatient.referred_by_doctor_phone && <p>{selectedPatient.referred_by_doctor_phone}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Data Tabs */}
        {selectedPatient ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="test-reports">Test Reports</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <PatientOverview patient={selectedPatient} />
            </TabsContent>
            
            <TabsContent value="test-reports">
              <PatientTestReports patientId={selectedPatient.id} />
            </TabsContent>
            
            <TabsContent value="documents">
              <PatientDocuments 
                patientId={selectedPatient.id} 
                patientName={selectedPatient.full_name}
                doctorPhone={selectedPatient.referred_by_doctor_phone}
              />
            </TabsContent>
            
            <TabsContent value="bills">
              <PatientBills patientId={selectedPatient.id} />
            </TabsContent>
            
            <TabsContent value="payments">
              <PatientPayments patientId={selectedPatient.id} />
            </TabsContent>
            
            <TabsContent value="followups">
              <PatientFollowups patientId={selectedPatient.id} />
            </TabsContent>
            
            <TabsContent value="timeline">
              <PatientTimeline patientId={selectedPatient.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mb-4" />
              <p className="text-lg">Select a patient to view their history</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}