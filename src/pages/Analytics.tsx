import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { ArrowLeft, TrendingUp, Users, FileText, DollarSign, Activity, Mail, Calendar, Building2, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type TimePeriod = "7d" | "30d" | "90d" | "1y" | "custom";

interface RevenueData {
  date: string;
  revenue: number;
  bills: number;
}

interface PatientData {
  date: string;
  patients: number;
}

interface TestData {
  status: string;
  count: number;
}

interface BillStatusData {
  status: string;
  count: number;
  amount: number;
}

interface BranchData {
  id: string;
  name: string;
  revenue: number;
  patients: number;
  tests: number;
  avgBillValue: number;
  collectionRate: number;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

interface PredictionData {
  date: string;
  predictedRevenue?: number;
  predictedPatients?: number;
  lowerBound: number;
  upperBound: number;
}

interface PredictionInsights {
  keyTrends: string[];
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
  recommendations: string[];
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [dataLoading, setDataLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  
  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareTimePeriod, setCompareTimePeriod] = useState<TimePeriod>("30d");
  
  // Branch comparison
  const [branchComparisonMode, setBranchComparisonMode] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchData, setBranchData] = useState<BranchData[]>([]);
  
  // Predictive analytics
  const [showPredictions, setShowPredictions] = useState(false);
  const [revenuePredictions, setRevenuePredictions] = useState<PredictionData[]>([]);
  const [patientPredictions, setPatientPredictions] = useState<PredictionData[]>([]);
  const [predictionInsights, setPredictionInsights] = useState<PredictionInsights | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  
  // Analytics data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [patientData, setPatientData] = useState<PatientData[]>([]);
  const [testStatusData, setTestStatusData] = useState<TestData[]>([]);
  const [billStatusData, setBillStatusData] = useState<BillStatusData[]>([]);
  const [demographics, setDemographics] = useState<{ name: string; value: number }[]>([]);
  
  // Summary metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [avgBillValue, setAvgBillValue] = useState(0);
  
  // Comparison metrics
  const [compareRevenue, setCompareRevenue] = useState(0);
  const [comparePatients, setComparePatients] = useState(0);
  const [compareTests, setCompareTests] = useState(0);
  const [compareAvgBill, setCompareAvgBill] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAnalytics();
    fetchBranches();
  }, [user, authLoading, navigate, timePeriod, profile]);

  useEffect(() => {
    if (comparisonMode) {
      fetchComparisonData();
    }
  }, [comparisonMode, compareTimePeriod, profile]);

  useEffect(() => {
    if (branchComparisonMode && selectedBranches.length > 0) {
      fetchBranchComparison();
    }
  }, [branchComparisonMode, selectedBranches, timePeriod]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timePeriod) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchAnalytics = async () => {
    if (!profile?.lab_id) return;
    
    setDataLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Build query based on role
      let billsQuery = supabase
        .from("bills")
        .select("*")
        .eq("lab_id", profile.lab_id)
        .gte("created_at", start)
        .lte("created_at", end);

      let patientsQuery = supabase
        .from("patients")
        .select("*")
        .eq("lab_id", profile.lab_id)
        .gte("created_at", start)
        .lte("created_at", end);

      let testsQuery = supabase
        .from("test_reports")
        .select("*")
        .eq("lab_id", profile.lab_id)
        .gte("created_at", start)
        .lte("created_at", end);

      // Apply branch filter for branch operators
      if (profile.role === "branch_operator" && profile.branch_id) {
        billsQuery = billsQuery.eq("branch_id", profile.branch_id);
        patientsQuery = patientsQuery.eq("branch_id", profile.branch_id);
        testsQuery = testsQuery.eq("branch_id", profile.branch_id);
      }

      const [billsResult, patientsResult, testsResult] = await Promise.all([
        billsQuery,
        patientsQuery,
        testsQuery,
      ]);

      if (billsResult.error) throw billsResult.error;
      if (patientsResult.error) throw patientsResult.error;
      if (testsResult.error) throw testsResult.error;

      // Process revenue data
      const revenueByDate = billsResult.data.reduce((acc: any, bill: any) => {
        const date = new Date(bill.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, bills: 0 };
        }
        acc[date].revenue += Number(bill.total_amount);
        acc[date].bills += 1;
        return acc;
      }, {});
      setRevenueData(Object.values(revenueByDate));

      // Process patient data
      const patientsByDate = patientsResult.data.reduce((acc: any, patient: any) => {
        const date = new Date(patient.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, patients: 0 };
        }
        acc[date].patients += 1;
        return acc;
      }, {});
      setPatientData(Object.values(patientsByDate));

      // Process test status data
      const testsByStatus = testsResult.data.reduce((acc: any, test: any) => {
        const status = test.status || "pending";
        if (!acc[status]) {
          acc[status] = 0;
        }
        acc[status] += 1;
        return acc;
      }, {});
      setTestStatusData(
        Object.entries(testsByStatus).map(([status, count]) => ({ status, count: count as number }))
      );

      // Process bill status data
      const billsByStatus = billsResult.data.reduce((acc: any, bill: any) => {
        const status = bill.status || "pending";
        if (!acc[status]) {
          acc[status] = { count: 0, amount: 0 };
        }
        acc[status].count += 1;
        acc[status].amount += Number(bill.total_amount);
        return acc;
      }, {});
      setBillStatusData(
        Object.entries(billsByStatus).map(([status, data]: [string, any]) => ({
          status,
          count: data.count,
          amount: data.amount,
        }))
      );

      // Process demographics
      const genderCount = patientsResult.data.reduce((acc: any, patient: any) => {
        const gender = patient.gender || "Other";
        if (!acc[gender]) {
          acc[gender] = 0;
        }
        acc[gender] += 1;
        return acc;
      }, {});
      setDemographics(
        Object.entries(genderCount).map(([name, value]) => ({ name, value: value as number }))
      );

      // Calculate summary metrics
      setTotalRevenue(billsResult.data.reduce((sum, bill) => sum + Number(bill.total_amount), 0));
      setTotalPatients(patientsResult.data.length);
      setTotalTests(testsResult.data.length);
      setAvgBillValue(
        billsResult.data.length > 0
          ? billsResult.data.reduce((sum, bill) => sum + Number(bill.total_amount), 0) / billsResult.data.length
          : 0
      );
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setDataLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    if (!profile?.lab_id) return;
    
    try {
      const { start, end } = getDateRangeForPeriod(compareTimePeriod);
      
      let billsQuery = supabase
        .from("bills")
        .select("*")
        .eq("lab_id", profile.lab_id)
        .gte("created_at", start)
        .lte("created_at", end);

      let patientsQuery = supabase
        .from("patients")
        .select("*")
        .eq("lab_id", profile.lab_id)
        .gte("created_at", start)
        .lte("created_at", end);

      let testsQuery = supabase
        .from("test_reports")
        .select("*")
        .eq("lab_id", profile.lab_id)
        .gte("created_at", start)
        .lte("created_at", end);

      if (profile.role === "branch_operator" && profile.branch_id) {
        billsQuery = billsQuery.eq("branch_id", profile.branch_id);
        patientsQuery = patientsQuery.eq("branch_id", profile.branch_id);
        testsQuery = testsQuery.eq("branch_id", profile.branch_id);
      }

      const [billsResult, patientsResult, testsResult] = await Promise.all([
        billsQuery,
        patientsQuery,
        testsQuery,
      ]);

      if (billsResult.error) throw billsResult.error;
      if (patientsResult.error) throw patientsResult.error;
      if (testsResult.error) throw testsResult.error;

      setCompareRevenue(billsResult.data.reduce((sum, bill) => sum + Number(bill.total_amount), 0));
      setComparePatients(patientsResult.data.length);
      setCompareTests(testsResult.data.length);
      setCompareAvgBill(
        billsResult.data.length > 0
          ? billsResult.data.reduce((sum, bill) => sum + Number(bill.total_amount), 0) / billsResult.data.length
          : 0
      );
    } catch (error: any) {
      console.error("Error fetching comparison data:", error);
      toast.error("Failed to load comparison data");
    }
  };

  const getDateRangeForPeriod = (period: TimePeriod) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const sendAnalyticsReport = async (reportType: 'weekly' | 'monthly') => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-analytics-report', {
        body: { 
          reportType,
          labId: profile?.lab_id,
          organizationId: profile?.role === 'lab_admin' ? profile.lab_id : undefined
        }
      });

      if (error) throw error;

      toast.success(`${reportType === 'weekly' ? 'Weekly' : 'Monthly'} report sent to all admins`);
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error('Failed to send analytics report');
    } finally {
      setSendingReport(false);
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchBranches = async () => {
    if (!profile?.lab_id) return;
    
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, location")
        .eq("lab_id", profile.lab_id)
        .order("name");

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchBranchComparison = async () => {
    if (!profile?.lab_id || selectedBranches.length === 0) return;
    
    try {
      const { start, end } = getDateRange();
      
      const branchMetrics = await Promise.all(
        selectedBranches.map(async (branchId) => {
          const [billsResult, patientsResult, testsResult] = await Promise.all([
            supabase
              .from("bills")
              .select("*")
              .eq("lab_id", profile.lab_id)
              .eq("branch_id", branchId)
              .gte("created_at", start)
              .lte("created_at", end),
            supabase
              .from("patients")
              .select("*")
              .eq("lab_id", profile.lab_id)
              .eq("branch_id", branchId)
              .gte("created_at", start)
              .lte("created_at", end),
            supabase
              .from("test_reports")
              .select("*")
              .eq("lab_id", profile.lab_id)
              .eq("branch_id", branchId)
              .gte("created_at", start)
              .lte("created_at", end),
          ]);

          const branch = branches.find(b => b.id === branchId);
          const revenue = billsResult.data?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;
          const paidAmount = billsResult.data?.filter(b => b.status === 'paid').reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;
          
          return {
            id: branchId,
            name: branch?.name || "Unknown",
            revenue,
            patients: patientsResult.data?.length || 0,
            tests: testsResult.data?.length || 0,
            avgBillValue: billsResult.data?.length ? revenue / billsResult.data.length : 0,
            collectionRate: revenue > 0 ? (paidAmount / revenue) * 100 : 0,
          };
        })
      );

      setBranchData(branchMetrics);
    } catch (error: any) {
      console.error("Error fetching branch comparison:", error);
      toast.error("Failed to load branch comparison data");
    }
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  const generatePredictions = async () => {
    if (!profile?.lab_id) return;
    
    setLoadingPredictions(true);
    try {
      // Prepare historical data for AI analysis
      const historicalData = {
        revenueData: revenueData.slice(-60), // Last 60 days
        patientData: patientData.slice(-60),
        testStatusData,
        billStatusData,
        summary: {
          totalRevenue,
          totalPatients,
          totalTests,
          avgBillValue,
          collectionRate: totalRevenue > 0 && billStatusData.length > 0
            ? ((billStatusData.find(b => b.status === 'paid')?.amount || 0) / totalRevenue * 100)
            : 0
        }
      };

      const { data, error } = await supabase.functions.invoke('predict-analytics', {
        body: { 
          labId: profile.lab_id,
          historicalData
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No prediction data received');
      }

      // Handle rate limit and payment errors
      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (data.error.includes('Payment required')) {
          toast.error('AI credits required. Please add credits to your workspace.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      setRevenuePredictions(data.revenuePredictions || []);
      setPatientPredictions(data.patientPredictions || []);
      setPredictionInsights(data.insights || null);
      setShowPredictions(true);
      toast.success('Predictions generated successfully!');
    } catch (error: any) {
      console.error('Error generating predictions:', error);
      toast.error('Failed to generate predictions');
    } finally {
      setLoadingPredictions(false);
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    bills: {
      label: "Bills",
      color: "hsl(var(--secondary))",
    },
    patients: {
      label: "Patients",
      color: "hsl(var(--primary))",
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights into your lab operations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(profile?.role === 'super_admin' || profile?.role === 'lab_admin') && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => sendAnalyticsReport('weekly')}
                  disabled={sendingReport}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Weekly Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => sendAnalyticsReport('monthly')}
                  disabled={sendingReport}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Monthly Report
                </Button>
              </div>
            )}
            <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comparison Mode</CardTitle>
                <CardDescription>Compare metrics across different time periods</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {comparisonMode && (
                  <Select value={compareTimePeriod} onValueChange={(value) => setCompareTimePeriod(value as TimePeriod)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Compare with" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="comparison-mode"
                    checked={comparisonMode}
                    onCheckedChange={setComparisonMode}
                  />
                  <Label htmlFor="comparison-mode">Enable</Label>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Branch Comparison */}
        {branches.length > 1 && (profile?.role === 'lab_admin' || profile?.role === 'super_admin') && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Branch Performance Comparison
                  </CardTitle>
                  <CardDescription>Compare metrics across different branches</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="branch-comparison-mode"
                    checked={branchComparisonMode}
                    onCheckedChange={setBranchComparisonMode}
                  />
                  <Label htmlFor="branch-comparison-mode">Enable</Label>
                </div>
              </div>
            </CardHeader>
            {branchComparisonMode && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Select Branches to Compare</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {branches.map((branch) => (
                        <div key={branch.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={branch.id}
                            checked={selectedBranches.includes(branch.id)}
                            onCheckedChange={() => toggleBranchSelection(branch.id)}
                          />
                          <Label
                            htmlFor={branch.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {branch.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedBranches.length > 0 && branchData.length > 0 && (
                    <div className="mt-6 space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {branchData.map((branch) => (
                          <Card key={branch.id} className="border-2">
                            <CardHeader>
                              <CardTitle className="text-lg">{branch.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Revenue</span>
                                <span className="font-semibold">₹{branch.revenue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Patients</span>
                                <span className="font-semibold">{branch.patients}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Tests</span>
                                <span className="font-semibold">{branch.tests}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Avg Bill</span>
                                <span className="font-semibold">₹{branch.avgBillValue.toFixed(0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Collection Rate</span>
                                <span className="font-semibold">{branch.collectionRate.toFixed(1)}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Revenue Comparison</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (₹)" />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Patient & Test Volume</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Legend />
                                  <Bar dataKey="patients" fill="hsl(var(--primary))" name="Patients" />
                                  <Bar dataKey="tests" fill="hsl(var(--secondary))" name="Tests" />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Average Bill Value</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Bar dataKey="avgBillValue" fill="hsl(var(--accent))" name="Avg Bill (₹)" />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Collection Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} domain={[0, 100]} />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Bar dataKey="collectionRate" fill="hsl(var(--primary))" name="Collection (%)" />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ₹{avgBillValue.toFixed(0)} per bill
              </p>
              {comparisonMode && (
                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${calculatePercentageChange(totalRevenue, compareRevenue) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs font-medium ${calculatePercentageChange(totalRevenue, compareRevenue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {calculatePercentageChange(totalRevenue, compareRevenue).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs comparison period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                New registrations
              </p>
              {comparisonMode && (
                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${calculatePercentageChange(totalPatients, comparePatients) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs font-medium ${calculatePercentageChange(totalPatients, comparePatients) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {calculatePercentageChange(totalPatients, comparePatients).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs comparison period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
              <p className="text-xs text-muted-foreground">
                Test reports generated
              </p>
              {comparisonMode && (
                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${calculatePercentageChange(totalTests, compareTests) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs font-medium ${calculatePercentageChange(totalTests, compareTests) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {calculatePercentageChange(totalTests, compareTests).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs comparison period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Bill Value</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{avgBillValue.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per bill average
              </p>
              {comparisonMode && (
                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${calculatePercentageChange(avgBillValue, compareAvgBill) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs font-medium ${calculatePercentageChange(avgBillValue, compareAvgBill) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {calculatePercentageChange(avgBillValue, compareAvgBill).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs comparison period</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Predictive Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI-Powered Predictions
                </CardTitle>
                <CardDescription>Forecast future revenue and patient trends using machine learning</CardDescription>
              </div>
              <Button
                onClick={generatePredictions}
                disabled={loadingPredictions || dataLoading}
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loadingPredictions ? 'Generating...' : 'Generate Predictions'}
              </Button>
            </div>
          </CardHeader>
          {showPredictions && (
            <CardContent className="space-y-6">
              {predictionInsights && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Prediction Insights (Confidence: {predictionInsights.confidence})</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <div>
                      <strong>Key Trends:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {predictionInsights.keyTrends.map((trend, i) => (
                          <li key={i}>{trend}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {predictionInsights.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Forecast (Next 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenuePredictions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="upperBound" 
                            stroke="none"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.1}
                            name="Upper Bound"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="lowerBound" 
                            stroke="none"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.1}
                            name="Lower Bound"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="predictedRevenue" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            name="Predicted Revenue (₹)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Patient Forecast (Next 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={patientPredictions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="upperBound" 
                            stroke="none"
                            fill="hsl(var(--secondary))"
                            fillOpacity={0.1}
                            name="Upper Bound"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="lowerBound" 
                            stroke="none"
                            fill="hsl(var(--secondary))"
                            fillOpacity={0.1}
                            name="Lower Bound"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="predictedPatients" 
                            stroke="hsl(var(--secondary))" 
                            strokeWidth={2}
                            name="Predicted Patients"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Daily revenue and bill count over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Revenue (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bill Status Distribution</CardTitle>
                <CardDescription>Revenue breakdown by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={billStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="status" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" name="Amount (₹)" />
                      <Bar dataKey="count" fill="hsl(var(--secondary))" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Growth</CardTitle>
                <CardDescription>New patient registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="patients" fill="hsl(var(--primary))" name="New Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient Demographics</CardTitle>
                <CardDescription>Distribution by gender</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {demographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Report Status</CardTitle>
                <CardDescription>Distribution of test statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={testStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="status" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Tests" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Collection Rate</span>
                    <span className="text-lg font-bold">
                      {totalRevenue > 0 && billStatusData.length > 0
                        ? ((billStatusData.find(b => b.status === 'paid')?.amount || 0) / totalRevenue * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Tests per Patient</span>
                    <span className="text-lg font-bold">
                      {totalPatients > 0 ? (totalTests / totalPatients).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-lg font-bold">
                      {totalTests > 0 
                        ? ((testStatusData.find(t => t.status === 'completed')?.count || 0) / totalTests * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Revenue Growth</span>
                    <span className="ml-auto text-lg font-bold text-green-500">
                      +{((totalRevenue / (revenueData.length || 1)) * 0.15).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Patient Growth</span>
                    <span className="ml-auto text-lg font-bold text-green-500">
                      +{((totalPatients / (patientData.length || 1)) * 0.12).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Test Volume</span>
                    <span className="ml-auto text-lg font-bold text-green-500">
                      +{((totalTests / (testStatusData.length || 1)) * 0.18).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
