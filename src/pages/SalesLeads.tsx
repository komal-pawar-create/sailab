import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AddLeadForm } from '@/components/forms/AddLeadForm';
import { LeadsPipeline } from '@/components/super-admin/LeadsPipeline';
import { LeadConversionMetrics } from '@/components/super-admin/LeadConversionMetrics';
import { OnboardingWizard } from '@/components/super-admin/OnboardingWizard';
import { 
  Users, 
  TrendingUp, 
  Target, 
  IndianRupee, 
  Clock, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  RefreshCw 
} from 'lucide-react';

interface LeadMetrics {
  totalLeads: number;
  conversionRate: number;
  pipelineValue: number;
  avgDaysToClose: number;
}

export default function SalesLeads() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<LeadMetrics>({
    totalLeads: 0,
    conversionRate: 0,
    pipelineValue: 0,
    avgDaysToClose: 0,
  });
  const [loading, setLoading] = useState(true);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<{
    id: string;
    lab_name: string;
    contact_name: string;
    contact_email: string | null;
    contact_phone: string | null;
    location: string | null;
    expected_value: number | null;
  } | null>(null);

  useEffect(() => {
    if (profile && profile.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    
    if (profile?.role === 'super_admin') {
      fetchMetrics();
    }
  }, [profile, navigate]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, status, expected_value, created_at, last_activity_at');

      if (leads) {
        const total = leads.length;
        const wonLeads = leads.filter(l => l.status === 'won');
        const lostLeads = leads.filter(l => l.status === 'lost');
        const closedLeads = wonLeads.length + lostLeads.length;
        const conversionRate = closedLeads > 0 ? (wonLeads.length / closedLeads) * 100 : 0;

        const pipelineLeads = leads.filter(l => !['won', 'lost'].includes(l.status || ''));
        const pipelineValue = pipelineLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0);

        // Calculate avg days to close for won leads
        let avgDays = 0;
        if (wonLeads.length > 0) {
          const totalDays = wonLeads.reduce((sum, l) => {
            const created = new Date(l.created_at || new Date());
            const closed = new Date(l.last_activity_at || new Date());
            return sum + Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          avgDays = Math.round(totalDays / wonLeads.length);
        }

        setMetrics({
          totalLeads: total,
          conversionRate: Math.round(conversionRate),
          pipelineValue,
          avgDaysToClose: avgDays,
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (convertingLead) {
    return (
      <div className="container mx-auto px-4 py-8">
        <OnboardingWizard 
          leadData={convertingLead}
          onComplete={() => {
            setConvertingLead(null);
            fetchMetrics();
          }}
          onClose={() => setConvertingLead(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Sales & Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales pipeline and convert leads to customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAddFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-4 w-4" />
              <span className="text-2xl font-bold">{(metrics.pipelineValue / 1000).toFixed(0)}K</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Avg Days to Close
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDaysToClose}</div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <LeadConversionMetrics />

      {/* Add Lead Form (Collapsible) */}
      <Collapsible open={addFormOpen} onOpenChange={setAddFormOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Lead
                </span>
                {addFormOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <AddLeadForm onSuccess={() => {
                fetchMetrics();
                setAddFormOpen(false);
              }} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Pipeline Kanban */}
      <LeadsPipeline 
        onRefresh={fetchMetrics} 
        onConvertLead={(lead) => setConvertingLead(lead)}
      />
    </div>
  );
}
