
-- Rate limiting table for access code attempts
CREATE TABLE public.access_code_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_code_attempts ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) can insert/read attempts
-- No public access policies needed

-- Index for efficient cleanup and lookup
CREATE INDEX idx_access_code_attempts_ip_time ON public.access_code_attempts (ip_hash, attempted_at);

-- Auto-cleanup old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.access_code_attempts WHERE attempted_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_attempts_trigger
AFTER INSERT ON public.access_code_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_attempts();
