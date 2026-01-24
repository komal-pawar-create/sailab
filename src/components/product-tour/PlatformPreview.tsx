import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3,
  MousePointer,
  ChevronRight,
  Sparkles,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
}

interface ScreenModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  hotspots: Hotspot[];
}

const modules: ScreenModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'Real-time overview of your lab operations',
    hotspots: [
      { id: 'stats', x: 15, y: 20, title: 'Quick Stats', description: 'View today\'s patients, revenue, and tests at a glance' },
      { id: 'chart', x: 50, y: 50, title: 'Revenue Analytics', description: 'Interactive charts showing daily, weekly, and monthly trends' },
      { id: 'activity', x: 80, y: 30, title: 'Activity Feed', description: 'Real-time updates on patient registrations and reports' },
      { id: 'actions', x: 25, y: 75, title: 'Quick Actions', description: 'One-click access to common tasks like adding patients or bills' }
    ]
  },
  {
    id: 'patients',
    name: 'Patients',
    icon: <Users className="h-4 w-4" />,
    description: 'Complete patient management system',
    hotspots: [
      { id: 'search', x: 30, y: 15, title: 'Smart Search', description: 'Find patients by name, phone, ID, or doctor referral' },
      { id: 'list', x: 50, y: 50, title: 'Patient List', description: 'Sortable and filterable patient records with quick actions' },
      { id: 'history', x: 80, y: 40, title: 'Patient History', description: 'Complete timeline of visits, tests, bills, and documents' },
      { id: 'add', x: 15, y: 80, title: 'Quick Add', description: 'Register new patients in under 30 seconds' }
    ]
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Professional invoicing and payment tracking',
    hotspots: [
      { id: 'create', x: 25, y: 25, title: 'Create Bill', description: 'Generate GST-compliant invoices with test catalog' },
      { id: 'payments', x: 70, y: 35, title: 'Payment Tracking', description: 'Track cash, card, UPI, and partial payments' },
      { id: 'outstanding', x: 50, y: 70, title: 'Outstanding', description: 'Monitor pending payments with aging analysis' },
      { id: 'print', x: 85, y: 80, title: 'Print & Share', description: 'Print bills or share via WhatsApp instantly' }
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: <FileText className="h-4 w-4" />,
    description: 'Generate professional test reports',
    hotspots: [
      { id: 'templates', x: 20, y: 30, title: 'Report Templates', description: 'Pre-configured templates for all test types' },
      { id: 'results', x: 55, y: 45, title: 'Enter Results', description: 'Easy result entry with auto-flagging of abnormal values' },
      { id: 'letterhead', x: 80, y: 25, title: 'Custom Letterhead', description: 'Your lab branding on every report' },
      { id: 'share', x: 40, y: 80, title: 'Multi-Channel Delivery', description: 'Share via WhatsApp, Email, or SMS' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Business intelligence and insights',
    hotspots: [
      { id: 'revenue', x: 30, y: 30, title: 'Revenue Reports', description: 'Daily, weekly, monthly revenue breakdowns' },
      { id: 'tests', x: 70, y: 25, title: 'Test Analytics', description: 'Most popular tests and revenue contribution' },
      { id: 'doctors', x: 50, y: 60, title: 'Referral Analysis', description: 'Track doctor referrals and their value' },
      { id: 'export', x: 80, y: 80, title: 'Export Data', description: 'Download reports in Excel or PDF format' }
    ]
  }
];

const PlatformPreview = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  
  const currentModule = modules.find(m => m.id === activeModule) || modules[0];
  
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <Monitor className="h-3 w-3 mr-1" />
            Interactive Preview
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore the Platform
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Click on the hotspots to discover key features of each module
          </p>
        </motion.div>

        {/* Module Tabs */}
        <Tabs value={activeModule} onValueChange={setActiveModule} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto mb-8 bg-transparent gap-2 h-auto flex-wrap">
            {modules.map((module) => (
              <TabsTrigger
                key={module.id}
                value={module.id}
                className={cn(
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  "px-4 py-2 rounded-full border transition-all duration-200"
                )}
              >
                <span className="flex items-center gap-2">
                  {module.icon}
                  {module.name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Preview Area */}
          <motion.div
            layout
            className="relative"
          >
            {/* Device Frame */}
            <div className="relative mx-auto max-w-5xl">
              {/* Browser Chrome */}
              <div className="bg-muted rounded-t-xl border border-b-0 p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background rounded-md px-4 py-1 text-sm text-muted-foreground flex items-center gap-2">
                    <span>🔒</span>
                    labflow.mywebz.in/{activeModule}
                  </div>
                </div>
              </div>

              {/* Screen Content */}
              <div className="relative bg-card border rounded-b-xl overflow-hidden aspect-[16/10]">
                {/* Simulated UI */}
                <div className="absolute inset-0 p-6 bg-gradient-to-br from-background to-muted/50">
                  {/* Sidebar */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 bg-card border-r flex flex-col items-center py-4 gap-4">
                    {modules.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          m.id === activeModule ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                      >
                        {m.icon}
                      </div>
                    ))}
                  </div>

                  {/* Main Content Area */}
                  <div className="ml-20 h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-lg">{currentModule.name}</h3>
                        <p className="text-sm text-muted-foreground">{currentModule.description}</p>
                      </div>
                      <Button size="sm">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Quick Action
                      </Button>
                    </div>

                    {/* Content Grid Placeholder */}
                    <div className="grid grid-cols-3 gap-4 h-[calc(100%-80px)]">
                      <div className="col-span-2 bg-muted/30 rounded-lg animate-pulse" />
                      <div className="bg-muted/30 rounded-lg animate-pulse" />
                      <div className="bg-muted/30 rounded-lg animate-pulse" />
                      <div className="col-span-2 bg-muted/30 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Hotspots */}
                {currentModule.hotspots.map((hotspot) => (
                  <motion.button
                    key={hotspot.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute group"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
                  >
                    {/* Pulse Ring */}
                    <div className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 animate-ping" />
                    
                    {/* Hotspot Dot */}
                    <div className={cn(
                      "relative w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-300",
                      activeHotspot === hotspot.id 
                        ? "bg-primary scale-125" 
                        : "bg-primary/80 hover:bg-primary hover:scale-110"
                    )}>
                      <MousePointer className="h-4 w-4 text-primary-foreground" />
                    </div>

                    {/* Tooltip */}
                    <AnimatePresence>
                      {activeHotspot === hotspot.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute z-50 w-64 p-4 bg-popover border rounded-lg shadow-xl -translate-x-1/2 mt-2"
                        >
                          <h4 className="font-semibold mb-1">{hotspot.title}</h4>
                          <p className="text-sm text-muted-foreground">{hotspot.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {currentModule.hotspots.map((hotspot, index) => (
              <motion.button
                key={hotspot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveHotspot(hotspot.id)}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all duration-200 hover:border-primary hover:bg-primary/5",
                  activeHotspot === hotspot.id && "border-primary bg-primary/10"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium text-sm">{hotspot.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {hotspot.description}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </Tabs>
      </div>
    </section>
  );
};

export default PlatformPreview;
