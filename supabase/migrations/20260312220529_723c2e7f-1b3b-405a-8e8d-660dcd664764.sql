
-- Create storage bucket for worker photos
INSERT INTO storage.buckets (id, name, public) VALUES ('worker-photos', 'worker-photos', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for worker-photos bucket
CREATE POLICY "Users can upload worker photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'worker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own worker photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'worker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own worker photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'worker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view worker photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'worker-photos');
