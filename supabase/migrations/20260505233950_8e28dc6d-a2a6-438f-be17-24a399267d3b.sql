CREATE OR REPLACE FUNCTION public.enforce_employee_sale_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perm RECORD;
  v_emp RECORD;
  v_max_disc NUMERIC;
BEGIN
  -- Only enforce when a cashier (employee) is attached to the sale.
  IF NEW.cashier_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_emp FROM public.employees
   WHERE id = NEW.cashier_id AND user_id = NEW.user_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caissier invalide ou inactif' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_perm FROM public.employee_permissions
   WHERE employee_id = NEW.cashier_id;

  -- Discount checks
  IF COALESCE(NEW.discount_amount, 0) > 0 THEN
    IF NOT FOUND OR COALESCE(v_perm.can_discount, false) = false THEN
      RAISE EXCEPTION 'Cet employé n''est pas autorisé à appliquer des remises'
        USING ERRCODE = '42501';
    END IF;
    v_max_disc := COALESCE(NEW.subtotal, 0) * COALESCE(v_perm.max_discount_pct, 0) / 100.0;
    IF NEW.discount_amount > v_max_disc + 0.01 THEN
      RAISE EXCEPTION 'Remise (%.2f) supérieure à la limite autorisée (%.2f)',
        NEW.discount_amount, v_max_disc USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Refund check (negative total = refund/return)
  IF COALESCE(NEW.total, 0) < 0 THEN
    IF NOT FOUND OR COALESCE(v_perm.can_refund, false) = false THEN
      RAISE EXCEPTION 'Cet employé n''est pas autorisé à effectuer des remboursements'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_employee_sale_perms ON public.sales;
CREATE TRIGGER trg_enforce_employee_sale_perms
BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.enforce_employee_sale_permissions();