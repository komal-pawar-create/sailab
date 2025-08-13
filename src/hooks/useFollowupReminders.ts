import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface Followup {
  id: string;
  title: string;
  patient_name: string;
  due_at: string;
  remind_at: string;
  priority: 'low' | 'medium' | 'high';
}

export function useFollowupReminders() {
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Check for overdue followups
        const { data: overdueFollowups } = await supabase
          .from('patient_followups')
          .select(`
            id,
            title,
            due_at,
            priority,
            patients!inner(full_name)
          `)
          .eq('status', 'open')
          .lt('due_at', now.toISOString());

        // Check for upcoming reminders
        const { data: upcomingReminders } = await supabase
          .from('patient_followups')
          .select(`
            id,
            title,
            remind_at,
            priority,
            patients!inner(full_name)
          `)
          .eq('status', 'open')
          .not('remind_at', 'is', null)
          .lte('remind_at', thirtyMinutesFromNow.toISOString())
          .gte('remind_at', now.toISOString());

        // Show overdue notifications
        overdueFollowups?.forEach((followup: any) => {
          toast.error(`Overdue: ${followup.title}`, {
            description: `Patient: ${followup.patients.full_name}`,
            duration: 8000,
          });
        });

        // Show upcoming reminders
        upcomingReminders?.forEach((followup: any) => {
          toast.info(`Reminder: ${followup.title}`, {
            description: `Patient: ${followup.patients.full_name}`,
            duration: 6000,
          });
        });

      } catch (error) {
        console.error('Error checking followup reminders:', error);
      }
    };

    // Check immediately
    checkReminders();

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}