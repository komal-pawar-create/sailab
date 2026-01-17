import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Building2, 
  Shield,
  CheckCircle2
} from 'lucide-react';

interface FeatureCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  capabilities: string[];
  highlight: string;
}

const featureCategories: FeatureCategory[] = [
  {
    id: 'patients',
    icon: <Users className="h-5 w-5" />,
    title: 'Patient Management',
    description: 'Complete patient lifecycle management from registration to follow-ups',
    capabilities: [
      'Auto-generated unique patient IDs with branch prefix',
      'Smart search across name, phone, and patient ID',
      'Complete patient history with timeline view',
      'Document uploads and management',
      'Doctor referral tracking',
      'Age calculation in years and months'
    ],
    highlight: 'Register patients in under 2 minutes'
  },
  {
    id: 'testing',
    icon: <FileText className="h-5 w-5" />,
    title: 'Test & Reporting',
    description: 'Streamlined test management and professional report generation',
    capabilities: [
      'Custom test types with flexible pricing',
      'Professional PDF reports with lab branding',
      'Status tracking (Pending → In Progress → Completed)',
      'Technician assignment and tracking',
      'Batch report generation',
      'Digital report delivery via SMS/WhatsApp'
    ],
    highlight: 'One-click professional report generation'
  },
  {
    id: 'billing',
    icon: <CreditCard className="h-5 w-5" />,
    title: 'Billing & Payments',
    description: 'Comprehensive billing system with GST compliance and flexible payments',
    capabilities: [
      'Automatic tax calculations with GST support',
      'Partial payments and payment tracking',
      'Complete ledger with aging reports',
      'Multiple payment methods',
      'Discount management (flat and percentage)',
      'Outstanding balance tracking',
      'Payment receipt generation'
    ],
    highlight: 'Zero billing errors with auto-calculations'
  },
  {
    id: 'analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Analytics & Insights',
    description: 'Data-driven insights to grow and optimize your laboratory',
    capabilities: [
      'Real-time revenue dashboards',
      'Daily, weekly, monthly trend analysis',
      'Test volume and type analytics',
      'Staff performance metrics',
      'Collection efficiency reports',
      'AI-powered predictions (coming soon)',
      'Export reports to Excel/PDF'
    ],
    highlight: 'Make informed decisions with real-time data'
  },
  {
    id: 'multibranch',
    icon: <Building2 className="h-5 w-5" />,
    title: 'Multi-Branch Control',
    description: 'Centralized management for laboratory chains and franchises',
    capabilities: [
      'Unified dashboard for all locations',
      'Branch-wise performance comparison',
      'Centralized user management',
      'Consolidated financial reports',
      'Branch-specific configurations',
      'Inter-branch data visibility controls'
    ],
    highlight: 'Scale from 1 to 100+ branches effortlessly'
  },
  {
    id: 'security',
    icon: <Shield className="h-5 w-5" />,
    title: 'Security & Compliance',
    description: 'Enterprise-grade security with complete audit trails',
    capabilities: [
      'Role-based access control (RBAC)',
      'Complete audit logs for all actions',
      'Data encryption at rest and in transit',
      'Session management and timeout',
      'IP-based access restrictions',
      'HIPAA-ready infrastructure',
      'Regular automated backups'
    ],
    highlight: 'Enterprise-grade security for your data'
  }
];

const FeatureDeepDive = () => {
  return (
    <section className="py-20 px-4 bg-muted/30" aria-labelledby="features-heading">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Deep Dive</Badge>
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Explore Every <span className="gradient-text">Feature</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the powerful capabilities that make Lab Master the choice of 500+ laboratories
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {featureCategories.map((category) => (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="bg-background rounded-xl border-0 shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/50">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{category.title}</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      {category.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="pt-4">
                  {/* Highlight badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <CheckCircle2 className="h-4 w-4" />
                    {category.highlight}
                  </div>

                  {/* Capabilities grid */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {category.capabilities.map((capability, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FeatureDeepDive;
