import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3,
  MousePointer,
  Monitor,
  ZoomIn,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import real screenshots
import dashboardScreenshot from '@/assets/screenshots/dashboard-overview.png';
import patientsScreenshot from '@/assets/screenshots/patients-list.png';
import billingScreenshot from '@/assets/screenshots/billing-interface.png';
import reportsScreenshot from '@/assets/screenshots/reports-view.png';
import analyticsScreenshot from '@/assets/screenshots/analytics-dashboard.png';

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
  screenshot: string;
  hotspots: Hotspot[];
}

const modules: ScreenModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'Real-time overview of your lab operations',
    screenshot: dashboardScreenshot,
    hotspots: [
      { id: 'stats', x: 25, y: 18, title: 'Quick Stats', description: 'View today\'s patients, revenue, and tests at a glance' },
      { id: 'chart', x: 40, y: 55, title: 'Revenue Analytics', description: 'Interactive charts showing daily, weekly, and monthly trends' },
      { id: 'activity', x: 88, y: 35, title: 'Activity Feed', description: 'Real-time updates on patient registrations and reports' },
      { id: 'distribution', x: 70, y: 55, title: 'Test Distribution', description: 'Visual breakdown of tests performed by category' }
    ]
  },
  {
    id: 'patients',
    name: 'Patients',
    icon: <Users className="h-4 w-4" />,
    description: 'Complete patient management system',
    screenshot: patientsScreenshot,
    hotspots: [
      { id: 'search', x: 25, y: 22, title: 'Smart Search', description: 'Find patients by name, phone, ID, or doctor referral' },
      { id: 'list', x: 50, y: 50, title: 'Patient List', description: 'Sortable and filterable patient records with quick actions' },
      { id: 'filter', x: 50, y: 22, title: 'Filter Options', description: 'Filter by status, date, or referring doctor' },
      { id: 'add', x: 15, y: 78, title: 'Quick Add', description: 'Register new patients in under 30 seconds' }
    ]
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Professional invoicing and payment tracking',
    screenshot: billingScreenshot,
    hotspots: [
      { id: 'create', x: 35, y: 18, title: 'Create Bill', description: 'Generate GST-compliant invoices with test catalog' },
      { id: 'items', x: 45, y: 50, title: 'Line Items', description: 'Add tests with automatic pricing calculation' },
      { id: 'preview', x: 88, y: 40, title: 'Bill Preview', description: 'Real-time preview of the generated invoice' },
      { id: 'payment', x: 40, y: 85, title: 'Payment Options', description: 'Track cash, card, UPI, and partial payments' }
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: <FileText className="h-4 w-4" />,
    description: 'Generate professional test reports',
    screenshot: reportsScreenshot,
    hotspots: [
      { id: 'filters', x: 35, y: 12, title: 'Report Filters', description: 'Filter by status, date range, and report type' },
      { id: 'status', x: 55, y: 35, title: 'Status Tracking', description: 'Easily see completed, pending, and in-progress reports' },
      { id: 'patients', x: 30, y: 55, title: 'Patient Reports', description: 'Complete list of patient test entries' },
      { id: 'sidebar', x: 12, y: 45, title: 'Quick Navigation', description: 'Filter by categories and report types' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Business intelligence and insights',
    screenshot: analyticsScreenshot,
    hotspots: [
      { id: 'volumes', x: 25, y: 35, title: 'Test Volumes', description: 'Monthly test volumes with trend visualization' },
      { id: 'distribution', x: 60, y: 30, title: 'Test Distribution', description: 'Pie chart showing test type breakdown' },
      { id: 'kpi', x: 90, y: 35, title: 'KPI Cards', description: 'Key metrics showing growth percentages' },
      { id: 'revenue', x: 60, y: 75, title: 'Revenue Trends', description: 'Track revenue over time with predictions' }
    ]
  }
];

const PlatformPreview = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
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
            Click on the hotspots to discover key features of each module. These are real screenshots from LabFlow.
          </p>
        </motion.div>

        {/* Module Tabs */}
        <Tabs value={activeModule} onValueChange={(val) => { setActiveModule(val); setActiveHotspot(null); }} className="w-full">
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
                <button 
                  onClick={() => setIsZoomed(true)}
                  className="p-1.5 rounded-md hover:bg-background transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Screen Content with Real Screenshot */}
              <div className="relative bg-card border rounded-b-xl overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentModule.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    {/* Real Screenshot */}
                    <img 
                      src={currentModule.screenshot} 
                      alt={`${currentModule.name} module screenshot`}
                      className="w-full h-auto object-cover"
                    />
                    
                    {/* Overlay for better hotspot visibility */}
                    <div className="absolute inset-0 bg-black/5" />

                    {/* Hotspots */}
                    {currentModule.hotspots.map((hotspot) => (
                      <motion.button
                        key={hotspot.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="absolute group z-10"
                        style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                        onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
                      >
                        {/* Pulse Ring */}
                        <div className="absolute inset-0 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 animate-ping" />
                        
                        {/* Hotspot Dot */}
                        <div className={cn(
                          "relative w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-2 border-white",
                          activeHotspot === hotspot.id 
                            ? "bg-primary scale-125" 
                            : "bg-primary/90 hover:bg-primary hover:scale-110"
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
                              className="absolute z-50 w-64 p-4 bg-popover border rounded-lg shadow-xl -translate-x-1/2 mt-4"
                              style={{ 
                                left: hotspot.x > 70 ? '-50%' : hotspot.x < 30 ? '50%' : '0%'
                              }}
                            >
                              <h4 className="font-semibold mb-1 text-foreground">{hotspot.title}</h4>
                              <p className="text-sm text-muted-foreground">{hotspot.description}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
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

      {/* Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={currentModule.screenshot}
              alt={`${currentModule.name} full view`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PlatformPreview;
