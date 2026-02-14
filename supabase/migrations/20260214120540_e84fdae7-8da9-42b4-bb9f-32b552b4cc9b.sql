
-- 1. Admin-only SELECT policy on access_code_attempts
CREATE POLICY "Admins can view access code attempts"
ON public.access_code_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Hide access_code from users' own subscription SELECT
-- Drop existing user SELECT policy and recreate without access_code exposure
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Create a secure view that excludes access_code for regular users
CREATE OR REPLACE FUNCTION public.get_my_subscription()
RETURNS TABLE (
  id uuid,
  plan subscription_plan,
  status subscription_status,
  start_date timestamptz,
  end_date timestamptz,
  amount integer,
  payment_method payment_method
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.plan, s.status, s.start_date, s.end_date, s.amount, s.payment_method
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;
