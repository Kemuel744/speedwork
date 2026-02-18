-- Create trigger to notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT COALESCE(NULLIF(company_name, ''), email) INTO sender_name
  FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    NEW.receiver_id,
    'Nouveau message',
    COALESCE(sender_name, 'Quelqu''un') || ' vous a envoyé un message' || 
      CASE WHEN NEW.message_type = 'formal' AND NEW.subject != '' THEN ' : ' || NEW.subject ELSE '' END,
    'new_message',
    jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id, 'message_type', NEW.message_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();
