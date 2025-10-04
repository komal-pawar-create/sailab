import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, User, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  technician_name: string | null;
  results: any;
}

interface PatientReportsPreviewProps {
  patientId: string | null;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientReportsPreview({
  patientId,
  patientName,
  open,
  onOpenChange,
}: PatientReportsPreviewProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && patientId) {
      fetchLatestReports();
    }
  }, [open, patientId]);

  const fetchLatestReports = async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_reports")
        .select("id, test_type, test_date, status, technician_name, results")
        .eq("patient_id", patientId)
        .order("test_date", { ascending: false })
        .limit(2);

      if (error) throw error;
      setReports(data || []);
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleViewFullHistory = () => {
    onOpenChange(false);
    navigate(`/patient-history/${patientId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Latest Reports - {patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reports found for this patient
            </div>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{report.test_type}</h3>
                      </div>
                      <Badge variant={getStatusVariant(report.status)}>
                        {report.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(report.test_date).toLocaleDateString()}
                        </span>
                      </div>
                      {report.technician_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{report.technician_name}</span>
                        </div>
                      )}
                    </div>

                    {report.results && (
                      <div className="text-sm">
                        <span className="font-medium">Results: </span>
                        <span className="text-muted-foreground">
                          {typeof report.results === "string"
                            ? report.results
                            : JSON.stringify(report.results).substring(0, 100)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div className="flex justify-center pt-4">
            <Button onClick={handleViewFullHistory} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
