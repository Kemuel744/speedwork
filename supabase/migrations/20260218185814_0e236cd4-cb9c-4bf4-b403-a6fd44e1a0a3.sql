
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS company_brand_colors jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_document_template text DEFAULT 'moderne',
  ADD COLUMN IF NOT EXISTS company_custom_note text DEFAULT '';
