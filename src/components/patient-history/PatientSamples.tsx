import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import { SampleBarcode } from "@/components/samples/SampleBarcode";
import { SampleUpdateDialog } from "@/components/samples/SampleUpdateDialog";
import { SampleTimelineView } from "@/components/samples/SampleTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Beaker, Clock } from "lucide-react";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface PatientSamplesProps {
  patientId: string;
}

export default function PatientSamples({ patientId }: PatientSamplesProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("samples" as any) as any)
        .select("*")
        .eq("patient_id", patientId)
        .order("collected_at", { ascending: false });

      if (error) throw error;
      setSamples(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch samples", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [patientId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (samples.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Beaker className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No samples collected yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {samples.map((sample) => {
        const start = new Date(sample.collected_at);
        const end = sample.completed_at ? new Date(sample.completed_at) :
          sample.rejected_at ? new Date(sample.rejected_at) : new Date();
        const elapsedMins = differenceInMinutes(end, start);
        const slaMins = (sample.sla_hours || 24) * 60;
        const percent = Math.min((elapsedMins / slaMins) * 100, 100);
        const breached = elapsedMins > slaMins && !sample.completed_at && !sample.rejected_at;
        const elapsedHrs = differenceInHours(end, start);

        return (
          <Card key={sample.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-bold">{sample.sample_id}</p>
                  <p className="text-sm text-muted-foreground">{sample.test_type}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Collected: {format(new Date(sample.collected_at), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
                <SampleStatusBadge status={sample.status} slaBreached={breached} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <Progress
                  value={percent}
                  className={cn("h-2 flex-1", breached && "[&>div]:bg-destructive")}
                />
                <span className="text-xs text-muted-foreground">{elapsedHrs}h / {sample.sla_hours}h</span>
              </div>

              <SampleTimelineView
                status={sample.status}
                collectedAt={sample.collected_at}
                receivedAt={sample.received_at}
                processingAt={sample.processing_at}
                completedAt={sample.completed_at}
                rejectedAt={sample.rejected_at}
              />

              <div className="flex gap-1 mt-3 justify-end">
                <SampleBarcode
                  sampleId={sample.sample_id}
                  barcode={sample.barcode}
                  patientName=""
                  testType={sample.test_type}
                  collectedAt={sample.collected_at}
                />
                <SampleUpdateDialog
                  sampleId={sample.id}
                  currentStatus={sample.status}
                  onUpdated={fetchSamples}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
