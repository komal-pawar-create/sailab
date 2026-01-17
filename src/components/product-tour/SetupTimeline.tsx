import React from 'react';
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

interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  duration: string;
  tasks: string[];
}

interface TimelineDay {
  day: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: TimelineStep[];
}

const timelineDays: TimelineDay[] = [
  {
    day: 'Day 1',
    title: 'Quick Setup',
    description: 'Get your lab profile ready in under 30 minutes',
    icon: <UserPlus className="h-6 w-6" />,
    color: 'bg-blue-500',
    steps: [
      {
        icon: <UserPlus className="h-5 w-5 text-blue-500" />,
        title: 'Create Account',
        duration: '2 min',
        tasks: ['Sign up with email', 'Verify your account', 'Set secure password']
      },
      {
        icon: <Building2 className="h-5 w-5 text-blue-500" />,
        title: 'Configure Lab Profile',
        duration: '5 min',
        tasks: ['Add lab name and address', 'Upload logo', 'Set contact details']
      },
      {
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        title: 'Add Test Types',
        duration: '10 min',
        tasks: ['Import from global catalog', 'Set custom pricing', 'Configure report templates']
      },
      {
        icon: <Settings className="h-5 w-5 text-blue-500" />,
        title: 'Set Up Billing',
        duration: '5 min',
        tasks: ['Configure GST settings', 'Add payment methods', 'Set terms and conditions']
      }
    ]
  },
  {
    day: 'Day 2',
    title: 'Team Configuration',
    description: 'Invite your team and configure roles',
    icon: <Settings className="h-6 w-6" />,
    color: 'bg-purple-500',
    steps: [
      {
        icon: <Users className="h-5 w-5 text-purple-500" />,
        title: 'Add Staff Members',
        duration: '5 min',
        tasks: ['Invite operators via email', 'Set usernames and passwords', 'Assign to branches']
      },
      {
        icon: <Settings className="h-5 w-5 text-purple-500" />,
        title: 'Configure Permissions',
        duration: '5 min',
        tasks: ['Select role for each user', 'Set access levels', 'Enable/disable features']
      },
      {
        icon: <Building2 className="h-5 w-5 text-purple-500" />,
        title: 'Branch Setup',
        duration: '10 min',
        tasks: ['Add branch locations', 'Configure branch-specific settings', 'Set up branch operators']
      },
      {
        icon: <FileText className="h-5 w-5 text-purple-500" />,
        title: 'Customize Templates',
        duration: '10 min',
        tasks: ['Upload letterhead', 'Configure report format', 'Set footer text']
      }
    ]
  },
  {
    day: 'Day 3',
    title: 'Go Live!',
    description: 'Start managing patients and generating reports',
    icon: <Rocket className="h-6 w-6" />,
    color: 'bg-green-500',
    steps: [
      {
        icon: <UserPlus className="h-5 w-5 text-green-500" />,
        title: 'Register First Patient',
        duration: '2 min',
        tasks: ['Enter patient details', 'Auto-generate patient ID', 'Add to system']
      },
      {
        icon: <FileText className="h-5 w-5 text-green-500" />,
        title: 'Create First Bill',
        duration: '2 min',
        tasks: ['Select tests', 'Apply discounts if any', 'Generate invoice']
      },
      {
        icon: <FileText className="h-5 w-5 text-green-500" />,
        title: 'Generate First Report',
        duration: '3 min',
        tasks: ['Enter test results', 'Preview report', 'Send to patient']
      },
      {
        icon: <Rocket className="h-5 w-5 text-green-500" />,
        title: 'Full Operation Mode',
        duration: '∞',
        tasks: ['Manage daily operations', 'Track analytics', 'Scale your lab']
      }
    ]
  }
];

const SetupTimeline = () => {
  return (
    <section className="py-20 px-4" aria-labelledby="timeline-heading">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Getting Started</Badge>
          <h2 id="timeline-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Up and Running in <span className="gradient-text">3 Days</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our step-by-step setup process ensures you're fully operational within 3 days
          </p>
        </div>

        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 hidden md:block" />

          <div className="space-y-12">
            {timelineDays.map((day, dayIndex) => (
              <div
                key={day.day}
                className={`relative flex flex-col ${
                  dayIndex % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-8 items-start md:items-center`}
              >
                {/* Timeline node */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10">
                  <div className={`${day.color} text-white p-3 rounded-full shadow-lg`}>
                    {day.icon}
                  </div>
                </div>

                {/* Content card */}
                <Card className={`flex-1 ${dayIndex % 2 === 0 ? 'md:mr-auto md:pr-16' : 'md:ml-auto md:pl-16'} md:w-[45%] w-full glass border-0`}>
                  <CardContent className="p-6">
                    {/* Mobile timeline node */}
                    <div className="flex md:hidden items-center gap-3 mb-4">
                      <div className={`${day.color} text-white p-2 rounded-full`}>
                        {day.icon}
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-1">{day.day}</Badge>
                        <h3 className="font-bold text-xl">{day.title}</h3>
                      </div>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden md:block mb-4">
                      <Badge variant="outline" className="mb-2">{day.day}</Badge>
                      <h3 className="font-bold text-xl mb-1">{day.title}</h3>
                      <p className="text-sm text-muted-foreground">{day.description}</p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                      {day.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {step.icon}
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SetupTimeline;
