
-- 1. Create workers table (employee registry)
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT 'ouvrier',
  base_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  photo_url TEXT,
  contract_type TEXT NOT NULL DEFAULT 'journalier',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for workers
CREATE POLICY "Users can view own workers" ON public.workers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all workers" ON public.workers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can view workers" ON public.workers FOR SELECT TO authenticated USING (same_org(auth.uid(), user_id));
CREATE POLICY "Users can create own workers" ON public.workers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workers" ON public.workers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workers" ON public.workers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Updated_at trigger for workers
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add new columns to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_type TEXT NOT NULL DEFAULT 'chantier';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS end_date DATE;

-- 6. Add worker_id reference to team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;

-- 7. Add workers to offline IndexedDB store list (index on user_id)
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON public.workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON public.workers(status);
