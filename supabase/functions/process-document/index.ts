import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import mammoth from "npm:mammoth@1.8.0";
import WordExtractor from "npm:word-extractor@1.0.4";
import { Buffer } from "node:buffer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Medical report field patterns - Updated to capture doctor details and signatures
const MEDICAL_PATTERNS = {
  patientName: /(?:PATIENT\s*NAME|NAME|MR\.|MRS\.|MS\.|MASTER)\s*:?\s*(.+?)(?:\n|$)/i,
  age: /(?:AGE\/SEX|AGE|AGE\/GENDER|SEX\/AGE)\s*:?\s*(.+?)(?:\n|$)/i,
  patientId: /(?:PATIENT\s*ID|ID|REG\.\s*NO\.?|REGISTRATION|LAB\s*NO\.?)\s*:?\s*(.+?)(?:\n|$)/i,
  date: /(?:DATE|REPORT\s*DATE|COLLECTION\s*DATE|TEST\s*DATE)\s*:?\s*(.+?)(?:\n|$)/i,
  referredBy: /(?:REF(?:\.|ERRED)?\s*BY\s*(?:DR\.?|DOCTOR)?|REF\s*DR\.?|REFERRING\s*(?:DR\.?|DOCTOR)?)\s*:?\s*([A-Za-z\s.]+?)(?:\n|$)/i,
  testName: /(?:TEST\s*NAME|INVESTIGATION|TEST|EXAMINATION)\s*:?\s*(.+?)(?:\n|$)/i,
  specimen: /(?:SPECIMEN|SAMPLE\s*TYPE|SAMPLE)\s*:?\s*(.+?)(?:\n|$)/i,
  report: /(?:REPORT|TEST\s*REPORT|INVESTIGATION\s*REPORT|FINDINGS)\s*:?\s*(.+?)(?=IMPRESSION|CONCLUSION|COMMENT|DIAGNOSIS|NOTE|DR\.|DOCTOR|Authorized|Disclaimer|CONSULTING|CONSULTANT|$)/si,
  impression: /(?:IMPRESSION|CONCLUSION|COMMENT|DIAGNOSIS|NOTE)\s*:?\s*(.+?)(?=DR\.|DOCTOR|Authorized|Disclaimer|CONSULTING|CONSULTANT|M\.?B\.?B\.?S|M\.?D|D\.?M\.?R\.?D|$)/si,
  doctorName: /(?:DR\.|DOCTOR|Dr\.)\s+([A-Z][A-Za-z\s.]+?)(?=\n|M\.?B\.?B\.?S|M\.?D|D\.?M\.?R\.?D|CONSULTING|CONSULTANT|,|$)/i,
  doctorQualifications: /(?:M\.?B\.?B\.?S\.?|M\.?D\.?|D\.?M\.?R\.?D\.?|F\.?R\.?C\.?S\.?|M\.?R\.?C\.?P\.?|M\.?S\.?|M\.?Ch\.?|D\.?M\.?|D\.?N\.?B\.?)[\s,]*([\w\s,.\(\)]*?)(?=\n|CONSULTING|CONSULTANT|$)/i,
  doctorDesignation: /(?:CONSULTING|CONSULTANT)\s+([A-Z][A-Za-z\s&]+?)(?:\n|$)/i,
  disclaimer: /(?:Disclaimer|Note|DISCLAIMER|NOTE)\s*:?\s*(.+?)(?=$)/si,
  authorizedSignature: /(?:Authorized\s+Signature|Auth\.\s+Sign|AUTHORIZED\s+SIGNATURE)\s*:?\s*(.+?)(?:\n|$)/i
};

// Helper function to detect if text is a medical report
function isMedicalReport(text: string): boolean {
  const patterns = Object.values(MEDICAL_PATTERNS);
  const matches = patterns.filter(pattern => pattern.test(text));
  return matches.length >= 3; // If at least 3 medical fields are found
}

// Helper function to parse medical report fields
function parseMedicalReport(text: string) {
  const fields: any = {};
  
  for (const [key, pattern] of Object.entries(MEDICAL_PATTERNS)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      fields[key] = match[1].trim().replace(/\s+/g, ' ');
    }
  }
  
  // Clean up the report and impression to remove redundant patterns
  if (fields.report) {
    fields.report = fields.report
      .replace(/^REPORT\s*:?\s*/i, '')
      .replace(/^TEST\s*REPORT\s*:?\s*/i, '')
      .trim();
  }
  
  if (fields.impression) {
    fields.impression = fields.impression
      .replace(/^IMPRESSION\s*:?\s*/i, '')
      .replace(/^CONCLUSION\s*:?\s*/i, '')
      .replace(/^COMMENT\s*:?\s*/i, '')
      .replace(/^DIAGNOSIS\s*:?\s*/i, '')
      .replace(/^NOTE\s*:?\s*/i, '')
      .trim();
  }
  
  // Clean up doctor name
  if (fields.doctorName) {
    fields.doctorName = fields.doctorName
      .replace(/^DR\.\s*/i, '')
      .replace(/^DOCTOR\s*/i, '')
      .replace(/^Dr\.\s*/i, '')
      .trim();
  }
  
  // Clean up qualifications
  if (fields.doctorQualifications) {
    fields.doctorQualifications = fields.doctorQualifications.trim();
  }
  
  // Clean up designation
  if (fields.doctorDesignation) {
    fields.doctorDesignation = fields.doctorDesignation
      .replace(/^CONSULTING\s*/i, 'CONSULTING ')
      .replace(/^CONSULTANT\s*/i, 'CONSULTANT ')
      .trim();
  }
  
  // Clean up disclaimer
  if (fields.disclaimer) {
    fields.disclaimer = fields.disclaimer
      .replace(/^Disclaimer\s*:?\s*/i, '')
      .replace(/^Note\s*:?\s*/i, '')
      .replace(/^DISCLAIMER\s*:?\s*/i, '')
      .replace(/^NOTE\s*:?\s*/i, '')
      .trim();
  }
  
  return fields;
}

// Helper function to draw a bordered box
async function drawBorderedBox(page: any, x: number, y: number, width: number, height: number, borderWidth = 1) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth,
  });
}

// Helper function to wrap text with better control
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Helper function to render medical report in professional format
async function renderMedicalReport(
  page: any,
  fields: any,
  fonts: any,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  pdfDoc?: any,
  letterheadImage?: any
): Promise<{ finalY: number, additionalPages: any[] }> {
  const leftMargin = 45;
  const rightMargin = pageWidth - 45;
  const contentWidth = rightMargin - leftMargin;
  let currentY = startY;
  
  // Patient Information Box
  const boxHeight = 100;
  const boxY = currentY - boxHeight;
  
  // Draw the bordered box for patient info with rounded effect
  await drawBorderedBox(page, leftMargin, boxY, contentWidth, boxHeight, 1);
  
  // Add subtle gray background to header box
  page.drawRectangle({
    x: leftMargin,
    y: boxY,
    width: contentWidth,
    height: boxHeight,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1,
  });
  
  // Render patient details in a structured two-column format
  const col1X = leftMargin + 10;
  const col1LabelX = col1X;
  const col1ValueX = col1X + 90;
  const col2X = pageWidth / 2;
  const col2LabelX = col2X;
  const col2ValueX = col2X + 80;
  let infoY = currentY - 20;
  
  const renderField = (label: string, value: string, labelX: number, valueX: number, y: number, maxLength = 35) => {
    if (value) {
      // Label in bold
      page.drawText(label, {
        x: labelX,
        y,
        size: 10,
        font: fonts.bold,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      // Value in regular - truncate if too long
      const displayValue = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
      page.drawText(displayValue, {
        x: valueX,
        y,
        size: 10,
        font: fonts.regular,
        color: rgb(0, 0, 0),
      });
    }
  };
  
  // Left column
  renderField("Patient Name:", fields.patientName || "—", col1LabelX, col1ValueX, infoY);
  renderField("Age/Gender:", fields.age || "—", col1LabelX, col1ValueX, infoY - 20);
  renderField("Patient ID:", fields.patientId || "—", col1LabelX, col1ValueX, infoY - 40);
  
  // Right column
  renderField("Date:", fields.date || new Date().toLocaleDateString(), col2LabelX, col2ValueX, infoY);
  renderField("Ref. By Dr:", fields.referredBy || "—", col2LabelX, col2ValueX, infoY - 20);
  
  // Test name if available (spanning width)
  if (fields.testName) {
    renderField("Test:", fields.testName, col1LabelX, col1ValueX, infoY - 60, 70);
  }
  
  // Specimen if available
  if (fields.specimen) {
    renderField("Specimen:", fields.specimen, col2LabelX, col2ValueX, infoY - 60);
  }
  
  currentY = boxY - 25;
  
  // Report Section
  if (fields.report) {
    // Draw separator line
    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    currentY -= 20;
    
    // Section header
    page.drawText("REPORT", {
      x: leftMargin,
      y: currentY,
      size: 12,
      font: fonts.bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 18;
    
    // Report content with justified text
    const reportLines = wrapText(fields.report, fonts.regular, 10, contentWidth);
    for (const line of reportLines) {
      if (currentY < 120) break; // Leave space for footer
      
      page.drawText(line, {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fonts.regular,
        color: rgb(0, 0, 0),
        lineHeight: 14,
      });
      currentY -= 14;
    }
  }
  
  // Impression/Conclusion Section
  if (fields.impression && currentY > 150) {
    currentY -= 15;
    
    // Draw separator line
    page.drawLine({
      start: { x: leftMargin, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    currentY -= 20;
    
    // Section header
    page.drawText("IMPRESSION", {
      x: leftMargin,
      y: currentY,
      size: 12,
      font: fonts.bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 18;
    
    // Impression content
    const impressionLines = wrapText(fields.impression, fonts.regular, 10, contentWidth);
    for (const line of impressionLines) {
      if (currentY < 120) break;
      
      page.drawText(line, {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: fonts.regular,
        color: rgb(0, 0, 0),
        lineHeight: 14,
      });
      currentY -= 14;
    }
  }
  
  // Add doctor details, signature and disclaimer section
  if (currentY > 100) {
    currentY -= 30;
    
    // Doctor details section - align to right
    const signatureX = rightMargin - 200;
    
    // Doctor Name
    if (fields.doctorName) {
      page.drawText(`DR. ${fields.doctorName}`, {
        x: signatureX,
        y: currentY,
        size: 11,
        font: fonts.bold,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;
    }
    
    // Qualifications
    if (fields.doctorQualifications) {
      page.drawText(fields.doctorQualifications, {
        x: signatureX,
        y: currentY,
        size: 9,
        font: fonts.regular,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= 13;
    }
    
    // Designation
    if (fields.doctorDesignation) {
      page.drawText(fields.doctorDesignation, {
        x: signatureX,
        y: currentY,
        size: 9,
        font: fonts.regular,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= 15;
    }
    
    // Draw signature line
    page.drawLine({
      start: { x: signatureX, y: currentY },
      end: { x: rightMargin, y: currentY },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Authorized Signature text
    const authText = fields.authorizedSignature || "Authorized Signature";
    page.drawText(authText, {
      x: signatureX + 20,
      y: currentY - 15,
      size: 9,
      font: fonts.regular,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    currentY -= 30;
    
    // Disclaimer at the bottom if present
    if (fields.disclaimer && currentY > 80) {
      // Draw separator line before disclaimer
      page.drawLine({
        start: { x: leftMargin, y: currentY },
        end: { x: rightMargin, y: currentY },
        thickness: 0.3,
        color: rgb(0.9, 0.9, 0.9),
      });
      
      currentY -= 15;
      
      // Disclaimer text - smaller font, italics effect
      const disclaimerLines = wrapText(fields.disclaimer, fonts.regular, 8, contentWidth);
      for (const line of disclaimerLines) {
        if (currentY < 50) break;
        
        page.drawText(line, {
          x: leftMargin,
          y: currentY,
          size: 8,
          font: fonts.regular,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 10;
      }
    }
  }
  
  return { finalY: currentY, additionalPages: [] };
}

// Helper function to render general document with better formatting
async function renderGeneralDocument(
  page: any,
  text: string,
  fonts: any,
  startY: number,
  pageWidth: number,
  pageHeight: number
): Promise<number> {
  const leftMargin = 45;
  const rightMargin = pageWidth - 45;
  const contentWidth = rightMargin - leftMargin;
  let currentY = startY;
  
  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  for (const paragraph of paragraphs) {
    if (currentY < 100) break; // Leave space for footer
    
    // Check if this is a title or header
    const isTitle = paragraph.length < 100 && 
                   (paragraph === paragraph.toUpperCase() || 
                    paragraph.match(/^(Subject|RE|To|From|Date|Ref):/i) ||
                    paragraph.endsWith(':'));
    
    const font = isTitle ? fonts.bold : fonts.regular;
    const fontSize = isTitle ? 12 : 10;
    const lineHeight = isTitle ? 18 : 14;
    
    // Wrap paragraph text
    const lines = wrapText(paragraph, font, fontSize, contentWidth);
    
    for (const line of lines) {
      if (currentY < 100) break;
      
      page.drawText(line, {
        x: leftMargin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }
    
    // Add extra space after paragraphs
    currentY -= isTitle ? 12 : 8;
  }
  
  return currentY;
}

async function embedImageFromUrl(pdfDoc: any, imageUrl: string, label: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${label}: ${response.status} ${response.statusText}`);
  }

  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  const normalizedUrl = imageUrl.toLowerCase().split('?')[0];

  if (contentType.includes('png') || normalizedUrl.endsWith('.png')) {
    return await pdfDoc.embedPng(bytes);
  }

  if (
    contentType.includes('jpeg') ||
    contentType.includes('jpg') ||
    normalizedUrl.endsWith('.jpg') ||
    normalizedUrl.endsWith('.jpeg')
  ) {
    return await pdfDoc.embedJpg(bytes);
  }

  throw new Error(`${label} must be a PNG or JPG image.`);
}

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
    const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc'];
    const fileExtension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      console.warn('Unsupported file type:', fileExtension);
      return new Response(
        JSON.stringify({
          error: 'UNSUPPORTED_FILE_TYPE',
          message: `File type "${fileExtension || 'unknown'}" is not supported for letterhead processing.`,
          supportedTypes: supportedExtensions,
          details: 'Supported file types: PDF, images (JPG, JPEG, PNG), and Word documents (DOCX and DOC).'
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            ...securityHeaders,
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
        letterheadImage = await embedImageFromUrl(pdfDoc, letterheadUrl, 'letterhead');
      }

      // Embed standard fonts for text rendering
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fonts = {
        regular: helveticaFont,
        bold: helveticaBoldFont
      };

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
              opacity: 0.85, // Make letterhead more prominent
            });
          }
        }
      } else if (originalFileUrl && (fileName.toLowerCase().match(/\.(doc|docx)$/))) {
        // Handle Word documents with enhanced formatting
        console.log('Processing Word document:', fileName);
        const originalResponse = await fetch(originalFileUrl);
        const docBytes = await originalResponse.arrayBuffer();
        
        try {
          let extractedContent = '';
          
          if (fileName.toLowerCase().endsWith('.doc')) {
            // Legacy .doc support
            console.log('Using word-extractor for .doc format');
            const extractor = new WordExtractor();
            
            // word-extractor needs a buffer
            const buffer = Buffer.from(docBytes);
            const extracted = await extractor.extract(buffer);
            extractedContent = extracted.getBody();
            
            // Normalize tab-separated columns into spaced columns for pdf-lib
            extractedContent = extractedContent.replace(/\t/g, '    ');
          } else {
            // Modern .docx support with mammoth
            console.log('Using mammoth for .docx format');
            const buffer = Buffer.from(docBytes);
            const result = await mammoth.convertToHtml({ buffer });
            const htmlContent = result.value;
            
            // Parse HTML to text preserving table cells (with spaces) and paragraphs (with newlines)
            extractedContent = htmlContent
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<\/tr>/gi, '\n')
              .replace(/<\/td>/gi, '    ')
              .replace(/<\/th>/gi, '    ')
              .replace(/<\/h[1-6]>/gi, '\n\n')
              .replace(/<[^>]+>/g, '') // Remove remaining tags
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/\n\s*\n\s*\n+/g, '\n\n') // Collapse excessive newlines
              .trim();
          }
          
          console.log('Extracted text from Word document, length:', extractedContent.length);
          
          // Check if this is a medical report
          const isMedical = isMedicalReport(extractedContent);
          
          // Helper function to add a new page with letterhead
          const addPageWithLetterhead = () => {
            const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
            
            if (letterheadImage) {
              const { width, height } = page.getSize();
              // Determine letterhead opacity based on image dimensions
              const imageAspectRatio = letterheadImage.width / letterheadImage.height;
              const pageAspectRatio = width / height;
              
              // If letterhead is full page size, use it as background
              page.drawImage(letterheadImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
                opacity: 0.85, // Make letterhead more prominent
              });
            }
            
            return page;
          };
          
          // Start with the first page
          let currentPage = addPageWithLetterhead();
          const pageHeight = 841.89;
          const topMargin = letterheadImage ? 140 : 80; // More space if letterhead exists
          let yPosition = pageHeight - topMargin;
          
          if (isMedical) {
            // Parse medical report fields
            const fields = parseMedicalReport(extractedContent);
            console.log('Detected medical report with fields:', Object.keys(fields));
            
            // Render as medical report
            const result = await renderMedicalReport(
              currentPage,
              fields,
              fonts,
              yPosition,
              595.28,
              pageHeight,
              pdfDoc,
              letterheadImage
            );
            
            // Add any additional pages if content overflowed
            for (const additionalPage of result.additionalPages) {
              // Pages are already added to the document
            }
          } else {
            // Render as general document with improved formatting
            await renderGeneralDocument(
              currentPage,
              extractedContent,
              fonts,
              yPosition,
              595.28,
              pageHeight
            );
          }
          
        } catch (extractError: any) {
          console.error('Error extracting text from Word document:', extractError);
          return new Response(
            JSON.stringify({
              error: 'EXTRACTION_FAILED',
              message: 'Unable to extract text from the Word document. It may be corrupted or in an unsupported format.',
              details: extractError.message || extractError.toString()
            }),
            { 
              status: 422, 
              headers: { 
                ...corsHeaders, 
                ...securityHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
      } else if (originalFileUrl && (fileName.toLowerCase().match(/\.(jpg|jpeg|png)$/))) {
        // If original is an image, create a PDF with the image
        console.log('Processing image document');
        const embeddedImage = await embedImageFromUrl(pdfDoc, originalFileUrl, 'original image');
        
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
            opacity: 0.85, // Make letterhead more prominent
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
            opacity: 0.85, // Make letterhead more prominent
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
            ...securityHeaders,
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
        success: false,
        message: error.message || 'Unknown processing error',
        error: error.message,
        details: 'Failed to process document with letterhead'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          ...securityHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
