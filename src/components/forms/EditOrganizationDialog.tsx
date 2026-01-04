import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface EditOrganizationDialogProps {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditOrganizationDialog({
  organization,
  open,
  onOpenChange,
  onSuccess,
}: EditOrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stats, setStats] = useState({ labs: 0, branches: 0, users: 0 });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    contact_email: '',
    contact_phone: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        address_line1: organization.address_line1 || '',
        address_line2: organization.address_line2 || '',
        city: organization.city || '',
        state: organization.state || '',
        postal_code: organization.postal_code || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
      });
      fetchStats();
    }
  }, [organization]);

  const fetchStats = async () => {
    if (!organization) return;

    // Count labs
    const { count: labCount } = await supabase
      .from('labs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization.id);

    // Count branches
    const { count: branchCount } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization.id);

    // Count users through branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', organization.id);

    let userCount = 0;
    if (branches && branches.length > 0) {
      const branchIds = branches.map(b => b.id);
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('branch_id', branchIds);
      userCount = count || 0;
    }

    setStats({
      labs: labCount || 0,
      branches: branchCount || 0,
      users: userCount,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Missing required field',
        description: 'Organization name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          address_line1: formData.address_line1.trim() || null,
          address_line2: formData.address_line2.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Organization updated',
        description: `${formData.name} has been updated successfully.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error updating organization',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!organization) return;

    setIsDeleting(true);

    try {
      // Check for dependencies
      if (stats.branches > 0 || stats.labs > 0) {
        toast({
          title: 'Cannot delete organization',
          description: `This organization has ${stats.labs} lab(s) and ${stats.branches} branch(es). Please delete them first.`,
          variant: 'destructive',
        });
        setShowDeleteConfirm(false);
        setIsDeleting(false);
        return;
      }

      const { error } = await supabase.from('organizations').delete().eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Organization deleted',
        description: `${organization.name} has been deleted successfully.`,
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error deleting organization',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details. This organization has {stats.labs} lab(s), {stats.branches} branch(es), and {stats.users} user(s).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-email">Contact Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-phone">Contact Phone</Label>
                <Input
                  id="org-phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-address1">Address Line 1</Label>
                <Input
                  id="org-address1"
                  value={formData.address_line1}
                  onChange={(e) => handleChange('address_line1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address2">Address Line 2</Label>
                <Input
                  id="org-address2"
                  value={formData.address_line2}
                  onChange={(e) => handleChange('address_line2', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-city">City</Label>
                <Input
                  id="org-city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-state">State</Label>
                <Input
                  id="org-state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-postal">Postal Code</Label>
                <Input
                  id="org-postal"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading || isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{organization?.name}</span>?
              {(stats.labs > 0 || stats.branches > 0) && (
                <span className="block mt-2 text-destructive">
                  Warning: This organization has {stats.labs} lab(s) and {stats.branches} branch(es).
                  You must delete them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || stats.labs > 0 || stats.branches > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Organization'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
