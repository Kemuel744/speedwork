
-- Create a secure view for shared documents that excludes internal fields
CREATE VIEW public.shared_documents_view AS
SELECT 
  id, number, type, status, date, due_date, subject,
  client_name, client_email, client_phone, client_address,
  company_name, company_email, company_phone, company_address,
  company_logo, company_logo_position, company_currency,
  company_signatory_title, company_iban, company_bic, company_bank_name,
  company_brand_colors, company_custom_note, company_description,
  company_document_template,
  items, subtotal, labor_cost, tax_rate, tax_amount,
  withholding_rate, withholding_amount, total,
  share_token
FROM public.documents
WHERE share_token IS NOT NULL AND share_token != '';

-- Remove the overly broad shared documents RLS policy
DROP POLICY IF EXISTS "Anyone can view shared documents via token" ON public.documents;
