import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  CreditCard, 
  FlaskConical, 
  FileText, 
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PatientJourneyFlow = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const journeySteps = [
    {
      id: 'register',
      icon: <UserPlus className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'billing',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'testing',
      icon: <FlaskConical className="h-6 w-6" />,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'report',
      icon: <FileText className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'delivery',
      icon: <Bell className="h-6 w-6" />,
      color: 'from-pink-500 to-rose-500'
    }
  ];
  
  const handleStepClick = (stepId: string) => {
    setActiveStep(activeStep === stepId ? null : stepId);
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };
  
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {t('productTour.patientJourney.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('productTour.patientJourney.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t('productTour.patientJourney.subtitle')}
          </p>
        </motion.div>

        {/* Journey Flow */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 via-green-500 to-pink-500 rounded-full hidden md:block -translate-y-1/2 opacity-30" />
          
          {/* Animated progress line */}
          <motion.div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 via-green-500 to-pink-500 rounded-full hidden md:block -translate-y-1/2"
            initial={{ width: 0 }}
            whileInView={{ width: `${(completedSteps.length / journeySteps.length) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
            {journeySteps.map((step, index) => {
              const stepData = t(`productTour.patientJourney.steps.${step.id}`, { returnObjects: true }) as { title: string; duration: string; description: string; details: string[] };
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.button
                    onClick={() => handleStepClick(step.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-300",
                      "bg-card hover:shadow-lg hover:-translate-y-1",
                      activeStep === step.id && "ring-2 ring-primary shadow-lg",
                      completedSteps.includes(step.id) && "border-green-500/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Step Icon */}
                    <div className="relative mb-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mx-auto",
                        step.color
                      )}>
                        {step.icon}
                      </div>
                      {completedSteps.includes(step.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Step Content */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        {stepData.duration}
                      </div>
                      <h3 className="font-semibold mb-1 text-sm">{stepData.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stepData.description}
                      </p>
                    </div>
                    
                    {/* Expand indicator */}
                    <div className="flex justify-center mt-3">
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-300",
                        activeStep === step.id && "rotate-90"
                      )} />
                    </div>
                  </motion.button>
                  
                  {/* Expanded details */}
                  <AnimatePresence>
                    {activeStep === step.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 bg-muted/50 rounded-xl border">
                          <ul className="space-y-2">
                            {stepData.details.map((detail, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">{t('productTour.patientJourney.totalTime')} </span>
            <span className="text-primary font-bold">{t('productTour.patientJourney.under5Min')}</span>
            <span className="text-muted-foreground">{t('productTour.patientJourney.fromRegistration')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PatientJourneyFlow;
