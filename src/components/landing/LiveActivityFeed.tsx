import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, FileText, TestTube, Building2 } from 'lucide-react';

interface Activity {
  id: number;
  type: 'signup' | 'bill' | 'test' | 'lab';
  location: string;
  timeAgo: string;
}

const icons = {
  signup: UserPlus,
  bill: FileText,
  test: TestTube,
  lab: Building2,
};

const messageKeys = {
  signup: 'activity.newLabSignedUp',
  bill: 'activity.billGenerated',
  test: 'activity.testReportCreated',
  lab: 'activity.labOnboarded',
};

const locations = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Indore', 'Nagpur', 'Coimbatore', 'Kochi',
];

const generateActivity = (id: number): Activity => {
  const types: Activity['type'][] = ['signup', 'bill', 'test', 'lab'];
  const type = types[Math.floor(Math.random() * types.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const minutes = Math.floor(Math.random() * 30) + 1;
  
  return {
    id,
    type,
    location,
    timeAgo: `${minutes}m ago`,
  };
};

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([
    generateActivity(1),
  ]);
  const [counter, setCounter] = useState(2);
  const { t } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateActivity(counter);
        setCounter((c) => c + 1);
        return [newActivity];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [counter]);

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block" aria-live="polite" aria-atomic="false">
      <AnimatePresence mode="wait">
        {activities.map((activity) => {
          const Icon = icons[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl glass shadow-lg max-w-xs"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {t(messageKeys[activity.type])}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.location} • {activity.timeAgo}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default LiveActivityFeed;
