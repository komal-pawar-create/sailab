import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Smartphone
} from 'lucide-react';

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
}

const stakeholders: StakeholderData[] = [
  {
    id: 'owner',
    name: 'Lab Owners',
    icon: <Building2 className="h-5 w-5" />,
    tagline: 'Complete visibility and control over your laboratory business',
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
            <TabsContent key={stakeholder.id} value={stakeholder.id} className="mt-0">
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
