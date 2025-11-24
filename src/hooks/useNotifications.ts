import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

interface SendNotificationParams {
  to: string;
  subject?: string;
  message: string;
  channels: NotificationChannel[];
  patientName?: string;
}

export const useNotifications = () => {
  const sendNotification = async ({
    to,
    subject,
    message,
    channels,
    patientName,
  }: SendNotificationParams) => {
    const results = {
      email: false,
      sms: false,
      whatsapp: false,
    };

    // Send Email
    if (channels.includes('email')) {
      try {
        const fromEmail = localStorage.getItem('resend_from_email');
        const fromName = localStorage.getItem('resend_from_name');

        const { data, error } = await supabase.functions.invoke('send-email-notification', {
          body: {
            to,
            subject: subject || 'Lab Notification',
            html: `
              <h2>${subject || 'Lab Notification'}</h2>
              ${patientName ? `<p><strong>Patient:</strong> ${patientName}</p>` : ''}
              <p>${message}</p>
              <br/>
              <p style="color: #666; font-size: 12px;">This is an automated notification from your laboratory management system.</p>
            `,
            fromEmail,
            fromName,
          },
        });

        if (error) throw error;
        results.email = data?.success || false;
        console.log('Email sent:', data);
      } catch (error) {
        console.error('Email error:', error);
      }
    }

    // Send SMS
    if (channels.includes('sms')) {
      try {
        const { data, error } = await supabase.functions.invoke('send-sms-notification', {
          body: {
            to,
            message: `${subject ? subject + ': ' : ''}${message}`,
          },
        });

        if (error) throw error;
        results.sms = data?.success || false;
        console.log('SMS sent:', data);
      } catch (error) {
        console.error('SMS error:', error);
      }
    }

    // Send WhatsApp
    if (channels.includes('whatsapp')) {
      try {
        const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
          body: {
            to,
            message: `${subject ? subject + '\n\n' : ''}${message}`,
          },
        });

        if (error) throw error;
        results.whatsapp = data?.success || false;
        console.log('WhatsApp sent:', data);
      } catch (error) {
        console.error('WhatsApp error:', error);
      }
    }

    return results;
  };

  const notifyBillCreated = async (
    patientPhone: string,
    patientName: string,
    billNumber: string,
    totalAmount: number,
    channels: NotificationChannel[]
  ) => {
    const message = `Your bill ${billNumber} has been generated. Total amount: ₹${totalAmount.toFixed(2)}. Please proceed with payment.`;
    
    try {
      await sendNotification({
        to: patientPhone,
        subject: 'Bill Generated',
        message,
        channels,
        patientName,
      });
      toast.success('Notification sent to patient');
    } catch (error) {
      console.error('Error sending bill notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const notifyTestReportReady = async (
    patientPhone: string,
    patientName: string,
    testType: string,
    channels: NotificationChannel[]
  ) => {
    const message = `Your ${testType} test report is ready. Please contact the lab to collect your report.`;
    
    try {
      await sendNotification({
        to: patientPhone,
        subject: 'Test Report Ready',
        message,
        channels,
        patientName,
      });
      toast.success('Notification sent to patient');
    } catch (error) {
      console.error('Error sending report notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const notifyFollowupReminder = async (
    patientPhone: string,
    patientName: string,
    followupTitle: string,
    dueDate: string,
    channels: NotificationChannel[]
  ) => {
    const message = `Reminder: You have a follow-up appointment "${followupTitle}" scheduled for ${new Date(dueDate).toLocaleDateString()}.`;
    
    try {
      await sendNotification({
        to: patientPhone,
        subject: 'Follow-up Reminder',
        message,
        channels,
        patientName,
      });
      toast.success('Reminder sent to patient');
    } catch (error) {
      console.error('Error sending followup notification:', error);
      toast.error('Failed to send reminder');
    }
  };

  return {
    sendNotification,
    notifyBillCreated,
    notifyTestReportReady,
    notifyFollowupReminder,
  };
};
