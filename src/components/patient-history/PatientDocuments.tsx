import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, FileImage, File, Calendar, User, RefreshCw, Layers } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
}

interface DocumentTemplate {
  id: string;
  original_document_id: string;
  template_type: string;
  generated_pdf_url: string | null;
  created_at: string;
}

interface PatientDocumentsProps {
  patientId: string;
}

export default function PatientDocuments({ patientId }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Record<string, DocumentTemplate>>({});
  const [loading, setLoading] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchDocuments();
    fetchTemplates();
  }, [patientId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // First get all document IDs for this patient
      const documentIds = documents.map(doc => doc.id);
      if (documentIds.length === 0) return;

      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .in("original_document_id", documentIds);

      if (error) throw error;
      
      // Create a map of document IDs to templates
      const templateMap: Record<string, DocumentTemplate> = {};
      (data || []).forEach(template => {
        if (template.original_document_id) {
          templateMap[template.original_document_id] = template;
        }
      });
      setTemplates(templateMap);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const downloadDocument = async (doc: Document, withLetterhead = false) => {
    if (!doc.file_path && !withLetterhead) {
      toast({
        title: "Error",
        description: "File path not found",
        variant: "destructive",
      });
      return;
    }

    try {
      let fileName = doc.file_name;

      if (withLetterhead && templates[doc.id]?.generated_pdf_url) {
        // Download letterhead version using direct link (avoids CORS issues)
        fileName = `letterhead_${doc.file_name.replace(/\.[^/.]+$/, '.pdf')}`;
        const url = templates[doc.id].generated_pdf_url!;
        
        // Create a direct download link
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.target = "_blank"; // Open in new tab to handle cross-origin downloads
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: `Downloaded ${fileName}`,
        });
      } else if (doc.file_path) {
        // Download original using Supabase client (for private files)
        const { data, error } = await supabase.storage
          .from("lab-files")
          .download(doc.file_path);
        
        if (error) throw error;
        
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "Success",
            description: `Downloaded ${fileName}`,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const generateWithLetterhead = async (doc: Document) => {
    if (!profile?.lab_id || !profile?.branch_id || !doc.file_path) return;

    setProcessingDocs(prev => new Set(prev).add(doc.id));

    try {
      // Check if letterhead exists
      const { data: branchData } = await supabase
        .from('branches')
        .select('letterhead_url, logo_url')
        .eq('id', profile.branch_id)
        .single();

      const { data: labData } = await supabase
        .from('labs')
        .select('letterhead_url')
        .eq('id', profile.lab_id)
        .single();

      const letterheadUrl = branchData?.letterhead_url || labData?.letterhead_url;
      
      if (!letterheadUrl) {
        toast({
          title: "No letterhead found",
          description: "Please upload a letterhead template first in Lab Profile or Branch settings.",
          variant: "destructive",
        });
        return;
      }

      // Get the original file URL from storage
      const { data: { publicUrl: originalFileUrl } } = supabase.storage
        .from('lab-files')
        .getPublicUrl(doc.file_path);

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: doc.id,
          letterheadUrl: letterheadUrl,
          logoUrl: branchData?.logo_url,
          documentType: 'patient_document',
          originalFileUrl,
          fileName: doc.file_name,
          labId: profile.lab_id,
          branchId: profile.branch_id,
        }
      });

      if (error) throw error;

      if (data?.success && data?.generatedPdfUrl) {
        toast({
          title: "Document processed successfully",
          description: "Your document has been generated with letterhead.",
        });
        
        // Refresh templates immediately
        await fetchTemplates();
      } else {
        throw new Error(data?.message || "Failed to process document");
      }

    } catch (error: any) {
      console.error("Error generating with letterhead:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate document with letterhead",
        variant: "destructive",
      });
    } finally {
      setProcessingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return FileImage;
    if (fileType.includes("pdf")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const FileIcon = getFileIcon(doc.file_type);
              const hasLetterhead = !!templates[doc.id]?.generated_pdf_url;
              const isProcessing = processingDocs.has(doc.id);
              
              return (
                <Card key={doc.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={doc.file_name}>
                          {doc.file_name}
                        </h4>
                        <div className="mt-1 space-y-1">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.file_type}
                            </Badge>
                            {hasLetterhead && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Layers className="h-3 w-3" />
                                Letterhead
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(doc.created_at), "PPP")}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3 gap-2"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download Options
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                          <File className="h-4 w-4 mr-2" />
                          Download Original
                        </DropdownMenuItem>
                        {hasLetterhead ? (
                          <DropdownMenuItem onClick={() => downloadDocument(doc, true)}>
                            <Layers className="h-4 w-4 mr-2" />
                            Download with Letterhead
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => generateWithLetterhead(doc)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate with Letterhead
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No documents found for this patient
          </div>
        )}
      </CardContent>
    </Card>
  );
}