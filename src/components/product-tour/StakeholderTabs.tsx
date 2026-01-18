import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  UserCog, 
  Users, 
  User, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle2,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  Bell,
  Smartphone,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  MousePointer,
  ArrowRight,
  Video,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Video embed helper functions
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getVimeoVideoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const VideoEmbed = ({ video }: { video: { video_url: string; video_type: string; title: string } }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (video.video_type === 'youtube') {
    const videoId = getYouTubeVideoId(video.video_url);
    if (!videoId) return null;
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Play className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={cn("w-full h-full transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    );
  }

  if (video.video_type === 'vimeo') {
    const videoId = getVimeoVideoId(video.video_url);
    if (!videoId) return null;
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Play className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title={video.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={cn("w-full h-full transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    );
  }

  // Direct video (MP4)
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
      <video
        src={video.video_url}
        title={video.title}
        controls
        className="w-full h-full"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  video_type: string;
  duration: string | null;
  thumbnail_url: string | null;
  display_order: number | null;
}

// Video tutorials section component
const VideoTutorialsSection = ({ stakeholderId }: { stakeholderId: string }) => {
  const { data: videos, isLoading } = useQuery({
    queryKey: ['demo-videos', stakeholderId],
    queryFn: async () => {
      // Map stakeholder IDs to video types/categories
      const videoTypeMap: Record<string, string[]> = {
        owner: ['dashboard', 'analytics', 'owner', 'management'],
        admin: ['admin', 'settings', 'configuration', 'users'],
        operator: ['operator', 'registration', 'billing', 'reports'],
        patient: ['patient', 'digital', 'notification']
      };
      
      const types = videoTypeMap[stakeholderId] || [];
      
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      // Filter videos based on stakeholder types or return all if no specific match
      if (data && data.length > 0) {
        const filtered = data.filter(video => 
          types.some(type => 
            video.title.toLowerCase().includes(type) || 
            video.video_type.toLowerCase().includes(type) ||
            (video.description?.toLowerCase().includes(type))
          )
        );
        // Return filtered or first 2 videos as fallback
        return filtered.length > 0 ? filtered.slice(0, 3) : data.slice(0, 2);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="aspect-video rounded-lg" />
          <Skeleton className="aspect-video rounded-lg" />
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Video Tutorials</h3>
        <Badge variant="secondary" className="text-xs">
          {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
        </Badge>
      </div>
      <div className={cn(
        "grid gap-4",
        videos.length === 1 ? "max-w-lg mx-auto" : "md:grid-cols-2"
      )}>
        {videos.map((video: DemoVideo) => (
          <div key={video.id} className="space-y-2">
            <VideoEmbed video={video} />
            <div className="px-1">
              <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
              {video.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
              )}
              {video.duration && (
                <span className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {video.duration}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface WorkflowStep {
  title: string;
  description: string;
  mockupContent: React.ReactNode;
  duration: number;
}

interface StakeholderFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
}

interface StakeholderData {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  features: StakeholderFeature[];
  timeSaved: string;
  keyBenefit: string;
  workflowSteps: WorkflowStep[];
}

// Animated mockup components for each workflow
const DashboardMockup = ({ highlight }: { highlight?: string }) => (
  <div className="bg-card rounded-lg border shadow-lg overflow-hidden w-full aspect-video">
    <div className="h-8 bg-muted/50 border-b flex items-center px-3 gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
      </div>
      <div className="text-xs text-muted-foreground ml-2">Lab Master Dashboard</div>
    </div>
    <div className="p-3 space-y-3">
      <div className="flex gap-2">
        {['Today', 'Week', 'Month'].map((period, i) => (
          <div key={i} className={cn(
            "px-3 py-1 rounded text-xs transition-all duration-500",
            highlight === 'stats' && i === 0 ? "bg-primary text-primary-foreground scale-105" : "bg-muted"
          )}>
            {period}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Revenue', value: '₹45,280', trend: '+12%' },
          { label: 'Patients', value: '127', trend: '+8%' },
          { label: 'Tests', value: '342', trend: '+15%' }
        ].map((stat, i) => (
          <div key={i} className={cn(
            "p-2 rounded-lg transition-all duration-500",
            highlight === 'revenue' && i === 0 ? "bg-primary/20 ring-2 ring-primary scale-105" : "bg-muted/50"
          )}>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            <div className="text-sm font-bold">{stat.value}</div>
            <div className="text-[10px] text-green-500">{stat.trend}</div>
          </div>
        ))}
      </div>
      <div className={cn(
        "h-20 rounded-lg transition-all duration-500 overflow-hidden",
        highlight === 'chart' ? "ring-2 ring-primary" : ""
      )}>
        <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 flex items-end justify-around px-2 pb-1">
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <div 
              key={i} 
              className="w-3 bg-primary/60 rounded-t transition-all duration-700"
              style={{ 
                height: highlight === 'chart' ? `${h}%` : '20%',
                transitionDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PatientRegMockup = ({ highlight }: { highlight?: string }) => (
  <div className="bg-card rounded-lg border shadow-lg overflow-hidden w-full aspect-video">
    <div className="h-8 bg-muted/50 border-b flex items-center px-3 gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
      </div>
      <div className="text-xs text-muted-foreground ml-2">Patient Registration</div>
    </div>
    <div className="p-3 space-y-2">
      <div className={cn(
        "p-2 rounded border bg-background transition-all duration-500",
        highlight === 'form' ? "ring-2 ring-primary" : ""
      )}>
        <div className="text-[10px] text-muted-foreground mb-1">Patient Name</div>
        <div className="h-5 bg-muted rounded flex items-center px-2">
          <span className={cn(
            "text-xs transition-all duration-500",
            highlight === 'form' ? "opacity-100" : "opacity-50"
          )}>
            {highlight === 'form' ? 'Rajesh Kumar' : ''}
          </span>
          {highlight === 'form' && <span className="w-0.5 h-3 bg-primary animate-pulse ml-0.5" />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={cn(
          "p-2 rounded border bg-background transition-all duration-500",
          highlight === 'details' ? "ring-2 ring-primary" : ""
        )}>
          <div className="text-[10px] text-muted-foreground mb-1">Phone</div>
          <div className="h-5 bg-muted rounded flex items-center px-2">
            <span className="text-xs">{highlight === 'details' ? '9876543210' : ''}</span>
          </div>
        </div>
        <div className={cn(
          "p-2 rounded border bg-background transition-all duration-500",
          highlight === 'details' ? "ring-2 ring-primary" : ""
        )}>
          <div className="text-[10px] text-muted-foreground mb-1">Age</div>
          <div className="h-5 bg-muted rounded flex items-center px-2">
            <span className="text-xs">{highlight === 'details' ? '35 Years' : ''}</span>
          </div>
        </div>
      </div>
      <div className={cn(
        "p-2 rounded border bg-background transition-all duration-500",
        highlight === 'id' ? "ring-2 ring-primary bg-primary/5" : ""
      )}>
        <div className="text-[10px] text-muted-foreground mb-1">Auto-Generated Patient ID</div>
        <div className="h-5 bg-muted rounded flex items-center px-2">
          <span className={cn(
            "text-xs font-mono font-bold transition-all",
            highlight === 'id' ? "text-primary" : ""
          )}>
            {highlight === 'id' ? 'LAB-2024-00127' : ''}
          </span>
        </div>
      </div>
      <Button 
        size="sm" 
        className={cn(
          "w-full h-7 text-xs transition-all duration-500",
          highlight === 'submit' ? "scale-105 shadow-lg" : ""
        )}
      >
        {highlight === 'submit' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
        {highlight === 'submit' ? 'Registered!' : 'Register Patient'}
      </Button>
    </div>
  </div>
);

const AdminSettingsMockup = ({ highlight }: { highlight?: string }) => (
  <div className="bg-card rounded-lg border shadow-lg overflow-hidden w-full aspect-video">
    <div className="h-8 bg-muted/50 border-b flex items-center px-3 gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
      </div>
      <div className="text-xs text-muted-foreground ml-2">Admin Settings</div>
    </div>
    <div className="flex h-[calc(100%-32px)]">
      <div className="w-1/3 border-r bg-muted/30 p-2 space-y-1">
        {['Users', 'Roles', 'Tests', 'Billing'].map((item, i) => (
          <div key={i} className={cn(
            "px-2 py-1.5 rounded text-xs transition-all duration-500 cursor-pointer",
            highlight === 'nav' && i === 0 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}>
            {item}
          </div>
        ))}
      </div>
      <div className="flex-1 p-2 space-y-2">
        <div className={cn(
          "flex items-center justify-between p-2 rounded border transition-all duration-500",
          highlight === 'user' ? "ring-2 ring-primary bg-primary/5" : ""
        )}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-3 w-3" />
            </div>
            <div>
              <div className="text-xs font-medium">Dr. Sharma</div>
              <div className="text-[10px] text-muted-foreground">Lab Admin</div>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] h-5">Active</Badge>
        </div>
        <div className={cn(
          "flex items-center justify-between p-2 rounded border transition-all duration-500",
          highlight === 'permissions' ? "ring-2 ring-primary" : ""
        )}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3" />
            </div>
            <div>
              <div className="text-xs font-medium">Operator 1</div>
              <div className="text-[10px] text-muted-foreground">Branch Operator</div>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">Limited</Badge>
        </div>
        {highlight === 'add' && (
          <Button size="sm" className="w-full h-7 text-xs animate-fade-in">
            + Add New User
          </Button>
        )}
      </div>
    </div>
  </div>
);

const PatientReportMockup = ({ highlight }: { highlight?: string }) => (
  <div className="bg-card rounded-lg border shadow-lg overflow-hidden w-full aspect-video">
    <div className="h-8 bg-muted/50 border-b flex items-center px-3 gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
      </div>
      <div className="text-xs text-muted-foreground ml-2">Patient App</div>
    </div>
    <div className="p-3 space-y-2 bg-gradient-to-b from-background to-muted/20">
      <div className={cn(
        "p-2 rounded-lg border bg-background transition-all duration-500",
        highlight === 'notification' ? "ring-2 ring-primary animate-pulse" : ""
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Bell className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <div className="text-xs font-medium">Report Ready!</div>
            <div className="text-[10px] text-muted-foreground">Your blood test results are available</div>
          </div>
        </div>
      </div>
      <div className={cn(
        "p-2 rounded-lg border bg-background transition-all duration-500",
        highlight === 'report' ? "ring-2 ring-primary" : ""
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium">Complete Blood Count</div>
          <Badge variant="secondary" className="text-[10px] h-5">PDF</Badge>
        </div>
        <div className="h-16 bg-muted/50 rounded flex items-center justify-center">
          <FileText className={cn(
            "h-6 w-6 transition-all duration-500",
            highlight === 'report' ? "text-primary scale-110" : "text-muted-foreground"
          )} />
        </div>
      </div>
      <div className={cn(
        "flex gap-2 transition-all duration-500",
        highlight === 'share' ? "opacity-100" : "opacity-70"
      )}>
        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
          <Smartphone className="h-3 w-3 mr-1" /> WhatsApp
        </Button>
        <Button size="sm" className="flex-1 h-7 text-xs">
          Download
        </Button>
      </div>
    </div>
  </div>
);

const stakeholders: StakeholderData[] = [
  {
    id: 'owner',
    name: 'Lab Owners',
    icon: <Building2 className="h-5 w-5" />,
    tagline: 'Complete visibility and control over your laboratory business',
    workflowSteps: [
      {
        title: 'Login to Dashboard',
        description: 'Access your personalized command center with role-based views',
        mockupContent: <DashboardMockup highlight="stats" />,
        duration: 2500
      },
      {
        title: 'View Revenue Analytics',
        description: 'Real-time revenue tracking with daily, weekly, and monthly comparisons',
        mockupContent: <DashboardMockup highlight="revenue" />,
        duration: 2500
      },
      {
        title: 'Analyze Trends',
        description: 'Interactive charts show patient flow, test volumes, and collection patterns',
        mockupContent: <DashboardMockup highlight="chart" />,
        duration: 2500
      }
    ],
    features: [
      {
        icon: <BarChart3 className="h-6 w-6 text-primary" />,
        title: 'Revenue Dashboard',
        description: 'Real-time insights into daily, weekly, and monthly revenue with trend analysis',
        benefit: 'Make data-driven decisions instantly'
      },
      {
        icon: <Building2 className="h-6 w-6 text-primary" />,
        title: 'Multi-Branch Management',
        description: 'Manage multiple lab locations from a single dashboard with unified reporting',
        benefit: 'Scale your business effortlessly'
      },
      {
        icon: <TrendingUp className="h-6 w-6 text-primary" />,
        title: 'Performance Analytics',
        description: 'Track staff productivity, test volumes, and collection efficiency',
        benefit: 'Optimize operations continuously'
      },
      {
        icon: <Shield className="h-6 w-6 text-primary" />,
        title: 'License Management',
        description: 'Automated alerts for license renewals and compliance tracking',
        benefit: 'Never miss critical deadlines'
      }
    ],
    timeSaved: '3+ hours daily',
    keyBenefit: '60% reduction in billing errors'
  },
  {
    id: 'admin',
    name: 'Administrators',
    icon: <UserCog className="h-5 w-5" />,
    tagline: 'Powerful tools to configure and manage your lab efficiently',
    workflowSteps: [
      {
        title: 'Access Admin Panel',
        description: 'Navigate to settings with organized sidebar for all configurations',
        mockupContent: <AdminSettingsMockup highlight="nav" />,
        duration: 2500
      },
      {
        title: 'Manage User Accounts',
        description: 'View all staff members with their roles and access levels',
        mockupContent: <AdminSettingsMockup highlight="user" />,
        duration: 2500
      },
      {
        title: 'Set Permissions',
        description: 'Granular role-based access control for each team member',
        mockupContent: <AdminSettingsMockup highlight="permissions" />,
        duration: 2500
      },
      {
        title: 'Add New Users',
        description: 'Quickly onboard new staff with predefined role templates',
        mockupContent: <AdminSettingsMockup highlight="add" />,
        duration: 2500
      }
    ],
    features: [
      {
        icon: <Users className="h-6 w-6 text-primary" />,
        title: 'User & Role Management',
        description: 'Create staff accounts with granular role-based permissions',
        benefit: 'Secure access control'
      },
      {
        icon: <Settings className="h-6 w-6 text-primary" />,
        title: 'Test Configuration',
        description: 'Add custom test types, pricing, and report templates',
        benefit: 'Tailored to your lab needs'
      },
      {
        icon: <CreditCard className="h-6 w-6 text-primary" />,
        title: 'Billing & GST Setup',
        description: 'Configure tax rates, discounts, and payment terms',
        benefit: 'Compliant invoicing'
      },
      {
        icon: <FileText className="h-6 w-6 text-primary" />,
        title: 'Audit Logs',
        description: 'Complete trail of all system activities for compliance',
        benefit: 'Full accountability'
      }
    ],
    timeSaved: '2+ hours daily',
    keyBenefit: 'Zero configuration errors'
  },
  {
    id: 'operator',
    name: 'Lab Operators',
    icon: <Users className="h-5 w-5" />,
    tagline: 'Streamlined workflows for faster, error-free operations',
    workflowSteps: [
      {
        title: 'Start Registration',
        description: 'Open patient registration with smart form auto-completion',
        mockupContent: <PatientRegMockup highlight="form" />,
        duration: 2500
      },
      {
        title: 'Enter Details',
        description: 'Quick entry of patient demographics with validation',
        mockupContent: <PatientRegMockup highlight="details" />,
        duration: 2500
      },
      {
        title: 'Auto-Generate ID',
        description: 'Unique patient ID created automatically based on branch code',
        mockupContent: <PatientRegMockup highlight="id" />,
        duration: 2500
      },
      {
        title: 'Complete Registration',
        description: 'One-click submit with instant confirmation',
        mockupContent: <PatientRegMockup highlight="submit" />,
        duration: 2500
      }
    ],
    features: [
      {
        icon: <User className="h-6 w-6 text-primary" />,
        title: 'Quick Patient Registration',
        description: 'Register patients in under 2 minutes with auto-generated IDs',
        benefit: 'Reduce waiting time'
      },
      {
        icon: <FileText className="h-6 w-6 text-primary" />,
        title: 'One-Click Reports',
        description: 'Generate professional PDF reports with a single click',
        benefit: 'Faster turnaround'
      },
      {
        icon: <CreditCard className="h-6 w-6 text-primary" />,
        title: 'Easy Billing',
        description: 'Create bills with automatic calculations and GST',
        benefit: 'No calculation errors'
      },
      {
        icon: <Bell className="h-6 w-6 text-primary" />,
        title: 'Follow-up Reminders',
        description: 'Never miss patient follow-ups with automated reminders',
        benefit: 'Improved patient care'
      }
    ],
    timeSaved: '5 min per patient',
    keyBenefit: '95% faster registration'
  },
  {
    id: 'patient',
    name: 'Patients',
    icon: <User className="h-5 w-5" />,
    tagline: 'Modern experience for your patients',
    workflowSteps: [
      {
        title: 'Receive Notification',
        description: 'Instant SMS/WhatsApp alert when your report is ready',
        mockupContent: <PatientReportMockup highlight="notification" />,
        duration: 2500
      },
      {
        title: 'View Report',
        description: 'Access professional PDF report with all test results',
        mockupContent: <PatientReportMockup highlight="report" />,
        duration: 2500
      },
      {
        title: 'Share or Download',
        description: 'Easy sharing via WhatsApp or download for records',
        mockupContent: <PatientReportMockup highlight="share" />,
        duration: 2500
      }
    ],
    features: [
      {
        icon: <Smartphone className="h-6 w-6 text-primary" />,
        title: 'Digital Reports',
        description: 'Receive test reports instantly via SMS or WhatsApp',
        benefit: 'No waiting at the lab'
      },
      {
        icon: <Bell className="h-6 w-6 text-primary" />,
        title: 'Smart Notifications',
        description: 'Automated updates on report status and appointments',
        benefit: 'Always informed'
      },
      {
        icon: <FileText className="h-6 w-6 text-primary" />,
        title: 'Report History',
        description: 'Access all past reports digitally anytime',
        benefit: 'Easy record keeping'
      },
      {
        icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
        title: 'Feedback System',
        description: 'Share experience and help improve lab services',
        benefit: 'Voice that matters'
      }
    ],
    timeSaved: 'Instant access',
    keyBenefit: '100% digital experience'
  }
];

// Workflow Demo Component
const WorkflowDemo = ({ steps }: { steps: WorkflowStep[] }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, steps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, steps]);

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-4">
      {/* Mockup display */}
      <div className="relative">
        <div className="transition-all duration-500 transform">
          {steps[currentStep].mockupContent}
        </div>
        
        {/* Cursor animation indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/90 px-2 py-1 rounded-full text-xs text-muted-foreground">
          <MousePointer className="h-3 w-3" />
          <span>Live Demo</span>
        </div>
      </div>

      {/* Step indicator and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index);
                setIsPlaying(false);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted-foreground/30"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Step description */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {currentStep + 1}
          </div>
          <div>
            <h4 className="font-semibold mb-1">{steps[currentStep].title}</h4>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
        </div>
      </div>

      {/* Steps timeline */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className={cn(
              "flex items-center gap-1 transition-colors",
              index === currentStep ? "text-primary font-medium" : ""
            )}>
              <CheckCircle2 className={cn(
                "h-3 w-3",
                index <= currentStep ? "text-primary" : ""
              )} />
              <span className="hidden sm:inline">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="h-3 w-3 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const StakeholderTabs = () => {
  const [activeTab, setActiveTab] = useState('owner');

  return (
    <section className="py-20 px-4" aria-labelledby="stakeholder-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">For Every Role</Badge>
          <h2 id="stakeholder-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Designed for <span className="gradient-text">Your Team</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how Lab Master transforms daily operations for every stakeholder in your laboratory
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2 bg-muted/50 rounded-xl mb-8">
            {stakeholders.map((stakeholder) => (
              <TabsTrigger
                key={stakeholder.id}
                value={stakeholder.id}
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all"
              >
                {stakeholder.icon}
                <span className="hidden sm:inline">{stakeholder.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {stakeholders.map((stakeholder) => (
            <TabsContent key={stakeholder.id} value={stakeholder.id} className="mt-0 animate-fade-in">
              <Card className="glass border-0">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-primary/10">
                      {stakeholder.icon}
                    </div>
                    <CardTitle className="text-2xl">{stakeholder.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {stakeholder.tagline}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Video Tutorials from Database */}
                  <VideoTutorialsSection stakeholderId={stakeholder.id} />

                  {/* Interactive Workflow Demo */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Play className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Interactive Workflow Demo</h3>
                    </div>
                    <div className="max-w-md mx-auto">
                      <WorkflowDemo steps={stakeholder.workflowSteps} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap justify-center gap-6 mb-8 p-4 bg-muted/30 rounded-xl">
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Clock className="h-4 w-4" />
                        <span>Time Saved</span>
                      </div>
                      <p className="text-2xl font-bold">{stakeholder.timeSaved}</p>
                    </div>
                    <div className="w-px bg-border hidden sm:block" />
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        <span>Key Benefit</span>
                      </div>
                      <p className="text-2xl font-bold">{stakeholder.keyBenefit}</p>
                    </div>
                  </div>

                  {/* Features grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {stakeholder.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10 h-fit">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {feature.description}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-primary font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            {feature.benefit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default StakeholderTabs;
