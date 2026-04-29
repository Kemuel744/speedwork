import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Warehouse, Store, Search, Save, Package, Plus, Boxes, Coins, Layers } from 'lucide-react';
import { usePlanQuota } from '@/hooks/usePlanQuota';

interface LocRow { id: string; name: string; location_type: string; address: string; city: string; }
interface ProductRow { id: string; name: string; sku: string | null; barcode: string | null; alert_threshold: number; cost_price: number; unit_price: number; }
interface StockRow { product_id: string; quantity: number; alert_threshold: number; }

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const productsQuota = usePlanQuota('products');
  const [loc, setLoc] = useState<LocRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockRow>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', sku: '', barcode: '', cost_price: '', unit_price: '', quantity: '' });
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user || !id) return;
    const [locRes, prodRes, stockRes] = await Promise.all([
      supabase.from('locations').select('*').eq('id', id).maybeSingle(),
      supabase.from('products').select('id,name,sku,barcode,alert_threshold,cost_price,unit_price').eq('user_id', user.id).order('name'),
      supabase.from('location_stock').select('product_id,quantity,alert_threshold').eq('location_id', id).eq('user_id', user.id),
    ]);
    if (locRes.data) setLoc(locRes.data as LocRow);
    if (prodRes.data) setProducts(prodRes.data as ProductRow[]);
    const map: Record<string, StockRow> = {};
    (stockRes.data as StockRow[] | null)?.forEach(s => { map[s.product_id] = s; });
    setStockMap(map);
  }, [user, id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateOne = async (productId: string) => {
    if (!user || !id) return;
    const raw = drafts[productId];
    const costRaw = costDrafts[productId];
    const parsed = parseInt(raw ?? String(stockMap[productId]?.quantity ?? 0), 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return toast({
        title: 'Quantité invalide',
        description: 'Veuillez saisir un nombre entier positif.',
        variant: 'destructive',
      });
    }
    const qty = Math.max(0, parsed);
    setSaving(true);

    // SELECT-then-UPDATE/INSERT car variant_id est nullable et casse onConflict
    const { data: existing, error: selErr } = await supabase
      .from('location_stock')
      .select('id')
      .eq('user_id', user.id)
      .eq('location_id', id)
      .eq('product_id', productId)
      .is('variant_id', null)
      .maybeSingle();

    if (selErr) {
      setSaving(false);
      return toast({ title: 'Erreur', description: selErr.message, variant: 'destructive' });
    }

    const { error } = existing
      ? await supabase.from('location_stock').update({ quantity: qty }).eq('id', existing.id)
      : await supabase.from('location_stock').insert({
          user_id: user.id,
          location_id: id,
          product_id: productId,
          quantity: qty,
        } as never);

    setSaving(false);
    if (error) {
      if (/column .* does not exist|relation .* does not exist|schema/i.test(error.message)) {
        return toast({
          title: 'Format de table inattendu',
          description: `La table location_stock ne correspond pas au format attendu (${error.message}). Contactez le support.`,
          variant: 'destructive',
        });
      }
      return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }

    // Optionnel : mise à jour du prix d'achat (coût) sur la fiche produit
    if (costRaw !== undefined && costRaw !== '') {
      const costNum = parseFloat(costRaw.replace(',', '.'));
      if (!Number.isNaN(costNum) && costNum >= 0) {
        await supabase.from('products').update({ cost_price: costNum }).eq('id', productId).eq('user_id', user.id);
      }
    }

    toast({ title: 'Stock mis à jour' });
    setDrafts(d => { const n = { ...d }; delete n[productId]; return n; });
    setCostDrafts(d => { const n = { ...d }; delete n[productId]; return n; });
    fetchAll();
  };

  const createProduct = async () => {
    if (!user || !id) return;
    if (!newProd.name.trim()) {
      return toast({ title: 'Nom requis', variant: 'destructive' });
    }
    if (productsQuota.cap !== null && productsQuota.used >= productsQuota.cap) {
      return toast({
        title: 'Limite du plan atteinte',
        description: `Le plan ${productsQuota.planName} autorise ${productsQuota.cap} produits. Mettez à niveau votre abonnement pour en ajouter davantage.`,
        variant: 'destructive',
      });
    }
    const cost = parseFloat((newProd.cost_price || '0').replace(',', '.'));
    const price = parseFloat((newProd.unit_price || '0').replace(',', '.'));
    const qty = parseInt(newProd.quantity || '0', 10);
    if ([cost, price].some(n => Number.isNaN(n) || n < 0) || Number.isNaN(qty) || qty < 0) {
      return toast({ title: 'Valeurs numériques invalides', variant: 'destructive' });
    }
    setCreating(true);
    const { data: created, error } = await supabase.from('products').insert({
      user_id: user.id,
      name: newProd.name.trim(),
      sku: newProd.sku.trim() || null,
      barcode: newProd.barcode.trim() || null,
      cost_price: cost,
      unit_price: price,
      quantity_in_stock: qty,
    } as never).select('id').single();

    if (error || !created) {
      setCreating(false);
      return toast({ title: 'Erreur', description: error?.message ?? 'Création impossible', variant: 'destructive' });
    }

    if (qty > 0) {
      await supabase.from('location_stock').insert({
        user_id: user.id,
        location_id: id,
        product_id: (created as { id: string }).id,
        quantity: qty,
      } as never);
    }
    setCreating(false);
    setCreateOpen(false);
    setNewProd({ name: '', sku: '', barcode: '', cost_price: '', unit_price: '', quantity: '' });
    toast({ title: 'Produit créé et ajouté à ce lieu' });
    fetchAll();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  );

  // Statistiques agrégées sur ce lieu
  const stats = products.reduce(
    (acc, p) => {
      const qty = stockMap[p.id]?.quantity ?? 0;
      if (qty > 0) {
        acc.distinctProducts += 1;
        acc.totalUnits += qty;
        acc.purchaseValue += qty * (p.cost_price || 0);
        acc.saleValue += qty * (p.unit_price || 0);
      }
      return acc;
    },
    { distinctProducts: 0, totalUnits: 0, purchaseValue: 0, saleValue: 0 }
  );
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  return (
    <div className="page-container">
      <Link to="/locations" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4 mr-1.5" />Retour aux lieux
      </Link>

      {loc && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {loc.location_type === 'shop' ? <Store className="w-5 h-5 text-primary" /> : <Warehouse className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{loc.name}</h1>
              <p className="text-sm text-muted-foreground">
                {loc.location_type === 'shop' ? 'Boutique' : 'Dépôt'}
                {loc.city && ` · ${loc.city}`}
              </p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1.5" />Nouveau produit ici</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Ajouter un produit à ce lieu</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Nom du produit *</Label>
                  <Input value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>SKU</Label>
                    <Input value={newProd.sku} onChange={e => setNewProd(p => ({ ...p, sku: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Code-barres</Label>
                    <Input value={newProd.barcode} onChange={e => setNewProd(p => ({ ...p, barcode: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Prix d'achat</Label>
                    <Input type="number" min={0} value={newProd.cost_price} onChange={e => setNewProd(p => ({ ...p, cost_price: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Prix de vente</Label>
                    <Input type="number" min={0} value={newProd.unit_price} onChange={e => setNewProd(p => ({ ...p, unit_price: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Quantité initiale</Label>
                    <Input type="number" min={0} value={newProd.quantity} onChange={e => setNewProd(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                <Button onClick={createProduct} disabled={creating}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Statistiques agrégées du stock dans ce lieu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Layers className="w-3.5 h-3.5" />Produits en stock</div>
          <p className="text-2xl font-bold mt-1">{stats.distinctProducts}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Boxes className="w-3.5 h-3.5" />Unités totales</div>
          <p className="text-2xl font-bold mt-1">{fmt(stats.totalUnits)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Coins className="w-3.5 h-3.5" />Valeur d'achat</div>
          <p className="text-2xl font-bold mt-1">{fmt(stats.purchaseValue)}</p>
          <p className="text-[11px] text-muted-foreground">Coût × quantités</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Coins className="w-3.5 h-3.5" />Valeur de vente</div>
          <p className="text-2xl font-bold mt-1">{fmt(stats.saleValue)}</p>
          <p className="text-[11px] text-muted-foreground">Prix vente × quantités</p>
        </CardContent></Card>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher un produit (nom, SKU, code-barres)..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{products.length === 0 ? 'Aucun produit dans le catalogue' : 'Aucun résultat'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(p => {
                const s = stockMap[p.id];
                const qty = s?.quantity ?? 0;
                const threshold = s?.alert_threshold ?? p.alert_threshold;
                const isLow = qty <= threshold;
                const draft = drafts[p.id];
                const costDraft = costDrafts[p.id];
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4 hover:bg-secondary/30">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.sku && <>SKU: {p.sku} · </>}Stock actuel : <span className={isLow ? 'text-amber-600 font-semibold' : 'text-foreground font-semibold'}>{qty}</span>
                        {' '}· Coût : <span className="text-foreground font-semibold">{fmt(p.cost_price || 0)}</span>
                        {' '}· Valeur : <span className="text-foreground font-semibold">{fmt(qty * (p.cost_price || 0))}</span>
                        {isLow && <Badge variant="outline" className="ml-2 text-[10px] border-amber-300 text-amber-700">Bas</Badge>}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground mb-0.5">Quantité</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-24"
                        placeholder={String(qty)}
                        value={draft ?? ''}
                        onChange={e => setDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground mb-0.5">Prix d'achat</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-28"
                        placeholder={String(p.cost_price || 0)}
                        value={costDraft ?? ''}
                        onChange={e => setCostDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                      />
                    </div>
                    <Button size="sm" disabled={(draft === undefined && costDraft === undefined) || saving} onClick={() => updateOne(p.id)}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}