
-- Add email column to workers table
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS email text DEFAULT '';

-- Create function to auto-link worker when a new user signs up with matching email
CREATE OR REPLACE FUNCTION public.auto_link_worker_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a new user is created, check if there's a worker with matching email
  UPDATE public.workers
  SET linked_user_id = NEW.id
  WHERE email = NEW.email
    AND linked_user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (created by handle_new_user trigger on auth.users)
DROP TRIGGER IF EXISTS trg_auto_link_worker ON public.profiles;
CREATE TRIGGER trg_auto_link_worker
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_worker_on_signup();
