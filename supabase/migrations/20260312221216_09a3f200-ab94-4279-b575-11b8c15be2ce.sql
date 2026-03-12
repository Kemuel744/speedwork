
-- Add new fields to missions table for Module 2
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS estimated_duration_hours NUMERIC NOT NULL DEFAULT 1;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normale';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS assigned_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS mission_date DATE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_missions_assigned_team ON public.missions(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_missions_assigned_worker ON public.missions(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_missions_priority ON public.missions(priority);
