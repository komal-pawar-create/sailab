-- Add letterhead_url to labs table
ALTER TABLE public.labs 
ADD COLUMN letterhead_url TEXT;

-- Add logo_url and letterhead_url to branches table  
ALTER TABLE public.branches
ADD COLUMN logo_url TEXT,
ADD COLUMN letterhead_url TEXT;

-- Create document_templates table for storing processed documents
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL,
  branch_id UUID,
  original_document_id UUID,
  template_type TEXT NOT NULL, -- 'letterhead_pdf', 'test_report', 'bill'
  template_url TEXT NOT NULL,
  generated_pdf_url TEXT,
  metadata JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on document_templates
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_templates
CREATE POLICY "Branch operators can manage templates in their branch" 
ON public.document_templates 
FOR ALL 
USING ((branch_id IS NOT NULL) AND (branch_id = get_user_branch(auth.uid())))
WITH CHECK ((branch_id IS NOT NULL) AND (branch_id = get_user_branch(auth.uid())));

CREATE POLICY "Lab admins can manage templates in their organization" 
ON public.document_templates 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM branches b 
  WHERE ((b.id = document_templates.branch_id) AND (b.organization_id = get_user_organization(auth.uid())))
))
WITH CHECK (EXISTS ( 
  SELECT 1 FROM branches b 
  WHERE ((b.id = document_templates.branch_id) AND (b.organization_id = get_user_organization(auth.uid())))
));

CREATE POLICY "Super admins can manage all templates" 
ON public.document_templates 
FOR ALL 
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();