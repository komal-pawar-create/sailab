import { memo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { SampleStatusBadge } from "./SampleStatusBadge";
import { SampleBarcode } from "./SampleBarcode";
import { SampleUpdateDialog } from "./SampleUpdateDialog";
import { SampleTimelineView } from "./SampleTimeline";
import { AddSampleForm } from "@/components/forms/AddSampleForm";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Eye } from "lucide-react";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

interface SampleTrackingTabProps {
  samples: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (search: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

function computeTAT(sample: any) {
  const start = new Date(sample.collected_at);
  const end = sample.completed_at ? new Date(sample.completed_at) :
    sample.rejected_at ? new Date(sample.rejected_at) : new Date();
  const elapsedMins = differenceInMinutes(end, start);
  const slaMins = (sample.sla_hours || 24) * 60;
  const percent = Math.min((elapsedMins / slaMins) * 100, 100);
  const breached = elapsedMins > slaMins && !sample.completed_at && !sample.rejected_at;
  const elapsedHrs = differenceInHours(end, start);
  return { percent, breached, elapsedHrs, elapsedMins, slaMins };
}

export const SampleTrackingTab = memo(function SampleTrackingTab({
  samples, totalCount, currentPage, pageSize,
  onPageChange, onPageSizeChange, onSearch, onRefresh, isLoading,
}: SampleTrackingTabProps) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const isMobile = useIsMobile();

  const handleSearch = (val: string) => {
    setSearchValue(val);
    onSearch(val);
  };

  const showTimeline = (sample: any) => {
    setSelectedSample(sample);
    setTimelineOpen(true);
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search samples..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <AddSampleForm onAdded={onRefresh} />
        </div>

        {samples.map((sample) => {
          const tat = computeTAT(sample);
          return (
            <Card key={sample.id} className="overflow-hidden">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm">{sample.sample_id}</span>
                  <SampleStatusBadge status={sample.status} slaBreached={tat.breached} />
                </div>
                <p className="text-sm">{(sample as any).patients?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{sample.test_type}</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={tat.percent}
                    className={cn("h-1.5 flex-1", tat.breached && "[&>div]:bg-destructive")}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {tat.elapsedHrs}h / {sample.sla_hours}h
                  </span>
                </div>
                <div className="flex gap-1 justify-end">
                  <SampleBarcode
                    sampleId={sample.sample_id}
                    barcode={sample.barcode}
                    patientName={(sample as any).patients?.full_name || ""}
                    testType={sample.test_type}
                    collectedAt={sample.collected_at}
                  />
                  <SampleUpdateDialog sampleId={sample.id} currentStatus={sample.status} />
                  <Button variant="ghost" size="icon" onClick={() => showTimeline(sample)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          pageSize={pageSize}
          totalCount={totalCount}
          hasNext={currentPage * pageSize < totalCount}
          hasPrev={currentPage > 1}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />

        <TimelineDialog open={timelineOpen} onOpenChange={setTimelineOpen} sample={selectedSample} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sample ID, patient, test..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <AddSampleForm onAdded={onRefresh} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sample ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>TAT Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : samples.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No samples found</TableCell></TableRow>
            ) : (
              samples.map((sample) => {
                const tat = computeTAT(sample);
                return (
                  <TableRow key={sample.id}>
                    <TableCell className="font-mono font-medium">{sample.sample_id}</TableCell>
                    <TableCell>{(sample as any).patients?.full_name || "—"}</TableCell>
                    <TableCell>{sample.test_type}</TableCell>
                    <TableCell>
                      <SampleStatusBadge status={sample.status} slaBreached={tat.breached} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(sample.collected_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Progress
                          value={tat.percent}
                          className={cn("h-2 flex-1", tat.breached && "[&>div]:bg-destructive")}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {tat.elapsedHrs}h/{sample.sla_hours}h
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <SampleBarcode
                          sampleId={sample.sample_id}
                          barcode={sample.barcode}
                          patientName={(sample as any).patients?.full_name || ""}
                          testType={sample.test_type}
                          collectedAt={sample.collected_at}
                        />
                        <SampleUpdateDialog sampleId={sample.id} currentStatus={sample.status} />
                        <Button variant="ghost" size="icon" onClick={() => showTimeline(sample)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / pageSize)}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNext={currentPage * pageSize < totalCount}
        hasPrev={currentPage > 1}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <TimelineDialog open={timelineOpen} onOpenChange={setTimelineOpen} sample={selectedSample} />
    </div>
  );
});

function TimelineDialog({ open, onOpenChange, sample }: { open: boolean; onOpenChange: (v: boolean) => void; sample: any }) {
  if (!sample) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Sample Timeline — {sample.sample_id}</DialogTitle>
        </DialogHeader>
        <SampleTimelineView
          status={sample.status}
          collectedAt={sample.collected_at}
          receivedAt={sample.received_at}
          processingAt={sample.processing_at}
          completedAt={sample.completed_at}
          rejectedAt={sample.rejected_at}
        />
        {sample.rejection_reason && (
          <p className="text-sm text-destructive mt-2">Reason: {sample.rejection_reason}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
