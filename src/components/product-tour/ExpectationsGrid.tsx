import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  CheckCircle2,
  Rocket
} from 'lucide-react';

interface Expectation {
  timeframe: string;
  icon: React.ReactNode;
  title: string;
  achievements: string[];
  color: string;
}

const expectations: Expectation[] = [
  {
    timeframe: 'First Hour',
    icon: <Clock className="h-6 w-6" />,
    title: 'Account Ready',
    achievements: [
      'Account created and verified',
      'Lab profile configured',
      'Basic settings completed',
      'Dashboard accessible'
    ],
    color: 'border-l-blue-500'
  },
  {
    timeframe: 'First Day',
    icon: <Calendar className="h-6 w-6" />,
    title: 'Fully Configured',
    achievements: [
      'Test types added and priced',
      'Billing settings configured',
      'Staff accounts created',
      'Ready for operations'
    ],
    color: 'border-l-purple-500'
  },
  {
    timeframe: 'First Week',
    icon: <CalendarDays className="h-6 w-6" />,
    title: 'Operational Excellence',
    achievements: [
      '50+ patients registered',
      'Reports generated smoothly',
      'Team fully trained',
      'Workflow mastered'
    ],
    color: 'border-l-orange-500'
  },
  {
    timeframe: 'First Month',
    icon: <CalendarRange className="h-6 w-6" />,
    title: 'ROI Visible',
    achievements: [
      'Measurable time savings',
      'Reduced billing errors',
      'Analytics insights available',
      'Business growth enabled'
    ],
    color: 'border-l-green-500'
  }
];

const ExpectationsGrid = () => {
  return (
    <section className="py-20 px-4" aria-labelledby="expectations-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">What to Expect</Badge>
          <h2 id="expectations-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Your Journey with <span className="gradient-text">Lab Master</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Clear milestones to track your progress from signup to success
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expectations.map((expectation, index) => (
            <Card
              key={expectation.timeframe}
              className={`glass border-0 border-l-4 ${expectation.color} hover-lift`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {expectation.icon}
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-1">{expectation.timeframe}</Badge>
                    <h3 className="font-semibold">{expectation.title}</h3>
                  </div>
                </div>

                <ul className="space-y-2">
                  {expectation.achievements.map((achievement, achievementIndex) => (
                    <li
                      key={achievementIndex}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{achievement}</span>
                    </li>
                  ))}
                </ul>

                {/* Progress indicator */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Rocket className="h-3 w-3" />
                    <span>Step {index + 1} of 4</span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((index + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExpectationsGrid;
