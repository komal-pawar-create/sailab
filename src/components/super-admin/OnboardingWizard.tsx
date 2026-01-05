import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Building2, 
  FlaskConical, 
  GitBranch, 
  UserCog, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Step schemas
const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  description: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
});

const labSchema = z.object({
  name: z.string().min(2, 'Lab name is required'),
  initials: z.string().min(1, 'Initials are required').max(5, 'Max 5 characters'),
  phone: z.string().optional(),
  admin_mobile_number: z.string().optional(),
  registration_number: z.string().optional(),
  gst_number: z.string().optional(),
  license_number: z.string().optional(),
  license_type: z.string().optional(),
  license_expiry_date: z.string().optional(),
});

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required'),
  branch_code: z.string().min(1, 'Branch code is required').max(10, 'Max 10 characters'),
  location: z.string().optional(),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const adminUserSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile_number: z.string().optional(),
});

const subscriptionSchema = z.object({
  plan_name: z.string().min(1, 'Plan is required'),
  billing_cycle: z.string().default('monthly'),
  amount: z.string().min(1, 'Amount is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  auto_renew: z.boolean().default(true),
  skip_subscription: z.boolean().default(false),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;
type LabFormValues = z.infer<typeof labSchema>;
type BranchFormValues = z.infer<typeof branchSchema>;
type AdminUserFormValues = z.infer<typeof adminUserSchema>;
type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

const steps = [
  { id: 1, title: 'Organization', icon: Building2, description: 'Create the parent organization' },
  { id: 2, title: 'Lab', icon: FlaskConical, description: 'Configure lab details' },
  { id: 3, title: 'Branch', icon: GitBranch, description: 'Set up primary branch' },
  { id: 4, title: 'Admin User', icon: UserCog, description: 'Create lab admin account' },
  { id: 5, title: 'Subscription', icon: CreditCard, description: 'Activate subscription' },
];

interface OnboardingWizardProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Store created IDs for linking
  const [createdIds, setCreatedIds] = useState<{
    organizationId?: string;
    labId?: string;
    branchId?: string;
    userId?: string;
  }>({});

  // Forms for each step
  const orgForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      description: '',
      contact_email: '',
      contact_phone: '',
      address_line1: '',
      city: '',
      state: '',
      postal_code: '',
    },
  });

  const labForm = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: '',
      initials: '',
      phone: '',
      admin_mobile_number: '',
      registration_number: '',
      gst_number: '',
      license_number: '',
      license_type: '',
      license_expiry_date: '',
    },
  });

  const branchForm = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      branch_code: '',
      location: '',
      phone: '',
      address_line1: '',
      city: '',
      state: '',
    },
  });

  const adminForm = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      mobile_number: '',
    },
  });

  const subscriptionForm = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      plan_name: 'Professional',
      billing_cycle: 'monthly',
      amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_renew: true,
      skip_subscription: false,
    },
  });

  // Step 1: Create Organization
  const handleOrganizationSubmit = async (data: OrganizationFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          address_line1: data.address_line1 || null,
          city: data.city || null,
          state: data.state || null,
          postal_code: data.postal_code || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCreatedIds(prev => ({ ...prev, organizationId: org.id }));
      setCompletedSteps(prev => [...prev, 1]);
      setCurrentStep(2);
      toast.success('Organization created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Create Lab
  const handleLabSubmit = async (data: LabFormValues) => {
    if (!user || !createdIds.organizationId) return;
    setIsSubmitting(true);
    
    try {
      const { data: lab, error } = await supabase
        .from('labs')
        .insert({
          name: data.name,
          initials: data.initials.toUpperCase(),
          organization_id: createdIds.organizationId,
          phone: data.phone || null,
          admin_mobile_number: data.admin_mobile_number || null,
          registration_number: data.registration_number || null,
          gst_number: data.gst_number || null,
          license_number: data.license_number || null,
          license_type: data.license_type || null,
          license_expiry_date: data.license_expiry_date || null,
          license_status: data.license_expiry_date ? 'active' : null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCreatedIds(prev => ({ ...prev, labId: lab.id }));
      setCompletedSteps(prev => [...prev, 2]);
      setCurrentStep(3);
      toast.success('Lab configured');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create lab');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Create Branch
  const handleBranchSubmit = async (data: BranchFormValues) => {
    if (!user || !createdIds.organizationId || !createdIds.labId) return;
    setIsSubmitting(true);
    
    try {
      const { data: branch, error } = await supabase
        .from('branches')
        .insert({
          name: data.name,
          branch_code: data.branch_code.toUpperCase(),
          organization_id: createdIds.organizationId,
          lab_id: createdIds.labId,
          location: data.location || null,
          phone: data.phone || null,
          address_line1: data.address_line1 || null,
          city: data.city || null,
          state: data.state || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCreatedIds(prev => ({ ...prev, branchId: branch.id }));
      setCompletedSteps(prev => [...prev, 3]);
      setCurrentStep(4);
      toast.success('Branch created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Create Admin User
  const handleAdminSubmit = async (data: AdminUserFormValues) => {
    if (!user || !createdIds.labId || !createdIds.branchId) return;
    setIsSubmitting(true);
    
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: 'lab_admin',
            lab_id: createdIds.labId,
            branch_id: createdIds.branchId,
            mobile_number: data.mobile_number || null,
            skip_email_confirmation: true,
          },
        },
      });

      if (authError) throw authError;
      
      setCreatedIds(prev => ({ ...prev, userId: authData.user?.id }));
      setCompletedSteps(prev => [...prev, 4]);
      setCurrentStep(5);
      toast.success('Admin user created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5: Create Subscription
  const handleSubscriptionSubmit = async (data: SubscriptionFormValues) => {
    if (!user || !createdIds.labId) return;
    
    if (data.skip_subscription) {
      setCompletedSteps(prev => [...prev, 5]);
      toast.success('Onboarding complete!');
      onComplete?.();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          lab_id: createdIds.labId,
          plan_name: data.plan_name,
          billing_cycle: data.billing_cycle,
          amount: parseFloat(data.amount),
          start_date: data.start_date,
          end_date: data.end_date || null,
          auto_renew: data.auto_renew,
          status: 'active',
          created_by: user.id,
        });

      if (error) throw error;
      
      setCompletedSteps(prev => [...prev, 5]);
      toast.success('Onboarding complete!');
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipSubscription = subscriptionForm.watch('skip_subscription');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Lab Onboarding Wizard
            </CardTitle>
            <CardDescription>
              Set up a new lab in just a few steps
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-6 relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all -z-10"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-background border-primary text-primary"
                      : "bg-muted border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Step 1: Organization */}
        {currentStep === 1 && (
          <Form {...orgForm}>
            <form onSubmit={orgForm.handleSubmit(handleOrganizationSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={orgForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ABC Healthcare Group" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orgForm.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@organization.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orgForm.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orgForm.control}
                  name="address_line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orgForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orgForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={orgForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Next: Lab Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 2: Lab */}
        {currentStep === 2 && (
          <Form {...labForm}>
            <form onSubmit={labForm.handleSubmit(handleLabSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={labForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City Diagnostics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="initials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initials * (for Patient IDs)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CD" maxLength={5} {...field} />
                      </FormControl>
                      <FormDescription>Used in patient ID generation</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Lab phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="admin_mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Mobile (for alerts)</FormLabel>
                      <FormControl>
                        <Input placeholder="Mobile number for license alerts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Lab registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="gst_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GSTIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Lab license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={labForm.control}
                  name="license_expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Next: Branch Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 3: Branch */}
        {currentStep === 3 && (
          <Form {...branchForm}>
            <form onSubmit={branchForm.handleSubmit(handleBranchSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={branchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Branch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="branch_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code * (for Patient IDs)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MB" maxLength={10} {...field} />
                      </FormControl>
                      <FormDescription>Used in patient ID generation</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Area/Locality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="address_line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Next: Admin User
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 4: Admin User */}
        {currentStep === 4 && (
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Create a Lab Admin account. This user will have full access to manage the lab, branches, and operators.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={adminForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Admin's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@lab.com" {...field} />
                      </FormControl>
                      <FormDescription>Used for login</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminForm.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Next: Subscription
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 5: Subscription */}
        {currentStep === 5 && (
          <Form {...subscriptionForm}>
            <form onSubmit={subscriptionForm.handleSubmit(handleSubscriptionSubmit)} className="space-y-4">
              <FormField
                control={subscriptionForm.control}
                name="skip_subscription"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 p-4 border rounded-lg">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="!mt-0">Skip Subscription Setup</FormLabel>
                      <FormDescription>You can add a subscription later</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {!skipSubscription && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={subscriptionForm.control}
                    name="plan_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subscriptionForm.control}
                    name="billing_cycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subscriptionForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (INR) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Subscription amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subscriptionForm.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subscriptionForm.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subscriptionForm.control}
                    name="auto_renew"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0 pt-6">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Auto Renew</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={goBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <CheckCircle2 className="h-4 w-4" />
                  {skipSubscription ? 'Complete Setup' : 'Activate & Complete'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Summary when all steps complete */}
        {completedSteps.length === 5 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Onboarding Complete!</h3>
            <p className="text-muted-foreground mb-6">
              The lab has been successfully set up and is ready to use.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">Organization Created</Badge>
              <Badge variant="secondary">Lab Configured</Badge>
              <Badge variant="secondary">Branch Added</Badge>
              <Badge variant="secondary">Admin User Created</Badge>
              <Badge variant="secondary">Subscription Active</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
