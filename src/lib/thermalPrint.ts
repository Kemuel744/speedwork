/**
 * Système d'impression universel pour imprimantes thermiques de caisse (80mm).
 *
 * Deux modes :
 * 1. CSS @page + window.print() — universel, fonctionne avec toute imprimante
 *    installée (USB/réseau/Bluetooth) via le pilote système. Recommandé.
 * 2. ESC/POS via Web Bluetooth — impression silencieuse directe (Chrome/Edge
 *    desktop & Android uniquement). Optionnel.
 *
 * Une seule source de vérité pour les reçus de :
 *  - ventes POS
 *  - retours clients
 *  - rapports de session de caisse (ouverture/clôture/X/Z)
 *  - étiquettes prix produits
 */

import { supabase } from '@/integrations/supabase/client';

export type ReceiptSettings = {
  paper_width_mm: 58 | 80;
  font_size_pt: number;
  font_family: string;
  show_logo: boolean;
  logo_url: string;
  header_business_name: string;
  header_address: string;
  header_phone: string;
  header_tax_id: string;
  header_extra_line: string;
  footer_thanks_message: string;
  footer_legal_mention: string;
  footer_return_policy: string;
  show_qr_code: boolean;
  qr_content_type: 'sale_id' | 'website' | 'whatsapp' | 'custom';
  qr_custom_value: string;
  auto_print: boolean;
  copies: number;
  open_cash_drawer: boolean;
  use_escpos: boolean;
  escpos_connection: 'bluetooth' | 'usb';
  escpos_device_name: string;
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  paper_width_mm: 80,
  font_size_pt: 11,
  font_family: 'monospace',
  show_logo: true,
  logo_url: '',
  header_business_name: '',
  header_address: '',
  header_phone: '',
  header_tax_id: '',
  header_extra_line: '',
  footer_thanks_message: 'Merci de votre visite !',
  footer_legal_mention: '',
  footer_return_policy: '',
  show_qr_code: true,
  qr_content_type: 'sale_id',
  qr_custom_value: '',
  auto_print: false,
  copies: 1,
  open_cash_drawer: false,
  use_escpos: false,
  escpos_connection: 'bluetooth',
  escpos_device_name: '',
};

let _cachedSettings: ReceiptSettings | null = null;

/** Charge les paramètres de reçu (avec cache mémoire). */
export async function getReceiptSettings(force = false): Promise<ReceiptSettings> {
  if (_cachedSettings && !force) return _cachedSettings;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_RECEIPT_SETTINGS;
    const { data } = await supabase
      .from('receipt_settings' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    _cachedSettings = data ? { ...DEFAULT_RECEIPT_SETTINGS, ...(data as any) } : DEFAULT_RECEIPT_SETTINGS;
    return _cachedSettings;
  } catch {
    return DEFAULT_RECEIPT_SETTINGS;
  }
}

/** Invalide le cache (à appeler après sauvegarde des réglages). */
export function invalidateReceiptSettingsCache() {
  _cachedSettings = null;
}

// ============================================================
// Données génériques d'un ticket à imprimer
// ============================================================

export type ReceiptLine = {
  label: string;
  qty?: number;
  unitPrice?: number;
  total?: number;
  /** ligne secondaire en italique (ex: code produit, lot pharmacie) */
  sub?: string;
};

export type ReceiptKind = 'sale' | 'return' | 'session' | 'label';

export type ReceiptDocument = {
  kind: ReceiptKind;
  /** Titre principal du ticket (ex: "REÇU DE VENTE", "RETOUR", "CLÔTURE CAISSE", "FIN DE SESSION X") */
  title: string;
  /** Numéro de pièce affiché en en-tête */
  number?: string;
  date?: Date;
  /** Lignes principales (articles vendus, produits retournés, mouvements) */
  lines?: ReceiptLine[];
  /** Sommaire bas-de-ticket : libellé + valeur formatée déjà */
  summary?: { label: string; value: string; bold?: boolean }[];
  /** Total final mis en avant, déjà formaté */
  totalLabel?: string;
  totalValue?: string;
  /** Mode de paiement (ex: "Espèces", "Mobile Money") */
  paymentMethod?: string;
  /** Nom caissier(ère) */
  cashier?: string;
  /** Nom client (optionnel) */
  customer?: string;
  /** Notes libres affichées sous le total */
  notes?: string;
  /** Identifiant interne pour le QR code (ex: id de la vente) */
  qrPayload?: string;
};

// ============================================================
// Helpers HTML
// ============================================================

function escapeHtml(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildQrUrl(s: ReceiptSettings, doc: ReceiptDocument): string | null {
  if (!s.show_qr_code) return null;
  let payload = '';
  switch (s.qr_content_type) {
    case 'sale_id':
      payload = doc.qrPayload || doc.number || '';
      break;
    case 'website':
    case 'whatsapp':
    case 'custom':
      payload = s.qr_custom_value;
      break;
  }
  if (!payload) return null;
  const data = encodeURIComponent(payload);
  // API publique générant un PNG QR — pas de dépendance JS pour la fenêtre d'impression
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${data}&margin=0`;
}

function renderReceiptHtml(s: ReceiptSettings, doc: ReceiptDocument): string {
  const widthMm = s.paper_width_mm;
  const innerMm = widthMm - 6; // marges latérales 3mm
  const date = doc.date ?? new Date();
  const qrUrl = buildQrUrl(s, doc);

  const lineRow = (l: ReceiptLine) => {
    const qtyPrice = l.qty != null && l.unitPrice != null
      ? `<span>${l.qty} × ${escapeHtml(String(l.unitPrice))}</span>`
      : '';
    return `
      <div class="item">
        <div class="item-name">${escapeHtml(l.label)}</div>
        ${l.sub ? `<div class="item-sub">${escapeHtml(l.sub)}</div>` : ''}
        <div class="row">
          ${qtyPrice}
          ${l.total != null ? `<span class="bold">${escapeHtml(String(l.total))}</span>` : ''}
        </div>
      </div>
    `;
  };

  const summaryRows = (doc.summary ?? [])
    .map(s => `<div class="row ${s.bold ? 'bold' : ''}"><span>${escapeHtml(s.label)}</span><span>${escapeHtml(s.value)}</span></div>`)
    .join('');

  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title)}${doc.number ? ' ' + escapeHtml(doc.number) : ''}</title>
<style>
  @page { size: ${widthMm}mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; color: #000; }
  body {
    width: ${widthMm}mm;
    padding: 3mm;
    font-family: ${s.font_family}, 'Courier New', monospace;
    font-size: ${s.font_size_pt}pt;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .small { font-size: ${Math.max(7, s.font_size_pt - 2)}pt; }
  .xsmall { font-size: ${Math.max(6, s.font_size_pt - 3)}pt; }
  h1 { font-size: ${s.font_size_pt + 2}pt; font-weight: 700; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 4px; margin: 2px 0; }
  .item { margin: 4px 0; }
  .item-name { font-weight: 700; }
  .item-sub { font-style: italic; font-size: ${Math.max(7, s.font_size_pt - 2)}pt; color: #333; }
  .total {
    display: flex; justify-content: space-between;
    font-size: ${s.font_size_pt + 3}pt; font-weight: 700;
    border-top: 2px solid #000; border-bottom: 2px solid #000;
    padding: 4px 0; margin: 6px 0;
  }
  .logo { max-width: ${innerMm * 3.78}px; max-height: 60px; margin: 0 auto 4px; display: block; }
  .qr { margin: 8px auto 0; display: block; }
  .footer { margin-top: 8px; }
  @media print { body { width: ${widthMm}mm; } }
</style>
</head><body>
  <div class="center">
    ${s.show_logo && s.logo_url ? `<img src="${escapeHtml(s.logo_url)}" class="logo" alt="" onerror="this.style.display='none'" />` : ''}
    ${s.header_business_name ? `<h1>${escapeHtml(s.header_business_name)}</h1>` : ''}
    ${s.header_address ? `<p class="small">${escapeHtml(s.header_address)}</p>` : ''}
    ${s.header_phone ? `<p class="small">Tél : ${escapeHtml(s.header_phone)}</p>` : ''}
    ${s.header_tax_id ? `<p class="xsmall">N° Contrib. ${escapeHtml(s.header_tax_id)}</p>` : ''}
    ${s.header_extra_line ? `<p class="xsmall">${escapeHtml(s.header_extra_line)}</p>` : ''}
  </div>
  <div class="sep"></div>
  <div class="center bold">${escapeHtml(doc.title)}</div>
  ${doc.number ? `<div class="row"><span>N°</span><span>${escapeHtml(doc.number)}</span></div>` : ''}
  <div class="row"><span>Date</span><span>${formatDate(date)}</span></div>
  ${doc.cashier ? `<div class="row"><span>Caissier</span><span>${escapeHtml(doc.cashier)}</span></div>` : ''}
  ${doc.customer ? `<div class="row"><span>Client</span><span>${escapeHtml(doc.customer)}</span></div>` : ''}
  ${doc.lines && doc.lines.length > 0 ? `<div class="sep"></div>${doc.lines.map(lineRow).join('')}` : ''}
  ${summaryRows ? `<div class="sep"></div>${summaryRows}` : ''}
  ${doc.totalValue ? `<div class="total"><span>${escapeHtml(doc.totalLabel || 'TOTAL')}</span><span>${escapeHtml(doc.totalValue)}</span></div>` : ''}
  ${doc.paymentMethod ? `<div class="row"><span>Paiement</span><span>${escapeHtml(doc.paymentMethod)}</span></div>` : ''}
  ${doc.notes ? `<div class="small" style="margin-top:6px;">${escapeHtml(doc.notes)}</div>` : ''}
  <div class="footer center small">
    ${s.footer_thanks_message ? `<p>${escapeHtml(s.footer_thanks_message)}</p>` : ''}
    ${s.footer_return_policy ? `<p class="xsmall" style="margin-top:4px;">${escapeHtml(s.footer_return_policy)}</p>` : ''}
    ${s.footer_legal_mention ? `<p class="xsmall" style="margin-top:4px;">${escapeHtml(s.footer_legal_mention)}</p>` : ''}
    ${qrUrl ? `<img src="${qrUrl}" class="qr" alt="QR" />` : ''}
  </div>
</body></html>`;
}

// ============================================================
// Impression CSS (window.print) — universel
// ============================================================

function printHtmlInIframe(html: string, copies: number): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      try { document.body.removeChild(iframe); } catch { /* noop */ }
      resolve();
    };

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) return cleanup();
        // Imprime le nombre de copies demandé séquentiellement
        let remaining = Math.max(1, Math.min(5, copies || 1));
        const printOnce = () => {
          win.focus();
          win.print();
          remaining -= 1;
          if (remaining > 0) setTimeout(printOnce, 600);
          else setTimeout(cleanup, 1200);
        };
        setTimeout(printOnce, 200);
      } catch {
        cleanup();
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return cleanup();
    doc.open();
    doc.write(html);
    doc.close();
  });
}

// ============================================================
// ESC/POS via Web Bluetooth (optionnel, mode silencieux)
// ============================================================

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function buildEscPosBuffer(s: ReceiptSettings, doc: ReceiptDocument): Uint8Array {
  const out: number[] = [];
  const enc = new TextEncoder();
  const push = (...bytes: number[]) => out.push(...bytes);
  const text = (str: string) => {
    enc.encode(str).forEach(b => out.push(b));
  };
  const align = (a: 0 | 1 | 2) => push(ESC, 0x61, a); // 0 left, 1 center, 2 right
  const bold = (on: boolean) => push(ESC, 0x45, on ? 1 : 0);
  const size = (w: number, h: number) => push(GS, 0x21, ((w & 0x07) << 4) | (h & 0x07));
  const newl = (n = 1) => { for (let i = 0; i < n; i++) push(LF); };
  const cut = () => push(GS, 0x56, 0x42, 0x00); // partial cut
  const drawer = () => push(ESC, 0x70, 0x00, 0x19, 0xfa); // ouvre tiroir

  push(ESC, 0x40); // init
  align(1);
  if (s.header_business_name) {
    bold(true); size(1, 1); text(s.header_business_name); newl(); size(0, 0); bold(false);
  }
  if (s.header_address) { text(s.header_address); newl(); }
  if (s.header_phone) { text('Tel: ' + s.header_phone); newl(); }
  if (s.header_tax_id) { text('N° Contrib. ' + s.header_tax_id); newl(); }
  text('--------------------------------'); newl();
  bold(true); text(doc.title); bold(false); newl();
  if (doc.number) { text('N°: ' + doc.number); newl(); }
  text('Date: ' + formatDate(doc.date ?? new Date())); newl();
  if (doc.cashier) { text('Caissier: ' + doc.cashier); newl(); }
  if (doc.customer) { text('Client: ' + doc.customer); newl(); }
  text('--------------------------------'); newl();

  align(0);
  for (const l of doc.lines ?? []) {
    bold(true); text(l.label); bold(false); newl();
    if (l.sub) { text('  ' + l.sub); newl(); }
    if (l.qty != null && l.unitPrice != null) {
      text(`  ${l.qty} x ${l.unitPrice}`);
      if (l.total != null) text('   = ' + l.total);
      newl();
    }
  }
  text('--------------------------------'); newl();
  for (const r of doc.summary ?? []) {
    text(r.label + ': ' + r.value); newl();
  }
  if (doc.totalValue) {
    bold(true); size(1, 1);
    text((doc.totalLabel || 'TOTAL') + ': ' + doc.totalValue);
    size(0, 0); bold(false); newl();
  }
  if (doc.paymentMethod) { text('Paiement: ' + doc.paymentMethod); newl(); }
  if (doc.notes) { text(doc.notes); newl(); }
  newl();
  align(1);
  if (s.footer_thanks_message) { text(s.footer_thanks_message); newl(); }
  if (s.footer_return_policy) { text(s.footer_return_policy); newl(); }
  if (s.footer_legal_mention) { text(s.footer_legal_mention); newl(); }
  newl(2);
  if (s.open_cash_drawer && doc.kind === 'sale') drawer();
  cut();
  return new Uint8Array(out);
}

/** Imprime via Bluetooth (ESC/POS). L'utilisateur sélectionne l'imprimante au premier appel. */
async function printEscPosBluetooth(buf: Uint8Array): Promise<void> {
  const nav = navigator as any;
  if (!nav.bluetooth) throw new Error('Web Bluetooth non supporté sur ce navigateur');
  const SERVICE = 0x18f0; // service standard ESC/POS
  const device = await nav.bluetooth.requestDevice({
    filters: [{ services: [SERVICE] }],
    optionalServices: [SERVICE],
  });
  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(SERVICE);
  const chars = await service.getCharacteristics();
  const writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
  if (!writeChar) throw new Error('Caractéristique d\'écriture introuvable');
  // Découpage en chunks 100 octets pour compatibilité large
  const CHUNK = 100;
  for (let i = 0; i < buf.length; i += CHUNK) {
    await writeChar.writeValue(buf.slice(i, i + CHUNK));
  }
  try { server.disconnect(); } catch { /* noop */ }
}

// ============================================================
// API publique
// ============================================================

/**
 * Imprime un reçu (CSS @page par défaut, ou ESC/POS si configuré et supporté).
 * Auto-charge les paramètres utilisateur, sauf si overrideSettings est fourni.
 */
export async function printReceipt(
  doc: ReceiptDocument,
  overrideSettings?: Partial<ReceiptSettings>,
): Promise<void> {
  const base = await getReceiptSettings();
  const s: ReceiptSettings = { ...base, ...overrideSettings };

  if (s.use_escpos) {
    try {
      const buf = buildEscPosBuffer(s, doc);
      await printEscPosBluetooth(buf);
      return;
    } catch (e) {
      console.warn('[ESC/POS] Échec, repli sur impression CSS :', e);
      // Fallback CSS pour ne jamais bloquer la caisse
    }
  }

  const html = renderReceiptHtml(s, doc);
  await printHtmlInIframe(html, s.copies);
}

/** Génère uniquement l'aperçu HTML d'un reçu (utile pour modale d'aperçu). */
export async function renderReceiptPreview(doc: ReceiptDocument): Promise<string> {
  const s = await getReceiptSettings();
  return renderReceiptHtml(s, doc);
}

/**
 * Impression d'étiquettes prix produits sur rouleau 80mm
 * (une étiquette par bande, codes-barres centrés).
 */
export type PriceLabel = {
  productName: string;
  price: string; // déjà formaté
  barcode?: string; // EAN-13 en chiffres
  category?: string;
};

export async function printPriceLabels(labels: PriceLabel[]): Promise<void> {
  const s = await getReceiptSettings();
  const widthMm = s.paper_width_mm;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<title>Étiquettes prix</title>
<style>
  @page { size: ${widthMm}mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${widthMm}mm; font-family: ${s.font_family}, monospace; font-size: ${s.font_size_pt}pt; color: #000; }
  .label {
    padding: 3mm; text-align: center;
    border-bottom: 1px dashed #999;
    page-break-inside: avoid;
  }
  .name { font-weight: 700; font-size: ${s.font_size_pt + 1}pt; margin-bottom: 2px; }
  .cat { font-size: ${Math.max(7, s.font_size_pt - 2)}pt; color: #444; }
  .price { font-size: ${s.font_size_pt + 6}pt; font-weight: 700; margin: 4px 0; }
  .barcode { margin-top: 4px; }
  @media print { .label:last-child { border-bottom: none; } }
</style>
</head><body>
${labels.map(l => `
  <div class="label">
    <div class="name">${escapeHtml(l.productName)}</div>
    ${l.category ? `<div class="cat">${escapeHtml(l.category)}</div>` : ''}
    <div class="price">${escapeHtml(l.price)}</div>
    ${l.barcode ? `<img class="barcode" src="https://barcodeapi.org/api/code128/${encodeURIComponent(l.barcode)}" alt="${escapeHtml(l.barcode)}" onerror="this.style.display='none'" /><div class="cat">${escapeHtml(l.barcode)}</div>` : ''}
  </div>
`).join('')}
</body></html>`;
  await printHtmlInIframe(html, 1);
}
