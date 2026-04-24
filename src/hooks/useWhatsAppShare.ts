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

  const sendReportLink = async ({
    patientPhone,
    patientName,
    testName,
    billId,
    labName,
    templateName = "copy_labflow",
    languageCode = "en",
  }: SendReportLinkArgs) => {
    if (!patientPhone) {
      toast.error("Patient has no phone number on file");
      return { success: false };
    }
    if (!billId) {
      toast.error("No bill linked — cannot create tracking link");
      return { success: false };
    }

    const phone = normalizePhone(patientPhone);
    if (phone.length < 12) {
      toast.error("Invalid phone number");
      return { success: false };
    }

    const firstName = (patientName || "Patient").trim().split(/\s+/)[0];
    const trackingUrl = buildTrackingUrl(billId);
    const params = [firstName, testName || "lab", trackingUrl, labName || "Your Lab"];

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-myoperator-whatsapp",
        {
          body: { to: phone, templateName, languageCode, params },
        }
      );

      if (error) {
        console.error("WhatsApp send error:", error);
        toast.error(error.message || "Failed to send WhatsApp message");
        return { success: false, error };
      }

      if (!data?.success) {
        const apiErr =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message || JSON.stringify(data?.error || {});
        toast.error(`WhatsApp send failed: ${apiErr}`);
        return { success: false, error: apiErr };
      }

      toast.success(`WhatsApp sent to ${firstName}`);
      return { success: true, data };
    } catch (err: any) {
      console.error("WhatsApp send exception:", err);
      toast.error(err.message || "Failed to send WhatsApp");
      return { success: false, error: err };
    } finally {
      setSending(false);
    }
  };

  return { sending, sendReportLink, buildTrackingUrl };
}
