-- Remove insecure shared_documents_view (exposed all shared docs to authenticated users)
DROP VIEW IF EXISTS public.shared_documents_view;

-- Create SECURITY DEFINER RPC that returns a document only when the caller knows the exact share token
CREATE OR REPLACE FUNCTION public.get_document_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc RECORD;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_doc FROM public.documents
  WHERE share_token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_doc.id,
    'number', v_doc.number,
    'type', v_doc.type,
    'status', v_doc.status,
    'date', v_doc.date,
    'due_date', v_doc.due_date,
    'subject', v_doc.subject,
    'client_name', v_doc.client_name,
    'client_email', v_doc.client_email,
    'client_phone', v_doc.client_phone,
    'client_address', v_doc.client_address,
    'company_name', v_doc.company_name,
    'company_email', v_doc.company_email,
    'company_phone', v_doc.company_phone,
    'company_address', v_doc.company_address,
    'company_logo', v_doc.company_logo,
    'company_logo_position', v_doc.company_logo_position,
    'company_currency', v_doc.company_currency,
    'company_signatory_title', v_doc.company_signatory_title,
    'company_iban', v_doc.company_iban,
    'company_bic', v_doc.company_bic,
    'company_bank_name', v_doc.company_bank_name,
    'company_brand_colors', v_doc.company_brand_colors,
    'company_custom_note', v_doc.company_custom_note,
    'company_description', v_doc.company_description,
    'company_document_template', v_doc.company_document_template,
    'items', v_doc.items,
    'subtotal', v_doc.subtotal,
    'labor_cost', v_doc.labor_cost,
    'tax_rate', v_doc.tax_rate,
    'tax_amount', v_doc.tax_amount,
    'withholding_rate', v_doc.withholding_rate,
    'withholding_amount', v_doc.withholding_amount,
    'total', v_doc.total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_document_by_token(text) TO anon, authenticated;