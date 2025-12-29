-- Create trigger function to update bill after payment deletion
CREATE OR REPLACE FUNCTION public.update_bill_after_payment_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Recalculate paid_amount from remaining payments
  UPDATE public.bills
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(payment_amount), 0)
      FROM public.bill_payments
      WHERE bill_id = OLD.bill_id
    ),
    updated_at = now()
  WHERE id = OLD.bill_id;
  
  -- Update due_amount and status based on new paid_amount
  UPDATE public.bills
  SET 
    due_amount = total_amount - paid_amount,
    status = CASE
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partially_paid'
      ELSE 'pending'
    END
  WHERE id = OLD.bill_id;
  
  RETURN OLD;
END;
$function$;

-- Create trigger for bill_payments DELETE
DROP TRIGGER IF EXISTS on_bill_payment_delete ON public.bill_payments;
CREATE TRIGGER on_bill_payment_delete
  AFTER DELETE ON public.bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bill_after_payment_delete();