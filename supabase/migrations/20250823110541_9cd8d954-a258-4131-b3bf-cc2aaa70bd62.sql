-- Fix remaining functions with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, lab_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'branch_operator'::public.user_role),
    CASE 
      WHEN NEW.raw_user_meta_data->>'lab_id' IS NOT NULL AND NEW.raw_user_meta_data->>'lab_id' != ''
      THEN (NEW.raw_user_meta_data->>'lab_id')::uuid 
      ELSE NULL 
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_bill_after_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;