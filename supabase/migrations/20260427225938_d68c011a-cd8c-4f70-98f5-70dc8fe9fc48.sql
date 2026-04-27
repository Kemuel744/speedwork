-- Table de configuration des reçus thermiques 80mm
CREATE TABLE public.receipt_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- Apparence
  paper_width_mm INTEGER NOT NULL DEFAULT 80 CHECK (paper_width_mm IN (58, 80)),
  font_size_pt INTEGER NOT NULL DEFAULT 11 CHECK (font_size_pt BETWEEN 8 AND 16),
  font_family TEXT NOT NULL DEFAULT 'monospace',
  show_logo BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT DEFAULT '',
  -- En-tête
  header_business_name TEXT NOT NULL DEFAULT '',
  header_address TEXT NOT NULL DEFAULT '',
  header_phone TEXT NOT NULL DEFAULT '',
  header_tax_id TEXT NOT NULL DEFAULT '',
  header_extra_line TEXT NOT NULL DEFAULT '',
  -- Pied
  footer_thanks_message TEXT NOT NULL DEFAULT 'Merci de votre visite !',
  footer_legal_mention TEXT NOT NULL DEFAULT '',
  footer_return_policy TEXT NOT NULL DEFAULT '',
  show_qr_code BOOLEAN NOT NULL DEFAULT true,
  qr_content_type TEXT NOT NULL DEFAULT 'sale_id' CHECK (qr_content_type IN ('sale_id', 'website', 'whatsapp', 'custom')),
  qr_custom_value TEXT NOT NULL DEFAULT '',
  -- Impression
  auto_print BOOLEAN NOT NULL DEFAULT false,
  copies INTEGER NOT NULL DEFAULT 1 CHECK (copies BETWEEN 1 AND 5),
  open_cash_drawer BOOLEAN NOT NULL DEFAULT false,
  -- ESC/POS direct (optionnel)
  use_escpos BOOLEAN NOT NULL DEFAULT false,
  escpos_connection TEXT NOT NULL DEFAULT 'bluetooth' CHECK (escpos_connection IN ('bluetooth', 'usb')),
  escpos_device_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipt settings"
  ON public.receipt_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own receipt settings"
  ON public.receipt_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receipt settings"
  ON public.receipt_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receipt settings"
  ON public.receipt_settings FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_receipt_settings_updated
BEFORE UPDATE ON public.receipt_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
