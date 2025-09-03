import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";
import mammoth from "https://esm.sh/mammoth@1.6.0";

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
    // Get the authorization header to extract user info
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const { documentId, letterheadUrl, logoUrl, extractedText, documentType, originalFileUrl, fileName, labId, branchId } = await req.json();
    
    console.log('Processing document:', { documentId, documentType, hasLetterhead: !!letterheadUrl, fileName });
    
    // Check if file type is supported
    const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExtension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      console.warn('Unsupported file type:', fileExtension);
      return new Response(
        JSON.stringify({
          error: 'UNSUPPORTED_FILE_TYPE',
          message: `File type "${fileExtension || 'unknown'}" is not supported for letterhead processing.`,
          supportedTypes: supportedExtensions,
          details: 'Supported file types: PDF, images (JPG, JPEG, PNG), and Word documents (DOC, DOCX).'
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Failed to authenticate user');
    }

    console.log('Authenticated user:', user.id);

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Download letterhead image if provided
      let letterheadImage;
      if (letterheadUrl) {
        console.log('Downloading letterhead from:', letterheadUrl);
        const letterheadResponse = await fetch(letterheadUrl);
        const letterheadBytes = await letterheadResponse.arrayBuffer();
        
        // Embed the letterhead image
        if (letterheadUrl.toLowerCase().includes('.png')) {
          letterheadImage = await pdfDoc.embedPng(letterheadBytes);
        } else {
          letterheadImage = await pdfDoc.embedJpg(letterheadBytes);
        }
      }

      // Embed standard fonts for text rendering
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Handle different document types
      if (originalFileUrl && (fileName.toLowerCase().endsWith('.pdf'))) {
        // If original is a PDF, load it and add letterhead to each page
        console.log('Processing PDF document');
        const originalResponse = await fetch(originalFileUrl);
        const originalPdfBytes = await originalResponse.arrayBuffer();
        const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
        
        const pages = await pdfDoc.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());
        
        for (const page of pages) {
          pdfDoc.addPage(page);
          
          // Add letterhead as background if available
          if (letterheadImage) {
            const { width, height } = page.getSize();
            page.drawImage(letterheadImage, {
              x: 0,
              y: 0,
              width: width,
              height: height,
              opacity: 0.3, // Make letterhead semi-transparent
            });
          }
        }
      } else if (originalFileUrl && (fileName.toLowerCase().match(/\.(doc|docx)$/))) {
        // Handle Word documents
        console.log('Processing Word document');
        const originalResponse = await fetch(originalFileUrl);
        const docBytes = await originalResponse.arrayBuffer();
        
        try {
          // Extract text and HTML from the Word document
          const result = await mammoth.extractRawText({ arrayBuffer: docBytes });
          const htmlResult = await mammoth.convertToHtml({ arrayBuffer: docBytes });
          
          console.log('Extracted text from Word document, length:', result.value.length);
          
          // Process the text content into paragraphs
          const paragraphs = result.value.split('\n\n').filter(p => p.trim());
          
          // Helper function to add a new page with letterhead
          const addPageWithLetterhead = () => {
            const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
            
            if (letterheadImage) {
              const { width, height } = page.getSize();
              page.drawImage(letterheadImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
                opacity: 0.25, // Slightly more subtle for text documents
              });
            }
            
            return page;
          };
          
          // Start with the first page
          let currentPage = addPageWithLetterhead();
          let yPosition = 841.89 - 120; // Start below letterhead area (120pt from top)
          const leftMargin = 60;
          const rightMargin = 60;
          const lineHeight = 18;
          const fontSize = 11;
          const titleFontSize = 14;
          const maxWidth = 595.28 - leftMargin - rightMargin;
          const bottomMargin = 100;
          
          // Process each paragraph
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i].trim();
            
            if (!paragraph) continue;
            
            // Determine if this is a title (simple heuristic: short lines, all caps, or specific patterns)
            const isTitle = paragraph.length < 50 && 
                          (paragraph === paragraph.toUpperCase() || 
                           paragraph.startsWith('Subject:') || 
                           paragraph.startsWith('RE:') ||
                           paragraph.startsWith('To:') ||
                           paragraph.startsWith('From:'));
            
            const currentFont = isTitle ? helveticaBoldFont : helveticaFont;
            const currentFontSize = isTitle ? titleFontSize : fontSize;
            
            // Split long paragraphs into lines that fit the page width
            const words = paragraph.split(' ');
            let currentLine = '';
            const lines = [];
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const testWidth = currentFont.widthOfTextAtSize(testLine, currentFontSize);
              
              if (testWidth > maxWidth) {
                if (currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  // Single word is too long, add it anyway
                  lines.push(word);
                  currentLine = '';
                }
              } else {
                currentLine = testLine;
              }
            }
            
            if (currentLine) {
              lines.push(currentLine);
            }
            
            // Check if we need a new page
            const requiredSpace = lines.length * lineHeight + (isTitle ? 30 : 20);
            if (yPosition - requiredSpace < bottomMargin) {
              currentPage = addPageWithLetterhead();
              yPosition = 841.89 - 120;
            }
            
            // Draw the lines
            for (const line of lines) {
              currentPage.drawText(line, {
                x: leftMargin,
                y: yPosition,
                size: currentFontSize,
                font: currentFont,
                color: rgb(0, 0, 0),
              });
              yPosition -= lineHeight;
            }
            
            // Add extra space after paragraphs
            yPosition -= isTitle ? 15 : 10;
          }
          
        } catch (extractError) {
          console.error('Error extracting text from Word document:', extractError);
          // Fallback to creating a simple page with error message
          const page = pdfDoc.addPage([595.28, 841.89]);
          
          if (letterheadImage) {
            const { width, height } = page.getSize();
            page.drawImage(letterheadImage, {
              x: 0,
              y: 0,
              width: width,
              height: height,
              opacity: 0.25,
            });
          }
          
          page.drawText('Unable to extract content from Word document.', {
            x: 60,
            y: 700,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      } else if (originalFileUrl && (fileName.toLowerCase().match(/\.(jpg|jpeg|png)$/))) {
        // If original is an image, create a PDF with the image
        console.log('Processing image document');
        const originalResponse = await fetch(originalFileUrl);
        const imageBytes = await originalResponse.arrayBuffer();
        
        let embeddedImage;
        if (fileName.toLowerCase().includes('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
        
        // Create a page with A4 dimensions
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
        
        // Add letterhead as background if available
        if (letterheadImage) {
          const { width, height } = page.getSize();
          page.drawImage(letterheadImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 0.3,
          });
        }
        
        // Add the original image, scaled to fit
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const imgDims = embeddedImage.scale(0.5);
        page.drawImage(embeddedImage, {
          x: (pageWidth - imgDims.width) / 2,
          y: (pageHeight - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      } else {
        // For other document types or when we only have text, create a simple PDF
        console.log('Creating new PDF with letterhead');
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        
        // Add letterhead as background if available
        if (letterheadImage) {
          const { width, height } = page.getSize();
          page.drawImage(letterheadImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 0.3,
          });
        }
        
        // Add extracted text if available
        if (extractedText) {
          const { width, height } = page.getSize();
          const fontSize = 12;
          const margin = 50;
          
          page.drawText(extractedText.substring(0, 500), {
            x: margin,
            y: height - margin - fontSize,
            size: fontSize,
            color: rgb(0, 0, 0),
            maxWidth: width - 2 * margin,
          });
        }
      }

      // Generate the PDF bytes
      const pdfBytes = await pdfDoc.save();
      
      // Generate unique filename for the processed document
      const timestamp = Date.now();
      const processedFileName = `letterhead_${timestamp}_${fileName || 'document'}.pdf`;
      const storagePath = `processed/${labId}/${branchId}/${processedFileName}`;
      
      console.log('Uploading processed PDF to:', storagePath);
      
      // Upload the generated PDF to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lab-files')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded PDF
      const { data: { publicUrl } } = supabase.storage
        .from('lab-files')
        .getPublicUrl(storagePath);

      // Save the template reference in the database
      const { data: templateData, error: templateError } = await supabase
        .from('document_templates')
        .insert({
          original_document_id: documentId,
          lab_id: labId,
          branch_id: branchId,
          template_type: 'letterhead',
          template_url: letterheadUrl,
          generated_pdf_url: publicUrl,
          created_by: user.id,
          metadata: {
            original_file_name: fileName,
            processed_at: new Date().toISOString(),
            has_letterhead: !!letterheadUrl,
            has_logo: !!logoUrl
          }
        })
        .select()
        .single();

      if (templateError) {
        console.error('Error saving template:', templateError);
        throw templateError;
      }

      console.log('Document processing complete:', { 
        templateId: templateData.id,
        pdfUrl: publicUrl 
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Document processed successfully',
          documentId,
          generatedPdfUrl: publicUrl,
          templateId: templateData.id
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (processingError) {
      console.error('Error during PDF processing:', processingError);
      throw processingError;
    }
  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process document with letterhead'
      }),
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