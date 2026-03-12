
-- Payroll records table: one record per worker per month
CREATE TABLE public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- manager who owns the workers
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- format: '2026-03'
  base_salary numeric NOT NULL DEFAULT 0,
  hours_worked numeric NOT NULL DEFAULT 0,
  days_worked integer NOT NULL DEFAULT 0,
  days_absent integer NOT NULL DEFAULT 0,
  late_count integer NOT NULL DEFAULT 0,
  missions_completed integer NOT NULL DEFAULT 0,
  mission_bonus numeric NOT NULL DEFAULT 0,
  performance_bonus numeric NOT NULL DEFAULT 0,
  late_penalty numeric NOT NULL DEFAULT 0,
  absence_penalty numeric NOT NULL DEFAULT 0,
  gross_salary numeric NOT NULL DEFAULT 0,
  net_salary numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft', -- draft, validated, paid
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(worker_id, month_year)
);

-- RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payroll" ON public.payroll
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payroll" ON public.payroll
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payroll" ON public.payroll
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payroll" ON public.payroll
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payroll" ON public.payroll
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Workers can view their own payroll
CREATE POLICY "Workers can view own payroll" ON public.payroll
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM workers w WHERE w.id = payroll.worker_id AND w.linked_user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_payroll_worker_month ON public.payroll(worker_id, month_year);
CREATE INDEX idx_payroll_user_month ON public.payroll(user_id, month_year);

-- Updated_at trigger
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
