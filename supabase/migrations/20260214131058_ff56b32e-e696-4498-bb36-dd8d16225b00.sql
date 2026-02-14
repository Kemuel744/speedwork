
-- Create documents table for invoices and quotes
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'unpaid', 'paid')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subject TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT DEFAULT '',
  company_address TEXT DEFAULT '',
  company_logo TEXT,
  company_logo_position TEXT DEFAULT 'left',
  company_iban TEXT DEFAULT '',
  company_bic TEXT DEFAULT '',
  company_bank_name TEXT DEFAULT '',
  company_currency TEXT DEFAULT 'XOF',
  company_signatory_title TEXT DEFAULT 'Le Directeur Général',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  withholding_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  withholding_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create invoice_reminders table
CREATE TABLE public.invoice_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_type TEXT NOT NULL DEFAULT 'auto' CHECK (reminder_type IN ('auto', 'manual')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  message TEXT
);

ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.invoice_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.invoice_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get overdue invoices (unpaid, due_date > 7 days ago)
CREATE OR REPLACE FUNCTION public.get_overdue_invoices()
RETURNS TABLE (
  document_id UUID,
  user_id UUID,
  number TEXT,
  client_name TEXT,
  client_email TEXT,
  total NUMERIC,
  due_date DATE,
  days_overdue INTEGER,
  company_currency TEXT,
  last_reminder TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    d.id as document_id,
    d.user_id,
    d.number,
    d.client_name,
    d.client_email,
    d.total,
    d.due_date,
    (CURRENT_DATE - d.due_date)::INTEGER as days_overdue,
    d.company_currency,
    (SELECT MAX(r.sent_at) FROM invoice_reminders r WHERE r.document_id = d.id) as last_reminder
  FROM documents d
  WHERE d.type = 'invoice'
    AND d.status IN ('unpaid', 'pending')
    AND d.due_date IS NOT NULL
    AND d.due_date < CURRENT_DATE - INTERVAL '7 days'
    AND (
      NOT EXISTS (SELECT 1 FROM invoice_reminders r WHERE r.document_id = d.id)
      OR (SELECT MAX(r.sent_at) FROM invoice_reminders r WHERE r.document_id = d.id) < now() - INTERVAL '7 days'
    )
$$;
