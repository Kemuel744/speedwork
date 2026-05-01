DROP POLICY IF EXISTS "Org members can view each other profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_org_member_profiles()
RETURNS TABLE(user_id uuid, full_name text, company_name text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.company_name, p.logo_url
  FROM public.profiles p
  WHERE public.same_org(auth.uid(), p.user_id)
    AND p.user_id <> auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_org_member_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_org_member_profiles() TO authenticated;