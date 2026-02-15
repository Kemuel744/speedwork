
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role inserts (from triggers)
CREATE POLICY "Service can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify on new profile (new client)
CREATE OR REPLACE FUNCTION public.notify_new_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Send notification to all admins
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      admin_record.user_id,
      'Nouveau client inscrit',
      'Un nouveau client s''est inscrit : ' || COALESCE(NEW.company_name, NEW.email),
      'new_client',
      jsonb_build_object('client_user_id', NEW.user_id, 'email', NEW.email, 'company_name', NEW.company_name)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_client_notify
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_client();

-- Trigger: notify on new subscription
CREATE OR REPLACE FUNCTION public.notify_new_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  client_email TEXT;
  client_name TEXT;
BEGIN
  SELECT email, company_name INTO client_email, client_name
  FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      admin_record.user_id,
      'Nouvel abonnement',
      COALESCE(client_name, client_email) || ' a souscrit un abonnement ' || NEW.plan || ' (' || NEW.amount || ' FCFA)',
      'new_subscription',
      jsonb_build_object('subscription_id', NEW.id, 'client_user_id', NEW.user_id, 'plan', NEW.plan, 'amount', NEW.amount)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_subscription_notify
AFTER INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_subscription();
