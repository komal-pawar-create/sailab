import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Calendar, IndianRupee, MoreHorizontal, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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
    // If moving to 'won', trigger conversion flow instead
    if (newStatus === 'won' && onConvertLead) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        onConvertLead(lead);
        return;
      }
    }
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      toast.success(`Lead moved to ${newStatus.replace('_', ' ')}`);
      fetchLeads();
      onRefresh?.();
    } catch (error: any) {
      toast.error('Failed to update lead status');
    }
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
              {getLeadsByStatus(column.id).map(lead => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{lead.lab_name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${sourceColors[lead.source] || 'bg-muted'}`}>
                        {lead.source?.replace('_', ' ')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getLeadsByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
