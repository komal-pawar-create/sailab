import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, DollarSign, Calendar, Star, Activity, Clock, UserCheck, Stethoscope } from "lucide-react";
import { format } from "date-fns";

interface PatientOverviewProps {
  patient: {
    id: string;
    patient_id: string;
    full_name: string;
    phone?: string;
    email?: string;
    age?: number;
    age_in_months?: number;
    gender?: string;
    patient_history?: string;
    referred_by_doctor_name?: string;
    referred_by_doctor_phone?: string;
    created_at: string;
  };
}

interface Stats {
  totalTests: number;
  totalBills: number;
  pendingAmount: number;
  upcomingFollowups: number;
  totalDocuments: number;
  averageRating: number;
}

export default function PatientOverview({ patient }: PatientOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    totalBills: 0,
    pendingAmount: 0,
    upcomingFollowups: 0,
    totalDocuments: 0,
    averageRating: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatientStats();
    fetchRecentActivity();
  }, [patient.id]);

  const fetchPatientStats = async () => {
    setLoading(true);
    try {
      // Fetch test reports count
      const { count: testCount } = await supabase
        .from("test_reports")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      // Fetch bills and pending amount
      const { data: billsData } = await supabase
        .from("bills")
        .select("total_amount, paid_amount, due_amount")
        .eq("patient_id", patient.id);

      const totalBills = billsData?.length || 0;
      const pendingAmount = billsData?.reduce((sum, bill) => sum + (Number(bill.due_amount) || 0), 0) || 0;

      // Fetch upcoming followups
      const { count: followupCount } = await supabase
        .from("patient_followups")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id)
        .eq("status", "open")
        .gte("due_at", new Date().toISOString());

      // Fetch documents count
      const { count: docCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      // Fetch feedback ratings
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("rating")
        .eq("patient_id", patient.id)
        .not("rating", "is", null);

      const averageRating = feedbackData?.length 
        ? feedbackData.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackData.length 
        : 0;

      setStats({
        totalTests: testCount || 0,
        totalBills,
        pendingAmount,
        upcomingFollowups: followupCount || 0,
        totalDocuments: docCount || 0,
        averageRating,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch patient statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities = [];
      
      // Get recent test reports
      const { data: recentTests } = await supabase
        .from("test_reports")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(3);

      recentTests?.forEach(test => {
        activities.push({
          type: "test",
          title: `Test Report: ${test.test_type}`,
          date: test.created_at,
          status: test.status,
          icon: FileText,
        });
      });

      // Get recent bills
      const { data: recentBills } = await supabase
        .from("bills")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(3);

      recentBills?.forEach(bill => {
        activities.push({
          type: "bill",
          title: `Bill #${bill.bill_number}`,
          date: bill.created_at,
          status: bill.status,
          amount: bill.total_amount,
          icon: DollarSign,
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Test Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBills}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-destructive" />
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₹{stats.pendingAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingFollowups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avg. Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Details and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient ID</span>
              <span className="font-medium">{patient.patient_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium">{patient.full_name}</span>
            </div>
            {patient.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{patient.email}</span>
              </div>
            )}
            {(patient.age_in_months || patient.age) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">
                  {patient.age_in_months 
                    ? patient.age_in_months < 24 
                      ? `${patient.age_in_months} months`
                      : `${Math.floor(patient.age_in_months / 12)} years`
                    : `${patient.age} years`}
                </span>
              </div>
            )}
            {patient.gender && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium">{patient.gender}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered On</span>
              <span className="font-medium">
                {format(new Date(patient.created_at), "PPP")}
              </span>
            </div>
            
            {/* Patient History Section */}
            {patient.patient_history && (
              <>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Patient History</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{patient.patient_history}</p>
                </div>
              </>
            )}
            
            {/* Referral Information */}
            {(patient.referred_by_doctor_name || patient.referred_by_doctor_phone) && (
              <>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Referred By</span>
                  </div>
                  {patient.referred_by_doctor_name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Doctor Name</span>
                      <span className="text-sm font-medium">{patient.referred_by_doctor_name}</span>
                    </div>
                  )}
                  {patient.referred_by_doctor_phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Doctor Phone</span>
                      <span className="text-sm font-medium">{patient.referred_by_doctor_phone}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            activity.status === "completed" ? "default" :
                            activity.status === "pending" ? "secondary" :
                            activity.status === "paid" ? "default" :
                            "outline"
                          }>
                            {activity.status}
                          </Badge>
                          {activity.amount && (
                            <span className="text-sm text-muted-foreground">
                              ₹{activity.amount}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(activity.date), "PPp")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}