import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileUploaded: (filePath: string, fileName: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
}

export const FileUpload = ({ 
  onFileUploaded, 
  accept = "image/*", 
  maxSize = 10,
  label = "Upload File"
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, path: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Error",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lab-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const newFile = { name: file.name, path: filePath };
      setUploadedFiles(prev => [...prev, newFile]);
      onFileUploaded(filePath, file.name);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files</Label>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};