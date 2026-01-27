import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserPlus, 
  Settings, 
  Rocket, 
  CheckCircle2,
  Clock,
  Building2,
  Users,
  FileText
} from 'lucide-react';

const SetupTimeline = () => {
  const { t } = useTranslation();

  const getIconForStep = (title: string, dayIndex: number) => {
    const iconMap: Record<string, Record<number, React.ReactNode>> = {
      0: { // Day 1 icons
        0: <UserPlus className="h-5 w-5 text-blue-500" />,
        1: <Building2 className="h-5 w-5 text-blue-500" />,
        2: <FileText className="h-5 w-5 text-blue-500" />,
        3: <Settings className="h-5 w-5 text-blue-500" />
      },
      1: { // Day 2 icons
        0: <Users className="h-5 w-5 text-purple-500" />,
        1: <Settings className="h-5 w-5 text-purple-500" />,
        2: <Building2 className="h-5 w-5 text-purple-500" />,
        3: <FileText className="h-5 w-5 text-purple-500" />
      },
      2: { // Day 3 icons
        0: <UserPlus className="h-5 w-5 text-green-500" />,
        1: <FileText className="h-5 w-5 text-green-500" />,
        2: <FileText className="h-5 w-5 text-green-500" />,
        3: <Rocket className="h-5 w-5 text-green-500" />
      }
    };
    return iconMap[dayIndex]?.[title as unknown as number] || <Settings className="h-5 w-5" />;
  };

  const dayConfigs = [
    { key: 'day1', icon: <UserPlus className="h-6 w-6" />, color: 'bg-blue-500' },
    { key: 'day2', icon: <Settings className="h-6 w-6" />, color: 'bg-purple-500' },
    { key: 'day3', icon: <Rocket className="h-6 w-6" />, color: 'bg-green-500' }
  ];

  return (
    <section className="py-20 px-4" aria-labelledby="timeline-heading">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">{t('productTour.setupTimeline.badge')}</Badge>
          <h2 id="timeline-heading" className="text-3xl md:text-4xl font-bold mb-4">
            {t('productTour.setupTimeline.title')} <span className="gradient-text">{t('productTour.setupTimeline.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('productTour.setupTimeline.subtitle')}
          </p>
        </div>

        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 hidden md:block" />

          <div className="space-y-12">
            {dayConfigs.map((dayConfig, dayIndex) => {
              const dayData = t(`productTour.setupTimeline.${dayConfig.key}`, { returnObjects: true }) as { 
                day: string; 
                title: string; 
                description: string; 
                steps: Array<{ title: string; duration: string; tasks: string[] }> 
              };

              return (
                <div
                  key={dayConfig.key}
                  className={`relative flex flex-col ${
                    dayIndex % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } gap-8 items-start md:items-center`}
                >
                  {/* Timeline node */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10">
                    <div className={`${dayConfig.color} text-white p-3 rounded-full shadow-lg`}>
                      {dayConfig.icon}
                    </div>
                  </div>

                  {/* Content card */}
                  <Card className={`flex-1 ${dayIndex % 2 === 0 ? 'md:mr-auto md:pr-16' : 'md:ml-auto md:pl-16'} md:w-[45%] w-full glass border-0`}>
                    <CardContent className="p-6">
                      {/* Mobile timeline node */}
                      <div className="flex md:hidden items-center gap-3 mb-4">
                        <div className={`${dayConfig.color} text-white p-2 rounded-full`}>
                          {dayConfig.icon}
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-1">{dayData.day}</Badge>
                          <h3 className="font-bold text-xl">{dayData.title}</h3>
                        </div>
                      </div>

                      {/* Desktop header */}
                      <div className="hidden md:block mb-4">
                        <Badge variant="outline" className="mb-2">{dayData.day}</Badge>
                        <h3 className="font-bold text-xl mb-1">{dayData.title}</h3>
                        <p className="text-sm text-muted-foreground">{dayData.description}</p>
                      </div>

                      {/* Steps */}
                      <div className="space-y-4">
                        {dayData.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getIconForStep(String(stepIndex), dayIndex)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium">{step.title}</h4>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {step.duration}
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {step.tasks.map((task, taskIndex) => (
                                  <li
                                    key={taskIndex}
                                    className="text-sm text-muted-foreground flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SetupTimeline;
