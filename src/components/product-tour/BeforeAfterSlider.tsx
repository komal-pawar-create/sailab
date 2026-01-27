import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Zap,
  TrendingUp,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BeforeAfterSlider = () => {
  const { t } = useTranslation();
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const comparisonItemKeys = [
    'patientRegistration',
    'billGeneration',
    'reportCreation',
    'findingRecords',
    'revenueCalculation',
    'errorRate'
  ];

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);
  
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setSliderPosition(percentage);
  }, []);
  
  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            {t('productTour.beforeAfter.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('productTour.beforeAfter.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('productTour.beforeAfter.subtitle')}
          </p>
        </motion.div>

        {/* Slider Comparison */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden border shadow-2xl cursor-ew-resize select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Before Side (Paper/Manual) */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <div className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('productTour.beforeAfter.paperRegisters')}</h3>
                  <p className="text-sm text-muted-foreground">{t('productTour.beforeAfter.manualProcesses')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {comparisonItemKeys.map((itemKey, index) => {
                  const item = t(`productTour.beforeAfter.items.${itemKey}`, { returnObjects: true }) as { label: string; before: string; after: string; improvement: string };
                  return (
                    <motion.div
                      key={itemKey}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-orange-200/50 dark:border-orange-800/30"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-bold text-orange-600">{item.before}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-orange-100/50 dark:bg-orange-900/20 rounded-xl">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">{t('productTour.beforeAfter.hoursLost')}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* After Side (LabFlow) */}
          <div 
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <div className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('productTour.beforeAfter.labflow')}</h3>
                  <p className="text-sm text-muted-foreground">{t('productTour.beforeAfter.digitalPlatform')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {comparisonItemKeys.map((itemKey, index) => {
                  const item = t(`productTour.beforeAfter.items.${itemKey}`, { returnObjects: true }) as { label: string; before: string; after: string; improvement: string };
                  return (
                    <motion.div
                      key={itemKey}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600">{item.after}</span>
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {item.improvement}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-semibold">{t('productTour.beforeAfter.hoursSaved')}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Slider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize z-10"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <GripVertical className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </motion.div>
        
        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          {t('productTour.beforeAfter.dragSlider')}
        </motion.p>
      </div>
    </section>
  );
};

export default BeforeAfterSlider;
