-- 1. Profil fournisseur public
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public_supplier boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supplier_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS supplier_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supplier_delivery_zones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS supplier_min_order numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_rating numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_orders_count integer NOT NULL DEFAULT 0;

-- 2. Produits exposables publiquement
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_public_price boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wholesale_price numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_public ON public.products(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_public_supplier ON public.profiles(is_public_supplier) WHERE is_public_supplier = true;

-- 3. Favoris marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL,
  supplier_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_user_id, supplier_user_id)
);
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers manage own favorites" ON public.marketplace_favorites
  FOR ALL USING (auth.uid() = buyer_user_id) WITH CHECK (auth.uid() = buyer_user_id);

CREATE POLICY "Suppliers see who favorited them" ON public.marketplace_favorites
  FOR SELECT USING (auth.uid() = supplier_user_id);

-- 4. Commandes marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  buyer_user_id uuid NOT NULL,
  supplier_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'quote_request',
  -- quote_request | quote_sent | confirmed | shipped | delivered | cancelled | rejected
  order_type text NOT NULL DEFAULT 'quote', -- quote | direct
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XAF',
  delivery_address text NOT NULL DEFAULT '',
  delivery_city text NOT NULL DEFAULT '',
  expected_delivery date,
  delivered_at timestamptz,
  buyer_notes text NOT NULL DEFAULT '',
  supplier_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view marketplace orders" ON public.marketplace_orders
  FOR SELECT USING (auth.uid() IN (buyer_user_id, supplier_user_id));

CREATE POLICY "Buyer creates marketplace orders" ON public.marketplace_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);

CREATE POLICY "Parties can update marketplace orders" ON public.marketplace_orders
  FOR UPDATE USING (auth.uid() IN (buyer_user_id, supplier_user_id));

CREATE POLICY "Buyer can delete pending order" ON public.marketplace_orders
  FOR DELETE USING (auth.uid() = buyer_user_id AND status IN ('quote_request', 'cancelled'));

CREATE TRIGGER trg_marketplace_orders_updated
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Lignes de commande marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view order items" ON public.marketplace_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders o
            WHERE o.id = order_id AND auth.uid() IN (o.buyer_user_id, o.supplier_user_id))
  );

CREATE POLICY "Parties can manage order items" ON public.marketplace_order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders o
            WHERE o.id = order_id AND auth.uid() IN (o.buyer_user_id, o.supplier_user_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.marketplace_orders o
            WHERE o.id = order_id AND auth.uid() IN (o.buyer_user_id, o.supplier_user_id))
  );

-- 6. Messages liés à une commande marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view marketplace messages" ON public.marketplace_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders o
            WHERE o.id = order_id AND auth.uid() IN (o.buyer_user_id, o.supplier_user_id))
  );

CREATE POLICY "Parties can send marketplace messages" ON public.marketplace_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_user_id AND
    EXISTS (SELECT 1 FROM public.marketplace_orders o
            WHERE o.id = order_id AND auth.uid() IN (o.buyer_user_id, o.supplier_user_id))
  );

CREATE POLICY "Recipient can mark messages read" ON public.marketplace_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.marketplace_orders o
            WHERE o.id = order_id AND auth.uid() IN (o.buyer_user_id, o.supplier_user_id))
  );

-- 7. Fonctions
CREATE OR REPLACE FUNCTION public.generate_marketplace_order_number(_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE year_part TEXT := to_char(now(), 'YYYY'); next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^MO-' || year_part || '-', ''), '')::INTEGER), 0) + 1
  INTO next_seq FROM public.marketplace_orders
  WHERE buyer_user_id = _user_id AND number LIKE 'MO-' || year_part || '-%';
  RETURN 'MO-' || year_part || '-' || lpad(next_seq::TEXT, 4, '0');
END;$$;

-- Liste publique des fournisseurs (avec filtres optionnels)
CREATE OR REPLACE FUNCTION public.get_public_suppliers(
  _search text DEFAULT NULL,
  _city text DEFAULT NULL,
  _country text DEFAULT NULL,
  _category text DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  company_name text,
  full_name text,
  city text,
  country text,
  phone text,
  email text,
  description text,
  categories text[],
  delivery_zones text[],
  min_order numeric,
  rating numeric,
  orders_count integer,
  product_count bigint,
  logo_url text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.user_id,
    p.company_name,
    p.full_name,
    p.city,
    p.country,
    p.phone,
    p.email,
    p.supplier_description,
    p.supplier_categories,
    p.supplier_delivery_zones,
    p.supplier_min_order,
    p.supplier_rating,
    p.supplier_orders_count,
    (SELECT COUNT(*) FROM public.products pr WHERE pr.user_id = p.user_id AND pr.is_public = true),
    p.logo_url
  FROM public.profiles p
  WHERE p.is_public_supplier = true
    AND p.user_id <> auth.uid()
    AND (_search IS NULL OR _search = '' OR
         p.company_name ILIKE '%' || _search || '%' OR
         p.full_name ILIKE '%' || _search || '%' OR
         p.supplier_description ILIKE '%' || _search || '%')
    AND (_city IS NULL OR _city = '' OR p.city ILIKE '%' || _city || '%')
    AND (_country IS NULL OR _country = '' OR p.country ILIKE '%' || _country || '%')
    AND (_category IS NULL OR _category = '' OR _category = ANY(p.supplier_categories))
  ORDER BY p.supplier_rating DESC, p.supplier_orders_count DESC, p.company_name;
$$;

-- Catalogue public d'un fournisseur donné
CREATE OR REPLACE FUNCTION public.get_supplier_public_catalog(_supplier_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  category text,
  unit text,
  unit_price numeric,
  wholesale_price numeric,
  show_public_price boolean,
  sku text,
  barcode text,
  in_stock boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    pr.id, pr.name, pr.description, pr.category, pr.unit,
    pr.unit_price, pr.wholesale_price, pr.show_public_price,
    pr.sku, pr.barcode,
    (pr.quantity_in_stock > 0) AS in_stock
  FROM public.products pr
  INNER JOIN public.profiles p ON p.user_id = pr.user_id
  WHERE pr.user_id = _supplier_user_id
    AND pr.is_public = true
    AND p.is_public_supplier = true
  ORDER BY pr.name;
$$;

-- Fournisseurs recommandés (basé sur catégories de produits du boutiquier)
CREATE OR REPLACE FUNCTION public.get_recommended_suppliers()
RETURNS TABLE(
  user_id uuid,
  company_name text,
  city text,
  country text,
  description text,
  categories text[],
  rating numeric,
  match_score bigint,
  logo_url text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH my_categories AS (
    SELECT DISTINCT category FROM public.products
    WHERE user_id = auth.uid() AND category IS NOT NULL AND category <> ''
  ),
  my_city AS (
    SELECT city, country FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
  )
  SELECT
    p.user_id, p.company_name, p.city, p.country,
    p.supplier_description, p.supplier_categories, p.supplier_rating,
    (
      (SELECT COUNT(*) FROM unnest(p.supplier_categories) c
       WHERE c IN (SELECT category FROM my_categories))
      + CASE WHEN p.city = (SELECT city FROM my_city) THEN 2 ELSE 0 END
      + CASE WHEN p.country = (SELECT country FROM my_city) THEN 1 ELSE 0 END
    )::bigint AS match_score,
    p.logo_url
  FROM public.profiles p
  WHERE p.is_public_supplier = true
    AND p.user_id <> auth.uid()
  ORDER BY match_score DESC, p.supplier_rating DESC
  LIMIT 6;
$$;

-- Notification automatique lors d'une nouvelle commande marketplace
CREATE OR REPLACE FUNCTION public.notify_marketplace_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  buyer_name text;
  supplier_name text;
  notif_user uuid;
  notif_title text;
  notif_msg text;
BEGIN
  SELECT COALESCE(NULLIF(company_name,''), email) INTO buyer_name
    FROM public.profiles WHERE user_id = NEW.buyer_user_id LIMIT 1;
  SELECT COALESCE(NULLIF(company_name,''), email) INTO supplier_name
    FROM public.profiles WHERE user_id = NEW.supplier_user_id LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    notif_user := NEW.supplier_user_id;
    notif_title := 'Nouvelle demande — ' || NEW.number;
    notif_msg := COALESCE(buyer_name,'Un client') || ' a envoyé une ' ||
                 CASE NEW.order_type WHEN 'quote' THEN 'demande de devis' ELSE 'commande directe' END;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    -- Notify the other party
    IF auth.uid() = NEW.supplier_user_id THEN
      notif_user := NEW.buyer_user_id;
    ELSE
      notif_user := NEW.supplier_user_id;
    END IF;
    notif_title := 'Commande ' || NEW.number || ' — ' ||
      CASE NEW.status
        WHEN 'quote_sent' THEN 'Devis reçu'
        WHEN 'confirmed' THEN 'Commande confirmée'
        WHEN 'shipped' THEN 'Expédiée'
        WHEN 'delivered' THEN 'Livrée'
        WHEN 'cancelled' THEN 'Annulée'
        WHEN 'rejected' THEN 'Refusée'
        ELSE NEW.status
      END;
    notif_msg := 'Statut mis à jour';

    -- Increment supplier orders count when delivered
    IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
      UPDATE public.profiles
        SET supplier_orders_count = supplier_orders_count + 1
        WHERE user_id = NEW.supplier_user_id;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF notif_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (notif_user, notif_title, notif_msg, 'marketplace_order',
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.number, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_marketplace_order_notify ON public.marketplace_orders;
CREATE TRIGGER trg_marketplace_order_notify
  AFTER INSERT OR UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_marketplace_order();

-- Notification message marketplace
CREATE OR REPLACE FUNCTION public.notify_marketplace_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o RECORD;
  recipient uuid;
  sender_name text;
BEGIN
  SELECT * INTO o FROM public.marketplace_orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  recipient := CASE WHEN NEW.sender_user_id = o.buyer_user_id THEN o.supplier_user_id ELSE o.buyer_user_id END;
  SELECT COALESCE(NULLIF(company_name,''), email) INTO sender_name
    FROM public.profiles WHERE user_id = NEW.sender_user_id LIMIT 1;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (recipient, 'Message — ' || o.number,
          COALESCE(sender_name,'Un partenaire') || ' : ' || left(NEW.content, 80),
          'marketplace_message',
          jsonb_build_object('order_id', o.id, 'order_number', o.number));
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_marketplace_message_notify ON public.marketplace_messages;
CREATE TRIGGER trg_marketplace_message_notify
  AFTER INSERT ON public.marketplace_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_marketplace_message();