import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileText, DollarSign, Star, Clock, Activity, Beaker } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "test" | "document" | "bill" | "followup" | "feedback" | "payment" | "sample";
  title: string;
  description?: string;
  date: string;
  status?: string;
  icon: any;
  color: string;
}

interface PatientTimelineProps {
  patientId: string;
}

export default function PatientTimeline({ patientId }: PatientTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimelineEvents();
  }, [patientId]);

  const fetchTimelineEvents = async () => {
    setLoading(true);
    try {
      const allEvents: TimelineEvent[] = [];

      const [testsRes, docsRes, billsRes, followupsRes, feedbackRes, samplesRes] = await Promise.all([
        supabase.from("test_reports").select("*").eq("patient_id", patientId),
        supabase.from("documents").select("*").eq("patient_id", patientId),
        supabase.from("bills").select("*").eq("patient_id", patientId),
        supabase.from("patient_followups").select("*").eq("patient_id", patientId),
        supabase.from("feedback").select("*").eq("patient_id", patientId),
        samplesTable().select("*").eq("patient_id", patientId),
      ]);

      testsRes.data?.forEach((test) => {
        allEvents.push({
          id: `test-${test.id}`,
          type: "test",
          title: `Test: ${test.test_type}`,
          description: test.status,
          date: test.created_at,
          status: test.status,
          icon: FileText,
          color: "text-blue-500",
        });
      });

      docsRes.data?.forEach((doc) => {
        allEvents.push({
          id: `doc-${doc.id}`,
          type: "document",
          title: `Document: ${doc.file_name}`,
          date: doc.created_at,
          icon: FileText,
          color: "text-purple-500",
        });
      });

      billsRes.data?.forEach((bill) => {
        allEvents.push({
          id: `bill-${bill.id}`,
          type: "bill",
          title: `Bill #${bill.bill_number}`,
          description: `₹${bill.total_amount}`,
          date: bill.created_at,
          status: bill.status,
          icon: DollarSign,
          color: "text-green-500",
        });
      });

      // Fetch payments for bills
      if (billsRes.data && billsRes.data.length > 0) {
        const billIds = billsRes.data.map((b) => b.id);
        const { data: payments } = await supabase.from("bill_payments").select("*").in("bill_id", billIds);
        
        payments?.forEach((payment) => {
          const bill = billsRes.data?.find((b) => b.id === payment.bill_id);
          allEvents.push({
            id: `payment-${payment.id}`,
            type: "payment",
            title: `Payment for #${bill?.bill_number}`,
            description: `₹${payment.payment_amount}`,
            date: payment.payment_date,
            icon: DollarSign,
            color: "text-emerald-500",
          });
        });
      }

      followupsRes.data?.forEach((f) => {
        allEvents.push({
          id: `followup-${f.id}`,
          type: "followup",
          title: `Follow-up: ${f.title}`,
          description: f.priority,
          date: f.created_at,
          status: f.status,
          icon: Calendar,
          color: "text-orange-500",
        });
      });

      feedbackRes.data?.forEach((fb) => {
        allEvents.push({
          id: `feedback-${fb.id}`,
          type: "feedback",
          title: `Feedback: ${fb.feedback_type}`,
          description: fb.rating ? `${fb.rating}/5` : undefined,
          date: fb.created_at,
          icon: Star,
          color: "text-yellow-500",
        });
      });

      (samplesRes.data as any[])?.forEach((s: any) => {
        allEvents.push({
          id: `sample-${s.id}`,
          type: "sample",
          title: `Sample: ${s.sample_id}`,
          description: `${s.test_type} — ${s.status}`,
          date: s.collected_at,
          status: s.status,
          icon: Beaker,
          color: "text-cyan-500",
        });
      });

      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(allEvents.slice(0, 20)); // Show last 20 events
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch activity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No activity found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event, index) => {
        const Icon = event.icon;
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className={`p-1.5 rounded-full bg-muted shrink-0 ${event.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{event.title}</span>
                {event.status && (
                  <Badge
                    variant={
                      event.status === "completed" || event.status === "paid"
                        ? "default"
                        : event.status === "pending"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {event.status}
                  </Badge>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
