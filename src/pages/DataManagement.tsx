import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Database, Users, Building2, ArrowLeft, RefreshCw, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Lab {
  id: string;
  name: string;
  initials: string;
  location: string | null;
  organization_id: string | null;
}

interface DataStats {
  patients: number;
  bills: number;
  test_reports: number;
  documents: number;
  followups: number;
  feedback: number;
  test_types: number;
}

interface ClearOptions {
  clear_payments: boolean;
  clear_bills: boolean;
  clear_test_reports: boolean;
  clear_documents: boolean;
  clear_followups: boolean;
  clear_feedback: boolean;
  clear_patients: boolean;
  clear_sequences: boolean;
  clear_test_types: boolean;
}

export default function DataManagement() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [dataStats, setDataStats] = useState<Record<string, DataStats>>({});
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmLabName, setConfirmLabName] = useState("");
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const [clearOptions, setClearOptions] = useState<ClearOptions>({
    clear_payments: true,
    clear_bills: true,
    clear_test_reports: true,
    clear_documents: true,
    clear_followups: true,
    clear_feedback: true,
    clear_patients: true,
    clear_sequences: true,
    clear_test_types: false,
  });
  const [clearLogs, setClearLogs] = useState<any[]>([]);

  // When patients is selected, all dependent data must be cleared
  const handleOptionChange = (field: keyof ClearOptions, value: boolean) => {
    if (field === 'clear_patients' && value) {
      // If patients is being checked, check all dependent data
      setClearOptions(prev => ({
        ...prev,
        clear_patients: true,
        clear_payments: true,
        clear_bills: true,
        clear_test_reports: true,
        clear_documents: true,
        clear_followups: true,
        clear_feedback: true,
      }));
    } else if (field === 'clear_patients' && !value) {
      // Allow unchecking patients
      setClearOptions(prev => ({ ...prev, clear_patients: false }));
    } else {
      setClearOptions(prev => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    checkAuth();
    fetchLabs();
    fetchClearLogs();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only super admins can access this page",
        variant: "destructive",
      });
      navigate("/super-admin");
    }
  };

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from("labs")
        .select("*")
        .order("name");

      if (error) throw error;
      setLabs(data || []);

      // Fetch data stats for each lab
      const stats: Record<string, DataStats> = {};
      for (const lab of data || []) {
        stats[lab.id] = await fetchLabStats(lab.id);
      }
      setDataStats(stats);
    } catch (error) {
      console.error("Error fetching labs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch labs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLabStats = async (labId: string): Promise<DataStats> => {
    const [
      patients,
      bills,
      test_reports,
      documents,
      followups,
      feedback,
      test_types
    ] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact" }).eq("lab_id", labId),
      supabase.from("bills").select("id", { count: "exact" }).eq("lab_id", labId),
      supabase.from("test_reports").select("id", { count: "exact" }).eq("lab_id", labId),
      supabase.from("documents").select("id", { count: "exact" }).eq("lab_id", labId),
      supabase.from("patient_followups").select("id", { count: "exact" }).eq("lab_id", labId),
      supabase.from("feedback").select("id", { count: "exact" }).eq("lab_id", labId),
      supabase.from("test_types").select("id", { count: "exact" }).eq("lab_id", labId),
    ]);

    return {
      patients: patients.count || 0,
      bills: bills.count || 0,
      test_reports: test_reports.count || 0,
      documents: documents.count || 0,
      followups: followups.count || 0,
      feedback: feedback.count || 0,
      test_types: test_types.count || 0,
    };
  };

  const fetchClearLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("data_clear_logs")
        .select("*")
        .order("cleared_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setClearLogs(data || []);
    } catch (error) {
      console.error("Error fetching clear logs:", error);
    }
  };

  const handleClearData = async () => {
    if (!selectedLab || confirmLabName !== selectedLab.name) return;

    setClearing(true);
    setClearProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setClearProgress(20);

      // Call the clear_lab_data function
      const { data, error } = await supabase.rpc("clear_lab_data", {
        p_lab_id: selectedLab.id,
        p_clear_payments: clearOptions.clear_payments,
        p_clear_bills: clearOptions.clear_bills,
        p_clear_test_reports: clearOptions.clear_test_reports,
        p_clear_documents: clearOptions.clear_documents,
        p_clear_followups: clearOptions.clear_followups,
        p_clear_feedback: clearOptions.clear_feedback,
        p_clear_patients: clearOptions.clear_patients,
        p_clear_sequences: clearOptions.clear_sequences,
        p_clear_test_types: clearOptions.clear_test_types,
      });

      setClearProgress(60);

      if (error) throw error;

      // Log the operation
      const { error: logError } = await supabase
        .from("data_clear_logs")
        .insert({
          lab_id: selectedLab.id,
          lab_name: selectedLab.name,
          cleared_by: user.id,
          deleted_counts: data as any,
          options: clearOptions as any,
        });

      setClearProgress(80);

      if (logError) console.error("Error logging clear operation:", logError);

      // Clear storage files if documents were cleared
      if (clearOptions.clear_documents && data && (data as any).documents > 0) {
        try {
          const { data: files } = await supabase.storage
            .from("lab-files")
            .list(`${selectedLab.id}/`);

          if (files && files.length > 0) {
            const filePaths = files.map(file => `${selectedLab.id}/${file.name}`);
            await supabase.storage.from("lab-files").remove(filePaths);
          }
        } catch (storageError) {
          console.error("Error clearing storage files:", storageError);
        }
      }

      setClearProgress(100);

      toast({
        title: "Data Cleared Successfully",
        description: `Cleared data for ${selectedLab.name}. Deleted: ${(data as any).patients} patients, ${(data as any).bills} bills, ${(data as any).test_reports} test reports, and more.`,
      });

      // Refresh stats
      const updatedStats = await fetchLabStats(selectedLab.id);
      setDataStats(prev => ({ ...prev, [selectedLab.id]: updatedStats }));

      // Reset form
      setSelectedLab(null);
      setConfirmLabName("");
      setShowFinalConfirm(false);
      setClearOptions({
        clear_payments: true,
        clear_bills: true,
        clear_test_reports: true,
        clear_documents: true,
        clear_followups: true,
        clear_feedback: true,
        clear_patients: true,
        clear_sequences: true,
        clear_test_types: false,
      });

      fetchClearLogs();
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
      setClearProgress(0);
    }
  };

  const getTotalRecords = (stats: DataStats) => {
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/super-admin")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
              <p className="text-muted-foreground mt-1">Manage and clear lab data</p>
            </div>
          </div>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Super Admin Only
          </Badge>
        </div>

        <Alert className="mb-6 border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">
            <strong>Warning:</strong> Data clearing is permanent and cannot be undone. All selected data will be permanently deleted. User accounts and organization structure will be preserved.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="labs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="labs">Labs Data</TabsTrigger>
            <TabsTrigger value="logs">Clear History</TabsTrigger>
          </TabsList>

          <TabsContent value="labs" className="space-y-4">
            <ScrollArea className="h-[600px]">
              <div className="grid gap-4">
                {loading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : labs.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No labs found</p>
                    </CardContent>
                  </Card>
                ) : (
                  labs.map((lab) => {
                    const stats = dataStats[lab.id] || {} as DataStats;
                    const totalRecords = stats.patients !== undefined ? getTotalRecords(stats) : 0;

                    return (
                      <Card key={lab.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {lab.name}
                              </CardTitle>
                              <CardDescription>
                                {lab.initials} • {lab.location || "No location"}
                              </CardDescription>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setSelectedLab(lab)}
                                  disabled={totalRecords === 0}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Clear Data
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive">
                                    Clear Data for {lab.name}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action is permanent and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                {!showFinalConfirm ? (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Select data to clear:</Label>
                                      {clearOptions.clear_patients && (
                                        <Alert className="border-warning bg-warning/10">
                                          <AlertTriangle className="h-4 w-4 text-warning" />
                                          <AlertDescription className="text-sm">
                                            <strong>Important:</strong> Clearing patients will automatically delete ALL related data from ANY lab that references these patients, including:
                                            <ul className="mt-2 ml-4 list-disc text-xs">
                                              <li>Test reports from other labs referencing these patients</li>
                                              <li>Documents from other labs referencing these patients</li>
                                              <li>Bills and payments from other labs</li>
                                              <li>Follow-ups and feedback from other labs</li>
                                            </ul>
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                      <div className="space-y-2 border rounded-lg p-4">
                                        {Object.entries({
                                          clear_patients: `Patients (${stats.patients || 0})`,
                                          clear_bills: `Bills (${stats.bills || 0})`,
                                          clear_test_reports: `Test Reports (${stats.test_reports || 0})`,
                                          clear_documents: `Documents (${stats.documents || 0})`,
                                          clear_followups: `Follow-ups (${stats.followups || 0})`,
                                          clear_feedback: `Feedback (${stats.feedback || 0})`,
                                          clear_test_types: `Test Types (${stats.test_types || 0})`,
                                        }).map(([key, label]) => {
                                          const isDependent = ['clear_bills', 'clear_test_reports', 'clear_documents', 'clear_followups', 'clear_feedback', 'clear_payments'].includes(key);
                                          const isDisabled = clearOptions.clear_patients && isDependent;
                                          
                                          return (
                                            <div key={key} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={key}
                                                checked={clearOptions[key as keyof ClearOptions]}
                                                onCheckedChange={(checked) => handleOptionChange(key as keyof ClearOptions, checked as boolean)}
                                                disabled={isDisabled}
                                              />
                                              <Label 
                                                htmlFor={key} 
                                                className={`text-sm cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                                              >
                                                {label}
                                                {isDisabled && <span className="ml-2 text-xs text-muted-foreground">(required when clearing patients)</span>}
                                              </Label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="confirm-name">
                                        Type "{lab.name}" to confirm:
                                      </Label>
                                      <Input
                                        id="confirm-name"
                                        value={confirmLabName}
                                        onChange={(e) => setConfirmLabName(e.target.value)}
                                        placeholder="Enter lab name"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <Alert className="border-destructive">
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>
                                        <strong>Final Confirmation</strong>
                                        <br />
                                        You are about to permanently delete all selected data for {lab.name}.
                                        This action cannot be reversed.
                                      </AlertDescription>
                                    </Alert>

                                    {clearing && (
                                      <div className="space-y-2">
                                        <Progress value={clearProgress} />
                                        <p className="text-sm text-center text-muted-foreground">
                                          Clearing data... {clearProgress}%
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => {
                                      setSelectedLab(null);
                                      setConfirmLabName("");
                                      setShowFinalConfirm(false);
                                    }}
                                    disabled={clearing}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  {!showFinalConfirm ? (
                                    <Button
                                      variant="destructive"
                                      onClick={() => setShowFinalConfirm(true)}
                                      disabled={confirmLabName !== lab.name || !Object.values(clearOptions).some(v => v)}
                                    >
                                      Continue
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="destructive"
                                      onClick={handleClearData}
                                      disabled={clearing}
                                    >
                                      {clearing ? "Clearing..." : "Delete All Data"}
                                    </Button>
                                  )}
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Patients</p>
                              <p className="text-2xl font-bold">{stats.patients || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Bills</p>
                              <p className="text-2xl font-bold">{stats.bills || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Test Reports</p>
                              <p className="text-2xl font-bold">{stats.test_reports || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Documents</p>
                              <p className="text-2xl font-bold">{stats.documents || 0}</p>
                            </div>
                          </div>
                          {totalRecords === 0 && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              No data to clear
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clear History</CardTitle>
                <CardDescription>Recent data clearing operations</CardDescription>
              </CardHeader>
              <CardContent>
                {clearLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No clearing operations yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clearLogs.map((log) => (
                      <Card key={log.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <p className="font-medium">{log.lab_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Cleared on {new Date(log.cleared_at).toLocaleString()}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(log.deleted_counts || {}).map(([type, count]) => (
                                  (count as any) > 0 && (
                                    <Badge key={type} variant="secondary">
                                      {type}: {count as any}
                                    </Badge>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}