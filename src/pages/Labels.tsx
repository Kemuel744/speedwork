import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Printer, Tag, Settings as SettingsIcon } from 'lucide-react';
import { printElement } from '@/lib/printElement';

interface Product {
  id: string; name: string; unit_price: number; barcode: string | null; sku: string | null;
}

interface Template {
  width_mm: number; height_mm: number; cols_per_page: number; rows_per_page: number;
  show_name: boolean; show_price: boolean; show_barcode: boolean; show_qr: boolean; show_company: boolean;
}

const defaultTpl: Template = {
  width_mm: 50, height_mm: 30, cols_per_page: 4, rows_per_page: 10,
  show_name: true, show_price: true, show_barcode: true, show_qr: false, show_company: false,
};

// Simple Code128-like barcode using stripes (visual only — for serious printing use a real lib client-side)
function BarcodeStripes({ value }: { value: string }) {
  const bars = (value || '').split('').map((c, i) => {
    const w = ((c.charCodeAt(0) % 4) + 1);
    return <div key={i} style={{ width: `${w}px`, height: '100%', background: '#000', marginRight: '1px' }} />;
  });
  return (
    <div className="flex items-end h-7 mt-1 justify-center overflow-hidden">{bars}</div>
  );
}

export default function Labels() {
  const { user } = useAuth();
  const { displayAmount } = useCurrency();
  const { company } = useCompany();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [tpl, setTpl] = useState<Template>(defaultTpl);
  const [picks, setPicks] = useState<Record<string, number>>({}); // productId -> qty labels
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('products').select('id,name,unit_price,barcode,sku')
      .eq('user_id', user.id).order('name').limit(500);
    setProducts((data as Product[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search)),
    [products, search]);

  const labelsToPrint = useMemo(() => {
    const list: Product[] = [];
    for (const p of products) {
      const qty = picks[p.id] || 0;
      for (let i = 0; i < qty; i++) list.push(p);
    }
    return list;
  }, [picks, products]);

  const print = async () => {
    if (labelsToPrint.length === 0) {
      toast({ title: 'Sélectionnez au moins une étiquette', variant: 'destructive' });
      return;
    }
    if (user) {
      await supabase.from('label_print_jobs').insert({
        user_id: user.id, product_count: Object.keys(picks).filter(k => picks[k] > 0).length,
        total_labels: labelsToPrint.length,
      });
    }
    await printElement(printRef.current, {
      title: `Etiquettes_${labelsToPrint.length}`,
      pageMargin: '5mm',
      extraCss: `
        body { background: #fff !important; }
        .label-print-area { padding: 0 !important; }
      `,
    });
  };

  const setQty = (id: string, q: number) => setPicks(p => ({ ...p, [id]: Math.max(0, q) }));

  return (
      <div className="container mx-auto p-4 lg:p-8 space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Tag className="w-7 h-7" />Étiquettes & codes-barres</h1>
          <p className="text-muted-foreground text-sm">Imprimez des planches A4 avec codes-barres pour vos produits</p>
        </div>
        <Button onClick={print}><Printer className="w-4 h-4 mr-2" />Imprimer ({labelsToPrint.length})</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        <Card className="lg:col-span-1">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><SettingsIcon className="w-4 h-4" />Modèle d'étiquette</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Largeur (mm)</Label><Input type="number" value={tpl.width_mm} onChange={e => setTpl({ ...tpl, width_mm: +e.target.value || 50 })} /></div>
              <div><Label className="text-xs">Hauteur (mm)</Label><Input type="number" value={tpl.height_mm} onChange={e => setTpl({ ...tpl, height_mm: +e.target.value || 30 })} /></div>
              <div><Label className="text-xs">Colonnes</Label><Input type="number" value={tpl.cols_per_page} onChange={e => setTpl({ ...tpl, cols_per_page: +e.target.value || 4 })} /></div>
              <div><Label className="text-xs">Lignes</Label><Input type="number" value={tpl.rows_per_page} onChange={e => setTpl({ ...tpl, rows_per_page: +e.target.value || 10 })} /></div>
            </div>
            <div className="space-y-2 pt-2">
              {([
                ['show_name', 'Afficher le nom'],
                ['show_price', 'Afficher le prix'],
                ['show_barcode', 'Afficher le code-barres'],
                ['show_qr', 'Afficher un QR (au lieu du code-barres)'],
                ['show_company', 'Afficher le nom de la boutique'],
              ] as [keyof Template, string][]).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <Label>{l}</Label>
                  <Switch checked={tpl[k] as boolean} onCheckedChange={v => setTpl({ ...tpl, [k]: v })} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Rechercher un produit ou code-barres..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="max-h-[500px] overflow-auto divide-y">
              {filtered.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Checkbox checked={(picks[p.id] || 0) > 0} onCheckedChange={v => setQty(p.id, v ? 1 : 0)} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.barcode || p.sku || '—'} · {displayAmount(p.unit_price)}</p>
                    </div>
                  </div>
                  <Input type="number" min={0} className="w-20 h-8" value={picks[p.id] || 0}
                    onChange={e => setQty(p.id, parseInt(e.target.value) || 0)} />
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Aucun produit</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print area */}
      <div ref={printRef} className="label-print-area">
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${tpl.cols_per_page}, ${tpl.width_mm}mm)`,
          gap: '2mm',
          justifyContent: 'center',
        }}>
          {labelsToPrint.map((p, i) => (
            <div key={i} style={{
              width: `${tpl.width_mm}mm`, height: `${tpl.height_mm}mm`,
              border: '1px dashed #ccc', padding: '2mm', boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '9px', overflow: 'hidden', background: 'white', color: '#000',
            }}>
              {tpl.show_company && <div style={{ fontSize: '7px', fontWeight: 600 }}>{company.name}</div>}
              {tpl.show_name && <div style={{ fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>{p.name.slice(0, 30)}</div>}
              {tpl.show_price && <div style={{ fontSize: '12px', fontWeight: 700 }}>{displayAmount(p.unit_price)}</div>}
              {tpl.show_qr && p.barcode && (
                <img alt="QR" style={{ width: '15mm', height: '15mm' }}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(p.barcode)}`} />
              )}
              {tpl.show_barcode && !tpl.show_qr && p.barcode && (
                <>
                  <BarcodeStripes value={p.barcode} />
                  <div style={{ fontSize: '8px', letterSpacing: '0.5px' }}>{p.barcode}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}