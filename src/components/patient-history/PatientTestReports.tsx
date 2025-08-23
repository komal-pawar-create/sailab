import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface TestReport {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  created_at: string;
  created_by: string;
}

interface PatientTestReportsProps {
  patientId: string;
}

export default function PatientTestReports({ patientId }: PatientTestReportsProps) {
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTestReports();
  }, [patientId]);

  const fetchTestReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_reports")
        .select("*")
        .eq("patient_id", patientId)
        .order("test_date", { ascending: false });

      if (error) throw error;
      setTestReports(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch test reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (report: TestReport) => {
    // If results contain file paths, download them
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
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to download test report",
          variant: "destructive",
        });
      }
    } else {
      // Generate a simple text report if no file is attached
      const reportContent = `
Test Report
===========
Patient ID: ${patientId}
Test Type: ${report.test_type}
Test Date: ${format(new Date(report.test_date), "PPP")}
Status: ${report.status}
Results: ${JSON.stringify(report.results, null, 2)}
      `;
      
      const blob = new Blob([reportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test_report_${report.test_type}_${format(new Date(report.test_date), "yyyy-MM-dd")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Test Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading test reports...</div>
        ) : testReports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Type</TableHead>
                <TableHead>Test Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.test_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(report.test_date), "PPP")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      report.status === "completed" ? "default" :
                      report.status === "pending" ? "secondary" :
                      "outline"
                    }>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(report.created_at), "PPP")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(report)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No test reports found for this patient
          </div>
        )}
      </CardContent>
    </Card>
  );
}