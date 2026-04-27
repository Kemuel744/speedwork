import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Printer, Bluetooth, Receipt, TestTube2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  DEFAULT_RECEIPT_SETTINGS,
  invalidateReceiptSettingsCache,
  printReceipt,
  type ReceiptSettings,
} from '@/lib/thermalPrint';
import { useCompany } from '@/contexts/CompanyContext';

export default function ReceiptSettingsPage() {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data } = await supabase
        .from('receipt_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setS({ ...DEFAULT_RECEIPT_SETTINGS, ...(data as any) });
      } else {
        // Pré-remplit avec les infos entreprise
        setS(prev => ({
          ...prev,
          header_business_name: company.name || '',
          header_address: company.address || '',
          header_phone: company.phone || '',
          logo_url: company.logo || '',
        }));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof ReceiptSettings>(k: K, v: ReceiptSettings[K]) =>
    setS(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('receipt_settings' as any)
        .upsert({ user_id: user.id, ...s }, { onConflict: 'user_id' });
      if (error) throw error;
      invalidateReceiptSettingsCache();
      toast.success('Réglages du reçu enregistrés');
    } catch (e: any) {
      toast.error(e.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const testPrint = async () => {
    await printReceipt(
      {
        kind: 'sale',
        title: 'TEST D\'IMPRESSION',
        number: 'TEST-001',
        date: new Date(),
        cashier: 'Démo',
        lines: [
          { label: 'Article exemple A', qty: 2, unitPrice: 1500, total: 3000 },
          { label: 'Article exemple B', sub: 'Lot 12345', qty: 1, unitPrice: 2500, total: 2500 },
        ],
        summary: [
          { label: 'Sous-total', value: '5 500 XAF' },
          { label: 'TVA 18%', value: '990 XAF' },
        ],
        totalLabel: 'TOTAL',
        totalValue: '6 490 XAF',
        paymentMethod: 'Espèces',
        qrPayload: 'TEST-001',
      },
      s, // utilise les réglages courants (non sauvegardés) pour tester instantanément
    );
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
            <Receipt className="w-6 h-6 text-primary" />
            Reçus & imprimante de caisse
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez vos tickets imprimés sur les imprimantes thermiques 80 mm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/receipt-test">
              <TestTube2 className="w-4 h-4 mr-2" />Écran de test
            </Link>
          </Button>
          <Button variant="outline" onClick={testPrint}>
            <TestTube2 className="w-4 h-4 mr-2" />Test d'impression
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Format papier</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Largeur du papier</Label>
            <Select value={String(s.paper_width_mm)} onValueChange={v => update('paper_width_mm', Number(v) as 58 | 80)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="80">80 mm (standard)</SelectItem>
                <SelectItem value="58">58 mm (mini)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Taille de police (pt)</Label>
            <Input type="number" min={8} max={16} value={s.font_size_pt}
              onChange={e => update('font_size_pt', Math.max(8, Math.min(16, Number(e.target.value) || 11)))} />
          </div>
          <div className="space-y-1.5">
            <Label>Police</Label>
            <Select value={s.font_family} onValueChange={v => update('font_family', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monospace">Monospace (recommandé)</SelectItem>
                <SelectItem value="'Courier New'">Courier New</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between sm:col-span-3 rounded-lg border p-3">
            <div>
              <Label className="font-medium">Afficher le logo</Label>
              <p className="text-xs text-muted-foreground">Le logo apparaît centré au sommet du ticket.</p>
            </div>
            <Switch checked={s.show_logo} onCheckedChange={v => update('show_logo', v)} />
          </div>
          {s.show_logo && (
            <div className="space-y-1.5 sm:col-span-3">
              <Label>URL du logo</Label>
              <Input value={s.logo_url} placeholder="https://..." onChange={e => update('logo_url', e.target.value)} />
              <p className="text-xs text-muted-foreground">Astuce : utilisez le logo configuré dans Réglages &gt; Entreprise.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">En-tête du ticket</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nom du commerce</Label>
            <Input value={s.header_business_name} onChange={e => update('header_business_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input value={s.header_phone} onChange={e => update('header_phone', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Adresse</Label>
            <Input value={s.header_address} onChange={e => update('header_address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>N° contribuable / NIF</Label>
            <Input value={s.header_tax_id} onChange={e => update('header_tax_id', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ligne libre (RCCM, slogan…)</Label>
            <Input value={s.header_extra_line} onChange={e => update('header_extra_line', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pied du ticket</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Message de remerciement</Label>
            <Input value={s.footer_thanks_message} onChange={e => update('footer_thanks_message', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Politique de retour / échange</Label>
            <Textarea rows={2} value={s.footer_return_policy} onChange={e => update('footer_return_policy', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mention légale (TVA, CGV, etc.)</Label>
            <Textarea rows={2} value={s.footer_legal_mention} onChange={e => update('footer_legal_mention', e.target.value)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">QR code en pied de ticket</Label>
              <p className="text-xs text-muted-foreground">Pratique pour reçus dématérialisés ou liens WhatsApp.</p>
            </div>
            <Switch checked={s.show_qr_code} onCheckedChange={v => update('show_qr_code', v)} />
          </div>
          {s.show_qr_code && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contenu du QR</Label>
                <Select value={s.qr_content_type} onValueChange={(v: any) => update('qr_content_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale_id">N° de vente / pièce</SelectItem>
                    <SelectItem value="website">Lien site web</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {s.qr_content_type !== 'sale_id' && (
                <div className="space-y-1.5">
                  <Label>Valeur</Label>
                  <Input
                    placeholder={
                      s.qr_content_type === 'website' ? 'https://...' :
                      s.qr_content_type === 'whatsapp' ? 'https://wa.me/242XXXXXXXX' :
                      'Texte ou URL'
                    }
                    value={s.qr_custom_value}
                    onChange={e => update('qr_custom_value', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Comportement à l'impression</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="font-medium">Impression directe après vente</Label>
                <p className="text-xs text-muted-foreground">Imprime le reçu sans passer par l'aperçu.</p>
              </div>
              <Switch checked={s.auto_print} onCheckedChange={v => update('auto_print', v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre de copies</Label>
              <Input type="number" min={1} max={5} value={s.copies}
                onChange={e => update('copies', Math.max(1, Math.min(5, Number(e.target.value) || 1)))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div>
                <Label className="font-medium">Ouvrir le tiroir-caisse</Label>
                <p className="text-xs text-muted-foreground">Uniquement en mode ESC/POS direct ci-dessous.</p>
              </div>
              <Switch checked={s.open_cash_drawer} onCheckedChange={v => update('open_cash_drawer', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-primary" />
            Mode avancé : impression directe ESC/POS
            <Badge variant="outline" className="text-[10px]">Optionnel</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Active l'impression silencieuse (sans dialogue) en envoyant directement les commandes ESC/POS à votre imprimante via Bluetooth.
            Compatible Chrome/Edge desktop et Android. Si l'imprimante ne répond pas, l'impression CSS classique prend automatiquement le relais.
          </p>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">Activer ESC/POS direct</Label>
              <p className="text-xs text-muted-foreground">Recommandé pour les caisses à fort débit.</p>
            </div>
            <Switch checked={s.use_escpos} onCheckedChange={v => update('use_escpos', v)} />
          </div>
          {s.use_escpos && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Connexion</Label>
                <Select value={s.escpos_connection} onValueChange={(v: any) => update('escpos_connection', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bluetooth">Bluetooth (Web Bluetooth)</SelectItem>
                    <SelectItem value="usb" disabled>USB (bientôt disponible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nom appareil (mémo)</Label>
                <Input placeholder="Ex: XPrinter 80mm" value={s.escpos_device_name}
                  onChange={e => update('escpos_device_name', e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
