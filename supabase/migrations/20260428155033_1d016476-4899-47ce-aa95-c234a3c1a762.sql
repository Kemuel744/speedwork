
-- Multi-supplier table linking products to several suppliers
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  supplier_sku TEXT NOT NULL DEFAULT '',
  cost_price NUMERIC NOT NULL DEFAULT 0,
  lead_time_days INTEGER NOT NULL DEFAULT 0,
  min_order_qty INTEGER NOT NULL DEFAULT 1,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_product_suppliers_user ON public.product_suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product ON public.product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON public.product_suppliers(supplier_id);

ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own product suppliers"
ON public.product_suppliers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_product_suppliers_updated_at
BEFORE UPDATE ON public.product_suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
