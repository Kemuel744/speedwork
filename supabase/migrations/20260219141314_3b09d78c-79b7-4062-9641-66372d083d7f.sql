
-- Fix security definer view by setting it to SECURITY INVOKER (default for views)
ALTER VIEW public.shared_documents_view SET (security_invoker = on);

-- Grant anonymous/authenticated access to the view so shared docs work without auth
GRANT SELECT ON public.shared_documents_view TO anon, authenticated;
