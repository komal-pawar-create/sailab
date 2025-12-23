import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDate, cn } from "@/lib/utils";
import { format, isPast, isToday, startOfDay, endOfDay } from "date-fns";
import { 
  Search, 
  CalendarIcon, 
  Check, 
  Eye, 
  Filter, 
  X, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ListTodo
} from "lucide-react";
import { AddFollowupForm } from "@/components/forms/AddFollowupForm";

interface Followup {
  id: string;
  title: string;
  details: string | null;
  due_at: string;
  status: string;
  priority: string;
  patient_id: string;
  assigned_to: string;
  created_at: string;
  completed_at: string | null;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
  };
}

export default function Followups() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFollowups();
  }, [user, authLoading, navigate]);

  const fetchFollowups = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("patient_followups")
        .select(`
          *,
          patients!fk_patient_followups_patient(id, full_name, patient_id)
        `)
        .order("due_at", { ascending: true });

      // Apply role-based filtering
      if (profile.role === "branch_operator" && profile.branch_id) {
        query = query.eq("branch_id", profile.branch_id);
      } else if (profile.lab_id && profile.role !== "super_admin") {
        query = query.eq("lab_id", profile.lab_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFollowups(data || []);
    } catch (error) {
      console.error("Error fetching followups:", error);
      toast({
        title: "Error",
        description: "Failed to load follow-ups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (followup: Followup) => {
    const { error } = await supabase
      .from("patient_followups")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", followup.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Follow-up marked as completed",
      });
      fetchFollowups();
    }
  };

  const handleReopen = async (followup: Followup) => {
    const { error } = await supabase
      .from("patient_followups")
      .update({ status: "open", completed_at: null })
      .eq("id", followup.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reopen follow-up",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Follow-up reopened",
      });
      fetchFollowups();
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch("");
  };

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || dateFrom || dateTo || search;

  // Apply all filters
  const filteredFollowups = followups.filter((f) => {
    // Search filter
    if (search && !f.title.toLowerCase().includes(search.toLowerCase()) && 
        !f.patients?.full_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "open" && f.status !== "open") return false;
      if (statusFilter === "completed" && f.status !== "completed") return false;
      if (statusFilter === "overdue") {
        const dueDate = new Date(f.due_at);
        if (f.status === "completed" || !isPast(dueDate) || isToday(dueDate)) return false;
      }
      if (statusFilter === "due_today") {
        if (!isToday(new Date(f.due_at)) || f.status === "completed") return false;
      }
    }

    // Priority filter
    if (priorityFilter !== "all" && f.priority !== priorityFilter) {
      return false;
    }

    // Date range filter
    if (dateFrom) {
      const dueDate = new Date(f.due_at);
      if (dueDate < startOfDay(dateFrom)) return false;
    }
    if (dateTo) {
      const dueDate = new Date(f.due_at);
      if (dueDate > endOfDay(dateTo)) return false;
    }

    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string, dueAt: string) => {
    if (status === "completed") {
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    }
    const dueDate = new Date(dueAt);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isToday(dueDate)) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Due Today</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  // Stats
  const stats = {
    total: followups.length,
    open: followups.filter(f => f.status === "open").length,
    overdue: followups.filter(f => f.status === "open" && isPast(new Date(f.due_at)) && !isToday(new Date(f.due_at))).length,
    dueToday: followups.filter(f => f.status === "open" && isToday(new Date(f.due_at))).length,
    completed: followups.filter(f => f.status === "completed").length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-ups</h1>
          <p className="text-muted-foreground">Manage patient follow-ups and reminders</p>
        </div>
        <AddFollowupForm onFollowupAdded={fetchFollowups} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { clearFilters(); setStatusFilter("all"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { clearFilters(); setStatusFilter("open"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => { clearFilters(); setStatusFilter("overdue"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-orange-500/50 transition-colors" onClick={() => { clearFilters(); setStatusFilter("due_today"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <CalendarIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.dueToday}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => { clearFilters(); setStatusFilter("completed"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title or patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due_today">Due Today</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Follow-ups ({filteredFollowups.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Title</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="w-[140px]">Due Date</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFollowups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No follow-ups found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFollowups.map((followup) => (
                      <TableRow key={followup.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{followup.title}</p>
                            {followup.details && (
                              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                {followup.details}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{followup.patients?.full_name || "-"}</p>
                            {followup.patients?.patient_id && (
                              <p className="text-xs text-muted-foreground">{followup.patients.patient_id}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(followup.due_at, true)}
                        </TableCell>
                        <TableCell>{getPriorityBadge(followup.priority)}</TableCell>
                        <TableCell>{getStatusBadge(followup.status, followup.due_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => followup.patients?.id && navigate(`/patient/${followup.patients.id}`)}
                              title="View Patient"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {followup.status === "completed" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReopen(followup)}
                                className="h-8 text-xs"
                              >
                                Reopen
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleComplete(followup)}
                                className="h-8 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Done
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
