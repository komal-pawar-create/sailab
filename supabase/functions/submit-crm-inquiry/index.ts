const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BIZFLOW_API_URL =
  "https://gcyrapukltxjohjfxgza.supabase.co/functions/v1/submit-inquiry";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BIZFLOW_API_KEY");
    const bizflowAnonKey = Deno.env.get("BIZFLOW_SUPABASE_ANON_KEY");
    if (!apiKey || !bizflowAnonKey) {
      console.error("BIZFLOW_API_KEY or BIZFLOW_SUPABASE_ANON_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Build payload with only fields the BizFlow API accepts
    const payload: Record<string, string> = {
      contact_person: body.contact_person,
      phone: body.phone,
      source: body.source || "labflow_lims",
    };

    if (body.email) payload.email = body.email;

    // Merge company_name into message since API rejects company_name as a standalone field
    let message = body.message || "";
    if (body.company_name) {
      message = `Company: ${body.company_name}\n${message}`.trim();
    }
    if (message) payload.message = message;

    console.log("Submitting to BizFlow CRM:", JSON.stringify({ ...payload, phone: "***" }));

    const response = await fetch(BIZFLOW_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": bizflowAnonKey,
        "x-public-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("BizFlow CRM response:", response.status, JSON.stringify(data));

    if (response.status === 409) {
      console.log("BizFlow CRM: duplicate lead (409), treating as success");
      return new Response(
        JSON.stringify({ success: true, duplicate: true, message: "We already have your inquiry! Our team will contact you shortly." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      console.error("BizFlow CRM error:", response.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: data?.message || `CRM API returned ${response.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CRM submission error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to submit inquiry" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
