-- 1) Remove direct client access to the overdue-invoices helper; backend automation still uses service-role access.
REVOKE EXECUTE ON FUNCTION public.get_overdue_invoices() FROM authenticated, anon, PUBLIC;

-- 2) Harden role/org helpers that must remain SECURITY DEFINER for RLS policies.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF _user_id <> auth.uid() AND auth.role() <> 'service_role' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.same_org(_user1 uuid, _user2 uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF auth.role() <> 'service_role' AND auth.uid() NOT IN (_user1, _user2) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members m1
    JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = _user1 AND m2.user_id = _user2
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF _user_id <> auth.uid() AND auth.role() <> 'service_role' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organizations
    WHERE owner_id = _user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF _user_id <> auth.uid() AND auth.role() <> 'service_role' THEN
    RETURN NULL;
  END IF;

  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1;

  RETURN v_org_id;
END;
$$;

-- 3) Convert owner-scoped callable functions to SECURITY INVOKER.
CREATE OR REPLACE FUNCTION public.generate_po_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT := to_char(now(), 'YYYY');
  next_seq INTEGER;
BEGIN
  IF auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^BC-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq
  FROM public.purchase_orders
  WHERE user_id = _user_id AND number LIKE 'BC-' || year_part || '-%';
  RETURN 'BC-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_transfer_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  year_part TEXT := to_char(now(), 'YYYY');
  next_seq INTEGER;
BEGIN
  IF auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^TRF-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq
  FROM public.stock_transfers
  WHERE user_id = _user_id AND number LIKE 'TRF-' || year_part || '-%';
  RETURN 'TRF-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_credit_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  IF auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^CR-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.customer_credits
  WHERE user_id = _user_id AND number LIKE 'CR-' || year_part || '-%';
  RETURN 'CR-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_return_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  IF auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^RET-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.sale_returns
  WHERE user_id = _user_id AND number LIKE 'RET-' || year_part || '-%';
  RETURN 'RET-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_session_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  IF auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^CS-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.cash_sessions
  WHERE user_id = _user_id AND number LIKE 'CS-' || year_part || '-%';
  RETURN 'CS-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_marketplace_order_number(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  IF auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^MO-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.marketplace_orders
  WHERE buyer_user_id = _user_id AND number LIKE 'MO-' || year_part || '-%';
  RETURN 'MO-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_subscription()
RETURNS TABLE(id uuid, plan subscription_plan, status subscription_status, start_date timestamp with time zone, end_date timestamp with time zone, amount integer, payment_method payment_method)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.plan, s.status, s.start_date, s.end_date, s.amount, s.payment_method
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_pnl(_start date, _end date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_revenue NUMERIC := 0;
  v_vat_collected NUMERIC := 0;
  v_purchases NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_returns NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('error', 'Non authentifié'); END IF;

  SELECT COALESCE(SUM(CASE WHEN subtotal_ht > 0 THEN subtotal_ht ELSE total END), 0),
         COALESCE(SUM(tax_amount), 0)
  INTO v_revenue, v_vat_collected
  FROM public.sales
  WHERE user_id = v_uid AND created_at::date BETWEEN _start AND _end;

  SELECT COALESCE(SUM(total), 0) INTO v_purchases
  FROM public.purchase_orders
  WHERE user_id = v_uid AND status IN ('received', 'partial') AND order_date BETWEEN _start AND _end;

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM public.expenses
  WHERE user_id = v_uid AND expense_date BETWEEN _start AND _end;

  SELECT COALESCE(SUM(total_amount), 0) INTO v_returns
  FROM public.sale_returns
  WHERE user_id = v_uid AND return_date BETWEEN _start AND _end;

  RETURN jsonb_build_object(
    'revenue', v_revenue,
    'vat_collected', v_vat_collected,
    'returns', v_returns,
    'net_revenue', v_revenue - v_returns,
    'purchases', v_purchases,
    'expenses', v_expenses,
    'gross_margin', v_revenue - v_returns - v_purchases,
    'net_result', v_revenue - v_returns - v_purchases - v_expenses
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vat_summary(_start date, _end date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_collected NUMERIC := 0;
  v_deductible NUMERIC := 0;
  v_sales_ht NUMERIC := 0;
  v_purchases_ht NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('error', 'Non authentifié'); END IF;

  SELECT COALESCE(SUM(tax_amount), 0), COALESCE(SUM(subtotal_ht), 0)
  INTO v_collected, v_sales_ht
  FROM public.sales
  WHERE user_id = v_uid AND created_at::date BETWEEN _start AND _end;

  SELECT COALESCE(SUM(tax_amount), 0), COALESCE(SUM(subtotal), 0)
  INTO v_deductible, v_purchases_ht
  FROM public.purchase_orders
  WHERE user_id = v_uid AND status IN ('received', 'partial') AND order_date BETWEEN _start AND _end;

  RETURN jsonb_build_object(
    'sales_ht', v_sales_ht,
    'vat_collected', v_collected,
    'purchases_ht', v_purchases_ht,
    'vat_deductible', v_deductible,
    'vat_to_pay', v_collected - v_deductible
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_savings_summary(_start date DEFAULT NULL::date, _end date DEFAULT NULL::date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_start DATE := COALESCE(_start, '1900-01-01'::date);
  v_end DATE := COALESCE(_end, CURRENT_DATE);
  v_revenue NUMERIC := 0;
  v_purchases NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_returns NUMERIC := 0;
  v_deposits NUMERIC := 0;
  v_business_deposits NUMERIC := 0;
  v_personal_deposits NUMERIC := 0;
  v_profit NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  SELECT COALESCE(SUM(CASE WHEN subtotal_ht > 0 THEN subtotal_ht ELSE total END), 0)
  INTO v_revenue
  FROM public.sales
  WHERE user_id = v_uid AND status = 'completed'
    AND created_at::date BETWEEN v_start AND v_end;

  SELECT COALESCE(SUM(total), 0) INTO v_purchases
  FROM public.purchase_orders
  WHERE user_id = v_uid AND status IN ('received', 'partial')
    AND order_date BETWEEN v_start AND v_end;

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM public.expenses
  WHERE user_id = v_uid AND expense_date BETWEEN v_start AND v_end;

  SELECT COALESCE(SUM(total_amount), 0) INTO v_returns
  FROM public.sale_returns
  WHERE user_id = v_uid AND return_date BETWEEN v_start AND v_end;

  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(amount) FILTER (WHERE deposit_type = 'business_savings'), 0),
    COALESCE(SUM(amount) FILTER (WHERE deposit_type = 'personal_withdrawal'), 0)
  INTO v_deposits, v_business_deposits, v_personal_deposits
  FROM public.deposits
  WHERE user_id = v_uid AND deposit_date BETWEEN v_start AND v_end;

  v_profit := v_revenue - v_returns - v_purchases - v_expenses;

  RETURN jsonb_build_object(
    'revenue', v_revenue,
    'returns', v_returns,
    'purchases', v_purchases,
    'expenses', v_expenses,
    'total_profit', v_profit,
    'total_deposits', v_deposits,
    'business_savings', v_business_deposits,
    'personal_withdrawals', v_personal_deposits,
    'available_profit', v_profit - v_deposits
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code RECORD;
  v_promo RECORD;
  v_discount NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('valid', false, 'error', 'Non authentifié'); END IF;
  SELECT * INTO v_code FROM public.promo_codes
  WHERE user_id = v_uid AND upper(code) = upper(_code) AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'Code invalide'); END IF;
  IF v_code.usage_limit > 0 AND v_code.usage_count >= v_code.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code épuisé');
  END IF;
  SELECT * INTO v_promo FROM public.promotions
  WHERE id = v_code.promotion_id AND user_id = v_uid AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'Promotion expirée'); END IF;
  IF v_promo.ends_at IS NOT NULL AND v_promo.ends_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Promotion terminée');
  END IF;
  IF v_promo.starts_at > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Promotion pas encore commencée');
  END IF;
  IF _subtotal < v_promo.min_purchase THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Montant minimum: ' || v_promo.min_purchase);
  END IF;

  IF v_promo.promo_type = 'percent' THEN
    v_discount := _subtotal * v_promo.value / 100;
  ELSIF v_promo.promo_type = 'fixed' THEN
    v_discount := v_promo.value;
  END IF;
  IF v_promo.max_discount > 0 AND v_discount > v_promo.max_discount THEN
    v_discount := v_promo.max_discount;
  END IF;
  IF v_discount > _subtotal THEN v_discount := _subtotal; END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promotion_id', v_promo.id,
    'promo_code_id', v_code.id,
    'name', v_promo.name,
    'promo_type', v_promo.promo_type,
    'value', v_promo.value,
    'discount', v_discount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pnl(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vat_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_savings_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_po_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_transfer_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_credit_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_return_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_session_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_marketplace_order_number(uuid) TO authenticated;