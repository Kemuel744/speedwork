-- =========================================
-- PHASE 4: Promotions, discounts & loyalty
-- =========================================

-- 1) PROMOTIONS
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  promo_type TEXT NOT NULL DEFAULT 'percent', -- percent, fixed, bogo, flash
  value NUMERIC NOT NULL DEFAULT 0,           -- % or amount
  min_purchase NUMERIC NOT NULL DEFAULT 0,
  max_discount NUMERIC NOT NULL DEFAULT 0,     -- 0 = no cap
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  apply_to TEXT NOT NULL DEFAULT 'all',        -- all, products, categories
  product_ids UUID[] NOT NULL DEFAULT '{}',
  category_ids UUID[] NOT NULL DEFAULT '{}',
  usage_limit INTEGER NOT NULL DEFAULT 0,      -- 0 = unlimited
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_apply BOOLEAN NOT NULL DEFAULT true,    -- if false, requires promo code
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own promotions" ON public.promotions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_promotions_active ON public.promotions(user_id, is_active);
CREATE TRIGGER trg_promotions_updated BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) PROMO CODES
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  promotion_id UUID NOT NULL,
  code TEXT NOT NULL,
  usage_limit INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own promo codes" ON public.promo_codes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_promo_codes_lookup ON public.promo_codes(user_id, code, is_active);

-- 3) LOYALTY PROGRAMS (one active program per user typically)
CREATE TABLE public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Programme Fidélité',
  description TEXT NOT NULL DEFAULT '',
  points_per_currency NUMERIC NOT NULL DEFAULT 1,    -- e.g. 1 point per 100 XAF spent
  currency_per_point NUMERIC NOT NULL DEFAULT 1,     -- e.g. 1 point = 5 XAF discount
  spend_threshold NUMERIC NOT NULL DEFAULT 100,      -- minimum purchase to earn (per N currency)
  min_redemption_points INTEGER NOT NULL DEFAULT 50,
  max_redemption_pct NUMERIC NOT NULL DEFAULT 50,    -- max % of cart payable in points
  expiry_months INTEGER NOT NULL DEFAULT 12,         -- 0 = never
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own loyalty programs" ON public.loyalty_programs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_loyalty_programs_updated BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) LOYALTY TRANSACTIONS
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  sale_id UUID,
  transaction_type TEXT NOT NULL DEFAULT 'earn', -- earn, redeem, adjust, expire
  points INTEGER NOT NULL DEFAULT 0,             -- positive earn, negative redeem
  description TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own loyalty txn" ON public.loyalty_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_loyalty_txn_customer ON public.loyalty_transactions(customer_id);

-- 5) ADD COLUMNS TO customers + sales
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_spent NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_id UUID,
  ADD COLUMN IF NOT EXISTS promo_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_redeemed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_value NUMERIC NOT NULL DEFAULT 0;

-- 6) Trigger: update customer points balance on loyalty transactions
CREATE OR REPLACE FUNCTION public.apply_loyalty_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.transaction_type = 'earn' THEN
    UPDATE public.customers
    SET loyalty_points = loyalty_points + NEW.points,
        lifetime_points = lifetime_points + NEW.points,
        updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF NEW.transaction_type IN ('redeem', 'expire') THEN
    UPDATE public.customers
    SET loyalty_points = GREATEST(0, loyalty_points - ABS(NEW.points)),
        updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF NEW.transaction_type = 'adjust' THEN
    UPDATE public.customers
    SET loyalty_points = GREATEST(0, loyalty_points + NEW.points),
        updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_apply_loyalty_txn AFTER INSERT ON public.loyalty_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_loyalty_transaction();

-- 7) RPC: validate promo code and return promotion details
CREATE OR REPLACE FUNCTION public.validate_promo_code(_code TEXT, _subtotal NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END;$$;