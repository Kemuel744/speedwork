
-- Products catalog
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  unit_price numeric NOT NULL DEFAULT 0,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  alert_threshold integer NOT NULL DEFAULT 5,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_user ON public.products (user_id);

-- Stock movements (entries, exits, adjustments)
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL DEFAULT 'entry', -- entry, exit, adjustment
  quantity integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movements" ON public.stock_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own movements" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own movements" ON public.stock_movements FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_stock_movements_product ON public.stock_movements (product_id);
CREATE INDEX idx_stock_movements_user ON public.stock_movements (user_id);
