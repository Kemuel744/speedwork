
-- ============== LOCATIONS (boutiques & dépôts) ==============
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'shop', -- 'shop' | 'warehouse'
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  manager_name TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own locations"
ON public.locations FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_locations_user ON public.locations(user_id);

-- ============== LOCATION STOCK (stock par lieu) ==============
CREATE TABLE public.location_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (location_id, product_id, variant_id)
);

ALTER TABLE public.location_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own location stock"
ON public.location_stock FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_location_stock_updated_at
BEFORE UPDATE ON public.location_stock
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_location_stock_location ON public.location_stock(location_id);
CREATE INDEX idx_location_stock_product ON public.location_stock(product_id);

-- ============== PURCHASE ORDERS (bons de commande) ==============
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | partial | received | cancelled
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XAF',
  notes TEXT NOT NULL DEFAULT '',
  share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own purchase orders"
ON public.purchase_orders FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view PO via share token"
ON public.purchase_orders FOR SELECT
USING (share_token IS NOT NULL);

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_po_user ON public.purchase_orders(user_id);
CREATE INDEX idx_po_supplier ON public.purchase_orders(supplier_id);

-- ============== PURCHASE ORDER ITEMS ==============
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity_ordered INTEGER NOT NULL DEFAULT 1,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own PO items"
ON public.purchase_order_items FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_po_items_po ON public.purchase_order_items(purchase_order_id);

-- ============== STOCK TRANSFERS ==============
CREATE TABLE public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  from_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  to_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_transit | received | cancelled
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_date DATE,
  qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_location_id <> to_location_id)
);

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transfers"
ON public.stock_transfers FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_stock_transfers_updated_at
BEFORE UPDATE ON public.stock_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_transfers_user ON public.stock_transfers(user_id);

-- ============== STOCK TRANSFER ITEMS ==============
CREATE TABLE public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_sent INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transfer items"
ON public.stock_transfer_items FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_transfer_items_transfer ON public.stock_transfer_items(transfer_id);

-- ============== NUMBERING FUNCTIONS ==============
CREATE OR REPLACE FUNCTION public.generate_po_number(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT := to_char(now(), 'YYYY');
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^BC-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq
  FROM public.purchase_orders
  WHERE user_id = _user_id AND number LIKE 'BC-' || year_part || '-%';
  RETURN 'BC-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_transfer_number(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT := to_char(now(), 'YYYY');
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^TRF-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq
  FROM public.stock_transfers
  WHERE user_id = _user_id AND number LIKE 'TRF-' || year_part || '-%';
  RETURN 'TRF-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;
$$;

-- ============== RECEIVE TRANSFER (validation QR) ==============
CREATE OR REPLACE FUNCTION public.receive_stock_transfer(_qr_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT * INTO v_transfer FROM public.stock_transfers
  WHERE qr_token = _qr_token AND user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfert introuvable');
  END IF;

  IF v_transfer.status = 'received' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfert déjà reçu');
  END IF;

  -- Move stock: decrement from source, increment to destination
  FOR v_item IN SELECT * FROM public.stock_transfer_items WHERE transfer_id = v_transfer.id LOOP
    -- Decrement source
    INSERT INTO public.location_stock (user_id, location_id, product_id, variant_id, quantity)
    VALUES (v_uid, v_transfer.from_location_id, v_item.product_id, v_item.variant_id, -v_item.quantity_sent)
    ON CONFLICT (location_id, product_id, variant_id)
    DO UPDATE SET quantity = location_stock.quantity - v_item.quantity_sent, updated_at = now();

    -- Increment destination
    INSERT INTO public.location_stock (user_id, location_id, product_id, variant_id, quantity)
    VALUES (v_uid, v_transfer.to_location_id, v_item.product_id, v_item.variant_id, v_item.quantity_sent)
    ON CONFLICT (location_id, product_id, variant_id)
    DO UPDATE SET quantity = location_stock.quantity + v_item.quantity_sent, updated_at = now();

    UPDATE public.stock_transfer_items SET quantity_received = v_item.quantity_sent WHERE id = v_item.id;
  END LOOP;

  UPDATE public.stock_transfers
  SET status = 'received', received_date = CURRENT_DATE, updated_at = now()
  WHERE id = v_transfer.id;

  RETURN jsonb_build_object('success', true, 'transfer_number', v_transfer.number);
END;
$$;
