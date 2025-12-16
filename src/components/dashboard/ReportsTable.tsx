import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AddTestReportForm } from "@/components/forms/AddTestReportForm";

interface Report {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  technician_name: string | null;
  created_at: string;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
  };
}

interface ReportsTableProps {
  reports: Report[];
  onRefresh: () => void;
}

export function ReportsTable({ reports, onRefresh }: ReportsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredReports = reports.filter((r) =>
    r.test_type.toLowerCase().includes(search.toLowerCase()) ||
    r.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.patients?.patient_id?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <AddTestReportForm onReportAdded={onRefresh} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Test Type</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-[100px]">Patient ID</TableHead>
              <TableHead className="w-[100px]">Test Date</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.slice(0, 50).map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{report.test_type}</TableCell>
                  <TableCell>{report.patients?.full_name || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{report.patients?.patient_id || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(report.test_date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {report.technician_name || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => report.patients?.id && navigate(`/patient/${report.patients.id}`)}
                        title="View Patient"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredReports.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredReports.length} reports. Use search to find specific reports.
        </p>
      )}
    </div>
  );
}
