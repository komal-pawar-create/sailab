import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Clock, 
  TrendingUp, 
  Shield, 
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FeatureComparison {
  feature: string;
  category: string;
  labMaster: { value: string | boolean; highlight?: boolean };
  manual: { value: string | boolean; warning?: boolean };
  competitor: { value: string | boolean };
  timeSaving?: string;
  tooltip: {
    description: string;
    useCase: string;
  };
}

const comparisonData: FeatureComparison[] = [
  // Patient Management
  {
    feature: 'Patient Registration',
    category: 'Patient Management',
    labMaster: { value: '< 30 seconds', highlight: true },
    manual: { value: '5-10 minutes', warning: true },
    competitor: { value: '1-2 minutes' },
    timeSaving: '90% faster',
    tooltip: {
      description: 'Quick patient onboarding with smart form autofill and validation.',
      useCase: 'A walk-in patient provides their phone number, and the system auto-fills previous visit details, saving time during rush hours.'
    }
  },
  {
    feature: 'Auto Patient ID Generation',
    category: 'Patient Management',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: true },
    tooltip: {
      description: 'Unique patient IDs generated automatically with branch prefix and date-based sequencing.',
      useCase: 'Each patient gets a unique ID like "MH-250121-001" that helps track records across multiple visits and branches.'
    }
  },
  {
    feature: 'Complete Patient History',
    category: 'Patient Management',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Limited' },
    tooltip: {
      description: 'Full timeline view of all patient interactions including tests, payments, documents, and follow-ups.',
      useCase: 'When a patient returns after 6 months, instantly view their previous test results, outstanding dues, and doctor referral history.'
    }
  },
  {
    feature: 'Smart Search & Filters',
    category: 'Patient Management',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Basic' },
    tooltip: {
      description: 'Search patients by name, phone, ID, or doctor referral with advanced filtering options.',
      useCase: 'Find all patients referred by Dr. Sharma in the last month who have pending test reports.'
    }
  },
  // Billing & Payments
  {
    feature: 'Invoice Generation',
    category: 'Billing & Payments',
    labMaster: { value: 'Instant', highlight: true },
    manual: { value: '15-20 minutes', warning: true },
    competitor: { value: '2-3 minutes' },
    timeSaving: '95% faster',
    tooltip: {
      description: 'Generate professional GST-compliant invoices with one click, including all test items and discounts.',
      useCase: 'Create a bill for multiple tests, apply a 10% discount, and print/share via WhatsApp - all in under 30 seconds.'
    }
  },
  {
    feature: 'Multiple Payment Methods',
    category: 'Billing & Payments',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: true },
    tooltip: {
      description: 'Accept cash, card, UPI, bank transfer, and partial payments with complete tracking.',
      useCase: 'Patient pays ₹500 in cash and ₹1,000 via UPI - system tracks both payments and shows remaining balance.'
    }
  },
  {
    feature: 'Outstanding Tracking',
    category: 'Billing & Payments',
    labMaster: { value: 'Real-time', highlight: true },
    manual: { value: 'End of day', warning: true },
    competitor: { value: 'Daily sync' },
    tooltip: {
      description: 'Live dashboard showing all pending payments with aging analysis and collection reminders.',
      useCase: 'See that ₹45,000 is outstanding from 12 patients, with ₹15,000 overdue by 30+ days - prioritize follow-ups.'
    }
  },
  {
    feature: 'GST Compliant Invoices',
    category: 'Billing & Payments',
    labMaster: { value: true, highlight: true },
    manual: { value: 'Manual entry', warning: true },
    competitor: { value: true },
    tooltip: {
      description: 'Auto-calculate CGST/SGST with proper HSN codes and generate GST-ready invoices.',
      useCase: 'All invoices are audit-ready with correct tax calculations, making GST filing hassle-free.'
    }
  },
  // Reports & Analytics
  {
    feature: 'Test Report Creation',
    category: 'Reports & Analytics',
    labMaster: { value: '1-2 minutes', highlight: true },
    manual: { value: '10-15 minutes', warning: true },
    competitor: { value: '3-5 minutes' },
    timeSaving: '85% faster',
    tooltip: {
      description: 'Create professional test reports with your letterhead, digital signature, and reference ranges.',
      useCase: 'Enter blood test results, system auto-flags abnormal values, add technician signature, and share PDF via WhatsApp.'
    }
  },
  {
    feature: 'Custom Letterhead',
    category: 'Reports & Analytics',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Extra cost' },
    tooltip: {
      description: 'Upload your lab letterhead and signature for branded, professional-looking reports.',
      useCase: 'All test reports automatically include your lab logo, contact details, and authorized signatory.'
    }
  },
  {
    feature: 'Revenue Analytics',
    category: 'Reports & Analytics',
    labMaster: { value: 'Real-time dashboard', highlight: true },
    manual: { value: 'Monthly calculation', warning: true },
    competitor: { value: 'Basic charts' },
    tooltip: {
      description: 'Interactive charts showing daily/weekly/monthly revenue, test-wise breakdown, and trends.',
      useCase: 'Discover that CBC tests generate 40% of revenue, and Saturdays have 3x more patients - optimize staffing.'
    }
  },
  {
    feature: 'Doctor Referral Tracking',
    category: 'Reports & Analytics',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: false },
    tooltip: {
      description: 'Track which doctors refer most patients and their contribution to lab revenue.',
      useCase: 'Generate a report showing Dr. Patel referred 50 patients worth ₹75,000 - strengthen the relationship.'
    }
  },
  // Operations
  {
    feature: 'Multi-Branch Support',
    category: 'Operations',
    labMaster: { value: 'Unlimited', highlight: true },
    manual: { value: 'N/A', warning: true },
    competitor: { value: 'Extra cost' },
    tooltip: {
      description: 'Manage multiple lab branches from a single dashboard with branch-specific settings.',
      useCase: 'View consolidated reports across 5 branches or drill down into individual branch performance.'
    }
  },
  {
    feature: 'Role-Based Access',
    category: 'Operations',
    labMaster: { value: '5+ roles', highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: '2-3 roles' },
    tooltip: {
      description: 'Assign specific permissions to lab owner, admin, operator, technician, and collector roles.',
      useCase: 'Operators can create bills but only admins can give discounts above 10% or view revenue reports.'
    }
  },
  {
    feature: 'Audit Trail',
    category: 'Operations',
    labMaster: { value: 'Complete', highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Limited' },
    tooltip: {
      description: 'Track every action with timestamp, user details, and before/after values.',
      useCase: 'See who modified a bill amount, when, and what the original value was - complete accountability.'
    }
  },
  {
    feature: 'Follow-up Reminders',
    category: 'Operations',
    labMaster: { value: 'Automated', highlight: true },
    manual: { value: 'Manual tracking', warning: true },
    competitor: { value: 'Basic' },
    tooltip: {
      description: 'Set follow-up dates for patients and get automated reminders for pending actions.',
      useCase: 'System reminds you to call patients for report collection or pending payments 3 days after their visit.'
    }
  },
  // Support & Pricing
  {
    feature: 'Setup Time',
    category: 'Support & Pricing',
    labMaster: { value: 'Same day', highlight: true },
    manual: { value: 'N/A' },
    competitor: { value: '1-2 weeks' },
    tooltip: {
      description: 'Get your lab up and running on LabFlow within hours, not weeks.',
      useCase: 'Sign up in the morning, upload letterhead, add staff - start billing patients by afternoon.'
    }
  },
  {
    feature: 'Training Required',
    category: 'Support & Pricing',
    labMaster: { value: '1 hour', highlight: true },
    manual: { value: 'N/A' },
    competitor: { value: '1-2 days' },
    tooltip: {
      description: 'Intuitive interface designed for non-technical users with guided onboarding tours.',
      useCase: 'Your receptionist can start using the system after a 1-hour training session with our support team.'
    }
  },
  {
    feature: 'Customer Support',
    category: 'Support & Pricing',
    labMaster: { value: 'WhatsApp + Phone', highlight: true },
    manual: { value: 'N/A' },
    competitor: { value: 'Email only' },
    tooltip: {
      description: 'Get instant help via WhatsApp or phone call - no waiting for email responses.',
      useCase: 'Facing an issue during peak hours? Send a WhatsApp message and get a solution within minutes.'
    }
  },
  {
    feature: 'Starting Price',
    category: 'Support & Pricing',
    labMaster: { value: '₹5,000 one-time', highlight: true },
    manual: { value: 'Staff costs', warning: true },
    competitor: { value: '₹15,000+/year' },
    tooltip: {
      description: 'One-time license fee with affordable annual maintenance - no hidden costs.',
      useCase: 'Pay ₹5,000 once and ₹2,000/year AMC vs competitors charging ₹15,000+ every year.'
    }
  }
];

const categories = [...new Set(comparisonData.map(item => item.category))];

const timeSavingsStats = [
  { label: 'Daily Time Saved', value: '3+ hours', icon: Clock },
  { label: 'Error Reduction', value: '95%', icon: Shield },
  { label: 'Productivity Boost', value: '4x', icon: TrendingUp },
  { label: 'Faster Reports', value: '10x', icon: Zap }
];

const ComparisonTable = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const renderValue = (value: string | boolean, highlight?: boolean, warning?: boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={cn("h-5 w-5", highlight ? "text-green-500" : "text-muted-foreground")} />
      ) : (
        <X className={cn("h-5 w-5", warning ? "text-red-500" : "text-muted-foreground")} />
      );
    }
    return (
      <span className={cn(
        "text-sm",
        highlight && "text-primary font-semibold",
        warning && "text-orange-500"
      )}>
        {value}
      </span>
    );
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <TrendingUp className="h-3 w-3 mr-1" />
            Why Choose LabFlow
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See How LabFlow Compares
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compare LabFlow with manual processes and competitor software to see the real difference in efficiency, features, and value.
          </p>
        </motion.div>

        {/* Time Savings Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {timeSavingsStats.map((stat, index) => (
            <Card key={stat.label} className="text-center border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                >
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-muted/50 border-b sticky top-0 z-10">
              <div className="p-4 font-semibold text-sm">Feature</div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="font-semibold text-primary">LabFlow</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-muted-foreground">Manual Process</span>
                </div>
              </div>
              <div className="p-4 text-center font-semibold text-muted-foreground">
                Competitor Software
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {categories.map((category) => (
                <div key={category}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full grid grid-cols-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-4 p-3 flex items-center gap-2 font-medium">
                      {expandedCategories.includes(category) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {category}
                    </div>
                  </button>

                  {/* Category Features */}
                  <AnimatePresence>
                    {expandedCategories.includes(category) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {comparisonData
                          .filter(item => item.category === category)
                          .map((item, index) => (
                            <motion.div
                              key={item.feature}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "grid grid-cols-4 border-b last:border-b-0 transition-colors",
                                hoveredRow === item.feature && "bg-muted/30"
                              )}
                              onMouseEnter={() => setHoveredRow(item.feature)}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              <div className="p-4 flex items-center gap-2">
                                <span className="text-sm">{item.feature}</span>
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <button className="text-muted-foreground hover:text-primary transition-colors">
                                        <Info className="h-3.5 w-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs p-3">
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">{item.tooltip.description}</p>
                                        <div className="pt-1 border-t border-border">
                                          <p className="text-xs text-muted-foreground">
                                            <span className="font-medium text-primary">Example: </span>
                                            {item.tooltip.useCase}
                                          </p>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {item.timeSaving && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    {item.timeSaving}
                                  </Badge>
                                )}
                              </div>
                              <div className="p-4 flex items-center justify-center">
                                {renderValue(item.labMaster.value, item.labMaster.highlight)}
                              </div>
                              <div className="p-4 flex items-center justify-center">
                                {renderValue(item.manual.value, false, item.manual.warning)}
                              </div>
                              <div className="p-4 flex items-center justify-center">
                                {renderValue(item.competitor.value)}
                              </div>
                            </motion.div>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-6">
            Ready to transform your lab operations and save hours every day?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gap-2" asChild>
              <a href="/#pricing">
                <Zap className="h-4 w-4" />
                Get Started Now
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/#demo">Watch Demo</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonTable;
