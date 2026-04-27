-- ===== PHASE 6: Employees =====
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'cashier', -- manager, cashier, seller, stockkeeper
  pin_code TEXT NOT NULL DEFAULT '0000', -- 4-digit PIN for POS quick login
  location_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hired_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_employees_user_pin ON public.employees(user_id, pin_code) WHERE is_active = true;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own employees" ON public.employees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.employee_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  can_sell BOOLEAN NOT NULL DEFAULT true,
  can_refund BOOLEAN NOT NULL DEFAULT false,
  can_discount BOOLEAN NOT NULL DEFAULT false,
  can_open_cash BOOLEAN NOT NULL DEFAULT false,
  can_close_cash BOOLEAN NOT NULL DEFAULT false,
  can_view_reports BOOLEAN NOT NULL DEFAULT false,
  can_manage_stock BOOLEAN NOT NULL DEFAULT false,
  can_manage_products BOOLEAN NOT NULL DEFAULT false,
  max_discount_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own emp permissions" ON public.employee_permissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_emp_perm_updated BEFORE UPDATE ON public.employee_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track which employee made the sale / opened the session
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cashier_id UUID;
ALTER TABLE public.cash_sessions ADD COLUMN IF NOT EXISTS cashier_id UUID;

-- PIN verification RPC
CREATE OR REPLACE FUNCTION public.verify_employee_pin(_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_emp RECORD;
  v_perm RECORD;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('valid', false, 'error', 'Non authentifié'); END IF;
  SELECT * INTO v_emp FROM public.employees
  WHERE user_id = v_uid AND pin_code = _pin AND is_active = true LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'PIN invalide'); END IF;
  SELECT * INTO v_perm FROM public.employee_permissions WHERE employee_id = v_emp.id;
  RETURN jsonb_build_object(
    'valid', true,
    'employee_id', v_emp.id,
    'full_name', v_emp.full_name,
    'role', v_emp.role,
    'permissions', COALESCE(to_jsonb(v_perm), '{}'::jsonb)
  );
END; $$;

-- ===== PHASE 7: Label templates =====
CREATE TABLE public.label_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  width_mm NUMERIC NOT NULL DEFAULT 50,
  height_mm NUMERIC NOT NULL DEFAULT 30,
  cols_per_page INTEGER NOT NULL DEFAULT 4,
  rows_per_page INTEGER NOT NULL DEFAULT 10,
  show_name BOOLEAN NOT NULL DEFAULT true,
  show_price BOOLEAN NOT NULL DEFAULT true,
  show_barcode BOOLEAN NOT NULL DEFAULT true,
  show_qr BOOLEAN NOT NULL DEFAULT false,
  show_company BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own label templates" ON public.label_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_label_tpl_updated BEFORE UPDATE ON public.label_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.label_print_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID,
  product_count INTEGER NOT NULL DEFAULT 0,
  total_labels INTEGER NOT NULL DEFAULT 0,
  printed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.label_print_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own print jobs" ON public.label_print_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);