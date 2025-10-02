import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Users, TestTube, MessageSquare, LogOut, Building2, Receipt, 
  CreditCard, History, Settings, RefreshCw, Search, Calendar, Clock,
  CalendarDays, CalendarRange, Upload, Plus
} from 'lucide-react';
import { AddPatientForm } from '@/components/forms/AddPatientForm';
import { AddTestReportForm } from '@/components/forms/AddTestReportForm';
import { AddFeedbackForm } from '@/components/forms/AddFeedbackForm';
import { AddBillForm } from '@/components/forms/AddBillForm';
import { AddDocumentForm } from '@/components/forms/AddDocumentForm';
import { AddFollowupForm } from '@/components/forms/AddFollowupForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { BillPrint } from '@/components/bills/BillPrint';
import { LedgerHistory } from '@/components/bills/LedgerHistory';
import { useFollowupReminders } from '@/hooks/useFollowupReminders';
import { Input } from '@/components/ui/input';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  name: string;
  location: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  created_at: string;
  labs?: { name: string };
  organizations?: { name: string };
}

interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone: string;
  patient_history?: string | null;
  created_at: string;
}

interface TestReport {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  patients: { full_name: string };
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  patients: { full_name: string };
  created_at: string;
}

interface Feedback {
  id: string;
  feedback_type: string;
  message: string;
  rating: number;
  patients?: { full_name: string };
  created_at: string;
}

interface Bill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  items: any;
  notes?: string;
  patients?: { full_name: string; patient_id: string } | null;
}

type TimeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'new' | 'pending' | 'completed' | 'action_needed' | 'review' | 'cancelled';

const Dashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [currentBranch, setCurrentBranch] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalReports: 0,
    totalDocuments: 0,
    totalBills: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    averageRating: 0
  });

  // Enable follow-up reminders
  useFollowupReminders();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile?.role === 'super_admin') {
        // Only redirect super_admin to /super-admin, not lab_admin
        navigate('/super-admin');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile && profile.role !== 'super_admin') {
      // Fetch branch details if user has branch_id
      if (profile.branch_id) {
        fetchBranchDetails();
      }
      fetchData();
    }
  }, [user, profile]);

  const fetchBranchDetails = async () => {
    if (!profile?.branch_id) return;
    
    try {
      const { data: branchData } = await supabase
        .from('branches')
        .select('*, organizations(*), labs(*)')
        .eq('id', profile.branch_id)
        .single();
      
      setCurrentBranch(branchData);
    } catch (error) {
      console.error('Error fetching branch details:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      // Check if user is a branch operator
      const isBranchOperator = profile && ['operator_1', 'operator_2', 'operator_3'].includes(profile.role);
      
      // Fetch branches
      let branchesQuery = supabase.from('branches').select('*, labs(*), organizations(*)');
      if (isBranchOperator && profile?.branch_id) {
        branchesQuery = branchesQuery.eq('id', profile.branch_id);
      }
      const { data: branchesData } = await branchesQuery;
      setBranches(branchesData || []);

      // Fetch patients with sorting by created_at DESC (latest first)
      let patientsQuery = supabase.from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      if (isBranchOperator && profile?.branch_id) {
        patientsQuery = patientsQuery.eq('branch_id', profile.branch_id);
      }
      const { data: patientsData } = await patientsQuery;
      setPatients(patientsData || []);

      // Fetch test reports
      let reportsQuery = supabase.from('test_reports').select('*, patients!test_reports_patient_id_fkey(full_name)');
      if (isBranchOperator && profile?.branch_id) {
        reportsQuery = reportsQuery.eq('branch_id', profile.branch_id);
      }
      const { data: reportsData } = await reportsQuery;
      setTestReports((reportsData || []).map(r => ({ ...r, patients: r.patients || undefined })));

      // Fetch documents
      let documentsQuery = supabase.from('documents').select('*, patients!fk_documents_patient(full_name)');
      if (isBranchOperator && profile?.branch_id) {
        documentsQuery = documentsQuery.eq('branch_id', profile.branch_id);
      }
      const { data: documentsData } = await documentsQuery;
      setDocuments((documentsData || []).map(d => ({ ...d, patients: d.patients || undefined })));

      // Fetch feedback
      let feedbackQuery = supabase.from('feedback').select('*, patients!fk_feedback_patient(full_name)');
      if (isBranchOperator && profile?.branch_id) {
        feedbackQuery = feedbackQuery.eq('branch_id', profile.branch_id);
      }
      const { data: feedbackData } = await feedbackQuery;
      setFeedback((feedbackData || []).map(f => ({ ...f, patients: f.patients || undefined })));

      // Fetch bills
      let billsQuery = supabase.from('bills').select('*, patients!fk_bills_patient(full_name, patient_id)');
      if (isBranchOperator && profile?.branch_id) {
        billsQuery = billsQuery.eq('branch_id', profile.branch_id);
      }
      const { data: billsData } = await billsQuery;
      setBills((billsData as any) || []);

      // Fetch followups
      let followupsQuery = supabase.from('patient_followups')
        .select(`
          *,
          patients!inner(full_name, patient_id),
          assigned_to_profile:profiles!patient_followups_assigned_to_fkey(full_name),
          created_by_profile:profiles!patient_followups_created_by_fkey(full_name)
        `)
        .order('due_at', { ascending: true });
      if (isBranchOperator && profile?.branch_id) {
        followupsQuery = followupsQuery.eq('branch_id', profile.branch_id);
      }
      const { data: followupsData } = await followupsQuery;
      setFollowups(followupsData || []);

      // Calculate stats
      const avgRating = feedbackData?.length 
        ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length 
        : 0;
      
      const totalRevenue = billsData?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
      const pendingAmount = billsData?.reduce((sum, bill) => sum + bill.due_amount, 0) || 0;
      
      setStats({
        totalPatients: patientsData?.length || 0,
        totalReports: reportsData?.length || 0,
        totalDocuments: documentsData?.length || 0,
        totalBills: billsData?.length || 0,
        totalRevenue,
        pendingAmount,
        averageRating: Math.round(avgRating * 10) / 10
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter utility functions
  const filterByTime = (items: any[], dateField: string) => {
    if (timeFilter === 'all') return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      switch (timeFilter) {
        case 'today':
          return isToday(itemDate);
        case 'yesterday':
          return isYesterday(itemDate);
        case 'week':
          return isThisWeek(itemDate);
        case 'month':
          return isThisMonth(itemDate);
        default:
          return true;
      }
    });
  };

  const filterByStatus = (items: TestReport[]) => {
    if (statusFilter === 'all') return items;
    
    return items.filter(item => {
      switch (statusFilter) {
        case 'new':
          return item.status === 'pending' && isToday(new Date(item.test_date));
        case 'pending':
          return item.status === 'pending';
        case 'completed':
          return item.status === 'completed';
        case 'action_needed':
          return item.status === 'action_needed';
        case 'review':
          return item.status === 'review';
        case 'cancelled':
          return item.status === 'cancelled';
        default:
          return true;
      }
    });
  };

  const filterBySearch = (items: any[], fields: string[]) => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(query);
      })
    );
  };

  // Filtered data
  const filteredPatients = useMemo(() => {
    let filtered = filterByTime(patients, 'created_at');
    filtered = filterBySearch(filtered, ['full_name', 'patient_id', 'phone']);
    return filtered;
  }, [patients, timeFilter, searchQuery]);

  const filteredTestReports = useMemo(() => {
    let filtered = filterByTime(testReports, 'test_date');
    filtered = filterByStatus(filtered);
    filtered = filterBySearch(filtered, ['test_type', 'patients.full_name']);
    return filtered;
  }, [testReports, timeFilter, statusFilter, searchQuery]);

  const filteredDocuments = useMemo(() => {
    let filtered = filterByTime(documents, 'created_at');
    filtered = filterBySearch(filtered, ['file_name', 'patients.full_name']);
    return filtered;
  }, [documents, timeFilter, searchQuery]);

  const filteredBills = useMemo(() => {
    let filtered = filterByTime(bills, 'bill_date');
    filtered = filterBySearch(filtered, ['bill_number', 'patients.full_name']);
    return filtered;
  }, [bills, timeFilter, searchQuery]);

  const filteredFeedback = useMemo(() => {
    let filtered = filterByTime(feedback, 'created_at');
    filtered = filterBySearch(filtered, ['message', 'patients.full_name']);
    return filtered;
  }, [feedback, timeFilter, searchQuery]);

  const filteredFollowups = useMemo(() => {
    let filtered = filterByTime(followups, 'due_at');
    filtered = filterBySearch(filtered, ['title', 'patients.full_name']);
    return filtered;
  }, [followups, timeFilter, searchQuery]);

  // Count functions
  const getTimeFilterCounts = (items: any[], dateField: string) => {
    return {
      today: items.filter(item => isToday(new Date(item[dateField]))).length,
      yesterday: items.filter(item => isYesterday(new Date(item[dateField]))).length,
      week: items.filter(item => isThisWeek(new Date(item[dateField]))).length,
      month: items.filter(item => isThisMonth(new Date(item[dateField]))).length,
      all: items.length
    };
  };

  const getStatusFilterCounts = (items: TestReport[]) => {
    return {
      all: items.length,
      new: items.filter(item => item.status === 'pending' && isToday(new Date(item.test_date))).length,
      pending: items.filter(item => item.status === 'pending').length,
      completed: items.filter(item => item.status === 'completed').length,
      action_needed: items.filter(item => item.status === 'action_needed').length,
      review: items.filter(item => item.status === 'review').length,
      cancelled: items.filter(item => item.status === 'cancelled').length
    };
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'operator_1': return 'bg-blue-500';
      case 'operator_2': return 'bg-green-500';
      case 'operator_3': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'partially_paid': return 'bg-orange-500';
      case 'overdue':
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen animate-enter">
      {/* Header */}
      <header className="bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tight">Lab Master</h1>
              <Badge className={`${getRoleColor(profile.role)} text-white`}>
                {profile.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {profile.full_name}
              </span>
              <Button 
                variant="outline" 
                onClick={() => navigate('/patient-history')}
              >
                <History className="h-4 w-4 mr-2" />
                Patient History
              </Button>
              {profile.role === 'admin' && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/lab-profile')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Lab Profile
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients, reports, bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Study
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Zip Upload
            </Button>
          </div>
        </div>

        {/* Time Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['today', 'yesterday', 'week', 'month', 'all'] as TimeFilter[]).map((filter) => {
            const counts = getTimeFilterCounts(patients, 'created_at');
            const icons = {
              today: <Clock className="h-3 w-3" />,
              yesterday: <Calendar className="h-3 w-3" />,
              week: <CalendarDays className="h-3 w-3" />,
              month: <CalendarRange className="h-3 w-3" />,
              all: null
            };
            
            return (
              <Button
                key={filter}
                variant={timeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className="relative"
              >
                {icons[filter] && <span className="mr-1">{icons[filter]}</span>}
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {counts[filter] > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 px-1.5 text-xs"
                  >
                    {counts[filter]}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Reports</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBills}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{stats.pendingAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="reports">Test Reports</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            {profile.role === 'admin' && <TabsTrigger value="locations">Locations</TabsTrigger>}
          </TabsList>

          <TabsContent value="patients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Patients</CardTitle>
                  <CardDescription>
                    Manage patient information and records
                    <span className="ml-2 text-primary font-semibold">
                      ({filteredPatients.length} patients)
                    </span>
                  </CardDescription>
                </div>
                <AddPatientForm onPatientAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Patient History</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{patient.patient_id}</Badge>
                        </TableCell>
                        <TableCell>{patient.full_name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {format(new Date(patient.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{patient.patient_history || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Test Reports</CardTitle>
                      <CardDescription>
                        View and manage test reports
                        <span className="ml-2 text-primary font-semibold">
                          ({filteredTestReports.length} reports)
                        </span>
                      </CardDescription>
                    </div>
                    <AddTestReportForm onReportAdded={fetchData} />
                  </div>
                  
                  {/* Status Filter Bar */}
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'new', 'pending', 'completed', 'action_needed', 'review', 'cancelled'] as StatusFilter[]).map((filter) => {
                      const counts = getStatusFilterCounts(testReports);
                      const statusColors = {
                        all: '',
                        new: 'text-blue-600',
                        pending: 'text-yellow-600',
                        completed: 'text-green-600',
                        action_needed: 'text-red-600',
                        review: 'text-purple-600',
                        cancelled: 'text-gray-600'
                      };
                      
                      return (
                        <Button
                          key={filter}
                          variant={statusFilter === filter ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter(filter)}
                          className="relative"
                        >
                          <span className={statusColors[filter]}>
                            {filter === 'all' ? 'All' : filter.replace('_', ' ').charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
                          </span>
                          {counts[filter] > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="ml-2 h-5 px-1.5 text-xs"
                            >
                              {counts[filter]}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Results</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTestReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.patients?.full_name}</TableCell>
                        <TableCell>{report.test_type}</TableCell>
                        <TableCell>{format(new Date(report.test_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-white",
                            report.status === 'completed' && "bg-green-500",
                            report.status === 'pending' && "bg-yellow-500",
                            report.status === 'action_needed' && "bg-red-500",
                            report.status === 'review' && "bg-purple-500",
                            report.status === 'cancelled' && "bg-gray-500"
                          )}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {format(new Date(report.created_at), 'dd/MM HH:mm')}
                        </TableCell>
                        <TableCell>
                          <pre className="text-xs max-w-xs truncate">{JSON.stringify(report.results, null, 2)}</pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Manage patient documents and files
                    <span className="ml-2 text-primary font-semibold">
                      ({filteredDocuments.length} documents)
                    </span>
                  </CardDescription>
                </div>
                <AddDocumentForm onDocumentAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.patients?.full_name}</TableCell>
                        <TableCell>{doc.file_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.file_type}</Badge>
                        </TableCell>
                        <TableCell>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followups">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Follow-up Tasks</CardTitle>
                  <CardDescription>
                    Manage patient follow-up reminders and tasks
                    <span className="ml-2 text-primary font-semibold">
                      ({filteredFollowups.length} tasks)
                    </span>
                  </CardDescription>
                </div>
                <AddFollowupForm onFollowupAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFollowups.map((followup) => (
                      <TableRow key={followup.id}>
                        <TableCell>
                          {followup.patients?.full_name} ({followup.patients?.patient_id})
                        </TableCell>
                        <TableCell className="font-medium">{followup.title}</TableCell>
                        <TableCell>
                          <Badge variant={
                            followup.priority === 'high' ? 'destructive' :
                            followup.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {followup.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(followup.due_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{followup.assigned_to_profile?.full_name}</TableCell>
                        <TableCell>
                          <Badge variant={followup.status === 'completed' ? 'default' : 'outline'}>
                            {followup.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {followup.status === 'open' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await supabase
                                    .from('patient_followups')
                                    .update({ 
                                      status: 'completed', 
                                      completed_at: new Date().toISOString() 
                                    })
                                    .eq('id', followup.id);
                                  fetchData();
                                  toast({
                                    title: "Success",
                                    description: "Follow-up completed",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to complete follow-up",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Feedback</CardTitle>
                  <CardDescription>
                    Patient feedback and ratings
                    <span className="ml-2 text-primary font-semibold">
                      ({filteredFeedback.length} feedback)
                    </span>
                  </CardDescription>
                </div>
                <AddFeedbackForm onFeedbackAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedback.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell>{fb.patients?.full_name || 'Anonymous'}</TableCell>
                        <TableCell>{fb.feedback_type}</TableCell>
                        <TableCell>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < fb.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{fb.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Bills</CardTitle>
                  <CardDescription>
                    Manage patient bills and payments
                    <span className="ml-2 text-primary font-semibold">
                      ({filteredBills.length} bills)
                    </span>
                  </CardDescription>
                </div>
                <AddBillForm onBillAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Bill Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.bill_number}</TableCell>
                        <TableCell>{bill.patients?.full_name}</TableCell>
                        <TableCell>{new Date(bill.bill_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{bill.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">₹{bill.paid_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">₹{bill.due_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(bill.status)} text-white`}>
                            {bill.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <BillPrint bill={bill} />
                            {bill.due_amount > 0 && (
                              <PaymentForm 
                                billId={bill.id} 
                                dueAmount={bill.due_amount} 
                                onPaymentAdded={fetchData} 
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <LedgerHistory />
          </TabsContent>

          {profile.role === 'admin' && branches && (
            <TabsContent value="locations">
              <Card>
                <CardHeader>
                  <CardTitle>Laboratory Locations</CardTitle>
                  <CardDescription>Manage laboratory branches and locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Lab</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell className="font-medium">{branch.name}</TableCell>
                          <TableCell>{branch.labs?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {branch.address_line1}
                            {branch.address_line2 && `, ${branch.address_line2}`}
                          </TableCell>
                          <TableCell>{branch.city}</TableCell>
                          <TableCell>{branch.state}</TableCell>
                          <TableCell>{branch.phone}</TableCell>
                          <TableCell>{new Date(branch.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;