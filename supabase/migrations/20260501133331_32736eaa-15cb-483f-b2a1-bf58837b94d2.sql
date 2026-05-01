
-- Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, then grant minimally.

-- 1) Trigger-only / internal helper functions: no direct callers
DO $$
DECLARE
  fn text;
  trigger_only text[] := ARRAY[
    'handle_new_user()',
    'auto_link_worker_on_signup()',
    'notify_new_message()',
    'notify_new_subscription()',
    'notify_new_client()',
    'notify_client_profile_updated()',
    'notify_new_learning_resource()',
    'notify_marketplace_message()',
    'notify_marketplace_order()',
    'cleanup_old_attempts()',
    'update_customer_balance_on_credit()',
    'apply_credit_payment()',
    'apply_loyalty_transaction()',
    'hash_employee_pin()',
    'enforce_depot_quota()'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_only LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 2) Helper / role-check functions: callable by authenticated (used in RLS & app)
DO $$
DECLARE
  fn text;
  authed_only text[] := ARRAY[
    'has_role(uuid, app_role)',
    'get_user_org_id(uuid)',
    'is_org_admin(uuid)',
    'same_org(uuid, uuid)',
    'get_admin_contacts()',
    'get_overdue_invoices()',
    'get_my_subscription()',
    'get_pnl(date, date)',
    'get_vat_summary(date, date)',
    'get_savings_summary(date, date)',
    'get_admin_clients_overview()',
    'get_recommended_suppliers()',
    'verify_employee_pin(text)',
    'set_employee_pin(uuid, text)',
    'validate_promo_code(text, numeric)',
    'cancel_sale(uuid, text)',
    'close_cash_session(uuid, numeric, text, text)',
    'receive_stock_transfer(text)',
    'generate_session_number(uuid)',
    'generate_return_number(uuid)',
    'generate_credit_number(uuid)',
    'generate_po_number(uuid)',
    'generate_transfer_number(uuid)',
    'generate_marketplace_order_number(uuid)',
    'generate_ean13(text)',
    'update_updated_at_column()'
  ];
BEGIN
  FOREACH fn IN ARRAY authed_only LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END $$;

-- 3) Public token-based functions: accessible to anon (intentional public surface)
DO $$
DECLARE
  fn text;
  public_funcs text[] := ARRAY[
    'get_purchase_order_by_token(text)',
    'get_supplier_public_catalog(uuid)',
    'get_public_suppliers(text, text, text, text)'
  ];
BEGIN
  FOREACH fn IN ARRAY public_funcs LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO anon, authenticated', fn);
  END LOOP;
END $$;
