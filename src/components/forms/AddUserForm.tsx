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

interface Branch {
  id: string;
  name: string;
  organization_id: string;
}

interface AddUserFormProps {
  onSuccess?: () => void;
}

export const AddUserForm = ({ onSuccess }: AddUserFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: '',
    organization_id: '',
    branch_id: ''
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile, signUp } = useAuth();

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchOrganizations();
    }
  }, [profile]);

  useEffect(() => {
    if (formData.organization_id) {
      fetchBranches(formData.organization_id);
    } else {
      setBranches([]);
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

  const fetchBranches = async (organizationId: string) => {
    try {
      const { data } = await supabase
        .from('branches')
        .select('id, name, organization_id')
        .eq('organization_id', organizationId)
        .order('name');
      
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.full_name,
        formData.role,
        undefined, // lab_id is not used in new system
        formData.branch_id
      );

      if (error) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        throw new Error(errorMessage);
      }

      toast.success('User created successfully');
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: '',
        organization_id: '',
        branch_id: ''
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset dependent fields when organization changes
    if (field === 'organization_id') {
      setFormData(prev => ({ ...prev, branch_id: '' }));
    }
  };

  const getRoleOptions = () => {
    if (profile?.role === 'super_admin') {
      return [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'lab_admin', label: 'Lab Admin' },
        { value: 'branch_operator', label: 'Branch Operator' },
        { value: 'admin', label: 'Admin' },
        { value: 'operator_1', label: 'Operator 1' },
        { value: 'operator_2', label: 'Operator 2' },
        { value: 'operator_3', label: 'Operator 3' }
      ];
    } else if (profile?.role === 'lab_admin') {
      return [
        { value: 'branch_operator', label: 'Branch Operator' },
        { value: 'admin', label: 'Admin' },
        { value: 'operator_1', label: 'Operator 1' },
        { value: 'operator_2', label: 'Operator 2' },
        { value: 'operator_3', label: 'Operator 3' }
      ];
    }
    return [];
  };

  const needsBranchAssignment = (role: string) => {
    // All users except super_admin need branch assignment
    return role !== 'super_admin';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsBranchAssignment(formData.role) && (
            <>
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <Select value={formData.organization_id} onValueChange={(value) => handleChange('organization_id', value)}>
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

              {formData.organization_id && (
                <div>
                  <Label htmlFor="branch">Branch *</Label>
                  <Select value={formData.branch_id} onValueChange={(value) => handleChange('branch_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <Button 
            type="submit" 
            disabled={
              loading || 
              !formData.email || 
              !formData.password || 
              !formData.full_name || 
              !formData.role ||
              (needsBranchAssignment(formData.role) && !formData.organization_id) ||
              (needsBranchAssignment(formData.role) && !formData.branch_id)
            }
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};