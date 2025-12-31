import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, IndianRupee, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalTests: number;
  pendingAmount: number;
  openFollowups: number;
  avgRating: number | null;
}

interface QuickStatsBarProps {
  patientId: string;
  onStatClick?: (tab: string) => void;
}

export default function QuickStatsBar({ patientId, onStatClick }: QuickStatsBarProps) {
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    pendingAmount: 0,
    openFollowups: 0,
    avgRating: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [patientId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [testsRes, billsRes, followupsRes, feedbackRes] = await Promise.all([
        supabase.from("test_reports").select("id", { count: "exact" }).eq("patient_id", patientId),
        supabase.from("bills").select("due_amount").eq("patient_id", patientId),
        supabase.from("patient_followups").select("id", { count: "exact" }).eq("patient_id", patientId).eq("status", "open"),
        supabase.from("feedback").select("rating").eq("patient_id", patientId).not("rating", "is", null),
      ]);

      const pendingAmount = billsRes.data?.reduce((sum, b) => sum + (b.due_amount || 0), 0) || 0;
      const ratings = feedbackRes.data?.map(f => f.rating).filter(Boolean) as number[];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      setStats({
        totalTests: testsRes.count || 0,
        pendingAmount,
        openFollowups: followupsRes.count || 0,
        avgRating,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      key: "reports",
      label: "Tests",
      value: stats.totalTests,
      icon: FileText,
      highlight: false,
    },
    {
      key: "billing",
      label: "Pending",
      value: `₹${stats.pendingAmount.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      highlight: stats.pendingAmount > 0,
    },
    {
      key: "followups",
      label: "Follow-ups",
      value: stats.openFollowups,
      icon: Clock,
      highlight: stats.openFollowups > 0,
    },
    {
      key: "activity",
      label: "Rating",
      value: stats.avgRating ? `${stats.avgRating.toFixed(1)}/5` : "N/A",
      icon: Star,
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statItems.map((item) => (
        <Badge
          key={item.key}
          variant={item.highlight ? "destructive" : "secondary"}
          className={cn(
            "px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors hover:opacity-80",
            item.highlight && "bg-destructive/90"
          )}
          onClick={() => onStatClick?.(item.key)}
        >
          <item.icon className="h-3.5 w-3.5 mr-1.5" />
          {item.label}: {item.value}
        </Badge>
      ))}
    </div>
  );
}
