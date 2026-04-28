import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Grid3x3, Search, Save, Store, Warehouse } from 'lucide-react';

interface LocRow { id: string; name: string; location_type: string; }
interface ProductRow { id: string; name: string; sku: string | null; }
interface StockRow { product_id: string; location_id: string; quantity: number; }

export default function MultiDepotStock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<LocRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // key = productId|locId
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [locRes, prodRes, stockRes] = await Promise.all([
      supabase.from('locations').select('id,name,location_type').eq('user_id', user.id).eq('is_active', true).order('is_default', { ascending: false }).order('name'),
      supabase.from('products').select('id,name,sku').eq('user_id', user.id).order('name'),
      supabase.from('location_stock').select('product_id,location_id,quantity').eq('user_id', user.id),
    ]);
    if (locRes.data) setLocations(locRes.data as LocRow[]);
    if (prodRes.data) setProducts(prodRes.data as ProductRow[]);
    const m: Record<string, Record<string, number>> = {};
    (stockRes.data as StockRow[] | null)?.forEach(s => {
      m[s.product_id] = m[s.product_id] || {};
      m[s.product_id][s.location_id] = s.quantity;
    });
    setMatrix(m);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const dirtyCount = Object.keys(drafts).length;

  const saveAll = async () => {
    if (!user || dirtyCount === 0) return;

    // Validation : vérifier le format des entrées avant tout appel réseau
    const invalid: string[] = [];
    const parsed = Object.entries(drafts).map(([key, val]) => {
      const [productId, locationId] = key.split('|');
      const qty = parseInt(val || '0', 10);
      if (!productId || !locationId) invalid.push(key);
      if (Number.isNaN(qty) || qty < 0) invalid.push(key);
      return { productId, locationId, quantity: Math.max(0, qty || 0) };
    });
    if (invalid.length > 0) {
      return toast({
        title: 'Données invalides',
        description: `${invalid.length} cellule(s) contiennent des valeurs incorrectes. Veuillez saisir des nombres entiers positifs.`,
        variant: 'destructive',
      });
    }

    setSaving(true);

    // SELECT-then-UPDATE/INSERT (variant_id nullable empêche un onConflict fiable)
    let okCount = 0;
    const errors: string[] = [];
    for (const row of parsed) {
      const { data: existing, error: selErr } = await supabase
        .from('location_stock')
        .select('id')
        .eq('user_id', user.id)
        .eq('location_id', row.locationId)
        .eq('product_id', row.productId)
        .is('variant_id', null)
        .maybeSingle();

      if (selErr) {
        errors.push(selErr.message);
        continue;
      }

      const op = existing
        ? supabase.from('location_stock').update({ quantity: row.quantity }).eq('id', existing.id)
        : supabase.from('location_stock').insert({
            user_id: user.id,
            location_id: row.locationId,
            product_id: row.productId,
            quantity: row.quantity,
          } as never);

      const { error: opErr } = await op;
      if (opErr) {
        // Détection d'un schéma incompatible (colonne manquante, contrainte cassée…)
        if (/column .* does not exist|relation .* does not exist|schema/i.test(opErr.message)) {
          setSaving(false);
          return toast({
            title: 'Format de table inattendu',
            description: `La table location_stock ne correspond pas au format attendu (${opErr.message}). Contactez le support.`,
            variant: 'destructive',
          });
        }
        errors.push(opErr.message);
      } else {
        okCount++;
      }
    }

    setSaving(false);
    if (errors.length > 0) {
      return toast({
        title: `Enregistrement partiel (${okCount}/${parsed.length})`,
        description: errors[0],
        variant: 'destructive',
      });
    }
    toast({ title: `${okCount} stock(s) mis à jour` });
    setDrafts({});
    fetchAll();
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Grid3x3 className="w-5 h-5 text-primary" />
            </div>
            Stock multi-dépôts
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Vue tableau : produits × lieux. Modifiez les quantités directement.</p>
        </div>
        <Button onClick={saveAll} disabled={dirtyCount === 0 || saving}>
          <Save className="w-4 h-4 mr-1.5" />Enregistrer ({dirtyCount})
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {locations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Aucun lieu actif. <Link to="/locations" className="text-primary underline">Créer un lieu</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 sticky top-0">
                <tr>
                  <th className="text-left p-3 min-w-[200px]">Produit</th>
                  {locations.map(l => (
                    <th key={l.id} className="text-center p-3 min-w-[110px]">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                        {l.location_type === 'shop' ? <Store className="w-3 h-3" /> : <Warehouse className="w-3 h-3" />}
                        <span className="truncate max-w-[90px]">{l.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t hover:bg-secondary/20">
                    <td className="p-3">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                    </td>
                    {locations.map(l => {
                      const key = `${p.id}|${l.id}`;
                      const current = matrix[p.id]?.[l.id] ?? 0;
                      const draft = drafts[key];
                      return (
                        <td key={l.id} className="p-2 text-center">
                          <Input
                            type="number"
                            min={0}
                            className={`w-20 mx-auto text-center ${draft !== undefined ? 'border-primary' : ''}`}
                            value={draft ?? String(current)}
                            onChange={e => setDrafts(d => ({ ...d, [key]: e.target.value }))}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}