-- Type pour catégoriser les dépôts
CREATE TYPE public.deposit_type AS ENUM ('business_savings', 'personal_withdrawal');

-- Table des dépôts
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deposit_type public.deposit_type NOT NULL DEFAULT 'business_savings',
  bank TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_deposits_user_date ON public.deposits(user_id, deposit_date DESC);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
  ON public.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deposits"
  ON public.deposits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deposits"
  ON public.deposits FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour résumé épargne
CREATE OR REPLACE FUNCTION public.get_savings_summary(_start DATE DEFAULT NULL, _end DATE DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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