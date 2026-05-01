
CREATE OR REPLACE FUNCTION public.admin_get_subscriptions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  plan public.subscription_plan,
  status public.subscription_status,
  payment_method public.payment_method,
  amount integer,
  access_code text,
  start_date timestamptz,
  end_date timestamptz,
  transaction_id text,
  created_at timestamptz,
  updated_at timestamptz,
  company_name text,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.id, s.user_id, s.plan, s.status, s.payment_method, s.amount,
    s.access_code, s.start_date, s.end_date, s.transaction_id,
    s.created_at, s.updated_at,
    p.company_name, p.email
  FROM public.subscriptions s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  ORDER BY s.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_subscriptions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_subscriptions() TO authenticated;
