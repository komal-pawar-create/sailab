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

    const requestBody = { to: phone, templateName, languageCode, params };
    console.log("[useWhatsAppShare] invoking send-myoperator-whatsapp with:", requestBody);

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-myoperator-whatsapp",
        { body: requestBody }
      );

      console.log("[useWhatsAppShare] response:", { data, error });

      if (error) {
        console.error("WhatsApp send error:", error);
        toast.error(`WhatsApp send failed: ${formatError(error)}`, { duration: 10000 });
        return { success: false, error };
      }

      if (!data?.success) {
        const apiErr = formatError(data?.error ?? data);
        toast.error(`WhatsApp send failed: ${apiErr}`, { duration: 10000 });
        return { success: false, error: apiErr, raw: data };
      }

      toast.success(`WhatsApp sent to ${firstName}`);
      return { success: true, data };
    } catch (err: any) {
      console.error("WhatsApp send exception:", err);
      toast.error(`WhatsApp send failed: ${formatError(err)}`, { duration: 10000 });
      return { success: false, error: err };
    } finally {
      setSending(false);
    }
  };

  return { sending, sendReportLink, buildTrackingUrl };
}
