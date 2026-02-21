import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SampleTimelineProps {
  status: string;
  collectedAt: string;
  receivedAt?: string | null;
  processingAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
}

const steps = [
  { key: "collected", label: "Collected", dateKey: "collectedAt" },
  { key: "received", label: "Received", dateKey: "receivedAt" },
  { key: "processing", label: "Processing", dateKey: "processingAt" },
  { key: "completed", label: "Completed", dateKey: "completedAt" },
] as const;

const statusOrder = ["collected", "received", "processing", "completed"];

export function SampleTimelineView(props: SampleTimelineProps) {
  const { status } = props;
  const isRejected = status === "rejected";
  const currentIndex = statusOrder.indexOf(status);

  const dates: Record<string, string | null | undefined> = {
    collectedAt: props.collectedAt,
    receivedAt: props.receivedAt,
    processingAt: props.processingAt,
    completedAt: props.completedAt,
  };

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const isDone = i <= currentIndex && !isRejected;
        const isCurrent = statusOrder[currentIndex] === step.key && !isRejected;
        const dateVal = dates[step.dateKey];

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              {isDone ? (
                <CheckCircle2 className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-green-500")} />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
              {i < steps.length - 1 && (
                <div className={cn("w-0.5 h-6", isDone ? "bg-green-500" : "bg-muted")} />
              )}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", !isDone && "text-muted-foreground")}>{step.label}</p>
              {dateVal && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(dateVal), "dd MMM yyyy, hh:mm a")}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {isRejected && (
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Rejected</p>
            {props.rejectedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(props.rejectedAt), "dd MMM yyyy, hh:mm a")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
