
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pin_attempts_user_time ON public.pin_attempts(user_id, attempted_at DESC);

ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- No client access; only SECURITY DEFINER function writes/reads.
REVOKE ALL ON public.pin_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_employee_pin(_pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_emp RECORD;
  v_perm RECORD;
  v_failed INT;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('valid', false, 'error', 'Non authentifié'); END IF;

  SELECT COUNT(*) INTO v_failed
  FROM public.pin_attempts
  WHERE user_id = v_uid
    AND success = false
    AND attempted_at > now() - interval '15 minutes';

  IF v_failed >= 10 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Trop de tentatives. Réessayez dans 15 minutes.');
  END IF;

  SELECT * INTO v_emp FROM public.employees
  WHERE user_id = v_uid AND is_active = true
    AND pin_hash IS NOT NULL
    AND pin_hash = extensions.crypt(_pin, pin_hash)
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.pin_attempts (user_id, success) VALUES (v_uid, false);
    RETURN jsonb_build_object('valid', false, 'error', 'PIN invalide');
  END IF;

  INSERT INTO public.pin_attempts (user_id, success) VALUES (v_uid, true);
  DELETE FROM public.pin_attempts WHERE attempted_at < now() - interval '1 day';

  SELECT * INTO v_perm FROM public.employee_permissions WHERE employee_id = v_emp.id;
  RETURN jsonb_build_object(
    'valid', true,
    'employee_id', v_emp.id,
    'full_name', v_emp.full_name,
    'role', v_emp.role,
    'permissions', COALESCE(to_jsonb(v_perm), '{}'::jsonb)
  );
END;
$function$;
