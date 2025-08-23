import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileText, DollarSign, User, Star, Clock, Activity } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "test" | "document" | "bill" | "followup" | "feedback" | "payment";
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

      // Fetch test reports
      const { data: tests } = await supabase
        .from("test_reports")
        .select("*")
        .eq("patient_id", patientId);

      tests?.forEach(test => {
        allEvents.push({
          id: `test-${test.id}`,
          type: "test",
          title: `Test Report: ${test.test_type}`,
          description: `Status: ${test.status}`,
          date: test.created_at,
          status: test.status,
          icon: FileText,
          color: "text-blue-600",
        });
      });

      // Fetch documents
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("patient_id", patientId);

      docs?.forEach(doc => {
        allEvents.push({
          id: `doc-${doc.id}`,
          type: "document",
          title: `Document uploaded: ${doc.file_name}`,
          description: `Type: ${doc.file_type}`,
          date: doc.created_at,
          icon: FileText,
          color: "text-purple-600",
        });
      });

      // Fetch bills
      const { data: bills } = await supabase
        .from("bills")
        .select("*")
        .eq("patient_id", patientId);

      bills?.forEach(bill => {
        allEvents.push({
          id: `bill-${bill.id}`,
          type: "bill",
          title: `Bill #${bill.bill_number}`,
          description: `Amount: ₹${bill.total_amount} - Status: ${bill.status}`,
          date: bill.created_at,
          status: bill.status,
          icon: DollarSign,
          color: "text-green-600",
        });
      });

      // Fetch bill payments
      if (bills && bills.length > 0) {
        const billIds = bills.map(b => b.id);
        const { data: payments } = await supabase
          .from("bill_payments")
          .select("*")
          .in("bill_id", billIds);

        payments?.forEach(payment => {
          const bill = bills.find(b => b.id === payment.bill_id);
          allEvents.push({
            id: `payment-${payment.id}`,
            type: "payment",
            title: `Payment received for Bill #${bill?.bill_number}`,
            description: `Amount: ₹${payment.payment_amount} - Method: ${payment.payment_method}`,
            date: payment.payment_date,
            icon: DollarSign,
            color: "text-emerald-600",
          });
        });
      }

      // Fetch follow-ups
      const { data: followups } = await supabase
        .from("patient_followups")
        .select("*")
        .eq("patient_id", patientId);

      followups?.forEach(followup => {
        allEvents.push({
          id: `followup-${followup.id}`,
          type: "followup",
          title: `Follow-up: ${followup.title}`,
          description: `Priority: ${followup.priority} - Status: ${followup.status}`,
          date: followup.created_at,
          status: followup.status,
          icon: Calendar,
          color: "text-orange-600",
        });
      });

      // Fetch feedback
      const { data: feedback } = await supabase
        .from("feedback")
        .select("*")
        .eq("patient_id", patientId);

      feedback?.forEach(fb => {
        allEvents.push({
          id: `feedback-${fb.id}`,
          type: "feedback",
          title: `Feedback: ${fb.feedback_type}`,
          description: fb.rating ? `Rating: ${fb.rating}/5` : fb.message,
          date: fb.created_at,
          icon: Star,
          color: "text-yellow-600",
        });
      });

      // Sort events by date (newest first)
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(allEvents);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch timeline events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupEventsByDate = () => {
    const grouped: { [key: string]: TimelineEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = format(new Date(event.date), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDate();
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Patient Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
        ) : events.length > 0 ? (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {sortedDates.map((date) => (
              <div key={date} className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-background px-2 font-semibold text-sm">
                    {format(new Date(date), "PPPP")}
                  </div>
                </div>
                
                {groupedEvents[date].map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.id} className="relative flex items-start gap-4 mb-4 ml-4">
                      <div className={`absolute left-4 p-2 bg-background rounded-full border-2 border-border ${event.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="ml-12 flex-1 bg-muted rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {event.status && (
                              <Badge variant={
                                event.status === "completed" || event.status === "paid" ? "default" :
                                event.status === "pending" ? "secondary" :
                                "outline"
                              }>
                                {event.status}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.date), "p")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No timeline events found for this patient
          </div>
        )}
      </CardContent>
    </Card>
  );
}