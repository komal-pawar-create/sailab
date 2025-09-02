import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, letterheadUrl, logoUrl, extractedText, documentType } = await req.json();
    
    console.log('Processing document:', { documentId, documentType, hasLetterhead: !!letterheadUrl, hasLogo: !!logoUrl });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // For now, we'll return a simple response indicating the document was processed
    // In a real implementation, we would:
    // 1. Download the letterhead image
    // 2. Use a PDF library to create a PDF with the letterhead as background
    // 3. Add the extracted text on top of the letterhead
    // 4. Upload the generated PDF to storage
    // 5. Return the URL of the generated PDF
    
    // Placeholder response for now
    const response = {
      success: true,
      message: 'Document processing initiated',
      documentId,
      letterheadUrl,
      logoUrl,
      extractedText: extractedText ? extractedText.substring(0, 100) + '...' : null,
      // In production, this would be the actual generated PDF URL
      generatedPdfUrl: null,
      note: 'PDF generation with letterhead overlay will be implemented with a proper PDF library'
    };
    
    console.log('Document processing complete:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});