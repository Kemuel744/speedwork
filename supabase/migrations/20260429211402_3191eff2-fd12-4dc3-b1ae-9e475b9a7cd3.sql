CREATE OR REPLACE FUNCTION public.get_admin_clients_overview()
 RETURNS TABLE(user_id uuid, email text, full_name text, company_name text, phone text, country text, city text, account_type text, created_at timestamp with time zone, current_plan text, subscription_status text, subscription_end timestamp with time zone, pos_revenue numeric, pos_sales_count bigint, invoiced_revenue numeric, invoices_count bigint, paid_invoices_revenue numeric, total_revenue numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH latest_sub AS (
    SELECT DISTINCT ON (s.user_id)
      s.user_id     AS sub_user_id,
      s.plan::text  AS plan,
      s.status::text AS status,
      s.end_date    AS end_date
    FROM public.subscriptions s
    ORDER BY s.user_id, s.created_at DESC
  ),
  pos AS (
    SELECT sa.user_id AS pos_user_id,
           COALESCE(SUM(sa.total), 0) AS revenue,
           COUNT(*)::bigint AS cnt
    FROM public.sales sa
    WHERE sa.status = 'completed'
    GROUP BY sa.user_id
  ),
  invs AS (
    SELECT d.user_id AS inv_user_id,
           COALESCE(SUM(d.total), 0) AS revenue,
           COUNT(*)::bigint AS cnt,
           COALESCE(SUM(CASE WHEN d.status = 'paid' THEN d.total ELSE 0 END), 0) AS paid_revenue
    FROM public.documents d
    WHERE d.type = 'invoice'
    GROUP BY d.user_id
  )
  SELECT
    p.user_id,
    p.email,
    p.full_name,
    p.company_name,
    p.phone,
    p.country,
    p.city,
    p.account_type,
    p.created_at,
    ls.plan,
    ls.status,
    ls.end_date,
    COALESCE(pos.revenue, 0)        AS pos_revenue,
    COALESCE(pos.cnt, 0)            AS pos_sales_count,
    COALESCE(invs.revenue, 0)       AS invoiced_revenue,
    COALESCE(invs.cnt, 0)           AS invoices_count,
    COALESCE(invs.paid_revenue, 0)  AS paid_invoices_revenue,
    COALESCE(pos.revenue, 0) + COALESCE(invs.paid_revenue, 0) AS total_revenue
  FROM public.profiles p
  LEFT JOIN latest_sub ls ON ls.sub_user_id = p.user_id
  LEFT JOIN pos          ON pos.pos_user_id = p.user_id
  LEFT JOIN invs         ON invs.inv_user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;