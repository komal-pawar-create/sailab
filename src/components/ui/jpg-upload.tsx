import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileImage } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UploadedJpgFile {
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

interface JpgUploadProps {
  onFileUploaded: (file: UploadedJpgFile) => void;
  onFileRemoved?: (file: UploadedJpgFile) => void;
  patientName?: string;
  label?: string;
  maxSize?: number; // in MB
}

export const JpgUpload = ({ onFileUploaded, onFileRemoved, patientName, label = "Upload JPG", maxSize = 5 }: JpgUploadProps) => {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedJpgFile[]>([]);
  const { profile } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const maxSizeBytes = maxSize * 1024 * 1024;
    const oversizedFile = files.find((file) => file.size > maxSizeBytes);
    if (oversizedFile) {
      toast({
        title: "File too large",
        description: `${oversizedFile.name} must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const uploadedBatch: UploadedJpgFile[] = [];

      for (const [index, file] of files.entries()) {
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const cleanPatientName = patientName ? patientName.replace(/[^a-zA-Z0-9]/g, '_') : 'UNKNOWN';
        const fileName = `${cleanPatientName}_${timestamp}_${index}.${fileExtension}`;
        const filePath = `${profile?.user_id}/${profile?.lab_id}/${profile?.branch_id}/${fileName}`;

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

        uploadedBatch.push(fileData);
        onFileUploaded(fileData);
      }

      setUploadedFiles((currentFiles) => [...currentFiles, ...uploadedBatch]);

      toast({
        title: files.length === 1 ? "Image uploaded" : "Images uploaded",
        description: files.length === 1
          ? "The image has been uploaded successfully."
          : `${files.length} images have been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((currentFiles) => {
      const fileToRemove = currentFiles[index];
      if (fileToRemove) onFileRemoved?.(fileToRemove);
      return currentFiles.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <FileImage className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : label}
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
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
