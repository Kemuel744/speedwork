-- =========================================
-- PHASE 3: Cash register, returns, customer credits
-- =========================================

-- 1) CASH REGISTERS
CREATE TABLE public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cash registers" ON public.cash_registers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_cash_registers_updated BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) CASH SESSIONS (open/close)
CREATE TABLE public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  register_id UUID,
  location_id UUID,
  number TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  counted_amount NUMERIC NOT NULL DEFAULT 0,
  difference NUMERIC NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_cash_in NUMERIC NOT NULL DEFAULT 0,
  total_cash_out NUMERIC NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  opened_by_name TEXT NOT NULL DEFAULT '',
  closed_by_name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cash sessions" ON public.cash_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_cash_sessions_user_status ON public.cash_sessions(user_id, status);
CREATE TRIGGER trg_cash_sessions_updated BEFORE UPDATE ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) CASH MOVEMENTS (in/out)
CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  movement_type TEXT NOT NULL DEFAULT 'expense', -- expense, withdrawal, deposit, other_in, other_out
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cash movements" ON public.cash_movements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_cash_movements_session ON public.cash_movements(session_id);

-- 4) CUSTOMERS (POS clients - distinct from "clients" used for invoicing)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_customers_user ON public.customers(user_id);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Augment SALES with payment + cashier + session + customer
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_given NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS cashier_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_sales_session ON public.sales(session_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(customer_id);

-- 6) SALE RETURNS
CREATE TABLE public.sale_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  sale_id UUID,
  customer_id UUID,
  session_id UUID,
  return_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL DEFAULT '',
  refund_method TEXT NOT NULL DEFAULT 'cash', -- cash, mobile_money, bank, store_credit
  total_amount NUMERIC NOT NULL DEFAULT 0,
  restock BOOLEAN NOT NULL DEFAULT true,
  cashier_name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own returns" ON public.sale_returns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_returns_user ON public.sale_returns(user_id);
CREATE TRIGGER trg_sale_returns_updated BEFORE UPDATE ON public.sale_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sale_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  return_id UUID NOT NULL,
  product_id UUID,
  variant_id UUID,
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own return items" ON public.sale_return_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_return_items_return ON public.sale_return_items(return_id);

-- 7) CUSTOMER CREDITS (dettes liées à une vente)
CREATE TABLE public.customer_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  customer_id UUID NOT NULL,
  sale_id UUID,
  initial_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open', -- open, partial, paid, overdue, cancelled
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own credits" ON public.customer_credits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_credits_customer ON public.customer_credits(customer_id);
CREATE INDEX idx_credits_status ON public.customer_credits(user_id, status);
CREATE TRIGGER trg_customer_credits_updated BEFORE UPDATE ON public.customer_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.customer_credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credit_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_credit_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own credit payments" ON public.customer_credit_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_credit_payments_credit ON public.customer_credit_payments(credit_id);

-- =========================================
-- 8) NUMBER GENERATORS
-- =========================================
CREATE OR REPLACE FUNCTION public.generate_session_number(_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^CS-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.cash_sessions
  WHERE user_id = _user_id AND number LIKE 'CS-' || year_part || '-%';
  RETURN 'CS-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;$$;

CREATE OR REPLACE FUNCTION public.generate_return_number(_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^RET-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.sale_returns
  WHERE user_id = _user_id AND number LIKE 'RET-' || year_part || '-%';
  RETURN 'RET-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;$$;

CREATE OR REPLACE FUNCTION public.generate_credit_number(_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^CR-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.customer_credits
  WHERE user_id = _user_id AND number LIKE 'CR-' || year_part || '-%';
  RETURN 'CR-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;$$;

-- =========================================
-- 9) CLOSE SESSION FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.close_cash_session(_session_id UUID, _counted_amount NUMERIC, _closed_by_name TEXT DEFAULT '', _notes TEXT DEFAULT '')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session RECORD; v_uid UUID := auth.uid();
  v_sales NUMERIC := 0; v_count INTEGER := 0;
  v_in NUMERIC := 0; v_out NUMERIC := 0; v_expected NUMERIC;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Non authentifié'); END IF;
  SELECT * INTO v_session FROM public.cash_sessions WHERE id = _session_id AND user_id = v_uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Session introuvable'); END IF;
  IF v_session.status = 'closed' THEN RETURN jsonb_build_object('success', false, 'error', 'Session déjà clôturée'); END IF;

  -- cash sales only count toward expected cash
  SELECT COALESCE(SUM(total), 0), COUNT(*) INTO v_sales, v_count
  FROM public.sales WHERE session_id = _session_id AND user_id = v_uid AND payment_method = 'cash';

  SELECT COALESCE(SUM(amount), 0) INTO v_in FROM public.cash_movements
  WHERE session_id = _session_id AND user_id = v_uid AND movement_type IN ('deposit', 'other_in');
  SELECT COALESCE(SUM(amount), 0) INTO v_out FROM public.cash_movements
  WHERE session_id = _session_id AND user_id = v_uid AND movement_type IN ('expense', 'withdrawal', 'other_out');

  v_expected := v_session.opening_amount + v_sales + v_in - v_out;

  UPDATE public.cash_sessions SET
    status = 'closed', closed_at = now(),
    counted_amount = _counted_amount, expected_amount = v_expected,
    difference = _counted_amount - v_expected,
    total_sales = v_sales, sales_count = v_count,
    total_cash_in = v_in, total_cash_out = v_out,
    closed_by_name = COALESCE(NULLIF(_closed_by_name, ''), closed_by_name),
    notes = COALESCE(NULLIF(_notes, ''), notes),
    updated_at = now()
  WHERE id = _session_id;

  RETURN jsonb_build_object(
    'success', true, 'expected', v_expected, 'counted', _counted_amount,
    'difference', _counted_amount - v_expected, 'sales_total', v_sales, 'sales_count', v_count
  );
END;$$;

-- =========================================
-- 10) CUSTOMER BALANCE TRIGGERS
-- =========================================
CREATE OR REPLACE FUNCTION public.update_customer_balance_on_credit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers SET current_balance = current_balance + NEW.remaining_amount, updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.customers SET current_balance = GREATEST(0, current_balance - OLD.remaining_amount), updated_at = now()
    WHERE id = OLD.customer_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
CREATE TRIGGER trg_credit_balance AFTER INSERT OR DELETE ON public.customer_credits
FOR EACH ROW EXECUTE FUNCTION public.update_customer_balance_on_credit();

CREATE OR REPLACE FUNCTION public.apply_credit_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_credit RECORD; v_new_remaining NUMERIC;
BEGIN
  SELECT * INTO v_credit FROM public.customer_credits WHERE id = NEW.credit_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_new_remaining := GREATEST(0, v_credit.remaining_amount - NEW.amount);
  UPDATE public.customer_credits SET
    remaining_amount = v_new_remaining,
    status = CASE WHEN v_new_remaining <= 0 THEN 'paid'
                  WHEN v_new_remaining < v_credit.initial_amount THEN 'partial'
                  ELSE status END,
    updated_at = now()
  WHERE id = NEW.credit_id;
  UPDATE public.customers SET
    current_balance = GREATEST(0, current_balance - NEW.amount), updated_at = now()
  WHERE id = v_credit.customer_id;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_apply_credit_payment AFTER INSERT ON public.customer_credit_payments
FOR EACH ROW EXECUTE FUNCTION public.apply_credit_payment();