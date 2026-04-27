import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Receipt, ArrowLeft, RotateCcw, Calculator, Tag, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import {
  DEFAULT_RECEIPT_SETTINGS,
  printReceipt,
  printPriceLabels,
  renderReceiptPreview,
  type ReceiptSettings,
  type ReceiptDocument,
} from '@/lib/thermalPrint';

type Scenario = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  build: () => ReceiptDocument;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'sale',
    title: 'Reçu de vente',
    description: 'Vente standard avec articles, TVA, total et paiement.',
    icon: Receipt,
    build: () => ({
      kind: 'sale',
      title: 'REÇU DE VENTE',
      number: 'V-2026-0042',
      date: new Date(),
      cashier: 'Démo Caissier',
      customer: 'Client comptoir',
      lines: [
        { label: 'Paracétamol 500mg (B/20)', sub: 'Lot PHA-2026-A', qty: 2, unitPrice: 1500, total: 3000 },
        { label: 'Sirop antitussif 200ml', qty: 1, unitPrice: 4500, total: 4500 },
        { label: 'Pansements stériles', qty: 3, unitPrice: 800, total: 2400 },
      ],
      summary: [
        { label: 'Sous-total', value: '9 900 XAF' },
        { label: 'TVA 18%', value: '1 782 XAF' },
      ],
      totalLabel: 'TOTAL TTC',
      totalValue: '11 682 XAF',
      paymentMethod: 'Espèces',
      qrPayload: 'V-2026-0042',
    }),
  },
  {
    id: 'return',
    title: 'Reçu de retour',
    description: 'Retour client avec montant remboursé.',
    icon: RotateCcw,
    build: () => ({
      kind: 'return',
      title: 'RETOUR / REMBOURSEMENT',
      number: 'R-2026-0007',
      date: new Date(),
      cashier: 'Démo Caissier',
      customer: 'Mme Mboussi',
      lines: [
        { label: 'Sirop antitussif 200ml', sub: 'Réf. vente V-2026-0040', qty: 1, unitPrice: 4500, total: 4500 },
      ],
      summary: [{ label: 'Mode remboursement', value: 'Espèces' }],
      totalLabel: 'REMBOURSÉ',
      totalValue: '4 500 XAF',
      notes: 'Article non ouvert, retour sous 7 jours.',
      qrPayload: 'R-2026-0007',
    }),
  },
  {
    id: 'session',
    title: 'Clôture de caisse (Z)',
    description: 'Rapport de fin de journée caisse.',
    icon: Calculator,
    build: () => ({
      kind: 'session',
      title: 'CLÔTURE CAISSE - Z',
      number: 'Z-20260427',
      date: new Date(),
      cashier: 'Démo Caissier',
      summary: [
        { label: 'Fond de caisse', value: '20 000 XAF' },
        { label: 'Ventes espèces', value: '85 400 XAF' },
        { label: 'Ventes Mobile Money', value: '32 100 XAF' },
        { label: 'Ventes carte', value: '14 200 XAF' },
        { label: 'Retours', value: '- 4 500 XAF' },
        { label: 'Nb tickets', value: '27' },
      ],
      totalLabel: 'TOTAL CAISSE',
      totalValue: '147 200 XAF',
      notes: 'Espèces comptées : 105 400 XAF — Écart : 0 XAF',
      qrPayload: 'Z-20260427',
    }),
  },
];

export default function ReceiptTest() {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewing, setPreviewing] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('sale');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('receipt_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setS({ ...DEFAULT_RECEIPT_SETTINGS, ...(data as any) });
      } else {
        setS(prev => ({
          ...prev,
          header_business_name: company.name || 'Mon Commerce',
          header_address: company.address || 'Brazzaville, Congo',
          header_phone: company.phone || '+242 06 000 0000',
          logo_url: company.logo || '',
        }));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPreview = async (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setPreviewing(true);
    const sc = SCENARIOS.find(x => x.id === scenarioId);
    if (!sc) { setPreviewing(false); return; }
    // Génère un aperçu en injectant les paramètres courants
    const { default: ReactDOMServer } = { default: null as any }; // not needed
    const doc = sc.build();
    // On appelle renderReceiptPreview via un mini contournement : on reconstruit l'HTML localement
    // en simulant les overrides — utilise la même fonction interne via printReceipt n'est pas possible.
    // On délègue donc à renderReceiptPreview qui lit les settings sauvegardés.
    const html = await renderReceiptPreview(doc);
    setPreviewHtml(html);
    setPreviewing(false);
  };

  const handlePrint = async (scenarioId: string) => {
    const sc = SCENARIOS.find(x => x.id === scenarioId);
    if (!sc) return;
    await printReceipt(sc.build(), s);
  };

  const handleLabelsTest = async () => {
    await printPriceLabels([
      { productName: 'Paracétamol 500mg', price: '1 500 XAF', barcode: '3401597405004', category: 'Antalgique' },
      { productName: 'Sirop antitussif 200ml', price: '4 500 XAF', barcode: '3401571234567', category: 'ORL' },
      { productName: 'Pansements stériles x10', price: '800 XAF', category: 'Soins' },
    ]);
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Printer className="w-6 h-6 text-primary" />
            Test d'impression — Reçus 80 mm
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez le rendu de vos reçus thermiques avec logo, en-tête, pied et QR code.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/receipt-settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Modifier les réglages
          </Link>
        </Button>
      </div>

      {/* Récap config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Configuration actuelle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">{s.paper_width_mm} mm</Badge>
          <Badge variant="outline">{s.font_family} · {s.font_size_pt}pt</Badge>
          {s.show_logo && s.logo_url && <Badge variant="outline">Logo activé</Badge>}
          {s.show_qr_code && <Badge variant="outline">QR : {s.qr_content_type}</Badge>}
          <Badge variant="outline">{s.copies} copie{s.copies > 1 ? 's' : ''}</Badge>
          {s.use_escpos && <Badge className="bg-primary">ESC/POS direct</Badge>}
        </CardContent>
      </Card>

      {/* Scénarios */}
      <div className="grid gap-4 md:grid-cols-3">
        {SCENARIOS.map(sc => {
          const Icon = sc.icon;
          const active = activeScenario === sc.id;
          return (
            <Card key={sc.id} className={active ? 'border-primary ring-1 ring-primary/30' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {sc.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{sc.description}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => refreshPreview(sc.id)}>
                    <Eye className="w-4 h-4 mr-1.5" /> Aperçu
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handlePrint(sc.id)}>
                    <Printer className="w-4 h-4 mr-1.5" /> Imprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Étiquettes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Étiquettes prix produits
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Imprime 3 étiquettes de démonstration avec nom, prix et code-barres.
          </p>
          <Button size="sm" onClick={handleLabelsTest}>
            <Printer className="w-4 h-4 mr-1.5" /> Imprimer étiquettes
          </Button>
        </CardContent>
      </Card>

      {/* Aperçu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aperçu du ticket</CardTitle>
        </CardHeader>
        <CardContent>
          {previewing ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : previewHtml ? (
            <div className="flex justify-center">
              <div className="bg-muted p-4 rounded-lg shadow-inner">
                <iframe
                  title="Aperçu reçu"
                  srcDoc={previewHtml}
                  className="bg-white shadow-md"
                  style={{ width: `${s.paper_width_mm * 3.78}px`, height: '600px', border: '0' }}
                />
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Aperçu basé sur les réglages enregistrés ({s.paper_width_mm} mm de large)
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Cliquez sur « Aperçu » d'un scénario ci-dessus pour visualiser le rendu.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
