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
import { PatientSearchSelect } from './PatientSearchSelect';
import { FeatureTooltip } from '@/components/ui/feature-tooltip';
import { PathologyReportEditor } from '@/components/pathology/PathologyReportEditor';
import type { PathologyReportPayload } from '@/lib/pathologyTypes';

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
  phone?: string;
}

interface TestType {
  id: string;
  test_name: string;
  category?: string | null;
  department?: string | null;
  is_global?: boolean;
}

interface AddTestReportFormProps {
  onReportAdded: () => void;
  preSelectedPatientId?: string;
}

export const AddTestReportForm = ({ onReportAdded, preSelectedPatientId }: AddTestReportFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file_name: string; file_path: string; file_type: string; file_size: number }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [department, setDepartment] = useState<'pathology' | 'radiology' | 'sonography'>('pathology');
  const [pathologyPayload, setPathologyPayload] = useState<PathologyReportPayload | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchTestTypes();
    }
  }, [open, selectedOperator, profile?.branch_id]);

  // Auto-select patient when preSelectedPatientId changes and patients are loaded
  useEffect(() => {
    if (preSelectedPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === preSelectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [preSelectedPatientId, patients]);

  const fetchPatients = async () => {
    try {
      let targetBranchId: string | null = null;

      // For admins, use selected operator's branch
      if (profile?.role === 'admin' && selectedOperator) {
        const { data: opProfile } = await supabase
          .from('profiles')
          .select('branch_id')
          .eq('user_id', selectedOperator)
          .maybeSingle();
        targetBranchId = opProfile?.branch_id ?? null;
      } else if (profile?.branch_id) {
        targetBranchId = profile.branch_id;
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
      setPatients((data || []).filter(p => p.id && p.id.trim() !== ''));
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('branch_id, lab_id, role')
        .eq('user_id', userData.user.id)
        .single();

      if (!profileData) return;

      // Fetch local test types from the branch
      const { data: localTestTypes, error: localError } = await supabase
        .from('test_types')
        .select('*')
        .eq('branch_id', profileData.branch_id)
        .order('test_name', { ascending: true });

      if (localError) console.error('Error fetching local test types:', localError);

      // Fetch global test types
      const { data: globalTestTypes, error: globalError } = await supabase
        .from('global_test_types')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('test_name', { ascending: true });

      if (globalError) console.error('Error fetching global test types:', globalError);

      // Combine and mark global test types
      const combinedTestTypes = [
        ...(globalTestTypes || []).map(t => ({ ...t, is_global: true })),
        ...(localTestTypes || []).map(t => ({ ...t, is_global: false }))
      ];

      setTestTypes(combinedTestTypes);
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
      
      const selectedDepartment = (formData.get('department') as string) || department;
      const modality = (formData.get('modality') as string) || (selectedDepartment === 'sonography' ? 'USG' : selectedDepartment === 'radiology' ? 'X-Ray' : 'Laboratory');
      const bodyPart = (formData.get('body_part') as string) || '';
      const results = formData.get('results') as string;
      let parsedResults: any = null;
      let selectedTestType = formData.get('test_type') as string;
      
      if (selectedDepartment === 'pathology') {
        if (!pathologyPayload || pathologyPayload.rows.length === 0 || pathologyPayload.selectedTestIds.length === 0) {
          throw new Error('Select at least one pathology test and enter report values.');
        }
        parsedResults = pathologyPayload.rows;
        selectedTestType = pathologyPayload.testTypeLabel;
      } else if (selectedDepartment === 'radiology' || selectedDepartment === 'sonography') {
        parsedResults = [
          { testName: 'Clinical History', result: formData.get('clinical_history') as string || '', sortOrder: 1 },
          { testName: 'Technique', result: formData.get('technique') as string || '', sortOrder: 2 },
          { testName: 'Findings', result: formData.get('findings') as string || '', sortOrder: 3 },
          { testName: 'Impression', result: formData.get('impression') as string || '', sortOrder: 4 },
          { testName: 'Advice', result: formData.get('advice') as string || '', sortOrder: 5 },
        ];
      } else if (results) {
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
          test_type: selectedTestType,
          test_date: formData.get('test_date') as string,
          status: formData.get('status') as string,
          technician_name: formData.get('technician_name') as string,
          results: parsedResults,
          department: selectedDepartment,
          modality,
          body_part: bodyPart,
          study_notes: formData.get('study_notes') as string || null,
          lab_id,
          branch_id,
          created_by,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      if (selectedDepartment === 'pathology' && reportData?.id && formData.get('status') === 'completed') {
        const { error: pdfError } = await supabase.functions.invoke('generate-pathology-report-pdf', {
          body: { reportId: reportData.id },
        });
        if (pdfError) {
          console.error('Pathology PDF generation failed:', pdfError);
          toast({
            title: 'Report saved, PDF pending',
            description: 'The report was saved but the server PDF could not be generated yet.',
            variant: 'destructive',
          });
        }
      }

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
      <FeatureTooltip
        featureKey="add-test-report"
        title="Upload Test Reports"
        description="Upload test results with images and documents. Reports can be linked to specific test types and include technician details."
        side="bottom"
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Test Report
          </Button>
        </DialogTrigger>
      </FeatureTooltip>
      <DialogContent className="max-w-6xl max-h-[92vh]">
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
              <PatientSearchSelect
                patients={patients}
                selectedPatientId={selectedPatient?.id || ''}
                onPatientSelect={handlePatientSelect}
                placeholder="Search and select patient"
                required
              />
              <input type="hidden" name="patient_id" value={selectedPatient?.id || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select name="department" value={department} onValueChange={(value) => setDepartment(value as 'pathology' | 'radiology' | 'sonography')} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pathology">Pathology</SelectItem>
                  <SelectItem value="radiology">Radiology / X-Ray</SelectItem>
                  <SelectItem value="sonography">Sonography / USG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {department === 'pathology' ? (
              <PathologyReportEditor
                branchId={profile?.branch_id}
                labId={profile?.lab_id}
                onChange={setPathologyPayload}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="test_type">Test Type *</Label>
                <Select name="test_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.filter(t => t.is_global && (t.department || department) === department).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Platform Tests</div>
                        {testTypes.filter(t => t.is_global && (t.department || department) === department).map((testType) => (
                          <SelectItem key={testType.id} value={testType.test_name}>
                            {testType.test_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {testTypes.filter(t => !t.is_global && (t.department || department) === department).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Branch Tests</div>
                        {testTypes.filter(t => !t.is_global && (t.department || department) === department).map((testType) => (
                          <SelectItem key={testType.id} value={testType.test_name}>
                            {testType.test_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {department !== 'pathology' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="modality">Modality</Label>
                  <CapitalizedInput name="modality" defaultValue={department === 'sonography' ? 'USG' : 'X-Ray'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_part">Body Part / Study</Label>
                  <CapitalizedInput name="body_part" placeholder="Chest, Abdomen, Pelvis, KUB" />
                </div>
              </div>
            )}

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

            {department === 'pathology' ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Structured pathology results will be saved from the grid above. Calculated values remain editable and manual overrides are preserved.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="clinical_history">Clinical History</Label>
                  <CapitalizedTextarea name="clinical_history" rows={2} placeholder="Relevant history" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technique">Technique</Label>
                  <CapitalizedTextarea name="technique" rows={2} defaultValue={department === 'sonography' ? 'Real-time ultrasound examination performed with appropriate probe.' : 'Digital radiography study performed.'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="findings">Findings *</Label>
                  <CapitalizedTextarea name="findings" rows={4} placeholder="Enter findings" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impression">Impression *</Label>
                  <CapitalizedTextarea name="impression" rows={3} placeholder="Enter impression" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advice">Advice</Label>
                  <CapitalizedTextarea name="advice" rows={2} placeholder="Correlate clinically" />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding..." : "Add Test Report"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
