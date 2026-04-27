-- Tax rates
CREATE TABLE public.tax_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tax rates" ON public.tax_rates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tax_rates_updated BEFORE UPDATE ON public.tax_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chart of accounts
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'expense', -- asset, liability, equity, revenue, expense
  parent_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own accounts" ON public.chart_of_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_coa_updated BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Accounting entries (header)
CREATE TABLE public.accounting_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'manual', -- sale, purchase, expense, manual
  source_id UUID,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entries" ON public.accounting_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_acc_entries_updated BEFORE UPDATE ON public.accounting_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Accounting entry lines
CREATE TABLE public.accounting_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_id UUID NOT NULL,
  account_id UUID NOT NULL,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounting_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entry lines" ON public.accounting_entry_lines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_acc_lines_entry ON public.accounting_entry_lines(entry_id);
CREATE INDEX idx_acc_lines_account ON public.accounting_entry_lines(account_id);

-- Add VAT breakdown to sales (if columns don't exist)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_rate NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS subtotal_ht NUMERIC NOT NULL DEFAULT 0;

-- P&L function
CREATE OR REPLACE FUNCTION public.get_pnl(_start DATE, _end DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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
END; $$;

-- VAT summary function
CREATE OR REPLACE FUNCTION public.get_vat_summary(_start DATE, _end DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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
END; $$;