
-- =============================================
-- MODULE 1: Gestion des équipes terrain
-- =============================================

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  leader_name text NOT NULL DEFAULT '',
  leader_phone text NOT NULL DEFAULT '',
  zone text NOT NULL DEFAULT '',
  site_name text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teams" ON public.teams FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members can view teams" ON public.teams FOR SELECT TO authenticated USING (same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all teams" ON public.teams FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own teams" ON public.teams FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  worker_name text NOT NULL,
  worker_phone text NOT NULL DEFAULT '',
  worker_role text NOT NULL DEFAULT 'ouvrier',
  is_leader boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can view members" ON public.team_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.user_id = auth.uid()));
CREATE POLICY "Org members can view team members" ON public.team_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND same_org(auth.uid(), teams.user_id)));
CREATE POLICY "Admins can view all members" ON public.team_members FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Team owners can add members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.user_id = auth.uid()));
CREATE POLICY "Team owners can update members" ON public.team_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.user_id = auth.uid()));
CREATE POLICY "Team owners can delete members" ON public.team_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.user_id = auth.uid()));

-- =============================================
-- MODULE 2: Tâches et Preuves de travail
-- =============================================

CREATE TABLE public.work_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  zone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  assigned_to text NOT NULL DEFAULT '',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.work_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Org members can view tasks" ON public.work_tasks FOR SELECT TO authenticated USING (same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all tasks" ON public.work_tasks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own tasks" ON public.work_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.work_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.work_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_work_tasks_updated_at BEFORE UPDATE ON public.work_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.work_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.work_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  latitude double precision,
  longitude double precision,
  completed_at timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proofs" ON public.work_proofs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Task owners can view proofs" ON public.work_proofs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.work_tasks WHERE work_tasks.id = work_proofs.task_id AND work_tasks.user_id = auth.uid()));
CREATE POLICY "Admins can view all proofs" ON public.work_proofs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own proofs" ON public.work_proofs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own proofs" ON public.work_proofs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- MODULE 5: Recrutement rapide
-- =============================================

CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  workers_needed integer NOT NULL DEFAULT 1,
  duration text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  salary_currency text NOT NULL DEFAULT 'XOF',
  location text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'open',
  deadline date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open missions" ON public.missions FOR SELECT TO authenticated USING (status = 'open' OR auth.uid() = user_id);
CREATE POLICY "Admins can view all missions" ON public.missions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own missions" ON public.missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.missions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own missions" ON public.missions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.mission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  applicant_name text NOT NULL,
  applicant_phone text NOT NULL DEFAULT '',
  applicant_email text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mission owners can view apps" ON public.mission_applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.missions WHERE missions.id = mission_applications.mission_id AND missions.user_id = auth.uid()));
CREATE POLICY "Users can view own apps" ON public.mission_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all apps" ON public.mission_applications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can apply" ON public.mission_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mission owners can update apps" ON public.mission_applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.missions WHERE missions.id = mission_applications.mission_id AND missions.user_id = auth.uid()));

-- =============================================
-- Storage bucket for work proofs photos
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('work-proofs', 'work-proofs', false);

CREATE POLICY "Users upload work proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'work-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users view own work proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'work-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own work proofs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'work-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins view all work proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'work-proofs' AND has_role(auth.uid(), 'admin'));
