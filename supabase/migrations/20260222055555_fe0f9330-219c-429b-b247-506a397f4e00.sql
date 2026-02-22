
-- Table for learning resources
CREATE TABLE public.learning_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'youtube', -- youtube, article, link
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Authenticated users can view resources"
ON public.learning_resources FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert resources"
ON public.learning_resources FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update resources"
ON public.learning_resources FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete resources"
ON public.learning_resources FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_learning_resources_updated_at
BEFORE UPDATE ON public.learning_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger when admin adds a resource
CREATE OR REPLACE FUNCTION public.notify_new_learning_resource()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Notify all non-admin users
  FOR user_record IN 
    SELECT DISTINCT p.user_id FROM public.profiles p
    WHERE p.user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      user_record.user_id,
      'Nouveau contenu d''apprentissage',
      'Un nouveau contenu a été ajouté : ' || NEW.title,
      'learning_resource',
      jsonb_build_object('resource_id', NEW.id, 'resource_type', NEW.resource_type, 'title', NEW.title)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_learning_resource
AFTER INSERT ON public.learning_resources
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_learning_resource();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_resources;
