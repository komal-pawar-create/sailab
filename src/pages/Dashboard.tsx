import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Users, TestTube, MessageSquare, LogOut, Building2, Receipt, CreditCard, History } from 'lucide-react';
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
  email: string;
}

interface TestReport {
  id: string;
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  patients: { full_name: string };
}

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  patients: { full_name: string };
}

interface Feedback {
  id: string;
  feedback_type: string;
  message: string;
  rating: number;
  patients?: { full_name: string };
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
      } else if (profile?.role === 'super_admin' || profile?.role === 'lab_admin') {
        navigate('/super-admin');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile && profile.role !== 'super_admin' && profile.role !== 'lab_admin') {
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
      // Fetch branches
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*, labs(*), organizations(*)');
      setBranches(branchesData || []);

      // Fetch patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*');
      setPatients(patientsData || []);

      // Fetch test reports
      const { data: reportsData } = await supabase
        .from('test_reports')
        .select('*, patients(full_name)');
      setTestReports(reportsData || []);

      // Fetch documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*, patients(full_name)');
      setDocuments(documentsData || []);

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*, patients(full_name)');
      setFeedback(feedbackData || []);

      // Fetch bills
      const { data: billsData } = await supabase
        .from('bills')
        .select('*, patients(full_name, patient_id)');
      setBills((billsData as any) || []);

      // Fetch followups
      const { data: followupsData } = await supabase
        .from('patient_followups')
        .select(`
          *,
          patients!inner(full_name, patient_id),
          assigned_to_profile:profiles!patient_followups_assigned_to_fkey(full_name),
          created_by_profile:profiles!patient_followups_created_by_fkey(full_name)
        `)
        .order('due_at', { ascending: true });
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
    }
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
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <CardDescription>Manage patient information and records</CardDescription>
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
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.patient_id}</TableCell>
                        <TableCell>{patient.full_name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.gender}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Test Reports</CardTitle>
                  <CardDescription>View and manage laboratory test results</CardDescription>
                </div>
                <AddTestReportForm onReportAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Results</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.patients?.full_name}</TableCell>
                        <TableCell>{report.test_type}</TableCell>
                        <TableCell>{new Date(report.test_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(report.status)} text-white`}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <pre className="text-xs">{JSON.stringify(report.results, null, 2)}</pre>
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
                  <CardDescription>Manage patient documents and files</CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.patients?.full_name}</TableCell>
                        <TableCell>{doc.file_name}</TableCell>
                        <TableCell>{doc.file_type}</TableCell>
                        <TableCell>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</TableCell>
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
                  <CardDescription>Manage patient follow-up reminders and tasks</CardDescription>
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
                    {followups.map((followup) => (
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
                  <CardDescription>Patient feedback and ratings</CardDescription>
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
                    {feedback.map((fb) => (
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
                  <CardDescription>Manage patient bills and payments</CardDescription>
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
                    {bills.map((bill) => (
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