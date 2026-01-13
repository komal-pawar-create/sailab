import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Target, DollarSign, Clock } from 'lucide-react';

interface LeadMetrics {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, { total: number; won: number }>;
  totalValue: number;
  wonValue: number;
  avgDaysToClose: number;
}

const statusOrder = ['new', 'contacted', 'demo_scheduled', 'negotiating', 'won', 'lost'];

export function LeadConversionMetrics() {
  const [metrics, setMetrics] = useState<LeadMetrics>({
    total: 0,
    byStatus: {},
    bySource: {},
    totalValue: 0,
    wonValue: 0,
    avgDaysToClose: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*');

      if (error) throw error;

      const leads = data || [];
      
      // Calculate metrics
      const byStatus: Record<string, number> = {};
      const bySource: Record<string, { total: number; won: number }> = {};
      let totalValue = 0;
      let wonValue = 0;
      let totalDaysToClose = 0;
      let wonCount = 0;

      leads.forEach(lead => {
        // Status counts
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;

        // Source tracking
        const source = lead.source || 'unknown';
        if (!bySource[source]) {
          bySource[source] = { total: 0, won: 0 };
        }
        bySource[source].total++;
        if (lead.status === 'won') {
          bySource[source].won++;
        }

        // Value tracking
        if (lead.expected_value) {
          totalValue += lead.expected_value;
          if (lead.status === 'won') {
            wonValue += lead.expected_value;
          }
        }

        // Days to close
        if (lead.status === 'won' && lead.created_at && lead.updated_at) {
          const created = new Date(lead.created_at);
          const updated = new Date(lead.updated_at);
          const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          totalDaysToClose += days;
          wonCount++;
        }
      });

      setMetrics({
        total: leads.length,
        byStatus,
        bySource,
        totalValue,
        wonValue,
        avgDaysToClose: wonCount > 0 ? Math.round(totalDaysToClose / wonCount) : 0,
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getConversionRate = () => {
    const closed = (metrics.byStatus['won'] || 0) + (metrics.byStatus['lost'] || 0);
    if (closed === 0) return 0;
    return Math.round(((metrics.byStatus['won'] || 0) / closed) * 100);
  };

  const getPipelineValue = () => {
    return metrics.totalValue - metrics.wonValue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Leads
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="h-4 w-4" />
              Conversion Rate
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{getConversionRate()}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Pipeline Value
            </div>
            <p className="text-2xl font-bold mt-1">₹{getPipelineValue().toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Avg. Days to Close
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.avgDaysToClose} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusOrder.filter(s => s !== 'lost').map((status, idx) => {
              const count = metrics.byStatus[status] || 0;
              const percentage = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Source Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversion by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.bySource).map(([source, data]) => {
              const rate = data.total > 0 ? (data.won / data.total) * 100 : 0;
              
              return (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {source.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {data.total} leads
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">
                      {data.won} won
                    </span>
                    <Badge variant={rate >= 50 ? 'default' : 'secondary'}>
                      {rate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
