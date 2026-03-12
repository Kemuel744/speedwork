
-- Add proof_type (before/after) and mission_id to work_proofs
ALTER TABLE public.work_proofs 
  ADD COLUMN IF NOT EXISTS proof_type text NOT NULL DEFAULT 'after',
  ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL;

-- Add index for mission lookups
CREATE INDEX IF NOT EXISTS idx_work_proofs_mission_id ON public.work_proofs(mission_id);

-- Allow managers to view proofs linked to their missions
CREATE POLICY "Mission owners can view proofs" ON public.work_proofs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM missions WHERE missions.id = work_proofs.mission_id AND missions.user_id = auth.uid()
  ));
