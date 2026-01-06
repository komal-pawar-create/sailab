import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Users, 
  FileText, 
  HardDrive, 
  Activity,
  TestTube,
  Building2,
  GitBranch,
  Calendar,
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface HealthStats {
  totalPatients: number;
  totalBills: number;
  totalTestReports: number;
  totalDocuments: number;
  activeUsers: number;
  totalUsers: number;
  totalLabs: number;
  totalBranches: number;
  recentPatients7Days: number;
  recentBills7Days: number;
  storageUsageMB: number;
  storageLimitMB: number;
}

interface ActivityItem {
  type: string;
  count: number;
  date: string;
}

export function SystemHealthTab() {
  const [stats, setStats] = useState<HealthStats>({
    totalPatients: 0,
    totalBills: 0,
    totalTestReports: 0,
    totalDocuments: 0,
    activeUsers: 0,
    totalUsers: 0,
    totalLabs: 0,
    totalBranches: 0,
    recentPatients7Days: 0,
    recentBills7Days: 0,
    storageUsageMB: 0,
    storageLimitMB: 1024, // 1GB default limit
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthStats();
  }, []);

  const fetchHealthStats = async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      // Fetch all stats in parallel
      const [
        patientsRes,
        recentPatientsRes,
        billsRes,
        recentBillsRes,
        testReportsRes,
        documentsRes,
        usersRes,
        activeUsersRes,
        labsRes,
        branchesRes,
      ] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('bills').select('id', { count: 'exact', head: true }),
        supabase.from('bills').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('test_reports').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('labs').select('id', { count: 'exact', head: true }),
        supabase.from('branches').select('id', { count: 'exact', head: true }),
      ]);

      // Fetch daily activity for the last 7 days
      const activityData: ActivityItem[] = [];
      for (let i = 0; i < 7; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const startOfDay = `${dateStr}T00:00:00`;
        const endOfDay = `${dateStr}T23:59:59`;
        
        const { count } = await supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
        
        activityData.push({
          type: 'patients',
          count: count || 0,
          date: format(date, 'EEE'),
        });
      }
      
      setRecentActivity(activityData.reverse());

      // Estimate storage from document count (rough estimate: 500KB per document)
      const estimatedStorageMB = ((documentsRes.count || 0) * 0.5);

      setStats({
        totalPatients: patientsRes.count || 0,
        totalBills: billsRes.count || 0,
        totalTestReports: testReportsRes.count || 0,
        totalDocuments: documentsRes.count || 0,
        activeUsers: activeUsersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalLabs: labsRes.count || 0,
        totalBranches: branchesRes.count || 0,
        recentPatients7Days: recentPatientsRes.count || 0,
        recentBills7Days: recentBillsRes.count || 0,
        storageUsageMB: estimatedStorageMB,
        storageLimitMB: 1024,
      });
    } catch (error: any) {
      toast.error('Failed to fetch system health stats');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const storagePercentage = Math.min((stats.storageUsageMB / stats.storageLimitMB) * 100, 100);
  const maxActivity = Math.max(...recentActivity.map(a => a.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            System Health
          </h2>
          <p className="text-muted-foreground">
            Real-time overview of platform usage across all labs
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Last updated: {format(new Date(), 'HH:mm')}
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-3xl font-bold">{stats.totalPatients.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.recentPatients7Days} this week
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                <p className="text-3xl font-bold">{stats.totalBills.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.recentBills7Days} this week
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Reports</p>
                <p className="text-3xl font-bold">{stats.totalTestReports.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TestTube className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-3xl font-bold">{stats.totalDocuments.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Database className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats & Storage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users & Infrastructure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Active Users</span>
              </div>
              <span className="font-semibold">{stats.activeUsers} / {stats.totalUsers}</span>
            </div>
            <Progress value={(stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100} className="h-2" />
            
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Labs</span>
                </div>
                <span className="font-medium">{stats.totalLabs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span>Branches</span>
                </div>
                <span className="font-medium">{stats.totalBranches}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage Usage
            </CardTitle>
            <CardDescription>Estimated based on document count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Used</span>
                <span className="font-medium">
                  {stats.storageUsageMB.toFixed(1)} MB / {stats.storageLimitMB} MB
                </span>
              </div>
              <Progress 
                value={storagePercentage} 
                className={`h-3 ${storagePercentage > 80 ? '[&>div]:bg-red-500' : storagePercentage > 60 ? '[&>div]:bg-amber-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                {(100 - storagePercentage).toFixed(1)}% remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Patient Registrations
            </CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-1 h-24">
              {recentActivity.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-1 flex-1">
                  <div 
                    className="w-full bg-primary/20 rounded-t relative overflow-hidden"
                    style={{ height: `${(day.count / maxActivity) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                  >
                    <div 
                      className="absolute inset-0 bg-primary"
                      style={{ height: '100%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Avg Patients/Lab</p>
              <p className="text-2xl font-bold">
                {stats.totalLabs > 0 ? Math.round(stats.totalPatients / stats.totalLabs) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Bills/Lab</p>
              <p className="text-2xl font-bold">
                {stats.totalLabs > 0 ? Math.round(stats.totalBills / stats.totalLabs) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Users/Branch</p>
              <p className="text-2xl font-bold">
                {stats.totalBranches > 0 ? (stats.totalUsers / stats.totalBranches).toFixed(1) : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reports/Patient</p>
              <p className="text-2xl font-bold">
                {stats.totalPatients > 0 ? (stats.totalTestReports / stats.totalPatients).toFixed(1) : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}