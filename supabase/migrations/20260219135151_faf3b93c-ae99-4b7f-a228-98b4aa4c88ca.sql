
-- Create a secure function that returns only limited admin contact info
CREATE OR REPLACE FUNCTION public.get_admin_contacts()
RETURNS TABLE(user_id uuid, email text, company_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.email, p.company_name
  FROM public.profiles p
  INNER JOIN public.user_roles r ON r.user_id = p.user_id
  WHERE r.role = 'admin'
$$;

-- Drop the overly broad policy that exposes all admin profile fields
DROP POLICY IF EXISTS "Users can view admin profiles" ON public.profiles;
