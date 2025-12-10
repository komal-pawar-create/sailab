import { useEffect, useState } from "react";
import { DashboardWidget } from "./DashboardWidget";
import { Activity, FileText, TestTube, Receipt, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  type: 'patient' | 'test' | 'bill' | 'document';
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export function ActivityFeed() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!profile?.lab_id) return;

    const fetchRecentActivity = async () => {
      try {
        // Fetch recent activities from different tables
        const [patients, tests, bills, documents] = await Promise.all([
          supabase
            .from('patients')
            .select('id, full_name, created_at, profiles!patients_created_by_fkey(full_name)')
            .eq('lab_id', profile.lab_id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('test_reports')
            .select('id, test_type, created_at, patients!test_reports_patient_id_fkey(full_name), profiles!test_reports_created_by_fkey(full_name)')
            .eq('lab_id', profile.lab_id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('bills')
            .select('id, bill_number, created_at, patients!bills_patient_id_fkey(full_name), profiles!bills_created_by_fkey(full_name)')
            .eq('lab_id', profile.lab_id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('documents')
            .select('id, file_name, created_at, patients!documents_patient_id_fkey(full_name), profiles!documents_uploaded_by_fkey(full_name)')
            .eq('lab_id', profile.lab_id)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const allActivities: ActivityItem[] = [];

        patients.data?.forEach(p => {
          allActivities.push({
            id: p.id,
            type: 'patient',
            action: 'registered',
            user: (p.profiles as any)?.full_name || 'Unknown',
            timestamp: p.created_at,
            details: p.full_name,
          });
        });

        tests.data?.forEach(t => {
          allActivities.push({
            id: t.id,
            type: 'test',
            action: 'created',
            user: (t.profiles as any)?.full_name || 'Unknown',
            timestamp: t.created_at,
            details: `${t.test_type} for ${(t.patients as any)?.full_name}`,
          });
        });

        bills.data?.forEach(b => {
          allActivities.push({
            id: b.id,
            type: 'bill',
            action: 'generated',
            user: (b.profiles as any)?.full_name || 'Unknown',
            timestamp: b.created_at,
            details: `${b.bill_number} for ${(b.patients as any)?.full_name}`,
          });
        });

        documents.data?.forEach(d => {
          allActivities.push({
            id: d.id,
            type: 'document',
            action: 'uploaded',
            user: (d.profiles as any)?.full_name || 'Unknown',
            timestamp: d.created_at,
            details: `${d.file_name} for ${(d.patients as any)?.full_name}`,
          });
        });

        // Sort by timestamp
        allActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(allActivities.slice(0, 10));
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchRecentActivity();

    // Subscribe to real-time updates
    const channels = [
      supabase
        .channel('patients_activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, () => {
          fetchRecentActivity();
        })
        .subscribe(),
      supabase
        .channel('tests_activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'test_reports' }, () => {
          fetchRecentActivity();
        })
        .subscribe(),
      supabase
        .channel('bills_activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bills' }, () => {
          fetchRecentActivity();
        })
        .subscribe(),
      supabase
        .channel('documents_activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents' }, () => {
          fetchRecentActivity();
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [profile?.lab_id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient': return User;
      case 'test': return TestTube;
      case 'bill': return Receipt;
      case 'document': return FileText;
      default: return Activity;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'patient': return 'bg-blue-500/10 text-blue-500';
      case 'test': return 'bg-green-500/10 text-green-500';
      case 'bill': return 'bg-purple-500/10 text-purple-500';
      case 'document': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <DashboardWidget title="Live Activity Feed" icon={Activity} description="Real-time updates">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-lg ${getActionColor(activity.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} {activity.action}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(activity.timestamp), 'HH:mm')}
                      </Badge>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </DashboardWidget>
  );
}
