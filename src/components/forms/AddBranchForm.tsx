import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
}

interface Lab {
  id: string;
  name: string;
  organization_id: string;
}

interface AddBranchFormProps {
  onSuccess?: () => void;
}

export const AddBranchForm = ({ onSuccess }: AddBranchFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    branch_code: '',
    organization_id: '',
    lab_id: '',
    location: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: ''
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (formData.organization_id) {
      fetchLabs(formData.organization_id);
    } else {
      setLabs([]);
    }
  }, [formData.organization_id]);

  const fetchOrganizations = async () => {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchLabs = async (organizationId: string) => {
    try {
      const { data } = await supabase
        .from('labs')
        .select('id, name, organization_id')
        .eq('organization_id', organizationId)
        .order('name');
      
      setLabs(data || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('branches')
        .insert([{
          ...formData,
          lab_id: formData.lab_id || null,
          created_by: user.id
        }]);

      if (error) throw error;

      toast.success('Branch created successfully');
      setFormData({
        name: '',
        branch_code: '',
        organization_id: '',
        lab_id: '',
        location: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        phone: ''
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating branch:', error);
      toast.error('Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter organizations and labs based on user role
  const availableOrganizations = profile?.role === 'super_admin' 
    ? organizations 
    : organizations; // Lab admins will see filtered orgs via RLS

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Branch</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Branch Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="branch_code">Branch Code * (3-4 letters)</Label>
              <Input
                id="branch_code"
                value={formData.branch_code}
                onChange={(e) => handleChange('branch_code', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                placeholder="e.g., SAN, PUN"
                required
                maxLength={4}
              />
            </div>
            <div>
              <Label htmlFor="organization">Organization *</Label>
              <Select value={formData.organization_id} onValueChange={(value) => handleChange('organization_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {availableOrganizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lab">Associated Lab (Optional)</Label>
              <Select value={formData.lab_id} onValueChange={(value) => handleChange('lab_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lab" />
                </SelectTrigger>
                <SelectContent>
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="location">Location Description</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Brief description of location"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || !formData.organization_id}>
            {loading ? 'Creating...' : 'Create Branch'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};