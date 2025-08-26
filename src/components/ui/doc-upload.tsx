import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DocUploadProps {
  onFileUploaded: (file: { file_name: string; file_path: string; file_type: string; file_size: number }) => void;
  patientName?: string;
  label?: string;
  maxSize?: number; // in MB
}

export const DocUpload = ({ onFileUploaded, patientName, label = "Upload Word Doc", maxSize = 10 }: DocUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file_name: string; file_path: string; file_type: string; file_size: number }>>([]);
  const { profile } = useAuth();

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
      
      const filePath = `${profile?.lab_id}/${profile?.branch_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lab-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const fileData = {
        file_name: fileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
      };

      setUploadedFiles([...uploadedFiles, fileData]);
      onFileUploaded(fileData);

      toast({
        title: "Document uploaded",
        description: "The document has been uploaded successfully.",
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

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById('doc-file-input')?.click()}
        >
          <FileText className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : label}
        </Button>
        <input
          id="doc-file-input"
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
              <span className="text-sm truncate">{file.file_name}</span>
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
    </div>
  );
};