import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { CapitalizedInput } from '@/components/ui/capitalized-input';
import { CapitalizedTextarea } from '@/components/ui/capitalized-textarea';
import { JpgUpload } from '@/components/ui/jpg-upload';
import { DocUpload } from '@/components/ui/doc-upload';
import { OperatorSelect } from './OperatorSelect';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

interface TestType {
  id: string;
  test_name: string;
}

interface AddTestReportFormProps {
  onReportAdded: () => void;
}

export const AddTestReportForm = ({ onReportAdded }: AddTestReportFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file_name: string; file_path: string; file_type: string; file_size: number }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedOperator, setSelectedOperator] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchTestTypes();
    }
  }, [open]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, patient_id')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    }
  };

  const fetchTestTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('test_types')
        .select('id, test_name')
        .order('test_name');

      if (error) throw error;
      setTestTypes(data || []);
    } catch (error) {
      console.error('Error fetching test types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test types",
        variant: "destructive",
      });
    }
  };

  const handleFileUploaded = (file: { file_name: string; file_path: string; file_type: string; file_size: number }) => {
    setUploadedFiles([...uploadedFiles, file]);
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient || null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Determine who is creating the report
      let lab_id = profile?.lab_id;
      let branch_id = profile?.branch_id;
      let created_by = profile?.user_id;
      
      // If admin is creating for an operator, use the operator's ID
      if (profile?.role === 'admin' && selectedOperator) {
        created_by = selectedOperator;
      }
      
      const results = formData.get('results') as string;
      let parsedResults = null;
      
      if (results) {
        try {
          parsedResults = JSON.parse(results);
        } catch {
          parsedResults = results;
        }
      }

      const { data: reportData, error: reportError } = await supabase
        .from('test_reports')
        .insert({
          patient_id: formData.get('patient_id') as string,
          test_type: formData.get('test_type') as string,
          test_date: formData.get('test_date') as string,
          status: formData.get('status') as string,
          technician_name: formData.get('technician_name') as string,
          results: parsedResults,
          lab_id,
          branch_id,
          created_by,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert uploaded files as documents
      if (uploadedFiles.length > 0 && reportData) {
        const documents = uploadedFiles.map(file => ({
          patient_id: formData.get('patient_id') as string,
          lab_id,
          branch_id,
          file_name: file.file_name,
          file_path: file.file_path,
          file_type: file.file_type,
          file_size: file.file_size,
          uploaded_by: created_by,
        }));

        const { error: docsError } = await supabase
          .from('documents')
          .insert(documents);

        if (docsError) {
          console.error('Error saving documents:', docsError);
        }
      }

      toast({
        title: "Success",
        description: "Test report added successfully",
      });

      setOpen(false);
      setUploadedFiles([]);
      setSelectedPatient(null);
      onReportAdded();
    } catch (error) {
      console.error('Error adding test report:', error);
      toast({
        title: "Error",
        description: "Failed to add test report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Test Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Test Report</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <OperatorSelect 
              selectedOperator={selectedOperator}
              onOperatorChange={setSelectedOperator}
            />
            
            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient *</Label>
              <Select name="patient_id" required onValueChange={handlePatientSelect}>
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

            <div className="space-y-2">
              <Label htmlFor="test_type">Test Type *</Label>
              <Select name="test_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((type) => (
                    <SelectItem key={type.id} value={type.test_name}>
                      {type.test_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_date">Test Date *</Label>
              <CapitalizedInput
                type="date"
                name="test_date"
                defaultValue={todayDate}
                required
                capitalize={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician_name">Technician Name *</Label>
              <CapitalizedInput
                name="technician_name"
                placeholder="Enter technician name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue="pending" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload Test Images/Documents</Label>
              <div className="space-y-3">
                <JpgUpload 
                  onFileUploaded={handleFileUploaded}
                  patientName={selectedPatient?.full_name}
                  label="Upload JPG"
                />
                <DocUpload 
                  onFileUploaded={handleFileUploaded}
                  patientName={selectedPatient?.full_name}
                  label="Upload Word Doc"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="results">Results</Label>
              <CapitalizedTextarea
                name="results"
                placeholder="Enter test results (optional)"
                rows={4}
                required={false}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding..." : "Add Test Report"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};