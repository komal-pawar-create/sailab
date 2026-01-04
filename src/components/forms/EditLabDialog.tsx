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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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
  // License fields
  license_number: string | null;
  license_type: string | null;
  license_issue_date: string | null;
  license_expiry_date: string | null;
  license_status: string | null;
  license_notes: string | null;
  license_reminder_days: number | null;
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
    // License fields
    license_number: '',
    license_type: '',
    license_issue_date: '',
    license_expiry_date: '',
    license_notes: '',
    license_reminder_days: '30',
  });
  const { toast } = useToast();

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!formData.license_expiry_date) return null;
    const expiry = new Date(formData.license_expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getLicenseStatusBadge = () => {
    const days = getDaysUntilExpiry();
    if (days === null) return null;
    
    if (days < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Expired ({Math.abs(days)} days ago)</Badge>;
    } else if (days <= 7) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Expires in {days} days</Badge>;
    } else if (days <= 30) {
      return <Badge className="flex items-center gap-1 bg-amber-500 text-white"><Clock className="h-3 w-3" /> Expires in {days} days</Badge>;
    } else {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Valid ({days} days)</Badge>;
    }
  };

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
        license_number: lab.license_number || '',
        license_type: lab.license_type || '',
        license_issue_date: lab.license_issue_date || '',
        license_expiry_date: lab.license_expiry_date || '',
        license_notes: lab.license_notes || '',
        license_reminder_days: lab.license_reminder_days?.toString() || '30',
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

    // Calculate license status
    let licenseStatus = 'active';
    if (formData.license_expiry_date) {
      const expiry = new Date(formData.license_expiry_date);
      const today = new Date();
      const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays = parseInt(formData.license_reminder_days) || 30;
      
      if (daysUntil < 0) {
        licenseStatus = 'expired';
      } else if (daysUntil <= reminderDays) {
        licenseStatus = 'expiring_soon';
      }
    }

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
          // License fields
          license_number: formData.license_number.trim() || null,
          license_type: formData.license_type || null,
          license_issue_date: formData.license_issue_date || null,
          license_expiry_date: formData.license_expiry_date || null,
          license_notes: formData.license_notes.trim() || null,
          license_reminder_days: parseInt(formData.license_reminder_days) || 30,
          license_status: licenseStatus,
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

            {/* License Information Section */}
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="h-5 w-5 text-primary" />
                  License Information
                </div>
                {getLicenseStatusBadge()}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-license-number">License Number</Label>
                  <Input
                    id="edit-license-number"
                    value={formData.license_number}
                    onChange={(e) => handleChange('license_number', e.target.value)}
                    placeholder="e.g., NABL-12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-license-type">License Type</Label>
                  <Select
                    value={formData.license_type}
                    onValueChange={(value) => handleChange('license_type', value)}
                  >
                    <SelectTrigger id="edit-license-type">
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-license-issue">Issue Date</Label>
                  <Input
                    id="edit-license-issue"
                    type="date"
                    value={formData.license_issue_date}
                    onChange={(e) => handleChange('license_issue_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-license-expiry">Expiry Date</Label>
                  <Input
                    id="edit-license-expiry"
                    type="date"
                    value={formData.license_expiry_date}
                    onChange={(e) => handleChange('license_expiry_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reminder-days">Reminder Days</Label>
                  <Input
                    id="edit-reminder-days"
                    type="number"
                    value={formData.license_reminder_days}
                    onChange={(e) => handleChange('license_reminder_days', e.target.value)}
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-license-notes">License Notes</Label>
                <Textarea
                  id="edit-license-notes"
                  value={formData.license_notes}
                  onChange={(e) => handleChange('license_notes', e.target.value)}
                  rows={2}
                  placeholder="Additional notes about the license..."
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
