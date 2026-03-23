
CREATE OR REPLACE FUNCTION public.notify_new_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  client_email TEXT;
  client_name TEXT;
  client_phone TEXT;
  msg_content TEXT;
  plan_label TEXT;
BEGIN
  SELECT email, company_name, phone INTO client_email, client_name, client_phone
  FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  plan_label := CASE NEW.plan::text
    WHEN 'monthly' THEN 'Mensuel (5 000 FCFA)'
    WHEN 'annual' THEN 'Annuel (36 000 FCFA)'
    WHEN 'enterprise' THEN 'Entreprise (15 000 FCFA/mois)'
    ELSE NEW.plan::text
  END;

  msg_content := E'Nouvel abonnement activé\n\n' ||
    'Client : ' || COALESCE(client_name, 'Non renseigné') || E'\n' ||
    'Email : ' || COALESCE(client_email, '') || E'\n' ||
    'Téléphone : ' || COALESCE(client_phone, 'Non renseigné') || E'\n' ||
    'Plan : ' || plan_label || E'\n' ||
    'Montant : ' || NEW.amount || E' FCFA\n' ||
    'Méthode de paiement : ' || NEW.payment_method::text || E'\n' ||
    'Code d''accès : ' || NEW.access_code || E'\n' ||
    'Date de début : ' || to_char(NEW.start_date, 'DD/MM/YYYY') || E'\n' ||
    'Date d''expiration : ' || to_char(NEW.end_date, 'DD/MM/YYYY') || E'\n' ||
    'Statut : ' || NEW.status::text;

  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Notification
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      admin_record.user_id,
      'Nouvel abonnement',
      COALESCE(client_name, client_email) || ' a souscrit un abonnement ' || NEW.plan::text || ' (' || NEW.amount || ' FCFA)',
      'new_subscription',
      jsonb_build_object('subscription_id', NEW.id, 'client_user_id', NEW.user_id, 'plan', NEW.plan, 'amount', NEW.amount)
    );

    -- Message interne dans la messagerie
    INSERT INTO public.messages (sender_id, receiver_id, subject, content, message_type)
    VALUES (
      NEW.user_id,
      admin_record.user_id,
      'Nouvel abonnement — ' || plan_label || ' — ' || COALESCE(client_name, client_email),
      msg_content,
      'formal'
    );
  END LOOP;
  RETURN NEW;
END;
$function$;
