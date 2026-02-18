
-- Add share_token column to documents
ALTER TABLE public.documents ADD COLUMN share_token TEXT UNIQUE;

-- Create index for fast lookup
CREATE INDEX idx_documents_share_token ON public.documents (share_token) WHERE share_token IS NOT NULL;

-- Allow public (anon) read access to documents via share_token
CREATE POLICY "Anyone can view shared documents via token"
ON public.documents
FOR SELECT
USING (share_token IS NOT NULL AND share_token != '');
