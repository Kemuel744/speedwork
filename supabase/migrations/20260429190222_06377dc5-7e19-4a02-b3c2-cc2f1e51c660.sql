-- 1) FIX CRITIQUE: ne plus stocker le PIN en clair
-- Le trigger hash_employee_pin met déjà pin_code à '****', mais on retire complètement la colonne pour blinder.
-- D'abord, mettre à jour le trigger pour ne plus toucher pin_code (la colonne va disparaître).
CREATE OR REPLACE FUNCTION public.hash_employee_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- pin_code colonne supprimée; le hashing se fait via verify_employee_pin / set_employee_pin RPC.
  RETURN NEW;
END;
$function$;

-- Supprimer la colonne plaintext
ALTER TABLE public.employees DROP COLUMN IF EXISTS pin_code;

-- RPC sécurisée pour définir/changer un PIN (hash côté serveur, ne renvoie jamais le PIN)
CREATE OR REPLACE FUNCTION public.set_employee_pin(_employee_id uuid, _pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF _pin IS NULL OR length(_pin) < 4 OR length(_pin) > 12 OR _pin !~ '^[0-9]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN invalide (4 à 12 chiffres)');
  END IF;
  SELECT user_id INTO v_owner FROM public.employees WHERE id = _employee_id;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employé introuvable');
  END IF;
  IF v_owner <> v_uid AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;
  UPDATE public.employees
    SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf')),
        updated_at = now()
    WHERE id = _employee_id;
  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.set_employee_pin(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_employee_pin(uuid, text) TO authenticated;

-- 2) Anti-privilege-escalation sur user_roles : RESTRICTIVE policy
-- Empêche tout INSERT/UPDATE/DELETE sauf si l'appelant est admin.
DROP POLICY IF EXISTS "Only admins can write roles (restrictive)" ON public.user_roles;
CREATE POLICY "Only admins can write roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) FIX du self-join cassé sur organizations
DROP POLICY IF EXISTS "Members can view their org" ON public.organizations;
CREATE POLICY "Members can view their org"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = organizations.id
      AND m.user_id = auth.uid()
  )
);

-- 4) Bucket worker-photos : passer en privé + policies de lecture restreintes
UPDATE storage.buckets SET public = false WHERE id = 'worker-photos';

DROP POLICY IF EXISTS "Worker photos: owner can read" ON storage.objects;
CREATE POLICY "Worker photos: owner can read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'worker-photos'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role))
);