import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Calendar, IndianRupee, MoreHorizontal, ArrowRight, Clock, AlertTriangle, MessageSquare, Flame } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { LeadActivityLog } from './LeadActivityLog';

interface Lead {
  id: string;
  lab_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  location: string | null;
  source: string;
  status: string;
  notes: string | null;
  expected_value: number | null;
  demo_date: string | null;
  follow_up_date: string | null;
  created_at: string;
  priority: string | null;
  last_activity_at: string | null;
}

const statusColumns = [
  { id: 'new', label: 'New Leads', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-purple-500' },
  { id: 'demo_scheduled', label: 'Demo Scheduled', color: 'bg-amber-500' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-orange-500' },
  { id: 'won', label: 'Won', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const sourceColors: Record<string, string> = {
  website: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  referral: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cold_call: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  demo_request: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

interface LeadsPipelineProps {
  onRefresh?: () => void;
  onConvertLead?: (lead: Lead) => void;
}

export function LeadsPipeline({ onRefresh, onConvertLead }: LeadsPipelineProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch leads');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const lead = leads.find(l => l.id === leadId);
    const oldStatus = lead?.status;
    
    // If moving to 'won', trigger conversion flow instead
    if (newStatus === 'won' && onConvertLead) {
      if (lead) {
        onConvertLead(lead);
        return;
      }
    }
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, last_activity_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;

      // Log status change activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          activity_type: 'status_change',
          description: `Status changed from ${oldStatus} to ${newStatus}`,
          old_status: oldStatus,
          new_status: newStatus,
          created_by: user.id,
        });
      }

      toast.success(`Lead moved to ${newStatus.replace('_', ' ')}`);
      fetchLeads();
      onRefresh?.();
    } catch (error: any) {
      toast.error('Failed to update lead status');
    }
  };

  const getLeadPriority = (lead: Lead): 'hot' | 'warm' | 'cold' => {
    const daysSinceCreated = differenceInDays(new Date(), new Date(lead.created_at));
    const hasActivity = lead.last_activity_at && differenceInDays(new Date(), new Date(lead.last_activity_at)) < 7;
    const highValue = (lead.expected_value || 0) >= 50000;
    
    if (highValue && hasActivity) return 'hot';
    if (hasActivity || (highValue && daysSinceCreated < 30)) return 'warm';
    return 'cold';
  };

  const isFollowUpOverdue = (lead: Lead): boolean => {
    if (!lead.follow_up_date) return false;
    return isPast(new Date(lead.follow_up_date)) && !isToday(new Date(lead.follow_up_date));
  };

  const isFollowUpToday = (lead: Lead): boolean => {
    if (!lead.follow_up_date) return false;
    return isToday(new Date(lead.follow_up_date));
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {statusColumns.map(col => (
          <Card key={col.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${col.color}`} />
            <CardContent className="pt-4 pb-3 px-3">
              <p className="text-2xl font-bold">{getLeadsByStatus(col.id).length}</p>
              <p className="text-xs text-muted-foreground">{col.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
        {statusColumns.map(column => (
          <div key={column.id} className="min-w-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-medium text-sm">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {getLeadsByStatus(column.id).length}
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {getLeadsByStatus(column.id).map(lead => {
                const priority = getLeadPriority(lead);
                const overdueFollowUp = isFollowUpOverdue(lead);
                const todayFollowUp = isFollowUpToday(lead);
                const daysSinceCreated = differenceInDays(new Date(), new Date(lead.created_at));
                
                return (
                <Card 
                  key={lead.id} 
                  className={`hover:shadow-md transition-shadow ${
                    overdueFollowUp ? 'border-red-500 border-2' : 
                    todayFollowUp ? 'border-amber-500 border-2' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {priority === 'hot' && <Flame className="h-3.5 w-3.5 text-red-500" />}
                        <h4 className="font-medium text-sm line-clamp-1">{lead.lab_name}</h4>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedLead(lead);
                            setShowActivityLog(true);
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {statusColumns
                            .filter(s => s.id !== lead.status)
                            .map(status => (
                              <DropdownMenuItem
                                key={status.id}
                                onClick={() => updateLeadStatus(lead.id, status.id)}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Move to {status.label}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">{lead.contact_name}</p>
                    
                    {/* Overdue/Today Follow-up Alert */}
                    {(overdueFollowUp || todayFollowUp) && (
                      <div className={`flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded ${
                        overdueFollowUp ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        <AlertTriangle className="h-3 w-3" />
                        {overdueFollowUp ? 'Overdue follow-up' : 'Follow-up today'}
                      </div>
                    )}
                    
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {lead.contact_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          <span>{lead.contact_phone}</span>
                        </div>
                      )}
                      {lead.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{lead.location}</span>
                        </div>
                      )}
                      {lead.expected_value && (
                        <div className="flex items-center gap-1.5 text-primary font-medium">
                          <IndianRupee className="h-3 w-3" />
                          <span>{lead.expected_value.toLocaleString()}</span>
                        </div>
                      )}
                      {lead.demo_date && (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(lead.demo_date), 'MMM d, HH:mm')}</span>
                        </div>
                      )}
                      {lead.follow_up_date && !overdueFollowUp && !todayFollowUp && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>Follow-up: {format(new Date(lead.follow_up_date), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${sourceColors[lead.source] || 'bg-muted'}`}>
                        {lead.source?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {daysSinceCreated}d ago
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );})}
              
              {getLeadsByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Activity Log Sheet */}
      <LeadActivityLog
        lead={selectedLead}
        open={showActivityLog}
        onOpenChange={setShowActivityLog}
        onActivityAdded={fetchLeads}
      />
    </div>
  );
}
