import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Check, Clock } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onRefresh: () => void;
}

export function FollowupsTable({ followups, onRefresh }: FollowupsTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredFollowups = followups.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.patients?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

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
            onChange={(e) => setSearch(e.target.value)}
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
            {filteredFollowups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No follow-ups found
                </TableCell>
              </TableRow>
            ) : (
              filteredFollowups.slice(0, 50).map((followup) => (
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
                    {format(new Date(followup.due_at), "dd MMM yy HH:mm")}
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

      {filteredFollowups.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredFollowups.length} follow-ups.
        </p>
      )}
    </div>
  );
}
