
CREATE OR REPLACE FUNCTION public.cancel_sale(_sale_id uuid, _reason text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_sale RECORD;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_session_open boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Lock the sale row to prevent concurrent cancellations (idempotence guard)
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = _sale_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vente introuvable');
  END IF;

  IF v_sale.status = 'cancelled' THEN
    -- Already cancelled: no-op, return success so retries are safe
    RETURN jsonb_build_object('success', true, 'already_cancelled', true, 'receipt_number', v_sale.receipt_number);
  END IF;

  -- 1) Restore stock for each line item
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_sale.items, '[]'::jsonb))
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::integer, 0);
    IF v_product_id IS NOT NULL AND v_qty > 0 THEN
      UPDATE public.products
        SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + v_qty,
            updated_at = now()
        WHERE id = v_product_id AND user_id = v_uid;

      INSERT INTO public.stock_movements (user_id, product_id, movement_type, quantity, reason)
      VALUES (v_uid, v_product_id, 'entry', v_qty,
              'Annulation vente ' || v_sale.receipt_number);
    END IF;
  END LOOP;

  -- 2) Cash adjustment if cash sale attached to an OPEN session
  IF v_sale.session_id IS NOT NULL
     AND COALESCE(v_sale.payment_method, 'cash') = 'cash'
     AND COALESCE(v_sale.total, 0) > 0 THEN
    SELECT (status = 'open') INTO v_session_open
      FROM public.cash_sessions WHERE id = v_sale.session_id AND user_id = v_uid;

    IF COALESCE(v_session_open, false) THEN
      INSERT INTO public.cash_movements (user_id, session_id, movement_type, amount, description)
      VALUES (v_uid, v_sale.session_id, 'expense', v_sale.total,
              'Ajustement annulation ' || v_sale.receipt_number ||
              CASE WHEN COALESCE(_reason,'') <> '' THEN ' — ' || _reason ELSE '' END);
    END IF;
  END IF;

  -- 3) Mark as cancelled (final step, inside same transaction)
  UPDATE public.sales
    SET status = 'cancelled',
        notes = CASE WHEN COALESCE(_reason,'') <> '' THEN 'Annulée : ' || _reason ELSE 'Annulée' END
    WHERE id = _sale_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_cancelled', false,
    'receipt_number', v_sale.receipt_number
  );
END;
$function$;
