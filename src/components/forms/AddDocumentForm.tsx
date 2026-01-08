import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';
import { OperatorSelect } from './OperatorSelect';
import { DocUploadWithLetterhead } from '@/components/ui/doc-upload-with-letterhead';
import { PatientSearchSelect } from './PatientSearchSelect';
import { FeatureTooltip } from '@/components/ui/feature-tooltip';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
  phone?: string;
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
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    apply_letterhead?: boolean;
  }>>([]);

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open, selectedOperator]);

  const fetchPatients = async () => {
    try {
      // Determine target branch for filtering (respecting RLS)
      let targetBranchId: string | null = null;

      if (profile?.role === 'admin' && selectedOperator) {
        const { data: operatorProfile } = await supabase
          .from('profiles')
          .select('branch_id')
          .eq('user_id', selectedOperator)
          .maybeSingle();
        targetBranchId = operatorProfile?.branch_id ?? null;
      } else if (profile?.role !== 'admin') {
        targetBranchId = profile?.branch_id ?? null;
      }

      let query = supabase
        .from('patients')
        .select('id, full_name, patient_id, phone')
        .order('created_at', { ascending: false });

      if (targetBranchId) {
        query = query.eq('branch_id', targetBranchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPatients((data || []).filter((patient) => patient.id && patient.id.trim() !== ''));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch patients',
        variant: 'destructive',
      });
    }
  };

  const handleFileUploaded = (file: {
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    apply_letterhead?: boolean;
  }) => {
    setUploadedFiles(prev => [...prev, file]);
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
      let branchId = profile?.branch_id;
      let uploadedBy = profile?.user_id;

      // For admins, get lab_id and branch_id from selected operator
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
          .select('lab_id, branch_id')
          .eq('user_id', selectedOperator)
          .single();
          
        if (!operatorProfile?.lab_id || !operatorProfile?.branch_id) {
          toast({
            title: "Error",
            description: "Selected operator is not assigned to a lab or branch.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        labId = operatorProfile.lab_id;
        branchId = operatorProfile.branch_id;
        uploadedBy = selectedOperator;
      } else if (!profile?.lab_id || !profile?.branch_id) {
        toast({
          title: "Error",
          description: "You must be assigned to a lab and branch to upload documents.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Save uploaded files as documents
      const documentInserts = uploadedFiles.map(file => ({
        patient_id: selectedPatient,
        file_name: file.file_name,
        file_path: file.file_path,
        file_type: file.file_type,
        file_size: file.file_size,
        lab_id: labId,
        branch_id: branchId,
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

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FeatureTooltip
        featureKey="upload-documents"
        title="Upload Documents"
        description="Attach prescriptions, medical records, and other patient documents. Files can include your lab's letterhead."
        side="bottom"
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </DialogTrigger>
      </FeatureTooltip>
      <DialogContent className="sm:max-w-[600px]">
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
            <PatientSearchSelect
              patients={patients}
              selectedPatientId={selectedPatient}
              onPatientSelect={setSelectedPatient}
              placeholder="Search and select patient"
            />
          </div>
          
          <DocUploadWithLetterhead
            onFileUploaded={handleFileUploaded}
            patientName={selectedPatientData?.full_name}
            patientId={selectedPatient}
            label="Upload Patient Documents"
            maxSize={10}
          />
          
          <Button type="submit" disabled={loading || uploadedFiles.length === 0} className="w-full">
            {loading ? 'Uploading...' : `Upload ${uploadedFiles.length} Document(s)`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};