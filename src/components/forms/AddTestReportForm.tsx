import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

interface AddTestReportFormProps {
  onReportAdded: () => void;
}

export const AddTestReportForm = ({ onReportAdded }: AddTestReportFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: '',
    test_type: '',
    test_date: '',
    status: 'pending',
    results: ''
  });

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
        .order('full_name');
      setPatients(data || []);
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
      let labId = profile?.lab_id;
      let createdBy = profile?.user_id;

      // For admins, get lab_id from selected operator
      if (profile?.role === 'admin') {
        if (!selectedOperator) {
          toast({
            title: "Error", 
            description: "Please select an operator to create the test report for.",
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
        createdBy = selectedOperator;
      } else if (!profile?.lab_id) {
        toast({
          title: "Error",
          description: "You must be assigned to a lab to create test reports.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const results = formData.results ? JSON.parse(formData.results) : null;
      
      const { data: reportData, error } = await supabase
        .from('test_reports')
        .insert({
          patient_id: formData.patient_id,
          test_type: formData.test_type,
          test_date: formData.test_date,
          status: formData.status,
          results,
          lab_id: labId,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;

      // Save uploaded files as documents
      if (uploadedFiles.length > 0 && reportData) {
        const documentInserts = uploadedFiles.map(file => ({
          patient_id: formData.patient_id,
          file_name: file.name,
          file_path: file.path,
          file_type: file.name.split('.').pop() || 'unknown',
          lab_id: labId,
          uploaded_by: createdBy
        }));

        const { error: documentsError } = await supabase
          .from('documents')
          .insert(documentInserts);

        if (documentsError) {
          console.error('Error saving documents:', documentsError);
          toast({
            title: "Warning",
            description: "Test report created but some files failed to save",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Test report added successfully",
      });

      setFormData({
        patient_id: '',
        test_type: '',
        test_date: '',
        status: 'pending',
        results: ''
      });
      setSelectedOperator('');
      setUploadedFiles([]);
      setOpen(false);
      onReportAdded();
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
          Add Test Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Test Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <OperatorSelect 
            selectedOperator={selectedOperator} 
            onOperatorChange={setSelectedOperator} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient</Label>
            <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients
                  .filter((patient) => patient.id && patient.id.trim() !== '')
                  .map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name} ({patient.patient_id})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test_type">Test Type</Label>
            <Input
              id="test_type"
              value={formData.test_type}
              onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
              placeholder="e.g., Blood Test, X-Ray, MRI"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test_date">Test Date</Label>
            <Input
              id="test_date"
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <FileUpload
            onFileUploaded={handleFileUploaded}
            accept="image/*,.pdf,.doc,.docx"
            maxSize={10}
            label="Upload Test Images/Documents"
          />
          
          <div className="space-y-2">
            <Label htmlFor="results">Results (JSON format)</Label>
            <Textarea
              id="results"
              value={formData.results}
              onChange={(e) => setFormData({ ...formData, results: e.target.value })}
              placeholder='{"hemoglobin": "12.5 g/dL", "glucose": "95 mg/dL"}'
              rows={4}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Test Report'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};