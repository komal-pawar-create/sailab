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

interface Lab {
  id: string;
  name: string;
  initials: string;
  organization_id: string | null;
  location: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  admin_mobile_number: string | null;
  registration_number: string | null;
  gst_number: string | null;
  website: string | null;
  footer_text: string | null;
  terms_conditions: string | null;
}

interface EditLabDialogProps {
  lab: Lab | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditLabDialog({ lab, open, onOpenChange, onSuccess }: EditLabDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    initials: '',
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
  });
  const { toast } = useToast();

  useEffect(() => {
    if (lab) {
      setFormData({
        name: lab.name || '',
        initials: lab.initials || '',
        location: lab.location || '',
        address_line1: lab.address_line1 || '',
        address_line2: lab.address_line2 || '',
        city: lab.city || '',
        state: lab.state || '',
        postal_code: lab.postal_code || '',
        phone: lab.phone || '',
        admin_mobile_number: lab.admin_mobile_number || '',
        registration_number: lab.registration_number || '',
        gst_number: lab.gst_number || '',
        website: lab.website || '',
        footer_text: lab.footer_text || '',
        terms_conditions: lab.terms_conditions || '',
      });
    }
  }, [lab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab) return;

    if (!formData.name.trim() || !formData.initials.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Lab name and initials are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('labs')
        .update({
          name: formData.name.trim(),
          initials: formData.initials.trim().toUpperCase(),
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', lab.id);

      if (error) throw error;

      toast({
        title: 'Lab updated',
        description: `${formData.name} has been updated successfully.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error updating lab',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lab) return;

    setIsDeleting(true);

    try {
      // Check for dependencies
      const { count: branchCount } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', lab.id);

      if (branchCount && branchCount > 0) {
        toast({
          title: 'Cannot delete lab',
          description: `This lab has ${branchCount} branch(es). Please delete or reassign them first.`,
          variant: 'destructive',
        });
        setShowDeleteConfirm(false);
        setIsDeleting(false);
        return;
      }

      const { error } = await supabase.from('labs').delete().eq('id', lab.id);

      if (error) throw error;

      toast({
        title: 'Lab deleted',
        description: `${lab.name} has been deleted successfully.`,
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error deleting lab',
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab</DialogTitle>
            <DialogDescription>Update lab details and settings</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Lab Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-initials">Initials *</Label>
                <Input
                  id="edit-initials"
                  value={formData.initials}
                  onChange={(e) => handleChange('initials', e.target.value.toUpperCase())}
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-admin-mobile">Admin Mobile (for OTP)</Label>
                <Input
                  id="edit-admin-mobile"
                  value={formData.admin_mobile_number}
                  onChange={(e) => handleChange('admin_mobile_number', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address1">Address Line 1</Label>
                <Input
                  id="edit-address1"
                  value={formData.address_line1}
                  onChange={(e) => handleChange('address_line1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address2">Address Line 2</Label>
                <Input
                  id="edit-address2"
                  value={formData.address_line2}
                  onChange={(e) => handleChange('address_line2', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postal">Postal Code</Label>
                <Input
                  id="edit-postal"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reg">Registration Number</Label>
                <Input
                  id="edit-reg"
                  value={formData.registration_number}
                  onChange={(e) => handleChange('registration_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gst">GST Number</Label>
                <Input
                  id="edit-gst"
                  value={formData.gst_number}
                  onChange={(e) => handleChange('gst_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-footer">Footer Text</Label>
              <Textarea
                id="edit-footer"
                value={formData.footer_text}
                onChange={(e) => handleChange('footer_text', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-terms">Terms & Conditions</Label>
              <Textarea
                id="edit-terms"
                value={formData.terms_conditions}
                onChange={(e) => handleChange('terms_conditions', e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="flex justify-between gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading || isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lab
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
            <AlertDialogTitle>Delete Lab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{lab?.name}</span>?
              This action cannot be undone. All associated data may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Lab'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
