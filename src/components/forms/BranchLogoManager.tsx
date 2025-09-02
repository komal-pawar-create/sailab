import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Branch {
  id: string;
  name: string;
  branch_code: string;
  logo_url?: string;
  letterhead_url?: string;
}

export const BranchLogoManager = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: { logo?: File; letterhead?: File } }>({});
  const [previews, setPreviews] = useState<{ [key: string]: { logo?: string; letterhead?: string } }>({});

  useEffect(() => {
    fetchBranches();
  }, [profile]);

  const fetchBranches = async () => {
    try {
      let query = supabase.from('branches').select('id, name, branch_code, logo_url, letterhead_url');
      
      // Filter based on user role
      if (profile?.role === 'lab_admin' && profile?.branch_id) {
        const { data: branchData } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', profile.branch_id)
          .single();
        
        if (branchData?.organization_id) {
          query = query.eq('organization_id', branchData.organization_id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setBranches(data || []);
      
      // Set initial previews
      const initialPreviews: typeof previews = {};
      data?.forEach(branch => {
        initialPreviews[branch.id] = {
          logo: branch.logo_url || '',
          letterhead: branch.letterhead_url || ''
        };
      });
      setPreviews(initialPreviews);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (branchId: string, file: File, type: 'logo' | 'letterhead') => {
    setSelectedFiles(prev => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [type]: file
      }
    }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({
        ...prev,
        [branchId]: {
          ...prev[branchId],
          [type]: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, branchId: string, type: 'logo' | 'letterhead') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${branchId}-${type}.${fileExt}`;
    const filePath = `branches/${branchId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('lab-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('lab-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const saveBranchAssets = async (branchId: string) => {
    try {
      const updates: any = {};
      
      if (selectedFiles[branchId]?.logo) {
        updates.logo_url = await uploadFile(selectedFiles[branchId].logo!, branchId, 'logo');
      }
      
      if (selectedFiles[branchId]?.letterhead) {
        updates.letterhead_url = await uploadFile(selectedFiles[branchId].letterhead!, branchId, 'letterhead');
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('branches')
          .update(updates)
          .eq('id', branchId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Branch assets updated successfully",
        });

        // Clear selected files for this branch
        setSelectedFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[branchId];
          return newFiles;
        });
        
        fetchBranches();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading branches...</div>;

  return (
    <div className="space-y-4">
      {branches.map(branch => (
        <Card key={branch.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {branch.name} ({branch.branch_code})
            </CardTitle>
            <CardDescription>Manage branch-specific branding assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {previews[branch.id]?.logo ? (
                    <div className="relative">
                      <img src={previews[branch.id].logo} alt="Branch logo" className="max-h-24 mx-auto" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0"
                        onClick={() => {
                          setPreviews(prev => ({
                            ...prev,
                            [branch.id]: { ...prev[branch.id], logo: '' }
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">No logo</p>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(branch.id, e.target.files[0], 'logo')}
                />
              </div>

              <div className="space-y-2">
                <Label>Branch Letterhead (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {previews[branch.id]?.letterhead ? (
                    <div className="relative">
                      <img src={previews[branch.id].letterhead} alt="Letterhead" className="max-h-24 mx-auto" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0"
                        onClick={() => {
                          setPreviews(prev => ({
                            ...prev,
                            [branch.id]: { ...prev[branch.id], letterhead: '' }
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">No letterhead</p>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(branch.id, e.target.files[0], 'letterhead')}
                />
              </div>
            </div>
            
            {(selectedFiles[branch.id]?.logo || selectedFiles[branch.id]?.letterhead) && (
              <Button onClick={() => saveBranchAssets(branch.id)} className="w-full">
                Save Branch Assets
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};