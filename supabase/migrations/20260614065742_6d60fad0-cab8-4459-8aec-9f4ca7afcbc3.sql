
-- Inventories module
CREATE TABLE public.inventories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  inventory_date date NOT NULL DEFAULT CURRENT_DATE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  responsible_name text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  products_checked integer NOT NULL DEFAULT 0,
  total_variance integer NOT NULL DEFAULT 0,
  variance_value numeric NOT NULL DEFAULT 0,
  accuracy_rate numeric NOT NULL DEFAULT 0,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventories TO authenticated;
GRANT ALL ON public.inventories TO service_role;

ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventories" ON public.inventories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_inventories_updated_at
  BEFORE UPDATE ON public.inventories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_inventories_user ON public.inventories(user_id, created_at DESC);

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  system_qty integer NOT NULL DEFAULT 0,
  counted_qty integer NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inventory_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventory items" ON public.inventory_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_inventory_items_inv ON public.inventory_items(inventory_id);

-- Validate inventory: create stock_movements adjustments + update product stock + freeze totals.
CREATE OR REPLACE FUNCTION public.validate_inventory(_inventory_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv RECORD;
  v_item RECORD;
  v_checked integer := 0;
  v_variance integer := 0;
  v_value numeric := 0;
  v_abs_variance integer := 0;
  v_total_system integer := 0;
  v_accuracy numeric := 100;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT * INTO v_inv FROM public.inventories WHERE id = _inventory_id AND user_id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inventaire introuvable');
  END IF;
  IF v_inv.status = 'validated' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inventaire déjà validé');
  END IF;

  FOR v_item IN
    SELECT * FROM public.inventory_items WHERE inventory_id = _inventory_id AND user_id = v_uid
  LOOP
    v_checked := v_checked + 1;
    v_variance := v_variance + (v_item.counted_qty - v_item.system_qty);
    v_abs_variance := v_abs_variance + ABS(v_item.counted_qty - v_item.system_qty);
    v_total_system := v_total_system + v_item.system_qty;
    v_value := v_value + (v_item.counted_qty - v_item.system_qty) * v_item.unit_price;

    IF v_item.counted_qty <> v_item.system_qty THEN
      INSERT INTO public.stock_movements (user_id, product_id, movement_type, quantity, reason)
      VALUES (
        v_uid, v_item.product_id, 'adjustment',
        v_item.counted_qty - v_item.system_qty,
        'Inventaire ' || COALESCE(NULLIF(v_inv.name, ''), to_char(v_inv.inventory_date, 'DD/MM/YYYY'))
      );

      UPDATE public.products
      SET quantity_in_stock = v_item.counted_qty, updated_at = now()
      WHERE id = v_item.product_id AND user_id = v_uid;
    END IF;
  END LOOP;

  IF v_total_system > 0 THEN
    v_accuracy := GREATEST(0, 100 - (v_abs_variance::numeric / v_total_system::numeric * 100));
  END IF;

  UPDATE public.inventories SET
    status = 'validated',
    validated_at = now(),
    products_checked = v_checked,
    total_variance = v_variance,
    variance_value = v_value,
    accuracy_rate = v_accuracy,
    updated_at = now()
  WHERE id = _inventory_id;

  RETURN jsonb_build_object(
    'success', true,
    'products_checked', v_checked,
    'total_variance', v_variance,
    'variance_value', v_value,
    'accuracy_rate', v_accuracy
  );
END;
$$;
