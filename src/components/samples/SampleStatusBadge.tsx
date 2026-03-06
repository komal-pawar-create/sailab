import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SampleStatus = "collected" | "received" | "processing" | "completed" | "rejected";

interface SampleStatusBadgeProps {
  status: string;
  slaBreached?: boolean;
  className?: string;
}

const statusConfig: Record<SampleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "muted" }> = {
  collected: { label: "Collected", variant: "info" },
  received: { label: "Received", variant: "secondary" },
  processing: { label: "Processing", variant: "outline" },
  completed: { label: "Completed", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function SampleStatusBadge({ status, slaBreached, className }: SampleStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.collected;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Badge variant={config.variant}>{config.label}</Badge>
      {slaBreached && status !== "completed" && status !== "rejected" && (
        <span className="flex items-center text-destructive animate-pulse" title="SLA Breached">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}
