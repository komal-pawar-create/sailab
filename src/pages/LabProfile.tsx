import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Building2, FileText, CreditCard, Settings } from 'lucide-react';

interface LabProfile {
  id: string;
  name: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  logo_url?: string;
  signature_url?: string;
  letterhead_url?: string;
  registration_number?: string;
  gst_number?: string;
  website?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  footer_text?: string;
  terms_conditions?: string;
}

export default function LabProfile() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [labProfile, setLabProfile] = useState<LabProfile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [letterheadPreview, setLetterheadPreview] = useState<string>('');

  useEffect(() => {
    if (!profile) return;
    
    // Only allow admin or lab_admin roles
    if (profile.role !== 'admin' && profile.role !== 'lab_admin' && profile.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchLabProfile();
  }, [profile, navigate]);

  const fetchLabProfile = async () => {
    setLoading(true);
    
    try {
      let labData = null;
      
      // First try to get lab by profile.lab_id
      if (profile?.lab_id) {
        const { data, error } = await supabase
          .from('labs')
          .select('*')
          .eq('id', profile.lab_id)
          .single();
        
        if (data && !error) {
          labData = data;
        }
      }
      
      // If no lab found and user has a branch, try to get lab through organization
      if (!labData && profile?.branch_id) {
        // Get organization_id from the user's branch
        const { data: branchData } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', profile.branch_id)
          .single();
        
        if (branchData?.organization_id) {
          // Get any lab in this organization
          const { data: orgLabData } = await supabase
            .from('labs')
            .select('*')
            .eq('organization_id', branchData.organization_id)
            .limit(1)
            .single();
          
          if (orgLabData) {
            labData = orgLabData;
          }
        }
      }
      
      // If still no lab, try to get any lab (for super_admin)
      if (!labData && profile?.role === 'super_admin') {
        const { data: anyLabData } = await supabase
          .from('labs')
          .select('*')
          .limit(1)
          .single();
        
        if (anyLabData) {
          labData = anyLabData;
        }
      }
      
      if (labData) {
        setLabProfile(labData);
        if (labData.logo_url) {
          setLogoPreview(labData.logo_url);
        }
        if (labData.signature_url) {
          setSignaturePreview(labData.signature_url);
        }
        if (labData.letterhead_url) {
          setLetterheadPreview(labData.letterhead_url);
        }
      } else {
        // Create a new lab profile template
        const newLabTemplate = {
          id: '',
          name: 'Lab Name',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          logo_url: '',
          signature_url: '',
          registration_number: '',
          gst_number: '',
          website: '',
          bank_name: '',
          bank_account_number: '',
          bank_ifsc_code: '',
          footer_text: '',
          terms_conditions: ''
        };
        setLabProfile(newLabTemplate);
      }
    } catch (error: any) {
      console.error('Error fetching lab profile:', error);
      toast({
        title: "Error",
        description: "Failed to load lab profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature' | 'letterhead') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    if (type === 'logo') {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (type === 'signature') {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (type === 'letterhead') {
      setLetterheadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLetterheadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'signature' | 'letterhead'): Promise<string | null> => {
    if (!profile?.user_id || !labProfile?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${labProfile.id}-${type}.${fileExt}`;
    const filePath = `labs/${labProfile.id}/${fileName}`;

    try {
      // Remove old file if exists
      if (type === 'logo' && labProfile.logo_url) {
        const oldPath = labProfile.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('lab-assets').remove([`labs/${labProfile.id}/${oldPath}`]);
        }
      } else if (type === 'signature' && labProfile.signature_url) {
        const oldPath = labProfile.signature_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('lab-assets').remove([`labs/${labProfile.id}/${oldPath}`]);
        }
      } else if (type === 'letterhead' && labProfile.letterhead_url) {
        const oldPath = labProfile.letterhead_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('lab-assets').remove([`labs/${labProfile.id}/${oldPath}`]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('lab-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lab-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labProfile) return;

    setSaving(true);

    try {
      let logoUrl = labProfile.logo_url;
      let signatureUrl = labProfile.signature_url;
      let letterheadUrl = labProfile.letterhead_url;

      // Upload new logo if selected
      if (logoFile) {
        const url = await uploadFile(logoFile, 'logo');
        if (url) logoUrl = url;
      }

      // Upload new signature if selected
      if (signatureFile) {
        const url = await uploadFile(signatureFile, 'signature');
        if (url) signatureUrl = url;
      }

      // Upload new letterhead if selected
      if (letterheadFile) {
        const url = await uploadFile(letterheadFile, 'letterhead');
        if (url) letterheadUrl = url;
      }

      // Update lab profile
      const { error } = await supabase
        .from('labs')
        .update({
          ...labProfile,
          logo_url: logoUrl,
          signature_url: signatureUrl,
          letterhead_url: letterheadUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', labProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lab profile updated successfully",
      });

      setLogoFile(null);
      setSignatureFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!labProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No lab profile found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lab Profile</h1>
        <p className="text-muted-foreground">Manage your lab's information and branding</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic details about your lab</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Lab Name</Label>
                    <Input
                      id="name"
                      value={labProfile.name}
                      onChange={(e) => setLabProfile({ ...labProfile, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={labProfile.phone || ''}
                      onChange={(e) => setLabProfile({ ...labProfile, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration">Registration Number</Label>
                    <Input
                      id="registration"
                      value={labProfile.registration_number || ''}
                      onChange={(e) => setLabProfile({ ...labProfile, registration_number: e.target.value })}
                      placeholder="LAB-REG-12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      value={labProfile.gst_number || ''}
                      onChange={(e) => setLabProfile({ ...labProfile, gst_number: e.target.value })}
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={labProfile.website || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input
                    id="address1"
                    value={labProfile.address_line1 || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, address_line1: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={labProfile.address_line2 || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, address_line2: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={labProfile.city || ''}
                      onChange={(e) => setLabProfile({ ...labProfile, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={labProfile.state || ''}
                      onChange={(e) => setLabProfile({ ...labProfile, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal">Postal Code</Label>
                    <Input
                      id="postal"
                      value={labProfile.postal_code || ''}
                      onChange={(e) => setLabProfile({ ...labProfile, postal_code: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Documents</CardTitle>
                <CardDescription>Logo, signature, and document settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Lab Logo</Label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Lab logo"
                            className="max-h-32 mx-auto"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={() => {
                              setLogoPreview('');
                              setLogoFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No logo uploaded</p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 200x100px, Max 2MB</p>
                  </div>

                  <div className="space-y-4">
                    <Label>Authorized Signature</Label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                      {signaturePreview ? (
                        <div className="relative">
                          <img
                            src={signaturePreview}
                            alt="Signature"
                            className="max-h-32 mx-auto"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={() => {
                              setSignaturePreview('');
                              setSignatureFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No signature uploaded</p>
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'signature')}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 150x50px, Max 2MB</p>
                  </div>
                </div>

                <div className="space-y-4 col-span-2">
                  <Label>Letterhead Template</Label>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    {letterheadPreview ? (
                      <div className="relative">
                        <img
                          src={letterheadPreview}
                          alt="Letterhead"
                          className="max-h-64 mx-auto"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0"
                          onClick={() => {
                            setLetterheadPreview('');
                            setLetterheadFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No letterhead template uploaded</p>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'letterhead')}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload your letterhead template. This will be used for generating PDF documents with your branding.
                    Recommended: A4 size (2480x3508px), Max 5MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer">Bill Footer Text</Label>
                  <Textarea
                    id="footer"
                    value={labProfile.footer_text || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, footer_text: e.target.value })}
                    placeholder="Thank you for choosing our services!"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={labProfile.terms_conditions || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, terms_conditions: e.target.value })}
                    placeholder="1. Payment is due within 30 days&#10;2. All tests are subject to availability..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking">
            <Card>
              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
                <CardDescription>Bank details for payment collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={labProfile.bank_name || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, bank_name: e.target.value })}
                    placeholder="State Bank of India"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={labProfile.bank_account_number || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, bank_account_number: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={labProfile.bank_ifsc_code || ''}
                    onChange={(e) => setLabProfile({ ...labProfile, bank_ifsc_code: e.target.value })}
                    placeholder="SBIN0001234"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
                <CardDescription>Other configuration options</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Additional settings will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}