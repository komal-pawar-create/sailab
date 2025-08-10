import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';
import { OperatorSelect } from './OperatorSelect';
import { FileUpload } from '@/components/ui/file-upload';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

interface AddDocumentFormProps {
  onDocumentAdded: () => void;
}

export const AddDocumentForm = ({ onDocumentAdded }: AddDocumentFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{path: string, name: string}>>([]);

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  const fetchPatients = async () => {
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, patient_id')
        .not('id', 'eq', '')
        .order('full_name');
      
      // Filter out any records with empty id
      setPatients((data || []).filter(patient => patient.id && patient.id.trim() !== ''));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    }
  };

  const handleFileUploaded = (filePath: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { path: filePath, name: fileName }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedPatient) {
        toast({
          title: "Error",
          description: "Please select a patient",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (uploadedFiles.length === 0) {
        toast({
          title: "Error",
          description: "Please upload at least one file",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let labId = profile?.lab_id;
      let uploadedBy = profile?.user_id;

      // For admins, get lab_id from selected operator
      if (profile?.role === 'admin') {
        if (!selectedOperator) {
          toast({
            title: "Error", 
            description: "Please select an operator to upload documents for.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const { data: operatorProfile } = await supabase
          .from('profiles')
          .select('lab_id')
          .eq('user_id', selectedOperator)
          .single();
          
        if (!operatorProfile?.lab_id) {
          toast({
            title: "Error",
            description: "Selected operator is not assigned to a lab.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        labId = operatorProfile.lab_id;
        uploadedBy = selectedOperator;
      } else if (!profile?.lab_id) {
        toast({
          title: "Error",
          description: "You must be assigned to a lab to upload documents.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Save uploaded files as documents
      const documentInserts = uploadedFiles.map(file => ({
        patient_id: selectedPatient,
        file_name: file.name,
        file_path: file.path,
        file_type: file.name.split('.').pop() || 'unknown',
        lab_id: labId,
        uploaded_by: uploadedBy
      }));

      const { error } = await supabase
        .from('documents')
        .insert(documentInserts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${uploadedFiles.length} document(s) uploaded successfully`,
      });

      setSelectedPatient('');
      setSelectedOperator('');
      setUploadedFiles([]);
      setOpen(false);
      onDocumentAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Patient Documents</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <OperatorSelect 
            selectedOperator={selectedOperator} 
            onOperatorChange={setSelectedOperator} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name} ({patient.patient_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <FileUpload
            onFileUploaded={handleFileUploaded}
            accept="image/*,.pdf,.doc,.docx,.txt"
            maxSize={10}
            label="Upload Patient Documents"
          />
          
          <Button type="submit" disabled={loading || uploadedFiles.length === 0} className="w-full">
            {loading ? 'Uploading...' : `Upload ${uploadedFiles.length} Document(s)`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};