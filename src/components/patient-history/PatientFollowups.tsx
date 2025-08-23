import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Followup {
  id: string;
  title: string;
  details?: string;
  due_at: string;
  remind_at?: string;
  priority: string;
  status: string;
  assigned_to: string;
  created_at: string;
  completed_at?: string;
}

interface PatientFollowupsProps {
  patientId: string;
}

export default function PatientFollowups({ patientId }: PatientFollowupsProps) {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFollowups();
  }, [patientId]);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patient_followups")
        .select("*")
        .eq("patient_id", patientId)
        .order("due_at", { ascending: true });

      if (error) throw error;
      setFollowups(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch follow-ups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async (followupId: string) => {
    try {
      const { error } = await supabase
        .from("patient_followups")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", followupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Follow-up marked as complete",
      });

      fetchFollowups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update follow-up",
        variant: "destructive",
      });
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "completed" ? CheckCircle : AlertCircle;
  };

  const openFollowups = followups.filter(f => f.status === "open");
  const completedFollowups = followups.filter(f => f.status === "completed");

  return (
    <div className="space-y-6">
      {/* Open Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Open Follow-ups ({openFollowups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading follow-ups...</div>
          ) : openFollowups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openFollowups.map((followup) => {
                  const isOverdue = new Date(followup.due_at) < new Date();
                  return (
                    <TableRow key={followup.id} className={isOverdue ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
                          {followup.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(followup.due_at), "PPP")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(followup.priority)}>
                          {followup.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {followup.remind_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {format(new Date(followup.remind_at), "PPp")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={followup.details}>
                        {followup.details || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsComplete(followup.id)}
                        >
                          Mark Complete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No open follow-ups for this patient
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Follow-ups */}
      {completedFollowups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed Follow-ups ({completedFollowups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Completed On</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedFollowups.map((followup) => (
                  <TableRow key={followup.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {followup.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(followup.due_at), "PPP")}
                    </TableCell>
                    <TableCell>
                      {followup.completed_at ? format(new Date(followup.completed_at), "PPP") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(followup.priority)}>
                        {followup.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={followup.details}>
                      {followup.details || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}