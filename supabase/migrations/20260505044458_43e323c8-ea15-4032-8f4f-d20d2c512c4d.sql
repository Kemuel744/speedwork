-- 1) Realtime: remove the broad public:* wildcard subscription allowance.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to own topic" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can receive own realtime events" ON realtime.messages;

CREATE POLICY "Users can subscribe only to private realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
);

-- 2) Storage: allow managers to read only worker photos referenced by their own worker records.
DROP POLICY IF EXISTS "Managers can view worker photos" ON storage.objects;

CREATE POLICY "Managers can view worker photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'worker-photos'
  AND EXISTS (
    SELECT 1
    FROM public.workers w
    WHERE w.user_id = auth.uid()
      AND w.photo_url IS NOT NULL
      AND w.photo_url <> ''
      AND (
        w.photo_url = storage.objects.name
        OR w.photo_url LIKE ('%' || storage.objects.name)
      )
  )
);

-- 3) Documents: remove anonymous/authenticated access to the legacy shared document view.
REVOKE ALL ON public.shared_documents_view FROM anon, authenticated;

-- 4) SECURITY DEFINER: revoke anonymous execution from functions that are not intended for anonymous use.
REVOKE EXECUTE ON FUNCTION public.admin_get_subscriptions() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_clients_overview() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_sale(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_cash_session(uuid, numeric, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_credit_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_marketplace_order_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_po_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_return_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_session_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_transfer_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_contacts() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_subscription() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_member_profiles() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_overdue_invoices() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pnl(date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_recommended_suppliers() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_savings_summary(date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vat_summary(date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.receive_stock_transfer(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.same_org(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_employee_pin(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_employee_pin(text) FROM anon, PUBLIC;

-- Keep intentional public RPCs callable because they expose only token- or public-catalog-scoped data.
GRANT EXECUTE ON FUNCTION public.get_purchase_order_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_suppliers(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_public_catalog(uuid) TO anon, authenticated;