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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, ChevronDown, Eye, EyeOff } from 'lucide-react';

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
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  // Load initial user data and reset password fields
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setRole(user.role);
      setBranchId(user.branch_id || '');
    }
    // Reset password fields when dialog opens/closes
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordOpen(false);
    setShowPassword(false);
  }, [user, isOpen]);

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

  const needsOrganizationAssignment = (selectedRole: string) => {
    return ['lab_admin', 'branch_operator', 'operator_1', 'operator_2', 'operator_3'].includes(selectedRole);
  };

  const needsBranchAssignment = (selectedRole: string) => {
    // Lab admin has access to all branches, so no specific branch needed
    return ['branch_operator', 'operator_1', 'operator_2', 'operator_3'].includes(selectedRole);
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
      } else if (role === 'lab_admin') {
        // Lab admin needs organization but can access all branches - assign first branch for lab_id derivation
        if (branches.length > 0) {
          updateData.branch_id = branches[0].id;
        } else if (!branchId) {
          toast({
            title: "Error",
            description: "Please select an organization with at least one branch",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
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
    // Clear branch and org if role doesn't need organization
    if (!needsOrganizationAssignment(newRole)) {
      setBranchId('');
      setOrganizationId('');
    }
    // Clear branch if role is lab_admin (they access all branches)
    if (newRole === 'lab_admin') {
      setBranchId('');
    }
  };

  const handleOrganizationChange = (newOrgId: string) => {
    setOrganizationId(newOrgId);
    setBranchId(''); // Reset branch selection when organization changes
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Get user_id from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error('Could not find user');
      }

      // Use admin API to update password
      const { error } = await supabase.auth.admin.updateUserById(
        profileData.user_id,
        { password: newPassword }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordOpen(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
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

          {needsOrganizationAssignment(role) && (
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

              {organizationId && needsBranchAssignment(role) && (
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

              {role === 'lab_admin' && organizationId && (
                <p className="text-sm text-muted-foreground">
                  Lab Admin has access to all branches in this organization
                </p>
              )}
            </>
          )}

          {/* Password Change Section */}
          <Collapsible open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isPasswordOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isChangingPassword ? 'Changing...' : 'Update Password'}
              </Button>
            </CollapsibleContent>
          </Collapsible>
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