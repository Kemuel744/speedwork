-- Server-side enforcement of the depot/warehouse quota per subscription plan.
-- This guards against ANY future page that inserts/updates the locations table.

CREATE OR REPLACE FUNCTION public.enforce_depot_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan        text;
  v_max_depots  integer;
  v_current     integer;
  v_is_admin    boolean;
BEGIN
  -- Only applies to depot/warehouse rows. Shops are unlimited.
  IF NEW.location_type NOT IN ('depot', 'warehouse') THEN
    RETURN NEW;
  END IF;

  -- On UPDATE: skip if the row was already a depot/warehouse (no new depot created).
  IF TG_OP = 'UPDATE' AND OLD.location_type IN ('depot', 'warehouse') THEN
    RETURN NEW;
  END IF;

  -- Admins bypass quotas.
  SELECT public.has_role(NEW.user_id, 'admin'::app_role) INTO v_is_admin;
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Resolve the user's active plan (defaults to 'monthly' / Starter).
  SELECT plan
    INTO v_plan
    FROM public.subscriptions
   WHERE user_id = NEW.user_id
     AND status = 'active'
   ORDER BY created_at DESC
   LIMIT 1;

  v_plan := COALESCE(v_plan, 'monthly');

  -- Quota matrix mirrors src/lib/planLimits.ts (NULL = unlimited).
  v_max_depots := CASE v_plan
    WHEN 'monthly'    THEN 0
    WHEN 'annual'     THEN 1
    WHEN 'enterprise' THEN NULL
    ELSE 0
  END;

  IF v_max_depots IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO v_current
    FROM public.locations
   WHERE user_id = NEW.user_id
     AND location_type IN ('depot', 'warehouse');

  IF v_current >= v_max_depots THEN
    RAISE EXCEPTION 'Limite du plan % atteinte : % dépôt(s) maximum. Mettez à niveau votre abonnement pour en ajouter davantage.',
      v_plan, v_max_depots
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_depot_quota ON public.locations;
CREATE TRIGGER trg_enforce_depot_quota
BEFORE INSERT OR UPDATE OF location_type ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_depot_quota();