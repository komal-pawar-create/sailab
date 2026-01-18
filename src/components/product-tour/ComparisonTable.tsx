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
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureComparison {
  feature: string;
  category: string;
  labMaster: { value: string | boolean; highlight?: boolean };
  manual: { value: string | boolean; warning?: boolean };
  competitor: { value: string | boolean };
  timeSaving?: string;
}

const comparisonData: FeatureComparison[] = [
  // Patient Management
  {
    feature: 'Patient Registration',
    category: 'Patient Management',
    labMaster: { value: '< 30 seconds', highlight: true },
    manual: { value: '5-10 minutes', warning: true },
    competitor: { value: '1-2 minutes' },
    timeSaving: '90% faster'
  },
  {
    feature: 'Auto Patient ID Generation',
    category: 'Patient Management',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: true }
  },
  {
    feature: 'Complete Patient History',
    category: 'Patient Management',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Limited' }
  },
  {
    feature: 'Smart Search & Filters',
    category: 'Patient Management',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Basic' }
  },
  // Billing & Payments
  {
    feature: 'Invoice Generation',
    category: 'Billing & Payments',
    labMaster: { value: 'Instant', highlight: true },
    manual: { value: '15-20 minutes', warning: true },
    competitor: { value: '2-3 minutes' },
    timeSaving: '95% faster'
  },
  {
    feature: 'Multiple Payment Methods',
    category: 'Billing & Payments',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: true }
  },
  {
    feature: 'Outstanding Tracking',
    category: 'Billing & Payments',
    labMaster: { value: 'Real-time', highlight: true },
    manual: { value: 'End of day', warning: true },
    competitor: { value: 'Daily sync' }
  },
  {
    feature: 'GST Compliant Invoices',
    category: 'Billing & Payments',
    labMaster: { value: true, highlight: true },
    manual: { value: 'Manual entry', warning: true },
    competitor: { value: true }
  },
  // Reports & Analytics
  {
    feature: 'Test Report Creation',
    category: 'Reports & Analytics',
    labMaster: { value: '1-2 minutes', highlight: true },
    manual: { value: '10-15 minutes', warning: true },
    competitor: { value: '3-5 minutes' },
    timeSaving: '85% faster'
  },
  {
    feature: 'Custom Letterhead',
    category: 'Reports & Analytics',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Extra cost' }
  },
  {
    feature: 'Revenue Analytics',
    category: 'Reports & Analytics',
    labMaster: { value: 'Real-time dashboard', highlight: true },
    manual: { value: 'Monthly calculation', warning: true },
    competitor: { value: 'Basic charts' }
  },
  {
    feature: 'Doctor Referral Tracking',
    category: 'Reports & Analytics',
    labMaster: { value: true, highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: false }
  },
  // Operations
  {
    feature: 'Multi-Branch Support',
    category: 'Operations',
    labMaster: { value: 'Unlimited', highlight: true },
    manual: { value: 'N/A', warning: true },
    competitor: { value: 'Extra cost' }
  },
  {
    feature: 'Role-Based Access',
    category: 'Operations',
    labMaster: { value: '5+ roles', highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: '2-3 roles' }
  },
  {
    feature: 'Audit Trail',
    category: 'Operations',
    labMaster: { value: 'Complete', highlight: true },
    manual: { value: false, warning: true },
    competitor: { value: 'Limited' }
  },
  {
    feature: 'Follow-up Reminders',
    category: 'Operations',
    labMaster: { value: 'Automated', highlight: true },
    manual: { value: 'Manual tracking', warning: true },
    competitor: { value: 'Basic' }
  },
  // Support & Pricing
  {
    feature: 'Setup Time',
    category: 'Support & Pricing',
    labMaster: { value: 'Same day', highlight: true },
    manual: { value: 'N/A' },
    competitor: { value: '1-2 weeks' }
  },
  {
    feature: 'Training Required',
    category: 'Support & Pricing',
    labMaster: { value: '1 hour', highlight: true },
    manual: { value: 'N/A' },
    competitor: { value: '1-2 days' }
  },
  {
    feature: 'Customer Support',
    category: 'Support & Pricing',
    labMaster: { value: 'WhatsApp + Phone', highlight: true },
    manual: { value: 'N/A' },
    competitor: { value: 'Email only' }
  },
  {
    feature: 'Starting Price',
    category: 'Support & Pricing',
    labMaster: { value: '₹5,000 one-time', highlight: true },
    manual: { value: 'Staff costs', warning: true },
    competitor: { value: '₹15,000+/year' }
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
            Why Choose Lab Master
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See How Lab Master Compares
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compare Lab Master with manual processes and competitor software to see the real difference in efficiency, features, and value.
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
                  <span className="font-semibold text-primary">Lab Master</span>
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
