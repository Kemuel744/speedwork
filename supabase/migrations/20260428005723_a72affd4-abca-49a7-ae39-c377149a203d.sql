
-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============ 1. PIN HASHING ============
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Backfill: hash any existing plaintext PINs
UPDATE public.employees
SET pin_hash = extensions.crypt(pin_code, extensions.gen_salt('bf'))
WHERE pin_hash IS NULL AND pin_code IS NOT NULL AND pin_code <> '';

-- Drop the unique index that referenced plaintext pin
DROP INDEX IF EXISTS public.idx_employees_user_pin;

-- Trigger: auto-hash pin_code on insert/update, then mask plaintext
CREATE OR REPLACE FUNCTION public.hash_employee_pin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.pin_code IS NOT NULL AND NEW.pin_code <> '' AND NEW.pin_code <> '****' THEN
    IF TG_OP = 'INSERT' OR NEW.pin_code IS DISTINCT FROM OLD.pin_code THEN
      NEW.pin_hash := extensions.crypt(NEW.pin_code, extensions.gen_salt('bf'));
      NEW.pin_code := '****';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hash_employee_pin ON public.employees;
CREATE TRIGGER trg_hash_employee_pin
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.hash_employee_pin();

UPDATE public.employees SET pin_code = '****' WHERE pin_hash IS NOT NULL AND pin_code <> '****';

-- Update verify_employee_pin to use hash
CREATE OR REPLACE FUNCTION public.verify_employee_pin(_pin text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_emp RECORD;
  v_perm RECORD;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('valid', false, 'error', 'Non authentifié'); END IF;
  SELECT * INTO v_emp FROM public.employees
  WHERE user_id = v_uid AND is_active = true
    AND pin_hash IS NOT NULL
    AND pin_hash = extensions.crypt(_pin, pin_hash)
  LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'PIN invalide'); END IF;
  SELECT * INTO v_perm FROM public.employee_permissions WHERE employee_id = v_emp.id;
  RETURN jsonb_build_object(
    'valid', true,
    'employee_id', v_emp.id,
    'full_name', v_emp.full_name,
    'role', v_emp.role,
    'permissions', COALESCE(to_jsonb(v_perm), '{}'::jsonb)
  );
END;
$$;

-- ============ 2. REALTIME SCOPING ============
DROP POLICY IF EXISTS "Authenticated users can receive own realtime events" ON realtime.messages;
CREATE POLICY "Users can only subscribe to own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'user:' || auth.uid()::text
  OR realtime.topic() LIKE 'public:%'
);

-- ============ 3. PUBLIC BUCKET LISTING FIX ============
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view worker photos" ON storage.objects;

-- ============ 4. REVOKE PUBLIC EXECUTE ON SECURITY DEFINER FUNCTIONS ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.same_org(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_contacts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_overdue_invoices() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_subscription() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_pnl(date, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_vat_summary(date, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.verify_employee_pin(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.close_cash_session(uuid, numeric, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.receive_stock_transfer(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_po_number(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_transfer_number(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_session_number(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_return_number(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_credit_number(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.get_my_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pnl(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vat_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_employee_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cash_session(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_stock_transfer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_purchase_order_by_token(text) TO anon, authenticated;
