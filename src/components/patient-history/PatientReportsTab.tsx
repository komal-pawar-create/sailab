import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Download, FileText, FileImage, File, RefreshCw, Layers, MessageCircle, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWhatsAppShare } from "@/hooks/useWhatsAppShare";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TestReport {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  created_at: string;
  department?: string | null;
  pdf_url?: string | null;
  report_number?: string | null;
}

interface Document {
  id: string;
  lab_id: string;
  branch_id: string | null;
  file_name: string;
  file_type: string;
  file_path: string | null;
  file_size: number | null;
  created_at: string;
}

interface DocumentTemplate {
  id: string;
  original_document_id: string;
  generated_pdf_url: string | null;
}

interface PatientReportsTabProps {
  patientId: string;
  patientName?: string;
  doctorName?: string;
  doctorPhone?: string;
}

type ShareRecipient = "patient" | "doctor";

interface ShareTarget {
  testName: string;
  reportDate?: string;
  recipient: ShareRecipient;
}

export default function PatientReportsTab({ patientId, patientName, doctorName, doctorPhone }: PatientReportsTabProps) {
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Record<string, DocumentTemplate>>({});
  const [loading, setLoading] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const [latestBillId, setLatestBillId] = useState<string | null>(null);
  const [patientPhone, setPatientPhone] = useState<string | null>(null);
  const [labName, setLabName] = useState<string>("");
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { sending, sendReportLink, buildTrackingUrl } = useWhatsAppShare();

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, docsRes, billRes, patientRes] = await Promise.all([
        supabase
          .from("test_reports")
          .select("*")
          .eq("patient_id", patientId)
          .order("test_date", { ascending: false }),
        supabase
          .from("documents")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("bills")
          .select("id")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("patients")
          .select("phone")
          .eq("id", patientId)
          .maybeSingle(),
      ]);

      setTestReports(testsRes.data || []);
      setDocuments(docsRes.data || []);
      setLatestBillId(billRes.data?.id ?? null);
      setPatientPhone(patientRes.data?.phone ?? null);

      // Resolve a friendly lab/branch name for the WhatsApp template
      if (profile?.branch_id || profile?.lab_id) {
        const [branchRes, labRes] = await Promise.all([
          profile?.branch_id
            ? supabase.from("branches").select("name").eq("id", profile.branch_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
          profile?.lab_id
            ? supabase.from("labs").select("name").eq("id", profile.lab_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);
        setLabName(branchRes.data?.name || labRes.data?.name || "");
      }

      // Fetch templates for documents
      if (docsRes.data && docsRes.data.length > 0) {
        const docIds = docsRes.data.map((d) => d.id);
        const { data: templateData } = await supabase
          .from("document_templates")
          .select("*")
          .in("original_document_id", docIds);

        const templateMap: Record<string, DocumentTemplate> = {};
        templateData?.forEach((t) => {
          if (t.original_document_id) {
            templateMap[t.original_document_id] = t;
          }
        });
        setTemplates(templateMap);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async (target: ShareTarget) => {
    if (!latestBillId) return;

    if (target.recipient === "doctor") {
      await sendReportLink({
        patientPhone,
        patientName: patientName || "Patient",
        testName: target.testName,
        billId: latestBillId,
        labName,
        recipientPhone: doctorPhone,
        recipientName: doctorName || "Doctor",
        recipientType: "doctor",
        missingPhoneMessage: "Doctor's WhatsApp number is not available. Please add the doctor's mobile number first.",
        invalidPhoneMessage: "Doctor's WhatsApp number is invalid. Please update the doctor's mobile number.",
        successMessage: `WhatsApp sent to Dr. ${doctorName || "Doctor"}`,
      });
      setShareTarget(null);
      return;
    }

    await sendReportLink({
      patientPhone,
      patientName: patientName || "Patient",
      testName: target.testName,
      billId: latestBillId,
      labName,
    });
    setShareTarget(null);
  };

  const downloadTestReport = async (report: TestReport) => {
    try {
      if (report.pdf_url) {
        window.open(report.pdf_url, "_blank", "noopener,noreferrer");
        return;
      }

      if ((report.department || "pathology") === "pathology") {
        const { data, error } = await supabase.functions.invoke("generate-pathology-report-pdf", {
          body: { reportId: report.id },
        });
        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "PDF generation failed");
        }
        window.open(data.pdfUrl, "_blank", "noopener,noreferrer");
        fetchData();
        return;
      }

      if (report.results?.file_path) {
        const { data, error } = await supabase.storage
          .from("lab-files")
          .download(report.results.file_path);
        if (error) throw error;
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = `test_report_${report.test_type}_${format(new Date(report.test_date), "yyyy-MM-dd")}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        toast({ title: "No file", description: "No PDF or uploaded file is available for this report yet." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to download", variant: "destructive" });
    }
  };

  const downloadDocument = async (doc: Document, withLetterhead = false) => {
    try {
      if (withLetterhead && templates[doc.id]?.generated_pdf_url) {
        const a = document.createElement("a");
        a.href = templates[doc.id].generated_pdf_url!;
        a.download = `letterhead_${doc.file_name.replace(/\.[^/.]+$/, ".pdf")}`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (doc.file_path) {
        const { data, error } = await supabase.storage.from("lab-files").download(doc.file_path);
        if (error) throw error;
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = doc.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to download", variant: "destructive" });
    }
  };

  const getPublicAssetUrl = (urlOrPath?: string | null) => {
    if (!urlOrPath) return null;
    if (urlOrPath.startsWith("http")) return urlOrPath;

    const { data } = supabase.storage.from("lab-assets").getPublicUrl(urlOrPath);
    return data.publicUrl;
  };

  const generateLetterhead = async (doc: Document) => {
    if (!doc.file_path) {
      toast({ title: "Missing document", description: "Original document file is missing.", variant: "destructive" });
      return;
    }

    setProcessingDocs((prev) => new Set(prev).add(doc.id));

    try {
      let targetLabId = doc.lab_id || profile?.lab_id || null;
      const targetBranchId = doc.branch_id || profile?.branch_id || null;

      const [branchRes, labRes] = await Promise.all([
        targetBranchId
          ? supabase.from("branches").select("letterhead_url, logo_url, lab_id").eq("id", targetBranchId).maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        targetLabId
          ? supabase.from("labs").select("letterhead_url, logo_url").eq("id", targetLabId).maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
      ]);

      if (branchRes.error) throw branchRes.error;
      if (labRes.error) throw labRes.error;

      targetLabId = targetLabId || branchRes.data?.lab_id || null;
      if (!targetLabId) {
        toast({ title: "Missing lab", description: "Could not determine the lab for this document.", variant: "destructive" });
        return;
      }

      const letterheadUrl = getPublicAssetUrl(branchRes.data?.letterhead_url || labRes.data?.letterhead_url);
      const logoUrl = getPublicAssetUrl(branchRes.data?.logo_url || labRes.data?.logo_url);
      if (!letterheadUrl) {
        toast({
          title: "No letterhead",
          description: "Upload a branch or lab letterhead before generating the report.",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("lab-files").getPublicUrl(doc.file_path);

      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          documentId: doc.id,
          letterheadUrl,
          logoUrl,
          documentType: "general",
          originalFileUrl: publicUrl,
          fileName: doc.file_name,
          labId: targetLabId,
          branchId: targetBranchId,
        },
      });

      if (error) {
        throw error;
      }
      if (data?.success) {
        toast({ title: "Success", description: "Letterhead generated" });
        setTemplates((prev) => ({
          ...prev,
          [doc.id]: {
            id: data.templateId,
            original_document_id: doc.id,
            generated_pdf_url: data.generatedPdfUrl,
          },
        }));
        fetchData();
      }
    } catch (error: any) {
      let errorMessage = error.message || "Failed to generate letterhead";
      
      // Handle Supabase Edge Function error structure
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          if (body && body.message) errorMessage = body.message;
          else if (body && body.error) errorMessage = body.error;
        } catch (e) {
          // Fallback if not JSON
        }
      } else if (error.message === "Edge Function returned a non-2xx status code") {
          errorMessage = "Failed to process document. The document format might not be supported or is corrupted.";
      }

      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setProcessingDocs((prev) => {
        const s = new Set(prev);
        s.delete(doc.id);
        return s;
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return FileImage;
    if (fileType.includes("pdf")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const reportLink = latestBillId ? buildTrackingUrl(latestBillId) : "";
  const shareRecipientLabel = shareTarget?.recipient === "doctor"
    ? `Dr. ${doctorName || "Doctor"} (${doctorPhone || "not available"})`
    : `${patientName || "Patient"} (${patientPhone || "not available"})`;
  const sharePreviewMessage = shareTarget?.recipient === "doctor"
    ? `Hello Dr. ${doctorName || "Doctor"},\n\nPlease find the diagnostic report of patient ${patientName || "Patient"}, Patient ID: ${patientId}, dated ${shareTarget?.reportDate ? format(new Date(shareTarget.reportDate), "PP") : "N/A"}.\n\nReport: ${reportLink}\n\nRegards,\n${labName || "Your Lab"}`
    : `Dear ${(patientName || "Patient").split(" ")[0]},\nYour ${shareTarget?.testName ?? ""} report is ready.\nAccess your report securely here:\n${reportLink}\nPlease do not share this link with others for privacy reasons.\n${labName || "Your Lab"}\nThank you`;

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <>
    <Tabs defaultValue="tests" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="tests" className="gap-2">
          <FileText className="h-4 w-4" />
          Tests ({testReports.length})
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-2">
          <File className="h-4 w-4" />
          Documents ({documents.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tests">
        {testReports.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Report No.</TableHead>
                  <TableHead className="w-[140px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.test_type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(report.test_date), "PP")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "completed" ? "default" : report.status === "pending" ? "secondary" : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{report.report_number || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => downloadTestReport(report)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 dark:text-green-500 hover:bg-accent"
                                  disabled={!latestBillId || !patientPhone || sending || report.status !== "completed"}
                                  onClick={() => setShareTarget({ testName: report.test_type, reportDate: report.test_date, recipient: "patient" })}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!latestBillId
                                ? "Generate a bill first to create a tracking link"
                                : report.status !== "completed"
                                  ? "Complete the report before sharing"
                                  : !patientPhone
                                    ? "Patient has no phone number"
                                    : "Send to Patient"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-blue-600 dark:text-blue-500 hover:bg-accent"
                                  disabled={!latestBillId || !doctorPhone || sending || report.status !== "completed"}
                                  onClick={() => setShareTarget({ testName: report.test_type, reportDate: report.test_date, recipient: "doctor" })}
                                >
                                  <Stethoscope className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!latestBillId
                                ? "Generate a bill first to create a tracking link"
                                : report.status !== "completed"
                                  ? "Complete the report before sharing"
                                  : !doctorPhone
                                    ? "Doctor's WhatsApp number is not available"
                                    : "Send to Doctor"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">No test reports found</div>
        )}
      </TabsContent>

      <TabsContent value="documents">
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              const hasLetterhead = !!templates[doc.id]?.generated_pdf_url;
              const isProcessing = processingDocs.has(doc.id);

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {format(new Date(doc.created_at), "PP")}
                    </p>
                    {hasLetterhead && (
                      <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                        <Layers className="h-3 w-3 mr-1" />
                        Letterhead
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" disabled={isProcessing}>
                        {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                        <File className="h-4 w-4 mr-2" />
                        Original
                      </DropdownMenuItem>
                      {hasLetterhead ? (
                        <DropdownMenuItem onClick={() => downloadDocument(doc, true)}>
                          <Layers className="h-4 w-4 mr-2" />
                          With Letterhead
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => generateLetterhead(doc)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate Letterhead
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        disabled={!latestBillId || !patientPhone || sending}
                        onClick={() => setShareTarget({ testName: doc.file_name, reportDate: doc.created_at, recipient: "patient" })}
                      >
                        <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                        Send to Patient
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!latestBillId || !doctorPhone || sending}
                        onClick={() => setShareTarget({ testName: doc.file_name, reportDate: doc.created_at, recipient: "doctor" })}
                      >
                        <Stethoscope className="h-4 w-4 mr-2 text-blue-600" />
                        Send to Doctor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">No documents found</div>
        )}
      </TabsContent>
    </Tabs>

    <AlertDialog open={!!shareTarget} onOpenChange={(o) => !o && setShareTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Send report link to {shareTarget?.recipient === "doctor" ? "doctor" : "patient"} on WhatsApp?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">To: </span>
                <span className="font-medium text-foreground">
                  {shareRecipientLabel}
                </span>
              </div>
              <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-line text-foreground">
                {sharePreviewMessage}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={sending}
            onClick={() => shareTarget && handleSendWhatsApp(shareTarget)}
          >
            {sending ? "Sending..." : "Send WhatsApp"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
