REVOKE SELECT (pin_hash) ON public.employees FROM authenticated, anon, PUBLIC;
REVOKE SELECT (access_code, transaction_id) ON public.subscriptions FROM authenticated, anon, PUBLIC;