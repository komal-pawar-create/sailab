import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
}

interface ScreenModule {
  id: string;
  icon: React.ReactNode;
  screenshot: string;
  hotspots: Hotspot[];
}

const modules: ScreenModule[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    screenshot: dashboardScreenshot,
    hotspots: [
      { id: 'stats', x: 25, y: 18 },
      { id: 'chart', x: 40, y: 55 },
      { id: 'activity', x: 88, y: 35 },
      { id: 'distribution', x: 70, y: 55 }
    ]
  },
  {
    id: 'patients',
    icon: <Users className="h-4 w-4" />,
    screenshot: patientsScreenshot,
    hotspots: [
      { id: 'search', x: 25, y: 22 },
      { id: 'list', x: 50, y: 50 },
      { id: 'filter', x: 50, y: 22 },
      { id: 'add', x: 15, y: 78 }
    ]
  },
  {
    id: 'billing',
    icon: <CreditCard className="h-4 w-4" />,
    screenshot: billingScreenshot,
    hotspots: [
      { id: 'create', x: 35, y: 18 },
      { id: 'items', x: 45, y: 50 },
      { id: 'preview', x: 88, y: 40 },
      { id: 'payment', x: 40, y: 85 }
    ]
  },
  {
    id: 'reports',
    icon: <FileText className="h-4 w-4" />,
    screenshot: reportsScreenshot,
    hotspots: [
      { id: 'filters', x: 35, y: 12 },
      { id: 'status', x: 55, y: 35 },
      { id: 'patients', x: 30, y: 55 },
      { id: 'sidebar', x: 12, y: 45 }
    ]
  },
  {
    id: 'analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    screenshot: analyticsScreenshot,
    hotspots: [
      { id: 'volumes', x: 25, y: 35 },
      { id: 'distribution', x: 60, y: 30 },
      { id: 'kpi', x: 90, y: 35 },
      { id: 'revenue', x: 60, y: 75 }
    ]
  }
];

const PlatformPreview = () => {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const currentModule = modules.find(m => m.id === activeModule) || modules[0];

  const getHotspotData = (moduleId: string, hotspotId: string) => {
    const hotspotData = t(`productTour.platformPreview.hotspots.${moduleId}.${hotspotId}`, { returnObjects: true }) as { title: string; description: string } | undefined;
    return hotspotData || { title: hotspotId, description: '' };
  };
  
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
            {t('productTour.platformPreview.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('productTour.platformPreview.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('productTour.platformPreview.subtitle')}
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
                  {t(`productTour.platformPreview.modules.${module.id}`)}
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
                      alt={`${t(`productTour.platformPreview.modules.${currentModule.id}`)} module screenshot`}
                      className="w-full h-auto object-cover"
                    />
                    
                    {/* Overlay for better hotspot visibility */}
                    <div className="absolute inset-0 bg-black/5" />

                    {/* Hotspots */}
                    {currentModule.hotspots.map((hotspot) => {
                      const hotspotData = getHotspotData(currentModule.id, hotspot.id);
                      return (
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
                                <h4 className="font-semibold mb-1 text-foreground">{hotspotData.title}</h4>
                                <p className="text-sm text-muted-foreground">{hotspotData.description}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
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
            {currentModule.hotspots.map((hotspot, index) => {
              const hotspotData = getHotspotData(currentModule.id, hotspot.id);
              return (
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
                    <span className="font-medium text-sm">{hotspotData.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {hotspotData.description}
                  </p>
                </motion.button>
              );
            })}
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
              alt={`${t(`productTour.platformPreview.modules.${currentModule.id}`)} full view`}
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
