import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  branch_id?: string;
}

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Organization {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  organization_id: string;
}

export default function EditUserDialog({ user, isOpen, onClose, onSuccess }: EditUserDialogProps) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load initial user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setRole(user.role);
      setBranchId(user.branch_id || '');
    }
  }, [user]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching organizations:', error);
      } else {
        setOrganizations(data || []);
      }
    };

    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  // Fetch branches when organization is selected or user has a branch
  useEffect(() => {
    const fetchBranches = async () => {
      // First, if user has a branch, get its organization
      if (user?.branch_id && !organizationId) {
        const { data: branchData } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', user.branch_id)
          .single();
        
        if (branchData) {
          setOrganizationId(branchData.organization_id);
          return; // Will be fetched in next effect run
        }
      }

      // Fetch branches for selected organization
      if (organizationId) {
        const { data, error } = await supabase
          .from('branches')
          .select('id, name, organization_id')
          .eq('organization_id', organizationId)
          .order('name');
        
        if (error) {
          console.error('Error fetching branches:', error);
        } else {
          setBranches(data || []);
        }
      } else {
        setBranches([]);
      }
    };

    fetchBranches();
  }, [organizationId, user?.branch_id]);

  const needsBranchAssignment = (selectedRole: string) => {
    return ['lab_admin', 'branch_operator', 'operator_1', 'operator_2', 'operator_3'].includes(selectedRole);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Update profile
      const updateData: any = {
        full_name: fullName,
        role,
        updated_at: new Date().toISOString(),
      };

      // Only update branch_id if the role needs it
      if (needsBranchAssignment(role)) {
        if (!branchId) {
          toast({
            title: "Error",
            description: "Please select a branch for this role",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        updateData.branch_id = branchId;
      } else {
        // Clear branch_id for super_admin
        updateData.branch_id = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    // Clear branch if role doesn't need it
    if (!needsBranchAssignment(newRole)) {
      setBranchId('');
      setOrganizationId('');
    }
  };

  const handleOrganizationChange = (newOrgId: string) => {
    setOrganizationId(newOrgId);
    setBranchId(''); // Reset branch selection when organization changes
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="lab_admin">Lab Admin</SelectItem>
                <SelectItem value="branch_operator">Branch Operator</SelectItem>
                <SelectItem value="operator_1">Operator 1</SelectItem>
                <SelectItem value="operator_2">Operator 2</SelectItem>
                <SelectItem value="operator_3">Operator 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsBranchAssignment(role) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select value={organizationId} onValueChange={handleOrganizationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {organizationId && (
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}