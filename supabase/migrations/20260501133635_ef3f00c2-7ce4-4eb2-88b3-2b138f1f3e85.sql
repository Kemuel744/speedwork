
-- =========================================================
-- 1) SUBSCRIPTIONS: hide access_code & transaction_id from owners
-- =========================================================
-- Revoke column-level SELECT from regular authenticated users on sensitive columns.
-- Admins (and the service_role used by edge functions) keep full access.
REVOKE SELECT (access_code, transaction_id) ON public.subscriptions FROM authenticated;
REVOKE SELECT (access_code, transaction_id) ON public.subscriptions FROM anon;

-- Re-grant SELECT on safe columns explicitly to authenticated
GRANT SELECT (id, user_id, plan, status, payment_method, amount, start_date, end_date, created_at, updated_at)
  ON public.subscriptions TO authenticated;

-- service_role keeps full access (default), admins use service_role via edge functions
-- and RPC get_my_subscription (SECURITY DEFINER) excludes access_code already.

-- =========================================================
-- 2) USER_ROLES: explicit per-command policies, prevent self-grant
-- =========================================================
-- Drop the broad ALL policies and replace with explicit ones.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can write roles (restrictive)" ON public.user_roles;

-- Restrictive policy: every write must be performed by an admin
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3) LEARNING_RESOURCES: stop broadcasting changes via Realtime
-- =========================================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.learning_resources;
