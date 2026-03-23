
CREATE OR REPLACE FUNCTION public.notify_new_client()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  msg_content TEXT;
BEGIN
  msg_content := E'Nouveau client inscrit\n\n' ||
    'Nom : ' || COALESCE(NULLIF(NEW.full_name, ''), 'Non renseigné') || E'\n' ||
    'Entreprise : ' || COALESCE(NULLIF(NEW.company_name, ''), 'Non renseigné') || E'\n' ||
    'Email : ' || COALESCE(NEW.email, '') || E'\n' ||
    'Téléphone : ' || COALESCE(NEW.phone, 'Non renseigné') || E'\n' ||
    'Pays : ' || COALESCE(NULLIF(NEW.country, ''), 'Non renseigné') || E'\n' ||
    'Ville : ' || COALESCE(NULLIF(NEW.city, ''), 'Non renseigné') || E'\n' ||
    'Adresse : ' || COALESCE(NULLIF(NEW.address, ''), 'Non renseigné') || E'\n' ||
    'Type de compte : ' || CASE NEW.account_type
      WHEN 'enterprise' THEN 'Entreprise'
      WHEN 'freelance' THEN 'Freelance'
      WHEN 'pme' THEN 'PME/Startup'
      WHEN 'ong' THEN 'Organisation/ONG'
      ELSE NEW.account_type
    END || E'\n' ||
    'Secteur : ' || COALESCE(NULLIF(NEW.sector, ''), 'Non renseigné') || E'\n' ||
    'Nombre d''employés : ' || COALESCE(NULLIF(NEW.employee_count, ''), 'Non renseigné') || E'\n' ||
    'Site web : ' || COALESCE(NULLIF(NEW.website, ''), 'Non renseigné') || E'\n' ||
    'Profession : ' || COALESCE(NULLIF(NEW.profession, ''), 'Non renseigné') || E'\n' ||
    'Expérience : ' || COALESCE(NULLIF(NEW.experience_years, ''), 'Non renseigné') || E'\n' ||
    'Compétences : ' || COALESCE(NULLIF(NEW.skills, ''), 'Non renseigné') || E'\n' ||
    'Disponibilité : ' || COALESCE(NULLIF(NEW.availability, ''), 'Non renseigné');

  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Notification
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

    -- Message interne dans la messagerie
    INSERT INTO public.messages (sender_id, receiver_id, subject, content, message_type)
    VALUES (
      NEW.user_id,
      admin_record.user_id,
      'Nouvelle inscription — ' || COALESCE(NULLIF(NEW.company_name, ''), NULLIF(NEW.full_name, ''), NEW.email),
      msg_content,
      'formal'
    );
  END LOOP;
  RETURN NEW;
END;
$function$;
