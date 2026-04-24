import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Download, FileText, FileImage, File, Calendar, RefreshCw, Layers, Share, MessageCircle } from "lucide-react";
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
}

interface Document {
  id: string;
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
  doctorPhone?: string;
}

export default function PatientReportsTab({ patientId, patientName, doctorPhone }: PatientReportsTabProps) {
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Record<string, DocumentTemplate>>({});
  const [loading, setLoading] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, docsRes] = await Promise.all([
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
      ]);

      setTestReports(testsRes.data || []);
      setDocuments(docsRes.data || []);

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

  const downloadTestReport = async (report: TestReport) => {
    if (report.results?.file_path) {
      try {
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
      } catch {
        toast({ title: "Error", description: "Failed to download", variant: "destructive" });
      }
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

  const generateLetterhead = async (doc: Document) => {
    if (!profile?.lab_id || !profile?.branch_id || !doc.file_path) return;
    setProcessingDocs((prev) => new Set(prev).add(doc.id));

    try {
      const [branchRes, labRes] = await Promise.all([
        supabase.from("branches").select("letterhead_url, logo_url").eq("id", profile.branch_id).single(),
        supabase.from("labs").select("letterhead_url").eq("id", profile.lab_id).single(),
      ]);

      const letterheadUrl = branchRes.data?.letterhead_url || labRes.data?.letterhead_url;
      if (!letterheadUrl) {
        toast({ title: "No letterhead", description: "Upload a letterhead first", variant: "destructive" });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("lab-files").getPublicUrl(doc.file_path);

      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          documentId: doc.id,
          letterheadUrl,
          logoUrl: branchRes.data?.logo_url,
          documentType: "patient_document",
          originalFileUrl: publicUrl,
          fileName: doc.file_name,
          labId: profile.lab_id,
          branchId: profile.branch_id,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast({ title: "Success", description: "Letterhead generated" });
        fetchData();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate", variant: "destructive" });
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

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
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
                  <TableHead className="w-[100px]">Action</TableHead>
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
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => downloadTestReport(report)}>
                        <Download className="h-4 w-4" />
                      </Button>
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
  );
}
