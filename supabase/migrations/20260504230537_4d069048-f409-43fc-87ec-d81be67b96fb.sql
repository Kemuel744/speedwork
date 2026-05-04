-- 1. Remove user-controlled INSERT on subscriptions (only admins/edge funcs may create)
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.subscriptions;

-- 2. Add UPDATE policy for sales (owner-scoped)
CREATE POLICY "Users can update their own sales"
ON public.sales
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Lock down SECURITY DEFINER functions: revoke broad execute, grant only where needed
-- Admin-only functions: revoke from anon and authenticated (admins call via service role / RPC with internal role check still in place)
REVOKE EXECUTE ON FUNCTION public.admin_get_subscriptions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_clients_overview() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_clients_overview() TO authenticated;
-- (internal has_role check inside still enforces admin)

-- Trigger-only functions: revoke from anon/authenticated entirely
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_client() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_client_profile_updated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_learning_resource() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_marketplace_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_marketplace_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_loyalty_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_credit_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_customer_balance_on_credit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hash_employee_pin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_attempts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_link_worker_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_depot_quota() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Number generators (called from triggers / server-side): revoke from anon
REVOKE EXECUTE ON FUNCTION public.generate_po_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_transfer_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_credit_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_session_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_return_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_marketplace_order_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_ean13(text) FROM PUBLIC, anon;

-- Authenticated-only helpers: revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.same_org(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_contacts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_subscription() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_org_member_profiles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_recommended_suppliers() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_overdue_invoices() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pnl(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_vat_summary(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_savings_summary(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_employee_pin(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_employee_pin(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.close_cash_session(uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_sale(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.receive_stock_transfer(text) FROM PUBLIC, anon;