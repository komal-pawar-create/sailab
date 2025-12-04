import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  file_path: string | null;
  created_at: string;
  patient_id: string;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
  };
}

interface DocumentsTableProps {
  documents: Document[];
  onRefresh: () => void;
}

export function DocumentsTable({ documents, onRefresh }: DocumentsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredDocuments = documents.filter((d) =>
    d.file_name.toLowerCase().includes(search.toLowerCase()) ||
    d.patients?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_path) return;
    
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>File Name</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[80px]">Size</TableHead>
              <TableHead className="w-[100px]">Uploaded</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.slice(0, 50).map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium truncate max-w-[200px]">{doc.file_name}</TableCell>
                  <TableCell>{doc.patients?.full_name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {doc.file_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at), "dd MMM yy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => doc.patients?.id && navigate(`/patient/${doc.patients.id}`)}
                        title="View Patient"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredDocuments.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredDocuments.length} documents.
        </p>
      )}
    </div>
  );
}
