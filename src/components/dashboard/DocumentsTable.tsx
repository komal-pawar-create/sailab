import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TablePagination } from "./TablePagination";
import { Skeleton } from "@/components/ui/skeleton";

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
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (search: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function DocumentsTable({ 
  documents, 
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRefresh,
  isLoading = false 
}: DocumentsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

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
            onChange={(e) => handleSearchChange(e.target.value)}
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
            {isLoading ? (
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
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
                    {formatDate(doc.created_at)}
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

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
    </div>
  );
}
