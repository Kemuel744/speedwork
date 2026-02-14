-- Restrict get_overdue_invoices to service_role only
REVOKE EXECUTE ON FUNCTION public.get_overdue_invoices() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_overdue_invoices() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_overdue_invoices() TO service_role;