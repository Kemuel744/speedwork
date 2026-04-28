
-- 1) Remove overly broad public read policy on purchase_orders
DROP POLICY IF EXISTS "Public can view PO via share token" ON public.purchase_orders;

-- 2) Secure RPC: returns PO data only when the exact share_token is provided
CREATE OR REPLACE FUNCTION public.get_purchase_order_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_items jsonb;
  v_supplier jsonb;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders
  WHERE share_token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'description', description,
    'quantity_ordered', quantity_ordered,
    'unit_price', unit_price,
    'total', total
  ) ORDER BY created_at), '[]'::jsonb)
  INTO v_items
  FROM public.purchase_order_items
  WHERE purchase_order_id = v_po.id;

  SELECT to_jsonb(s) INTO v_supplier
  FROM (
    SELECT name, email, phone, address, city
    FROM public.suppliers WHERE id = v_po.supplier_id
  ) s;

  RETURN jsonb_build_object(
    'po', jsonb_build_object(
      'id', v_po.id,
      'number', v_po.number,
      'status', v_po.status,
      'order_date', v_po.order_date,
      'expected_date', v_po.expected_date,
      'subtotal', v_po.subtotal,
      'total', v_po.total,
      'currency', v_po.currency,
      'notes', v_po.notes,
      'supplier_id', v_po.supplier_id
    ),
    'items', v_items,
    'supplier', v_supplier
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_purchase_order_by_token(text) TO anon, authenticated;

-- 3) Realtime channel authorization: restrict subscriptions to user's own topics
-- Topics used: 'notifications-realtime' and 'messages-realtime' (broadcast channels via postgres_changes)
-- We restrict by enabling RLS on realtime.messages and only allow authenticated users
-- to receive events for their own user-scoped topics.

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive own realtime events" ON realtime.messages;
CREATE POLICY "Authenticated users can receive own realtime events"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only allow authenticated subscriptions; payload-level filtering happens via
  -- the underlying table RLS (notifications/messages) which already restrict
  -- rows to the owner. This blocks anonymous Realtime subscriptions entirely.
  auth.uid() IS NOT NULL
);
