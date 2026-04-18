-- ============================================
-- PHASE 1 : Fondations boutique (variantes, lots, codes-barres, catégories, fournisseurs)
-- ============================================

-- 1) CATÉGORIES ARBORESCENTES
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_categories_user ON public.product_categories(user_id);
CREATE INDEX idx_product_categories_parent ON public.product_categories(parent_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories" ON public.product_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) FOURNISSEURS
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_user ON public.suppliers(user_id);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own suppliers" ON public.suppliers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) ENRICHIR products : barcode EAN-13, category_id, supplier_id, has_variants, has_batches
ALTER TABLE public.products
  ADD COLUMN barcode TEXT,
  ADD COLUMN category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN has_variants BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN has_batches BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN cost_price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN sku TEXT,
  ADD COLUMN unit TEXT NOT NULL DEFAULT 'unit';

CREATE INDEX idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE UNIQUE INDEX idx_products_sku_user ON public.products(user_id, sku) WHERE sku IS NOT NULL;

-- 4) VARIANTES DE PRODUITS (taille, couleur, etc.)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_user ON public.product_variants(user_id);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_variants_barcode ON public.product_variants(barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX idx_variants_sku_user ON public.product_variants(user_id, sku) WHERE sku IS NOT NULL;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own variants" ON public.product_variants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) LOTS / PÉREMPTION (essentiel pharmacies)
CREATE TABLE public.product_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  serial_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_batches_user ON public.product_batches(user_id);
CREATE INDEX idx_batches_product ON public.product_batches(product_id);
CREATE INDEX idx_batches_variant ON public.product_batches(variant_id);
CREATE INDEX idx_batches_expiry ON public.product_batches(expiry_date) WHERE expiry_date IS NOT NULL;

ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own batches" ON public.product_batches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_product_batches_updated_at
  BEFORE UPDATE ON public.product_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Fonction utilitaire : générer un EAN-13 valide
CREATE OR REPLACE FUNCTION public.generate_ean13(prefix TEXT DEFAULT '200')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  sum_odd INTEGER := 0;
  sum_even INTEGER := 0;
  i INTEGER;
  digit INTEGER;
  check_digit INTEGER;
BEGIN
  -- Construire 12 chiffres : prefix + random
  base := prefix || lpad(floor(random() * 1000000000)::TEXT, 12 - length(prefix), '0');
  base := substring(base from 1 for 12);
  
  -- Calculer la clé EAN-13
  FOR i IN 1..12 LOOP
    digit := substring(base from i for 1)::INTEGER;
    IF i % 2 = 1 THEN
      sum_odd := sum_odd + digit;
    ELSE
      sum_even := sum_even + digit;
    END IF;
  END LOOP;
  
  check_digit := (10 - ((sum_odd + sum_even * 3) % 10)) % 10;
  RETURN base || check_digit::TEXT;
END;
$$;