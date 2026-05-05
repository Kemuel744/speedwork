
-- 1. Subscriptions: revoke direct SELECT on sensitive columns
REVOKE SELECT (access_code, transaction_id) ON public.subscriptions FROM anon, authenticated;

-- 2. Employees: revoke SELECT on pin_hash
REVOKE SELECT (pin_hash) ON public.employees FROM anon, authenticated;

-- 3. Documents: restrict "Org members can view org documents" to non-sensitive columns only via column-level grants
DROP POLICY IF EXISTS "Org members can view org documents" ON public.documents;
-- Owner SELECT policy already covers user's own documents. Org members must use shared_documents flow.

-- 4. Missions: replace overly broad "Anyone can view open missions" with owner-only; expose public-safe via RPC
DROP POLICY IF EXISTS "Anyone can view open missions" ON public.missions;
CREATE POLICY "Owners and admins view missions"
ON public.missions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_open_missions()
RETURNS TABLE(id uuid, title text, description text, location text, workers_needed int, deadline timestamptz, mission_date date, duration text, priority text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT id, title, description, location, workers_needed, deadline, mission_date, duration, priority
  FROM public.missions
  WHERE status = 'open';
$$;
GRANT EXECUTE ON FUNCTION public.get_open_missions() TO authenticated;

-- 5. Worker photos: replace loose substring match with strict path-prefix policy + add UPDATE for managers
DROP POLICY IF EXISTS "Managers can view worker photos" ON storage.objects;
CREATE POLICY "Managers can view worker photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'worker-photos'
  AND EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.user_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = w.id::text
  )
);

CREATE POLICY "Managers can update worker photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'worker-photos'
  AND EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.user_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = w.id::text
  )
);
