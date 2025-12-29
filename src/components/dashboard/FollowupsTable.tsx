import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Check } from "lucide-react";
import { isPast, isToday } from "date-fns";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "./TablePagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Followup {
  id: string;
  title: string;
  details: string | null;
  due_at: string;
  status: string;
  priority: string;
  patient_id: string;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
  };
}

interface FollowupsTableProps {
  followups: Followup[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (search: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function FollowupsTable({ 
  followups, 
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRefresh,
  isLoading = false 
}: FollowupsTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string, dueAt: string) => {
    if (status === "completed") {
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    }
    const dueDate = new Date(dueAt);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isToday(dueDate)) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Due Today</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const handleComplete = async (followup: Followup) => {
    const { error } = await supabase
      .from("patient_followups")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", followup.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Follow-up marked as completed",
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search follow-ups..."
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
              <TableHead>Title</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-[120px]">Due Date</TableHead>
              <TableHead className="w-[80px]">Priority</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : followups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No follow-ups found
                </TableCell>
              </TableRow>
            ) : (
              followups.map((followup) => (
                <TableRow key={followup.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{followup.title}</p>
                      {followup.details && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {followup.details}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{followup.patients?.full_name || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(followup.due_at, true)}
                  </TableCell>
                  <TableCell>{getPriorityBadge(followup.priority)}</TableCell>
                  <TableCell>{getStatusBadge(followup.status, followup.due_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => followup.patients?.id && navigate(`/patient/${followup.patients.id}`)}
                        title="View Patient"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {followup.status !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(followup)}
                          className="h-8 text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Done
                        </Button>
                      )}
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
