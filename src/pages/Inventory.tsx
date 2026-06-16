import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLocations } from '@/contexts/LocationContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardCheck, Plus, ScanLine, Printer, FileSpreadsheet,
  Search, History, CheckCircle2, AlertTriangle, TrendingUp, Package, Trash2,
  Wallet, ShoppingCart, PackageX, PackageMinus,
} from 'lucide-react';
import QRScanner from '@/components/reports/QRScanner';
import { printElement } from '@/lib/printElement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Product {
  id: string; name: string; sku: string | null; barcode: string | null;
  unit_price: number; quantity_in_stock: number;
  cost_price: number | null; alert_threshold: number | null;
}
interface InventoryHeader {
  id: string; name: string; inventory_date: string; location_id: string | null;
  responsible_name: string; comment: string; status: 'draft' | 'validated';
  products_checked: number; total_variance: number; variance_value: number;
  accuracy_rate: number; validated_at: string | null; created_at: string;
}
interface InventoryItemRow {
  id?: string; product_id: string; system_qty: number;
  counted_qty: number; unit_price: number;
}

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const { locations } = useLocations();

  const [products, setProducts] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<InventoryHeader[]>([]);
  const [purchasedByProduct, setPurchasedByProduct] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Creation dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', inventory_date: new Date().toISOString().slice(0, 10),
    location_id: '', responsible_name: '', comment: '',
  });

  // Active counting
  const [activeInv, setActiveInv] = useState<InventoryHeader | null>(null);
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // View existing (read-only)
  const [viewInv, setViewInv] = useState<InventoryHeader | null>(null);
  const [viewItems, setViewItems] = useState<InventoryItemRow[]>([]);

  // Alert focus
  const [alertFocus, setAlertFocus] = useState<'low' | 'out' | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [pRes, iRes, mRes] = await Promise.all([
      supabase.from('products').select('id,name,sku,barcode,unit_price,quantity_in_stock,cost_price,alert_threshold').order('name'),
      supabase.from('inventories').select('*').order('created_at', { ascending: false }),
      supabase.from('stock_movements').select('product_id,quantity').gt('quantity', 0),
    ]);
    if (pRes.data) setProducts(pRes.data as Product[]);
    if (iRes.data) setInventories(iRes.data as InventoryHeader[]);
    if (mRes.data) {
      const map: Record<string, number> = {};
      (mRes.data as any[]).forEach(m => {
        map[m.product_id] = (map[m.product_id] || 0) + Number(m.quantity || 0);
      });
      setPurchasedByProduct(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resumeDraft = useCallback(async (inv: InventoryHeader) => {
    const { data } = await supabase.from('inventory_items')
      .select('*').eq('inventory_id', inv.id);
    setItems((data || []).map((r: any) => ({
      id: r.id, product_id: r.product_id, system_qty: r.system_qty,
      counted_qty: r.counted_qty, unit_price: Number(r.unit_price) || 0,
    })));
    setActiveInv(inv);
  }, []);

  const openView = useCallback(async (inv: InventoryHeader) => {
    const { data } = await supabase.from('inventory_items')
      .select('*').eq('inventory_id', inv.id);
    setViewItems((data || []).map((r: any) => ({
      id: r.id, product_id: r.product_id, system_qty: r.system_qty,
      counted_qty: r.counted_qty, unit_price: Number(r.unit_price) || 0,
    })));
    setViewInv(inv);
  }, []);

  // KPIs (global, from validated inventories)
  const kpis = useMemo(() => {
    const validated = inventories.filter(i => i.status === 'validated');
    const last = validated[0] || null;
    const checked = validated.reduce((s, i) => s + i.products_checked, 0);
    const variance = validated.reduce((s, i) => s + i.total_variance, 0);
    const loss = validated.reduce((s, i) => s + (i.variance_value < 0 ? -Number(i.variance_value) : 0), 0);
    const avgAccuracy = validated.length > 0
      ? validated.reduce((s, i) => s + Number(i.accuracy_rate), 0) / validated.length
      : 100;
    return { last, checked, variance, loss, accuracy: avgAccuracy };
  }, [inventories]);

  // Global stock overview
  const stockOverview = useMemo(() => {
    let initialUnits = 0;
    let currentUnits = 0;
    let initialPurchaseValue = 0;
    let currentValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach(p => {
      const cost = Number(p.cost_price) || Number(p.unit_price) || 0;
      const qty = Number(p.quantity_in_stock) || 0;
      const initialQty = Math.max(qty, purchasedByProduct[p.id] || 0);
      initialUnits += initialQty;
      currentUnits += qty;
      initialPurchaseValue += initialQty * cost;
      currentValue += qty * cost;
      const threshold = Number(p.alert_threshold) || 0;
      if (qty <= 0) outOfStock += 1;
      else if (threshold > 0 && qty <= threshold) lowStock += 1;
    });
    return { initialUnits, currentUnits, initialPurchaseValue, currentValue, lowStock, outOfStock };
  }, [products, purchasedByProduct]);

  const lowStockList = useMemo(
    () => products.filter(p => {
      const qty = Number(p.quantity_in_stock) || 0;
      const t = Number(p.alert_threshold) || 0;
      return qty > 0 && t > 0 && qty <= t;
    }),
    [products],
  );
  const outOfStockList = useMemo(
    () => products.filter(p => (Number(p.quantity_in_stock) || 0) <= 0),
    [products],
  );

  const createInventory = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: 'Nom requis', description: 'Saisissez un nom pour l\'inventaire.', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase.from('inventories').insert({
      user_id: user.id,
      name: form.name.trim(),
      inventory_date: form.inventory_date,
      location_id: form.location_id || null,
      responsible_name: form.responsible_name,
      comment: form.comment,
      status: 'draft',
    }).select().single();
    if (error || !data) {
      toast({ title: 'Erreur', description: error?.message, variant: 'destructive' });
      return;
    }
    // Seed items from existing products
    const seed = products.map(p => ({
      inventory_id: data.id,
      user_id: user.id,
      product_id: p.id,
      system_qty: p.quantity_in_stock,
      counted_qty: p.quantity_in_stock,
      unit_price: Number(p.unit_price) || 0,
    }));
    if (seed.length > 0) {
      const { data: inserted } = await supabase.from('inventory_items').insert(seed).select();
      setItems((inserted || []).map((r: any) => ({
        id: r.id, product_id: r.product_id, system_qty: r.system_qty,
        counted_qty: r.counted_qty, unit_price: Number(r.unit_price) || 0,
      })));
    } else {
      setItems([]);
    }
    setActiveInv(data as InventoryHeader);
    setOpenCreate(false);
    setForm({ name: '', inventory_date: new Date().toISOString().slice(0, 10), location_id: '', responsible_name: '', comment: '' });
    setInventories(prev => [data as InventoryHeader, ...prev]);
    toast({ title: 'Inventaire créé', description: `${seed.length} produit(s) à contrôler` });
  };

  const updateCounted = async (productId: string, value: number) => {
    setItems(prev => prev.map(r => r.product_id === productId ? { ...r, counted_qty: value } : r));
    const row = items.find(r => r.product_id === productId);
    if (row?.id) {
      await supabase.from('inventory_items')
        .update({ counted_qty: value }).eq('id', row.id);
    }
  };

  const handleScan = (text: string) => {
    // Resolve as product id, barcode, or sku
    const prod = products.find(p => p.id === text || p.barcode === text || p.sku === text);
    setScannerOpen(false);
    if (!prod) {
      toast({ title: 'Produit introuvable', variant: 'destructive' });
      return;
    }
    setSearch(prod.name);
    const row = items.find(r => r.product_id === prod.id);
    if (row) {
      updateCounted(prod.id, row.counted_qty + 1);
      toast({ title: prod.name, description: `+1 — total compté : ${row.counted_qty + 1}` });
    }
  };

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach(p => m.set(p.id, p));
    return m;
  }, [products]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(r => {
      const p = productMap.get(r.product_id);
      if (!p) return false;
      return p.name.toLowerCase().includes(q)
        || (p.sku || '').toLowerCase().includes(q)
        || (p.barcode || '').toLowerCase().includes(q);
    });
  }, [items, productMap, search]);

  const liveAnalysis = useMemo(() => {
    let surplus = 0, missing = 0, value = 0, system = 0, abs = 0;
    items.forEach(r => {
      const diff = r.counted_qty - r.system_qty;
      if (diff > 0) surplus += diff;
      if (diff < 0) missing += -diff;
      value += diff * r.unit_price;
      system += r.system_qty;
      abs += Math.abs(diff);
    });
    const accuracy = system > 0 ? Math.max(0, 100 - (abs / system) * 100) : 100;
    return { surplus, missing, value, count: items.length, accuracy };
  }, [items]);

  const validateInventory = async () => {
    if (!activeInv) return;
    if (!confirm('Valider cet inventaire ? Les ajustements de stock seront appliqués automatiquement.')) return;
    const { data, error } = await supabase.rpc('validate_inventory', { _inventory_id: activeInv.id });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    const res = data as any;
    if (!res?.success) {
      toast({ title: 'Erreur', description: res?.error || 'Validation impossible', variant: 'destructive' });
      return;
    }
    toast({ title: 'Inventaire validé', description: `${res.products_checked} produit(s) — précision ${Number(res.accuracy_rate).toFixed(1)}%` });
    setActiveInv(null);
    setItems([]);
    fetchAll();
  };

  const exportCSV = (rows: InventoryItemRow[], inv: InventoryHeader) => {
    const head = ['Produit', 'SKU', 'Stock système', 'Stock compté', 'Écart', 'Valeur écart'];
    const lines = rows.map(r => {
      const p = productMap.get(r.product_id);
      const diff = r.counted_qty - r.system_qty;
      return [
        (p?.name || '').replace(/"/g, '""'),
        (p?.sku || '').replace(/"/g, '""'),
        r.system_qty, r.counted_qty, diff, (diff * r.unit_price).toFixed(2),
      ].map(v => `"${v}"`).join(',');
    });
    const csv = [head.map(h => `"${h}"`).join(','), ...lines].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire-${inv.name || inv.id}-${inv.inventory_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printInventory = () => printElement(printRef.current, { title: `Inventaire_${activeInv?.name || ''}` });

  const renderCountRow = (r: InventoryItemRow) => {
    const p = productMap.get(r.product_id);
    const diff = r.counted_qty - r.system_qty;
    const value = diff * r.unit_price;
    return (
      <TableRow key={r.product_id}>
        <TableCell className="font-medium">
          <div className="truncate max-w-[200px]">{p?.name || '—'}</div>
          {p?.sku && <div className="text-xs text-muted-foreground">{p.sku}</div>}
        </TableCell>
        <TableCell className="text-right">{r.system_qty}</TableCell>
        <TableCell className="w-32">
          <Input
            type="number" inputMode="numeric" value={r.counted_qty}
            onChange={(e) => updateCounted(r.product_id, Math.max(0, parseInt(e.target.value || '0', 10)))}
            className="h-9 text-right"
          />
        </TableCell>
        <TableCell className={`text-right font-semibold ${diff === 0 ? '' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
          {diff > 0 ? `+${diff}` : diff}
        </TableCell>
        <TableCell className={`text-right text-sm ${value < 0 ? 'text-destructive' : value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
          {displayAmount(value)}
        </TableCell>
      </TableRow>
    );
  };

  // ───────── Counting view ─────────
  if (activeInv) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              {activeInv.name || 'Inventaire'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(activeInv.inventory_date), 'dd MMMM yyyy', { locale: fr })}
              {activeInv.responsible_name && ` — ${activeInv.responsible_name}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setActiveInv(null); setItems([]); }}>
              Retour
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(items, activeInv)}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={printInventory}>
              <Printer className="w-4 h-4 mr-1" />Imprimer
            </Button>
            <Button size="sm" onClick={validateInventory} disabled={activeInv.status === 'validated'}>
              <CheckCircle2 className="w-4 h-4 mr-1" />Valider l'inventaire
            </Button>
          </div>
        </div>

        {/* Live analysis */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <KpiTile icon={Package} label="Produits" value={liveAnalysis.count.toString()} />
          <KpiTile icon={TrendingUp} label="Surplus" value={`+${liveAnalysis.surplus}`} tone="success" />
          <KpiTile icon={AlertTriangle} label="Manquants" value={`-${liveAnalysis.missing}`} tone="destructive" />
          <KpiTile icon={ClipboardCheck} label="Valeur écart" value={displayAmount(liveAnalysis.value)} tone={liveAnalysis.value < 0 ? 'destructive' : 'success'} />
          <KpiTile icon={CheckCircle2} label="Précision" value={`${liveAnalysis.accuracy.toFixed(1)}%`} tone="success" />
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit (nom, SKU, code-barres)…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
                <ScanLine className="w-4 h-4 mr-1" />Scanner
              </Button>
            </div>

            <div ref={printRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Stock système</TableHead>
                    <TableHead>Stock compté</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead className="text-right">Valeur écart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun produit. Ajoutez d'abord des produits dans le catalogue.
                    </TableCell></TableRow>
                  ) : filteredItems.map(renderCountRow)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
      </div>
    );
  }

  // ───────── Dashboard view ─────────
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />Inventaire
          </h1>
          <p className="text-sm text-muted-foreground">
            Comparez stock théorique et stock physique sans créer de nouveaux produits.
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />Nouvel Inventaire
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <KpiTile icon={ClipboardCheck} label="Dernier inventaire"
          value={kpis.last ? format(new Date(kpis.last.inventory_date), 'dd/MM/yyyy') : '—'} />
        <KpiTile icon={Package} label="Produits vérifiés" value={kpis.checked.toString()} />
        <KpiTile icon={AlertTriangle} label="Écart total"
          value={kpis.variance > 0 ? `+${kpis.variance}` : kpis.variance.toString()}
          tone={kpis.variance < 0 ? 'destructive' : 'success'} />
        <KpiTile icon={TrendingUp} label="Valeur des pertes"
          value={displayAmount(kpis.loss)} tone={kpis.loss > 0 ? 'destructive' : 'success'} />
        <KpiTile icon={CheckCircle2} label="Taux de précision"
          value={`${kpis.accuracy.toFixed(1)}%`} tone="success" />
      </div>

      {/* Vue d'ensemble du stock */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Vue d'ensemble du stock</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <KpiTile icon={ShoppingCart} label="Stock initial"
            value={`${stockOverview.initialUnits} u.`} />
          <KpiTile icon={Package} label="Stock actuel"
            value={`${stockOverview.currentUnits} u.`} />
          <KpiTile icon={Wallet} label="Achat stock initial"
            value={displayAmount(stockOverview.initialPurchaseValue)} />
          <KpiTile icon={TrendingUp} label="Solde actuel"
            value={displayAmount(stockOverview.currentValue)}
            tone={stockOverview.currentValue >= stockOverview.initialPurchaseValue ? 'success' : 'destructive'} />
          <KpiTile
            icon={PackageMinus} label="Stock bas"
            value={stockOverview.lowStock.toString()}
            tone={stockOverview.lowStock > 0 ? 'destructive' : 'success'}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => { setAlertFocus('low'); alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          />
          <KpiTile
            icon={PackageX} label="En rupture"
            value={stockOverview.outOfStock.toString()}
            tone={stockOverview.outOfStock > 0 ? 'destructive' : 'success'}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => { setAlertFocus('out'); alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          />
        </div>
      </div>

      {/* Produits en alerte */}
      {(lowStockList.length > 0 || outOfStockList.length > 0) && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PackageMinus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="font-semibold">Produits en stock bas</h2>
                </div>
                <Badge variant="secondary">{lowStockList.length}</Badge>
              </div>
              {lowStockList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucun produit en stock bas.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {lowStockList.map(p => (
                    <div key={p.id} className="flex items-center justify-between border border-border/50 rounded-md px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Seuil : {p.alert_threshold}</p>
                      </div>
                      <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-500/50">
                        {p.quantity_in_stock} u.
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PackageX className="w-4 h-4 text-destructive" />
                  <h2 className="font-semibold">Produits en rupture</h2>
                </div>
                <Badge variant="secondary">{outOfStockList.length}</Badge>
              </div>
              {outOfStockList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucun produit en rupture.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {outOfStockList.map(p => (
                    <div key={p.id} className="flex items-center justify-between border border-border/50 rounded-md px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                      </div>
                      <Badge variant="destructive">0 u.</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Historique</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Produits</TableHead>
                <TableHead className="text-right">Écart</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : inventories.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Aucun inventaire pour le moment.</TableCell></TableRow>
              ) : inventories.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(inv.inventory_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{inv.name || '—'}</TableCell>
                  <TableCell>{inv.responsible_name || '—'}</TableCell>
                  <TableCell className="text-right">{inv.products_checked}</TableCell>
                  <TableCell className={`text-right ${inv.total_variance < 0 ? 'text-destructive' : inv.total_variance > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                    {inv.total_variance > 0 ? `+${inv.total_variance}` : inv.total_variance}
                  </TableCell>
                  <TableCell className={`text-right ${Number(inv.variance_value) < 0 ? 'text-destructive' : ''}`}>
                    {displayAmount(Number(inv.variance_value))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'validated' ? 'default' : 'outline'}>
                      {inv.status === 'validated' ? 'Validé' : 'Brouillon'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === 'draft' ? (
                      <Button size="sm" variant="outline" onClick={() => resumeDraft(inv)}>Reprendre</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => openView(inv)}>Voir</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvel inventaire</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom de l'inventaire</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex. Inventaire mensuel — juin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.inventory_date}
                  onChange={e => setForm({ ...form, inventory_date: e.target.value })} />
              </div>
              <div>
                <Label>Magasin</Label>
                <Select value={form.location_id} onValueChange={v => setForm({ ...form, location_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Responsable</Label>
              <Input value={form.responsible_name}
                onChange={e => setForm({ ...form, responsible_name: e.target.value })}
                placeholder="Nom du responsable" />
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea value={form.comment} rows={2}
                onChange={e => setForm({ ...form, comment: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenCreate(false)}>Annuler</Button>
              <Button onClick={createInventory}>Démarrer le comptage</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View dialog (validated) */}
      <Dialog open={!!viewInv} onOpenChange={(o) => !o && setViewInv(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewInv?.name || 'Inventaire'}</DialogTitle>
          </DialogHeader>
          {viewInv && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {format(new Date(viewInv.inventory_date), 'dd MMMM yyyy', { locale: fr })}
                {viewInv.responsible_name && ` — ${viewInv.responsible_name}`}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <KpiTile icon={Package} label="Produits" value={viewInv.products_checked.toString()} />
                <KpiTile icon={AlertTriangle} label="Écart" value={viewInv.total_variance.toString()} />
                <KpiTile icon={ClipboardCheck} label="Valeur" value={displayAmount(Number(viewInv.variance_value))} />
                <KpiTile icon={CheckCircle2} label="Précision" value={`${Number(viewInv.accuracy_rate).toFixed(1)}%`} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Système</TableHead>
                    <TableHead className="text-right">Compté</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewItems.map(r => {
                    const p = productMap.get(r.product_id);
                    const diff = r.counted_qty - r.system_qty;
                    return (
                      <TableRow key={r.product_id}>
                        <TableCell>{p?.name || '—'}</TableCell>
                        <TableCell className="text-right">{r.system_qty}</TableCell>
                        <TableCell className="text-right">{r.counted_qty}</TableCell>
                        <TableCell className={`text-right ${diff < 0 ? 'text-destructive' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                        <TableCell className="text-right">{displayAmount(diff * r.unit_price)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => exportCSV(viewItems, viewInv)}>
                  <FileSpreadsheet className="w-4 h-4 mr-1" />Excel
                </Button>
                <Button size="sm" onClick={() => setViewInv(null)}>Fermer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, tone }: {
  icon: any; label: string; value: string; tone?: 'success' | 'destructive';
}) {
  const toneClass = tone === 'destructive'
    ? 'text-destructive bg-destructive/10'
    : tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      : 'text-primary bg-primary/10';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${toneClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="font-bold text-base truncate">{value}</p>
    </div>
  );
}