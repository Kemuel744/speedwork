
-- Add trial tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN trial_start timestamp with time zone DEFAULT now(),
ADD COLUMN trial_docs_used integer DEFAULT 0;
