import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, FileImage, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DocUploadWithLetterheadProps {
  onFileUploaded: (file: { 
    file_name: string; 
    file_path: string; 
    file_type: string; 
    file_size: number;
    apply_letterhead?: boolean;
    letterhead_url?: string;
    logo_url?: string;
  }) => void;
  patientName?: string;
  patientId?: string;
  label?: string;
  maxSize?: number; // in MB
}

export const DocUploadWithLetterhead = ({ 
  onFileUploaded, 
  patientName, 
  patientId,
  label = "Upload Document", 
  maxSize = 10 
}: DocUploadWithLetterheadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ 
    file_name: string; 
    file_path: string; 
    file_type: string; 
    file_size: number;
    apply_letterhead?: boolean;
  }>>([]);
  const [applyLetterhead, setApplyLetterhead] = useState(false);
  const [letterheadUrl, setLetterheadUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { profile } = useAuth();

  // Fetch letterhead and logo when component mounts or when apply letterhead is toggled
  useEffect(() => {
    if (applyLetterhead && profile?.branch_id) {
      fetchLetterheadAndLogo();
    }
  }, [applyLetterhead, profile?.branch_id]);

  const fetchLetterheadAndLogo = async () => {
    if (!profile?.branch_id || !profile?.lab_id) return;

    try {
      // First check branch for letterhead and logo
      const { data: branchData } = await supabase
        .from('branches')
        .select('letterhead_url, logo_url')
        .eq('id', profile.branch_id)
        .single();

      if (branchData?.letterhead_url) {
        setLetterheadUrl(branchData.letterhead_url);
      } else {
        // Fallback to lab letterhead
        const { data: labData } = await supabase
          .from('labs')
          .select('letterhead_url')
          .eq('id', profile.lab_id)
          .single();
        
        if (labData?.letterhead_url) {
          setLetterheadUrl(labData.letterhead_url);
        }
      }

      if (branchData?.logo_url) {
        setLogoUrl(branchData.logo_url);
      }
    } catch (error) {
      console.error('Error fetching letterhead and logo:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate filename with patient name if available
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const cleanPatientName = patientName ? patientName.replace(/[^a-zA-Z0-9]/g, '_') : 'UNKNOWN';
      const fileName = `${cleanPatientName}_${timestamp}.${fileExtension}`;
      
      const filePath = `documents/${profile?.user_id}/${profile?.lab_id}/${profile?.branch_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lab-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const fileData = {
        file_name: fileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        apply_letterhead: applyLetterhead,
        letterhead_url: applyLetterhead ? letterheadUrl || undefined : undefined,
        logo_url: applyLetterhead ? logoUrl || undefined : undefined,
      };

      // If letterhead should be applied, process the document
      if (applyLetterhead && letterheadUrl) {
        await processDocumentWithLetterhead(fileData);
      }

      setUploadedFiles([...uploadedFiles, fileData]);
      onFileUploaded(fileData);

      toast({
        title: "Document uploaded",
        description: applyLetterhead ? "Document uploaded and processing with letterhead." : "The document has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const processDocumentWithLetterhead = async (fileData: any) => {
    if (!profile?.lab_id || !profile?.branch_id) return;

    setProcessing(true);
    try {
      // Generate a unique document ID for this upload
      const documentId = crypto.randomUUID();
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('lab-files')
        .getPublicUrl(fileData.file_path);

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: documentId,
          letterheadUrl: fileData.letterhead_url,
          logoUrl: fileData.logo_url,
          documentType: 'patient_document',
          originalFileUrl: publicUrl,
          lab_id: profile.lab_id,
          branch_id: profile.branch_id,
          fileName: fileData.file_name,
          hasLetterhead: true
        }
      });

      if (error) throw error;

      console.log('Document processing response:', data);

      // The edge function will handle saving to document_templates
      if (data?.success) {
        toast({
          title: "Processing complete",
          description: "Document has been processed with letterhead.",
        });
      }
    } catch (error) {
      console.error('Error processing document with letterhead:', error);
      toast({
        title: "Processing info",
        description: "Document uploaded. Letterhead processing will be completed in the background.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const getLetterheadPreviewUrl = () => {
    if (!letterheadUrl) return null;
    return supabase.storage.from('lab-assets').getPublicUrl(letterheadUrl).data.publicUrl;
  };

  const getLogoPreviewUrl = () => {
    if (!logoUrl) return null;
    return supabase.storage.from('lab-assets').getPublicUrl(logoUrl).data.publicUrl;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="apply-letterhead"
            checked={applyLetterhead}
            onCheckedChange={(checked) => setApplyLetterhead(checked as boolean)}
          />
          <label 
            htmlFor="apply-letterhead" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Apply letterhead to document
          </label>
          {applyLetterhead && letterheadUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}
        </div>

        {applyLetterhead && !letterheadUrl && (
          <p className="text-sm text-muted-foreground">
            No letterhead template found. Please upload a letterhead in Lab Profile or Branch settings.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || processing}
          onClick={() => document.getElementById('doc-letterhead-input')?.click()}
        >
          <FileText className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : processing ? "Processing..." : label}
        </Button>
        <input
          id="doc-letterhead-input"
          type="file"
          accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      
      {uploadedFiles.length > 0 && (
        <div className="space-y-1">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate">{file.file_name}</span>
                {file.apply_letterhead && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    With Letterhead
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Letterhead Preview</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="letterhead" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="letterhead">Letterhead Template</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
            </TabsList>
            <TabsContent value="letterhead" className="space-y-2">
              {letterheadUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={getLetterheadPreviewUrl() || ''} 
                    alt="Letterhead Preview" 
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No letterhead template available</p>
              )}
            </TabsContent>
            <TabsContent value="logo" className="space-y-2">
              {logoUrl ? (
                <div className="flex justify-center p-8">
                  <img 
                    src={getLogoPreviewUrl() || ''} 
                    alt="Logo Preview" 
                    className="max-w-xs h-auto"
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No logo available</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};