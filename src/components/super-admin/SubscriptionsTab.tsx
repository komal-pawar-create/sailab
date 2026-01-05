import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IndianRupee, Building2, Calendar, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AddSubscriptionForm } from '@/components/forms/AddSubscriptionForm';

interface Subscription {
  id: string;
  lab_id: string;
  plan_name: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  status: string;
  auto_renew: boolean;
  lab?: {
    name: string;
    initials: string;
  };
}

interface SubscriptionsTabProps {
  labs: { id: string; name: string; initials: string }[];
  onRefresh?: () => void;
}

export function SubscriptionsTab({ labs, onRefresh }: SubscriptionsTabProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          lab:labs(name, initials)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data as Subscription[] || []);
    } catch (error: any) {
      toast.error('Failed to fetch subscriptions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Calculate MRR
  const calculateMRR = () => {
    return subscriptions
      .filter(s => s.status === 'active')
      .reduce((total, sub) => {
        if (sub.billing_cycle === 'yearly') {
          return total + (sub.amount / 12);
        }
        return total + sub.amount;
      }, 0);
  };

  // Calculate ARR
  const calculateARR = () => calculateMRR() * 12;

  // Count by status
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const trialCount = subscriptions.filter(s => s.status === 'trial').length;
  const expiringCount = subscriptions.filter(s => {
    if (!s.end_date || s.status !== 'active') return false;
    return differenceInDays(new Date(s.end_date), new Date()) <= 30;
  }).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trial':
        return <Badge className="bg-purple-500 text-white">Trial</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'professional':
        return <Badge className="bg-blue-500 text-white">Professional</Badge>;
      case 'enterprise':
        return <Badge className="bg-amber-500 text-white">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">{plan}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-5 w-5" />
              <span className="text-2xl font-bold">{calculateMRR().toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">MRR from {activeCount} active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Annual Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-5 w-5" />
              <span className="text-2xl font-bold">{calculateARR().toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Projected yearly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              Trial Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{trialCount}</span>
            <p className="text-xs text-muted-foreground mt-1">Labs on trial</p>
          </CardContent>
        </Card>

        <Card className={expiringCount > 0 ? 'border-amber-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${expiringCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${expiringCount > 0 ? 'text-amber-500' : ''}`}>{expiringCount}</span>
            <p className="text-xs text-muted-foreground mt-1">Within next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Subscription Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AddSubscriptionForm 
          labs={labs} 
          onSuccess={() => {
            fetchSubscriptions();
            setShowAddForm(false);
            onRefresh?.();
          }} 
        />
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No subscriptions yet. Add your first subscription above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lab</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto Renew</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const daysUntilEnd = sub.end_date ? differenceInDays(new Date(sub.end_date), new Date()) : null;
                  const isExpiringSoon = daysUntilEnd !== null && daysUntilEnd <= 30 && daysUntilEnd >= 0;
                  
                  return (
                    <TableRow key={sub.id} className={isExpiringSoon ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{sub.lab?.initials}</Badge>
                          <span className="font-medium">{sub.lab?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan_name)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          <span>{sub.amount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                      <TableCell>{format(new Date(sub.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {sub.end_date ? (
                          <span className={isExpiringSoon ? 'text-amber-600 font-medium' : ''}>
                            {format(new Date(sub.end_date), 'MMM d, yyyy')}
                            {isExpiringSoon && ` (${daysUntilEnd}d)`}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <Badge variant={sub.auto_renew ? 'success' : 'secondary'}>
                          {sub.auto_renew ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
