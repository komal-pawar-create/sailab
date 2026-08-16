import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SendReportLinkArgs {
  patientPhone: string | null | undefined;
  patientName: string;
  testName: string;
  billId: string;
  labName: string;
  templateName?: string;
  languageCode?: string;
  recipientPhone?: string | null | undefined;
  recipientName?: string;
  recipientType?: "patient" | "doctor";
  missingPhoneMessage?: string;
  invalidPhoneMessage?: string;
  successMessage?: string;
  params?: string[];
}

export function useWhatsAppShare() {
  const [sending, setSending] = useState(false);

  const buildTrackingUrl = (billId: string) =>
    `https://labflow.mywebz.in/track/${billId}`;

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const isValidWhatsAppNumber = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };

  const formatError = (err: unknown): string => {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      return String(err);
    }
  };

  const sendReportLink = async ({
    patientPhone,
    patientName,
    testName,
    billId,
    labName,
    templateName = "copy_labflow",
    languageCode = "en",
    recipientPhone,
    recipientName,
    recipientType = "patient",
    missingPhoneMessage,
    invalidPhoneMessage,
    successMessage,
    params,
  }: SendReportLinkArgs) => {
    const targetPhone = recipientPhone ?? patientPhone;
    const targetName = recipientName || patientName || (recipientType === "doctor" ? "Doctor" : "Patient");

    if (!targetPhone) {
      toast.error(missingPhoneMessage || "Patient has no phone number on file");
      return { success: false };
    }
    if (!billId) {
      toast.error("No bill linked — cannot create tracking link");
      return { success: false };
    }

    if (!isValidWhatsAppNumber(targetPhone)) {
      toast.error(invalidPhoneMessage || "Invalid phone number");
      return { success: false };
    }

    const phone = normalizePhone(targetPhone);
    if (!isValidWhatsAppNumber(phone)) {
      toast.error(invalidPhoneMessage || "Invalid phone number");
      return { success: false };
    }

    const firstName = (targetName || "Patient").trim().split(/\s+/)[0];
    const trackingUrl = buildTrackingUrl(billId);
    const templateParams = params || [firstName, testName || "lab", trackingUrl, labName || "Your Lab"];

    const message = `Hello ${firstName},\n\nYour ${testName || "lab"} report from ${labName || "Your Lab"} is ready.\n\nYou can view or download it here:\n${trackingUrl}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    toast.success(successMessage || `Opening WhatsApp for ${firstName}`);
    setSending(false);
    return { success: true };
  };

  return { sending, sendReportLink, buildTrackingUrl };
}
