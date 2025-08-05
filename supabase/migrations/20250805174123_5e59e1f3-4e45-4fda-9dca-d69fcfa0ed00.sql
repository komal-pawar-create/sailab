-- Create bills table for patient billing
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL,
  lab_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid', 'overdue')),
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill_payments table for payment history
CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'cheque', 'online', 'insurance')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bills table
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bills
CREATE POLICY "Admins can view all bills" 
ON public.bills 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Operators can view bills from their lab" 
ON public.bills 
FOR ALL 
USING (lab_id = get_user_lab(auth.uid()));

-- Enable RLS on bill_payments table
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bill_payments
CREATE POLICY "Admins can view all payments" 
ON public.bill_payments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Operators can view payments from their lab bills" 
ON public.bill_payments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.bills 
  WHERE bills.id = bill_payments.bill_id 
  AND bills.lab_id = get_user_lab(auth.uid())
));

-- Create trigger for bills updated_at
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update bill amounts after payment
CREATE OR REPLACE FUNCTION public.update_bill_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bills
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(payment_amount), 0)
      FROM public.bill_payments
      WHERE bill_id = NEW.bill_id
    ),
    updated_at = now()
  WHERE id = NEW.bill_id;
  
  -- Update bill status based on payment
  UPDATE public.bills
  SET status = CASE
    WHEN paid_amount >= total_amount THEN 'paid'
    WHEN paid_amount > 0 THEN 'partially_paid'
    ELSE 'pending'
  END,
  due_amount = total_amount - paid_amount
  WHERE id = NEW.bill_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update bill after payment
CREATE TRIGGER update_bill_after_payment_trigger
AFTER INSERT ON public.bill_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_bill_after_payment();