import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Warehouse, Store, Search, Save, Package } from 'lucide-react';

interface LocRow { id: string; name: string; location_type: string; address: string; city: string; }
interface ProductRow { id: string; name: string; sku: string | null; barcode: string | null; alert_threshold: number; }
interface StockRow { product_id: string; quantity: number; alert_threshold: number; }

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loc, setLoc] = useState<LocRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockRow>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user || !id) return;
    const [locRes, prodRes, stockRes] = await Promise.all([
      supabase.from('locations').select('*').eq('id', id).maybeSingle(),
      supabase.from('products').select('id,name,sku,barcode,alert_threshold').eq('user_id', user.id).order('name'),
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
    const qty = Math.max(0, parseInt(raw || '0', 10) || 0);
    setSaving(true);
    const { error } = await supabase
      .from('location_stock')
      .upsert({ user_id: user.id, location_id: id, product_id: productId, quantity: qty } as never, { onConflict: 'location_id,product_id,variant_id' });
    setSaving(false);
    if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    toast({ title: 'Stock mis à jour' });
    setDrafts(d => { const n = { ...d }; delete n[productId]; return n; });
    fetchAll();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <Link to="/locations" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4 mr-1.5" />Retour aux lieux
      </Link>

      {loc && (
        <div className="flex items-center gap-3 mb-6">
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
      )}

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
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/30">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.sku && <>SKU: {p.sku} · </>}Stock actuel : <span className={isLow ? 'text-amber-600 font-semibold' : 'text-foreground font-semibold'}>{qty}</span>
                        {isLow && <Badge variant="outline" className="ml-2 text-[10px] border-amber-300 text-amber-700">Bas</Badge>}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      placeholder={String(qty)}
                      value={draft ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                    />
                    <Button size="sm" disabled={draft === undefined || saving} onClick={() => updateOne(p.id)}>
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