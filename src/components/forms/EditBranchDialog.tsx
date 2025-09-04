import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Branch {
  id: string;
  name: string;
  branch_code: string;
  location?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  registration_number?: string;
  gst_number?: string;
  website?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  footer_text?: string;
  terms_conditions?: string;
  logo_url?: string;
  letterhead_url?: string;
  signature_url?: string;
  organization_id: string;
  lab_id?: string;
  organization?: {
    id: string;
    name: string;
  };
  lab?: {
    id: string;
    name: string;
  };
}

interface Organization {
  id: string;
  name: string;
}

interface Lab {
  id: string;
  name: string;
  organization_id: string;
}

interface EditBranchDialogProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBranchDialog({ branch, isOpen, onClose, onSuccess }: EditBranchDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    branch_code: '',
    location: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    registration_number: '',
    gst_number: '',
    website: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    footer_text: '',
    terms_conditions: '',
    organization_id: '',
    lab_id: ''
  });

  // File URLs
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [letterheadUrl, setLetterheadUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        branch_code: branch.branch_code || '',
        location: branch.location || '',
        phone: branch.phone || '',
        address_line1: branch.address_line1 || '',
        address_line2: branch.address_line2 || '',
        city: branch.city || '',
        state: branch.state || '',
        postal_code: branch.postal_code || '',
        registration_number: branch.registration_number || '',
        gst_number: branch.gst_number || '',
        website: branch.website || '',
        bank_name: branch.bank_name || '',
        bank_account_number: branch.bank_account_number || '',
        bank_ifsc_code: branch.bank_ifsc_code || '',
        footer_text: branch.footer_text || '',
        terms_conditions: branch.terms_conditions || '',
        organization_id: branch.organization_id || '',
        lab_id: branch.lab_id || ''
      });
      setLogoUrl(branch.logo_url || '');
      setLetterheadUrl(branch.letterhead_url || '');
      setSignatureUrl(branch.signature_url || '');
    }
  }, [branch]);

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
      fetchLabs();
    }
  }, [isOpen]);

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching organizations:', error);
      return;
    }
    
    setOrganizations(data || []);
  };

  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from('labs')
      .select('id, name, organization_id')
      .order('name');
    
    if (error) {
      console.error('Error fetching labs:', error);
      return;
    }
    
    setLabs(data || []);
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'letterhead' | 'signature') => {
    if (!user || !branch) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${branch.id}/${type}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('lab-assets')
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error(`Failed to upload ${type}: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('lab-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'letterhead' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file, type);
    if (url) {
      switch (type) {
        case 'logo':
          setLogoUrl(url);
          break;
        case 'letterhead':
          setLetterheadUrl(url);
          break;
        case 'signature':
          setSignatureUrl(url);
          break;
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    }
  };

  const handleSave = async () => {
    if (!branch) return;
    
    setSaving(true);
    
    try {
      const updateData: any = {
        ...formData,
        logo_url: logoUrl || null,
        letterhead_url: letterheadUrl || null,
        signature_url: signatureUrl || null,
        lab_id: formData.lab_id || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('branches')
        .update(updateData)
        .eq('id', branch.id);

      if (error) throw error;

      toast.success('Branch updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Failed to update branch: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getPublicUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const { data } = supabase.storage.from('lab-assets').getPublicUrl(url);
    return data.publicUrl;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Branch: {branch?.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="terms">Terms & Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="branch_code">Branch Code *</Label>
                <Input
                  id="branch_code"
                  value={formData.branch_code}
                  onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lab">Associated Lab</Label>
                <Select
                  value={formData.lab_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, lab_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Lab</SelectItem>
                    {labs
                      .filter(lab => lab.organization_id === formData.organization_id)
                      .map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bank_account_number">Bank Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bank_ifsc_code">Bank IFSC Code</Label>
                <Input
                  id="bank_ifsc_code"
                  value={formData.bank_ifsc_code}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc_code: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <Label>Logo</Label>
                  <div className="mt-2 space-y-2">
                    {logoUrl && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={getPublicUrl(logoUrl)} 
                          alt="Logo" 
                          className="h-20 w-20 object-contain border rounded"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogoUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'logo')}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Label>Letterhead</Label>
                  <div className="mt-2 space-y-2">
                    {letterheadUrl && (
                      <div className="flex items-center gap-2">
                        <a 
                          href={getPublicUrl(letterheadUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Eye className="h-4 w-4" />
                          View Letterhead
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLetterheadUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'letterhead')}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Label>Signature</Label>
                  <div className="mt-2 space-y-2">
                    {signatureUrl && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={getPublicUrl(signatureUrl)} 
                          alt="Signature" 
                          className="h-20 object-contain border rounded"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSignatureUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'signature')}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="footer_text">Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}