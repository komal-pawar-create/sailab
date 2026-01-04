import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Shield } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface AddLabFormProps {
  onSuccess?: () => void;
}

export function AddLabForm({ onSuccess }: AddLabFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    initials: '',
    organization_id: '',
    location: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    admin_mobile_number: '',
    registration_number: '',
    gst_number: '',
    website: '',
    footer_text: '',
    terms_conditions: '',
    // License fields
    license_number: '',
    license_type: '',
    license_issue_date: '',
    license_expiry_date: '',
    license_notes: '',
    license_reminder_days: '30',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setOrganizations(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.initials.trim() || !formData.organization_id) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in lab name, initials, and select an organization.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('labs').insert({
        name: formData.name.trim(),
        initials: formData.initials.trim().toUpperCase(),
        organization_id: formData.organization_id,
        location: formData.location.trim() || null,
        address_line1: formData.address_line1.trim() || null,
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        phone: formData.phone.trim() || null,
        admin_mobile_number: formData.admin_mobile_number.trim() || null,
        registration_number: formData.registration_number.trim() || null,
        gst_number: formData.gst_number.trim() || null,
        website: formData.website.trim() || null,
        footer_text: formData.footer_text.trim() || null,
        terms_conditions: formData.terms_conditions.trim() || null,
        // License fields
        license_number: formData.license_number.trim() || null,
        license_type: formData.license_type || null,
        license_issue_date: formData.license_issue_date || null,
        license_expiry_date: formData.license_expiry_date || null,
        license_notes: formData.license_notes.trim() || null,
        license_reminder_days: parseInt(formData.license_reminder_days) || 30,
        license_status: formData.license_expiry_date ? 
          (new Date(formData.license_expiry_date) < new Date() ? 'expired' : 'active') : 'active',
      });

      if (error) throw error;

      toast({
        title: 'Lab created',
        description: `${formData.name} has been created successfully.`,
      });

      setFormData({
        name: '',
        initials: '',
        organization_id: '',
        location: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        phone: '',
        admin_mobile_number: '',
        registration_number: '',
        gst_number: '',
        website: '',
        footer_text: '',
        terms_conditions: '',
        license_number: '',
        license_type: '',
        license_issue_date: '',
        license_expiry_date: '',
        license_notes: '',
        license_reminder_days: '30',
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error creating lab',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Add New Lab
        </CardTitle>
        <CardDescription>Create a new lab under an organization</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Lab Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter lab name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">Initials *</Label>
              <Input
                id="initials"
                value={formData.initials}
                onChange={(e) => handleChange('initials', e.target.value.toUpperCase())}
                placeholder="e.g., ABC"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(value) => handleChange('organization_id', value)}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_mobile_number">Admin Mobile (for OTP)</Label>
              <Input
                id="admin_mobile_number"
                value={formData.admin_mobile_number}
                onChange={(e) => handleChange('admin_mobile_number', e.target.value)}
                placeholder="Admin mobile number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Location description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                placeholder="Apt, suite, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="Postal code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                value={formData.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                placeholder="Lab registration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={formData.gst_number}
                onChange={(e) => handleChange('gst_number', e.target.value)}
                placeholder="GST number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Textarea
              id="footer_text"
              value={formData.footer_text}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder="Text to appear on reports footer"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => handleChange('terms_conditions', e.target.value)}
              placeholder="Terms and conditions for bills/reports"
              rows={3}
            />
          </div>

          {/* License Information Section */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              License Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleChange('license_number', e.target.value)}
                  placeholder="e.g., NABL-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_type">License Type</Label>
                <Select
                  value={formData.license_type}
                  onValueChange={(value) => handleChange('license_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NABL">NABL</SelectItem>
                    <SelectItem value="NABH">NABH</SelectItem>
                    <SelectItem value="State License">State License</SelectItem>
                    <SelectItem value="ISO Certification">ISO Certification</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_reminder_days">Reminder Days Before Expiry</Label>
                <Input
                  id="license_reminder_days"
                  type="number"
                  value={formData.license_reminder_days}
                  onChange={(e) => handleChange('license_reminder_days', e.target.value)}
                  placeholder="30"
                  min="1"
                  max="365"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_issue_date">Issue Date</Label>
                <Input
                  id="license_issue_date"
                  type="date"
                  value={formData.license_issue_date}
                  onChange={(e) => handleChange('license_issue_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_expiry_date">Expiry Date</Label>
                <Input
                  id="license_expiry_date"
                  type="date"
                  value={formData.license_expiry_date}
                  onChange={(e) => handleChange('license_expiry_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_notes">License Notes</Label>
              <Textarea
                id="license_notes"
                value={formData.license_notes}
                onChange={(e) => handleChange('license_notes', e.target.value)}
                placeholder="Additional notes about the license..."
                rows={2}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Lab...
              </>
            ) : (
              'Create Lab'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
