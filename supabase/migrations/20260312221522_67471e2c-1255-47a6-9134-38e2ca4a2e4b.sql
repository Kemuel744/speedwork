
-- 1. Add linked_user_id to workers so a worker can log in and see their dashboard
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS linked_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_workers_linked_user ON public.workers(linked_user_id);

-- 2. RLS: workers can view their own linked profile
CREATE POLICY "Workers can view own linked profile" ON public.workers FOR SELECT TO authenticated USING (linked_user_id = auth.uid());

-- 3. Create time_entries table for pointage (clock-in/break/clock-out)
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'arrival',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- entry_type values: 'arrival', 'break_start', 'break_end', 'departure'

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Workers can manage their own time entries
CREATE POLICY "Users can view own time entries" ON public.time_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own time entries" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Managers can view time entries for their workers
CREATE POLICY "Managers can view worker time entries" ON public.time_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workers w WHERE w.id = time_entries.worker_id AND w.user_id = auth.uid()
  ));
-- Admins can view all
CREATE POLICY "Admins can view all time entries" ON public.time_entries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_time_entries_worker ON public.time_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_mission ON public.time_entries(mission_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(timestamp);

-- 4. Also allow workers to view missions assigned to them
CREATE POLICY "Workers can view assigned missions" ON public.missions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workers w WHERE w.id = missions.assigned_worker_id AND w.linked_user_id = auth.uid()
  ));

-- 5. Workers can view teams they belong to
CREATE POLICY "Workers can view their teams" ON public.teams FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.workers w ON w.id = tm.worker_id
    WHERE tm.team_id = teams.id AND w.linked_user_id = auth.uid()
  ));

-- 6. Workers can view their team members
CREATE POLICY "Workers can view their team members" ON public.team_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members my_tm
    JOIN public.workers w ON w.id = my_tm.worker_id
    WHERE my_tm.team_id = team_members.team_id AND w.linked_user_id = auth.uid()
  ));
