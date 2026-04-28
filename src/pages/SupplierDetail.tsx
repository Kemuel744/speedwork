import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Truck, Plus, Trash2, Star, Package, Mail, Phone, MapPin, Clock } from 'lucide-react';

interface Supplier { id: string; name: string; contact_person: string; email: string; phone: string; city: string; country: string; payment_terms: string; }
interface Product { id: string; name: string; sku: string | null; }
interface SupplierLink { id: string; product_id: string; supplier_sku: string; cost_price: number; lead_time_days: number; min_order_qty: number; is_preferred: boolean; }

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<SupplierLink[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', supplier_sku: '', cost_price: 0, lead_time_days: 0, min_order_qty: 1, is_preferred: false });

  const fetchAll = useCallback(async () => {
    if (!user || !id) return;
    const [supRes, prodRes, linkRes] = await Promise.all([
      supabase.from('suppliers').select('*').eq('id', id).maybeSingle(),
      supabase.from('products').select('id,name,sku').eq('user_id', user.id).order('name'),
      supabase.from('product_suppliers' as never).select('*').eq('supplier_id', id).eq('user_id', user.id),
    ]);
    if (supRes.data) setSupplier(supRes.data as Supplier);
    if (prodRes.data) setAllProducts(prodRes.data as Product[]);
    if (linkRes.data) setLinks(linkRes.data as SupplierLink[]);
  }, [user, id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const productById = (pid: string) => allProducts.find(p => p.id === pid);
  const linkedIds = new Set(links.map(l => l.product_id));
  const availableProducts = allProducts.filter(p => !linkedIds.has(p.id));

  // Regroupement des produits liés par délai de livraison (lead_time_days)
  const groupedByLeadTime = React.useMemo(() => {
    const groups = new Map<number, SupplierLink[]>();
    links.forEach(l => {
      const key = Number(l.lead_time_days) || 0;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(l);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [links]);

  const formatLeadTime = (days: number) => {
    if (days === 0) return 'Livraison immédiate';
    if (days === 1) return 'Livraison sous 1 jour';
    if (days <= 7) return `Livraison sous ${days} jours`;
    if (days <= 14) return `Livraison sous 1-2 semaines (${days}j)`;
    if (days <= 30) return `Livraison sous 2-4 semaines (${days}j)`;
    return `Livraison longue (${days}j)`;
  };

  const addLink = async () => {
    if (!user || !id || !form.product_id) {
      toast({ title: 'Sélectionnez un produit', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('product_suppliers' as never).insert({
      user_id: user.id,
      supplier_id: id,
      product_id: form.product_id,
      supplier_sku: form.supplier_sku,
      cost_price: Number(form.cost_price) || 0,
      lead_time_days: Number(form.lead_time_days) || 0,
      min_order_qty: Number(form.min_order_qty) || 1,
      is_preferred: form.is_preferred,
    } as never);
    if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    toast({ title: 'Produit ajouté' });
    setOpen(false);
    setForm({ product_id: '', supplier_sku: '', cost_price: 0, lead_time_days: 0, min_order_qty: 1, is_preferred: false });
    fetchAll();
  };

  const removeLink = async (linkId: string) => {
    if (!confirm('Retirer ce produit du fournisseur ?')) return;
    await supabase.from('product_suppliers' as never).delete().eq('id', linkId);
    fetchAll();
  };

  const togglePreferred = async (linkId: string, value: boolean) => {
    await supabase.from('product_suppliers' as never).update({ is_preferred: value } as never).eq('id', linkId);
    fetchAll();
  };

  return (
    <div className="page-container">
      <RouterLink to="/suppliers" />

      {supplier && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{supplier.name}</h1>
              {supplier.contact_person && <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>}
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-muted-foreground">
              {supplier.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{supplier.email}</div>}
              {supplier.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{supplier.phone}</div>}
              {(supplier.city || supplier.country) && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{[supplier.city, supplier.country].filter(Boolean).join(', ')}</div>}
              {supplier.payment_terms && <div className="flex items-center gap-2"><Badge variant="outline">{supplier.payment_terms}</Badge></div>}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />Produits fournis ({links.length})
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={availableProducts.length === 0}>
              <Plus className="w-4 h-4 mr-1.5" />Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Lier un produit à ce fournisseur</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Produit *</Label>
                <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Référence fournisseur</Label><Input value={form.supplier_sku} onChange={e => setForm({ ...form, supplier_sku: e.target.value })} /></div>
                <div><Label>Prix d'achat</Label><Input type="number" min={0} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} /></div>
                <div><Label>Délai (jours)</Label><Input type="number" min={0} value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: Number(e.target.value) })} /></div>
                <div><Label>Qté minimum</Label><Input type="number" min={1} value={form.min_order_qty} onChange={e => setForm({ ...form, min_order_qty: Number(e.target.value) })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.is_preferred} onCheckedChange={v => setForm({ ...form, is_preferred: !!v })} />
                Fournisseur préféré pour ce produit
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={addLink}>Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {links.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun produit lié à ce fournisseur</p>
            </div>
          ) : (
            <div>
              {groupedByLeadTime.map(([days, items]) => (
                <div key={days}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border-y text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Clock className="w-3.5 h-3.5" />
                    {formatLeadTime(days)}
                    <Badge variant="outline" className="ml-auto text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="divide-y">
                    {items.map(l => {
                      const p = productById(l.product_id);
                      return (
                        <div key={l.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/30">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate flex items-center gap-2">
                              {p?.name || 'Produit supprimé'}
                              {l.is_preferred && <Badge className="text-[10px]"><Star className="w-3 h-3 mr-0.5" />Préféré</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {l.supplier_sku && <>Réf : {l.supplier_sku} · </>}
                              Prix : <strong>{l.cost_price}</strong>
                              {l.min_order_qty > 1 && <> · min {l.min_order_qty}</>}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => togglePreferred(l.id, !l.is_preferred)} title={l.is_preferred ? 'Retirer préféré' : 'Marquer préféré'}>
                            <Star className={`w-3.5 h-3.5 ${l.is_preferred ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeLink(l.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RouterLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
      <ArrowLeft className="w-4 h-4 mr-1.5" />Retour aux fournisseurs
    </Link>
  );
}