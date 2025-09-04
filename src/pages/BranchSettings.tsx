import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, X, Building, CreditCard, FileText, Image } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  branch_code: string;
  location?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  logo_url?: string | null;
  letterhead_url?: string | null;
  signature_url?: string | null;
  website?: string | null;
  registration_number?: string | null;
  gst_number?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc_code?: string | null;
  footer_text?: string | null;
  terms_conditions?: string | null;
  organization_id: string;
  lab_id?: string | null;
}

export default function BranchSettings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Branch | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedLetterhead, setSelectedLetterhead] = useState<File | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      if (!['lab_admin', 'admin', 'super_admin'].includes(profile.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }
      fetchBranches();
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (selectedBranch) {
      setFormData(selectedBranch);
      setLogoPreview(selectedBranch.logo_url ? getPublicUrl('lab-assets', selectedBranch.logo_url) : null);
      setLetterheadPreview(selectedBranch.letterhead_url ? getPublicUrl('lab-assets', selectedBranch.letterhead_url) : null);
      setSignaturePreview(selectedBranch.signature_url ? getPublicUrl('lab-assets', selectedBranch.signature_url) : null);
    }
  }, [selectedBranch]);

  const getPublicUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      let query = supabase.from('branches').select('*');

      if (profile?.role === 'super_admin') {
        // Super admin can see all branches
      } else if (profile?.branch_id) {
        // Get branches from the same organization
        const { data: userBranch } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', profile.branch_id)
          .single();

        if (userBranch) {
          query = query.eq('organization_id', userBranch.organization_id);
        }
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      setBranches(data || []);
      if (data && data.length > 0) {
        setSelectedBranch(data[0]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch branches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'logo' | 'letterhead' | 'signature') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Set the selected file and preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === 'logo') {
        setSelectedLogo(file);
        setLogoPreview(preview);
      } else if (type === 'letterhead') {
        setSelectedLetterhead(file);
        setLetterheadPreview(preview);
      } else if (type === 'signature') {
        setSelectedSignature(file);
        setSignaturePreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, type: 'logo' | 'letterhead' | 'signature') => {
    if (!selectedBranch) return null;

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedBranch.branch_code}_${type}_${timestamp}.${fileExt}`;
    const filePath = `branches/${selectedBranch.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('lab-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  };

  const handleSubmit = async () => {
    if (!formData || !selectedBranch) return;

    setSaving(true);
    try {
      let updateData: any = { ...formData };

      // Upload new files if selected
      if (selectedLogo) {
        const logoUrl = await uploadFile(selectedLogo, 'logo');
        if (logoUrl) updateData.logo_url = logoUrl;
      }

      if (selectedLetterhead) {
        const letterheadUrl = await uploadFile(selectedLetterhead, 'letterhead');
        if (letterheadUrl) updateData.letterhead_url = letterheadUrl;
      }

      if (selectedSignature) {
        const signatureUrl = await uploadFile(selectedSignature, 'signature');
        if (signatureUrl) updateData.signature_url = signatureUrl;
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.organization_id;
      delete updateData.lab_id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.created_by;

      const { error } = await supabase
        .from('branches')
        .update(updateData)
        .eq('id', selectedBranch.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branch settings updated successfully.",
      });

      // Reset file selections
      setSelectedLogo(null);
      setSelectedLetterhead(null);
      setSelectedSignature(null);

      // Refresh branches
      fetchBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: "Error",
        description: "Failed to update branch settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFile = (type: 'logo' | 'letterhead' | 'signature') => {
    if (!formData) return;

    if (type === 'logo') {
      setFormData({ ...formData, logo_url: null });
      setLogoPreview(null);
      setSelectedLogo(null);
    } else if (type === 'letterhead') {
      setFormData({ ...formData, letterhead_url: null });
      setLetterheadPreview(null);
      setSelectedLetterhead(null);
    } else if (type === 'signature') {
      setFormData({ ...formData, signature_url: null });
      setSignaturePreview(null);
      setSelectedSignature(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No branches found.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Branch Settings</h1>
        <p className="text-muted-foreground">Manage branch-specific branding, address, and banking information.</p>
      </div>

      <div className="mb-6">
        <Label htmlFor="branch-select">Select Branch</Label>
        <Select
          value={selectedBranch?.id}
          onValueChange={(value) => {
            const branch = branches.find(b => b.id === value);
            setSelectedBranch(branch || null);
          }}
        >
          <SelectTrigger id="branch-select" className="w-full max-w-md">
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name} ({branch.branch_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData && (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <Building className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Image className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="banking">
              <CreditCard className="w-4 h-4 mr-2" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="settings">
              <FileText className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Branch Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch_code">Branch Code</Label>
                    <Input
                      id="branch_code"
                      value={formData.branch_code}
                      onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number || ''}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input
                      id="gst_number"
                      value={formData.gst_number || ''}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="logo">Branch Logo</Label>
                  <div className="mt-2 space-y-2">
                    {logoPreview && (
                      <div className="relative inline-block">
                        <img src={logoPreview} alt="Logo" className="h-24 object-contain border rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => handleRemoveFile('logo')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange('logo')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signature">Authorized Signature</Label>
                  <div className="mt-2 space-y-2">
                    {signaturePreview && (
                      <div className="relative inline-block">
                        <img src={signaturePreview} alt="Signature" className="h-20 object-contain border rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => handleRemoveFile('signature')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('signature-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {signaturePreview ? 'Change Signature' : 'Upload Signature'}
                      </Button>
                      <input
                        id="signature-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange('signature')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="letterhead">Letterhead Template</Label>
                  <div className="mt-2 space-y-2">
                    {letterheadPreview && (
                      <div className="relative">
                        <img src={letterheadPreview} alt="Letterhead" className="w-full max-w-md h-auto border rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveFile('letterhead')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('letterhead-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {letterheadPreview ? 'Change Letterhead' : 'Upload Letterhead'}
                      </Button>
                      <input
                        id="letterhead-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange('letterhead')}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload a letterhead template that will be used for documents and bills.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking">
            <Card>
              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number || ''}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
                  <Input
                    id="bank_ifsc_code"
                    value={formData.bank_ifsc_code || ''}
                    onChange={(e) => setFormData({ ...formData, bank_ifsc_code: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    value={formData.footer_text || ''}
                    onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                    placeholder="Text that appears at the bottom of bills and documents"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                  <Textarea
                    id="terms_conditions"
                    value={formData.terms_conditions || ''}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    placeholder="Terms and conditions for bills and documents"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving || !formData}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}