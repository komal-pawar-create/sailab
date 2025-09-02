-- Create global test types table for platform-wide test types
CREATE TABLE public.global_test_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_test_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for global test types
-- All authenticated users can view global test types
CREATE POLICY "All users can view global test types" 
ON public.global_test_types 
FOR SELECT 
USING (true);

-- Only super admins can create global test types
CREATE POLICY "Super admins can create global test types" 
ON public.global_test_types 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

-- Only super admins can update global test types
CREATE POLICY "Super admins can update global test types" 
ON public.global_test_types 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

-- Only super admins can delete global test types
CREATE POLICY "Super admins can delete global test types" 
ON public.global_test_types 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_global_test_types_updated_at
BEFORE UPDATE ON public.global_test_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();