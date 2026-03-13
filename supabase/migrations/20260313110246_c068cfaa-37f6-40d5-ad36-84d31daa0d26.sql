
-- Replace the notify_new_client function to include all profile fields in notification
CREATE OR REPLACE FUNCTION public.notify_new_client()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  -- Send notification to all admins with full client details
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      admin_record.user_id,
      'Nouveau client inscrit',
      'Un nouveau client s''est inscrit : ' || COALESCE(NULLIF(NEW.company_name, ''), NULLIF(NEW.full_name, ''), NEW.email),
      'new_client',
      jsonb_build_object(
        'client_user_id', NEW.user_id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'company_name', NEW.company_name,
        'phone', NEW.phone,
        'country', NEW.country,
        'city', NEW.city,
        'address', NEW.address,
        'account_type', NEW.account_type,
        'sector', NEW.sector,
        'employee_count', NEW.employee_count,
        'website', NEW.website,
        'profession', NEW.profession,
        'experience_years', NEW.experience_years,
        'skills', NEW.skills,
        'availability', NEW.availability
      )
    );
  END LOOP;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if any and recreate on UPDATE so we capture enriched profile
DROP TRIGGER IF EXISTS on_new_client ON public.profiles;
DROP TRIGGER IF EXISTS on_client_profile_enriched ON public.profiles;

-- Trigger on INSERT (basic info from handle_new_user)
CREATE TRIGGER on_new_client
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_client();

-- Also trigger on UPDATE when account_type changes from default (profile enrichment after registration)
CREATE OR REPLACE FUNCTION public.notify_client_profile_updated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  -- Only notify when account_type changes from the default (meaning the user just completed registration)
  IF OLD.account_type = 'enterprise' AND OLD.full_name = '' AND NEW.full_name != '' THEN
    -- Delete the initial sparse notification
    DELETE FROM public.notifications 
    WHERE type = 'new_client' 
    AND (metadata->>'client_user_id')::text = NEW.user_id::text
    AND (metadata->>'full_name' IS NULL OR metadata->>'full_name' = '');

    FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, metadata)
      VALUES (
        admin_record.user_id,
        'Nouveau client inscrit',
        COALESCE(NULLIF(NEW.company_name, ''), NULLIF(NEW.full_name, ''), NEW.email) || ' — ' || 
        CASE NEW.account_type
          WHEN 'enterprise' THEN 'Entreprise'
          WHEN 'freelance' THEN 'Freelance'
          WHEN 'pme' THEN 'PME/Startup'
          WHEN 'ong' THEN 'Organisation/ONG'
          ELSE NEW.account_type
        END,
        'new_client',
        jsonb_build_object(
          'client_user_id', NEW.user_id,
          'email', NEW.email,
          'full_name', NEW.full_name,
          'company_name', NEW.company_name,
          'phone', NEW.phone,
          'country', NEW.country,
          'city', NEW.city,
          'address', NEW.address,
          'account_type', NEW.account_type,
          'sector', NEW.sector,
          'employee_count', NEW.employee_count,
          'website', NEW.website,
          'profession', NEW.profession,
          'experience_years', NEW.experience_years,
          'skills', NEW.skills,
          'availability', NEW.availability
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_client_profile_enriched
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_profile_updated();
