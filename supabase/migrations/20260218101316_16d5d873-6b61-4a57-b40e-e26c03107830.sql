
-- Table for field reports
CREATE TABLE public.field_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  intervention_location text DEFAULT '',
  intervention_date date NOT NULL DEFAULT CURRENT_DATE,
  reporter_name text DEFAULT '',
  reporter_position text DEFAULT '',
  workers jsonb NOT NULL DEFAULT '[]',
  observations text DEFAULT '',
  recommendations text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.field_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own field reports" ON public.field_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own field reports" ON public.field_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own field reports" ON public.field_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own field reports" ON public.field_reports FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_field_reports_updated_at BEFORE UPDATE ON public.field_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_field_reports_user_id ON public.field_reports(user_id);

-- Table for report images with comments
CREATE TABLE public.field_report_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.field_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.field_report_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report images" ON public.field_report_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own report images" ON public.field_report_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own report images" ON public.field_report_images FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for report images
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);

CREATE POLICY "Users can upload report images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view report images" ON storage.objects FOR SELECT USING (bucket_id = 'report-images');
CREATE POLICY "Users can delete their report images" ON storage.objects FOR DELETE USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
