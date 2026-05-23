-- Make get_my_subscription a SECURITY DEFINER so we can drop the table-level user SELECT policy
CREATE OR REPLACE FUNCTION public.get_my_subscription()
RETURNS TABLE(id uuid, plan subscription_plan, status subscription_status, start_date timestamp with time zone, end_date timestamp with time zone, amount integer, payment_method payment_method)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT s.id, s.plan, s.status, s.start_date, s.end_date, s.amount, s.payment_method
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_subscription() TO authenticated;

-- Remove direct user SELECT access on subscriptions to prevent access_code exposure
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;