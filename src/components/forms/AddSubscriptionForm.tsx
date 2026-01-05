import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

const subscriptionSchema = z.object({
  lab_id: z.string().min(1, 'Lab is required'),
  plan_name: z.string().min(1, 'Plan is required'),
  billing_cycle: z.string().default('monthly'),
  amount: z.string().min(1, 'Amount is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  auto_renew: z.boolean().default(true),
  notes: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface AddSubscriptionFormProps {
  labs: { id: string; name: string; initials: string }[];
  onSuccess?: () => void;
}

export function AddSubscriptionForm({ labs, onSuccess }: AddSubscriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      lab_id: '',
      plan_name: 'Professional',
      billing_cycle: 'monthly',
      amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_renew: true,
      notes: '',
    },
  });

  const onSubmit = async (data: SubscriptionFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('subscriptions').insert({
        lab_id: data.lab_id,
        plan_name: data.plan_name,
        billing_cycle: data.billing_cycle,
        amount: parseFloat(data.amount),
        start_date: data.start_date,
        end_date: data.end_date || null,
        auto_renew: data.auto_renew,
        notes: data.notes || null,
        status: 'active',
        created_by: user.id,
      });

      if (error) throw error;
      
      toast.success('Subscription added successfully');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Add Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="lab_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lab" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {labs.map((lab) => (
                          <SelectItem key={lab.id} value={lab.id}>
                            {lab.name} ({lab.initials})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (INR) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Subscription'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
