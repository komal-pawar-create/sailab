import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  Send,
  Clock
} from 'lucide-react';

interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string | null;
  old_status: string | null;
  new_status: string | null;
  created_by: string;
  created_at: string;
}

interface Lead {
  id: string;
  lab_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
}

interface LeadActivityLogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivityAdded?: () => void;
}

const activityTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  note: { icon: MessageSquare, label: 'Note', color: 'bg-blue-500' },
  call: { icon: Phone, label: 'Call', color: 'bg-green-500' },
  email: { icon: Mail, label: 'Email', color: 'bg-purple-500' },
  meeting: { icon: Calendar, label: 'Meeting', color: 'bg-orange-500' },
  demo: { icon: Calendar, label: 'Demo', color: 'bg-amber-500' },
  status_change: { icon: ArrowRight, label: 'Status Change', color: 'bg-gray-500' },
};

export function LeadActivityLog({ lead, open, onOpenChange, onActivityAdded }: LeadActivityLogProps) {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'note',
    description: '',
  });

  const fetchActivities = async () => {
    if (!lead) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch activities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && lead) {
      fetchActivities();
    }
  }, [open, lead]);

  const handleAddActivity = async () => {
    if (!lead || !profile?.user_id || !newActivity.description.trim()) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: lead.id,
          activity_type: newActivity.activity_type,
          description: newActivity.description,
          created_by: profile.user_id,
        });

      if (error) throw error;

      // Update lead's last_activity_at
      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', lead.id);

      toast.success('Activity added');
      setNewActivity({ activity_type: 'note', description: '' });
      fetchActivities();
      onActivityAdded?.();
    } catch (error: any) {
      toast.error('Failed to add activity');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex flex-col gap-1">
            <span>{lead.lab_name}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {lead.contact_name}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-4">
          {/* Add Activity Form */}
          <div className="space-y-3 pb-4 border-b">
            <div className="flex gap-2">
              <Select
                value={newActivity.activity_type}
                onValueChange={(v) => setNewActivity(prev => ({ ...prev, activity_type: v }))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">📝 Note</SelectItem>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="email">✉️ Email</SelectItem>
                  <SelectItem value="meeting">📅 Meeting</SelectItem>
                  <SelectItem value="demo">🎥 Demo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Add a note about this lead..."
              value={newActivity.description}
              onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
            <Button
              onClick={handleAddActivity}
              disabled={submitting || !newActivity.description.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>

          {/* Activity Timeline */}
          <ScrollArea className="flex-1 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activities yet. Add the first one!
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const config = activityTypeConfig[activity.activity_type] || activityTypeConfig.note;
                  const Icon = config.icon;

                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {activity.activity_type === 'status_change' && (
                            <span className="text-xs text-muted-foreground">
                              {activity.old_status} → {activity.new_status}
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm mt-1">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
