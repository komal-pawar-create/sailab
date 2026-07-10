import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResultRow = {
  testName: string;
  categoryName?: string;
  result?: string;
  unit?: string;
  refRange?: string;
  isAbnormal?: boolean;
  sortOrder?: number;
  isSectionHeader?: boolean;
};

const text = (value: unknown) => (value == null ? "" : String(value));

const split = (doc: jsPDF, value: string, width: number) => doc.splitTextToSize(text(value), width) as string[];

const encodeBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  return btoa(binary);
};

const loadSignatureImage = async (adminClient: ReturnType<typeof createClient>, signaturePath: string) => {
  if (!signaturePath) return null;
  const url = signaturePath.startsWith("http")
    ? signaturePath
    : adminClient.storage.from("lab-assets").getPublicUrl(signaturePath).data.publicUrl;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.includes("png") && !contentType.includes("jpeg") && !contentType.includes("jpg")) return null;
    const format = contentType.includes("jpeg") || contentType.includes("jpg") ? "JPEG" : "PNG";
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { data: `data:${contentType};base64,${encodeBase64(bytes)}`, format };
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !serviceRole || !anonKey) {
      throw new Error("Missing Supabase function environment variables.");
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceRole);

    const { data: userData, error: userError } = await authedClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reportId } = await req.json();
    if (!reportId) throw new Error("reportId is required.");

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, role, lab_id, branch_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Profile not found.");

    const { data: report, error: reportError } = await adminClient
      .from("test_reports")
      .select("*, patients(*), branches(*), labs(*), referring_doctors(*)")
      .eq("id", reportId)
      .maybeSingle();
    if (reportError) throw reportError;
    if (!report) throw new Error("Report not found.");

    const isSuper = profile.role === "super_admin";
    const isLabAdmin = profile.role === "admin" || profile.role === "lab_admin";
    const allowed =
      isSuper ||
      (isLabAdmin && profile.lab_id === report.lab_id) ||
      profile.branch_id === report.branch_id;
    if (!allowed) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((report.department ?? "pathology") !== "pathology") {
      throw new Error("This PDF generator currently supports pathology reports only.");
    }

    const rows = Array.isArray(report.results) ? report.results as ResultRow[] : [];
    const patient = Array.isArray(report.patients) ? report.patients[0] : report.patients;
    const branch = Array.isArray(report.branches) ? report.branches[0] : report.branches;
    const lab = Array.isArray(report.labs) ? report.labs[0] : report.labs;
    const referringDoctor = Array.isArray(report.referring_doctors) ? report.referring_doctors[0] : report.referring_doctors;
    const reportNumber = report.report_number || `RPT-${new Date(report.created_at ?? Date.now()).getFullYear()}-${String(report.id).slice(0, 8).toUpperCase()}`;
    const signatureImage = await loadSignatureImage(adminClient, text(branch?.signature_url || lab?.signature_url));
    const consultantName = text(branch?.consultant_pathologist_name);
    const labInchargeName = text(branch?.lab_incharge_name);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const page = { width: 210, height: 297, marginX: 14, footerTop: 258 };
    let y = 18;
    let currentCategory = "";

    const header = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(text(branch?.name || lab?.name || "LabFlow Diagnostics"), 105, 14, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const address = [branch?.address_line1, branch?.address_line2, branch?.city, branch?.state, branch?.phone].filter(Boolean).join(" | ");
      if (address) doc.text(address, 105, 20, { align: "center" });
      doc.setDrawColor(22, 110, 210);
      doc.line(page.marginX, 24, page.width - page.marginX, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`DEPARTMENT OF ${text(report.department || "pathology").toUpperCase()}`, 105, 31, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const leftX = page.marginX;
      const rightX = 112;
      doc.text(`REPORT NO : ${reportNumber}`, leftX, 40);
      doc.text(`PATIENT NAME : ${text(patient?.full_name)}`, leftX, 46);
      doc.text(`AGE/SEX : ${text(patient?.age)} / ${text(patient?.gender)}`, leftX, 52);
      doc.text(`REFERRED BY : ${text(referringDoctor?.doctor_name || "Self / Walk-in")}`, leftX, 58);
      doc.text(`DATE : ${text(report.test_date)}`, rightX, 40);
      doc.text(`SAMPLE : ${text(report.modality || "Laboratory")}`, rightX, 46);
      doc.text(`STUDY : ${text(report.test_type)}`, rightX, 52);
      doc.line(page.marginX, 63, page.width - page.marginX, 63);
      doc.setFont("helvetica", "bold");
      doc.text("Test Name", page.marginX, 70);
      doc.text("Value", 91, 70);
      doc.text("Unit", 125, 70);
      doc.text("Bio. Ref Interval", 150, 70);
      doc.line(page.marginX, 73, page.width - page.marginX, 73);
      y = 80;
    };

    const ensureSpace = (needed = 10) => {
      if (y + needed < page.footerTop) return;
      doc.addPage();
      currentCategory = "";
      header();
    };

    header();
    doc.setFontSize(9);

    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).forEach((row) => {
      const category = text(row.categoryName || report.test_type);
      if (category && category !== currentCategory) {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(category, page.marginX, y);
        y += 7;
        doc.setFontSize(9);
        currentCategory = category;
      }

      if (row.isSectionHeader) {
        ensureSpace(8);
        doc.setFont("helvetica", "bold");
        doc.text(text(row.testName), page.marginX, y);
        y += 6;
        return;
      }

      const nameLines = split(doc, row.testName, 72);
      const valueLines = split(doc, row.result || "", 31);
      const unitLines = split(doc, row.unit || "", 20);
      const refLines = split(doc, row.refRange || "", 44);
      const lineCount = Math.max(nameLines.length, valueLines.length, unitLines.length, refLines.length, 1);
      ensureSpace(lineCount * 5 + 3);
      doc.setFont("helvetica", row.isAbnormal ? "bold" : "normal");
      doc.text(nameLines, page.marginX, y);
      doc.text(valueLines, 91, y);
      doc.text(unitLines, 125, y);
      doc.text(refLines, 150, y);
      y += lineCount * 5 + 2;
    });

    if (report.study_notes) {
      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.text("COMMENTS", page.marginX, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const commentLines = split(doc, text(report.study_notes), page.width - page.marginX * 2);
      commentLines.forEach((line) => {
        ensureSpace(6);
        doc.text(line, page.marginX, y);
        y += 5;
      });
    }

    // Reserve a fixed final footer zone so content never overlaps signatures.
    ensureSpace(60);
    const footerText = text(branch?.footer_text);
    if (footerText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(split(doc, footerText, 182).slice(0, 2), page.marginX, 232);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("*** End Of Report ***", 105, 246, { align: "center" });
    doc.setFont("helvetica", "normal");
    if (signatureImage) {
      doc.addImage(signatureImage.data, signatureImage.format, 137, 253, 46, 14, undefined, "FAST");
    }
    doc.line(22, 270, 78, 270);
    doc.line(132, 270, 188, 270);
    if (labInchargeName) doc.text(labInchargeName, 50, 276, { align: "center" });
    if (consultantName) doc.text(consultantName, 160, 276, { align: "center" });
    doc.text("Lab Incharge", 50, labInchargeName ? 282 : 276, { align: "center" });
    doc.text("Consultant Pathologist", 160, consultantName ? 282 : 276, { align: "center" });

    const bytes = doc.output("arraybuffer");
    const path = `${report.lab_id}/${report.branch_id || "branch"}/${report.id}.pdf`;
    const { error: uploadError } = await adminClient.storage
      .from("pathology-reports")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = adminClient.storage.from("pathology-reports").getPublicUrl(path);
    const pdfUrl = publicUrlData.publicUrl;
    const { error: updateError } = await adminClient
      .from("test_reports")
      .update({
        report_number: reportNumber,
        pdf_url: pdfUrl,
        finalized_at: new Date().toISOString(),
        finalized_by: userData.user.id,
        status: "completed",
      })
      .eq("id", report.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, pdfUrl, reportNumber }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
