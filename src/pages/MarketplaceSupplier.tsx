import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Store, MapPin, Phone, Mail, Package, ShoppingCart, Trash2, Plus, Send, MessageSquare, Truck, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupplierInfo {
  user_id: string; company_name: string; full_name: string; city: string; country: string;
  phone: string; email: string; description: string; categories: string[];
  delivery_zones: string[]; min_order: number; rating: number; orders_count: number;
  product_count: number; logo_url: string | null;
}
interface CatalogItem {
  id: string; name: string; description: string; category: string; unit: string;
  unit_price: number; wholesale_price: number; show_public_price: boolean;
  sku: string | null; barcode: string | null; in_stock: boolean;
}
interface CartLine { product_id: string; product_name: string; quantity: number; unit_price: number; }

export default function MarketplaceSupplier() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<'quote' | 'direct'>('quote');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Delivery estimation
  const [shippingMode, setShippingMode] = useState<'pickup' | 'standard' | 'express'>('standard');
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [totalWeightKg, setTotalWeightKg] = useState<number>(5);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    const supRes: any = await (supabase.rpc as any)('get_public_suppliers', { _search: null, _city: null, _country: null, _category: null });
    const found = (supRes?.data as SupplierInfo[] | undefined)?.find(s => s.user_id === id);
    if (found) setSupplier(found);
    const catRes: any = await (supabase.rpc as any)('get_supplier_public_catalog', { _supplier_user_id: id });
    if (catRes?.data) setCatalog(catRes.data as CatalogItem[]);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addToCart = (p: CatalogItem) => {
    const price = p.show_public_price ? (p.wholesale_price || p.unit_price) : 0;
    setCart(prev => {
      const existing = prev.find(l => l.product_id === p.id);
      if (existing) return prev.map(l => l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: price }];
    });
  };
  const updateLine = (pid: string, patch: Partial<CartLine>) => setCart(prev => prev.map(l => l.product_id === pid ? { ...l, ...patch } : l));
  const removeLine = (pid: string) => setCart(prev => prev.filter(l => l.product_id !== pid));

  const subtotal = cart.reduce((s, l) => s + l.quantity * (l.unit_price || 0), 0);

  // Shipping calculation (XAF). Tunable rates.
  const shippingConfig = {
    pickup:   { base: 0,    perKm: 0,   perKg: 0,   minDays: 0, maxDays: 0, label: 'Retrait sur place' },
    standard: { base: 1500, perKm: 150, perKg: 100, minDays: 2, maxDays: 5, label: 'Standard' },
    express:  { base: 3000, perKm: 300, perKg: 200, minDays: 1, maxDays: 2, label: 'Express' },
  } as const;
  const sc = shippingConfig[shippingMode];
  const shippingCost = Math.round(sc.base + sc.perKm * Math.max(0, distanceKm) + sc.perKg * Math.max(0, totalWeightKg));
  const grandTotal = subtotal + shippingCost;
  const today = new Date();
  const minDate = new Date(today); minDate.setDate(today.getDate() + sc.minDays);
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + sc.maxDays);
  const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  const deliveryEstimate = shippingMode === 'pickup'
    ? 'Disponible immédiatement après confirmation'
    : sc.minDays === sc.maxDays ? `Sous ${sc.minDays} jour(s) (${fmtDate(minDate)})` : `Entre ${fmtDate(minDate)} et ${fmtDate(maxDate)} (${sc.minDays}–${sc.maxDays} jours)`;

  const submitOrder = async () => {
    if (!user || !supplier || cart.length === 0) return;
    setSubmitting(true);
    const numRes: any = await (supabase.rpc as any)('generate_marketplace_order_number', { _user_id: user.id });
    const number = numRes?.data || `MO-${Date.now()}`;
    const shippingNote = `\n\n— Livraison —\nMode: ${sc.label}\nDistance: ${distanceKm} km · Poids: ${totalWeightKg} kg\nFrais estimés: ${shippingCost.toLocaleString()} XAF\nDélai: ${deliveryEstimate}`;
    const { data: order, error } = await (supabase.from as any)('marketplace_orders').insert({
      number, buyer_user_id: user.id, supplier_user_id: supplier.user_id,
      status: orderType === 'direct' ? 'confirmed' : 'quote_request',
      order_type: orderType,
      subtotal, total: grandTotal, currency: 'XAF',
      delivery_address: deliveryAddress, delivery_city: deliveryCity,
      expected_delivery: shippingMode === 'pickup' ? null : maxDate.toISOString().slice(0, 10),
      buyer_notes: (notes || '') + shippingNote,
    }).select().single();
    if (error || !order) { setSubmitting(false); return toast({ title: 'Erreur', description: error?.message, variant: 'destructive' }); }
    const items = cart.map(l => ({ order_id: order.id, product_id: l.product_id, product_name: l.product_name, quantity: l.quantity, unit_price: l.unit_price, total: l.quantity * l.unit_price }));
    await (supabase.from as any)('marketplace_order_items').insert(items);
    setSubmitting(false); setOpen(false); setCart([]);
    toast({ title: orderType === 'quote' ? 'Demande de devis envoyée' : 'Commande envoyée' });
    navigate('/marketplace/orders');
  };

  if (!supplier) return <div className="page-container"><p className="text-sm text-muted-foreground">Chargement...</p></div>;

  return (
    <div className="page-container">
      <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4 mr-1.5" />Retour au marketplace
      </Link>

      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {supplier.logo_url ? <img src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover" /> : <Store className="w-7 h-7 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold truncate">{supplier.company_name || supplier.full_name}</h1>
              {supplier.description && <p className="text-sm text-muted-foreground mt-1">{supplier.description}</p>}
              <div className="flex flex-wrap gap-1 mt-2">
                {supplier.categories?.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t text-sm text-muted-foreground">
            {(supplier.city || supplier.country) && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{[supplier.city, supplier.country].filter(Boolean).join(', ')}</div>}
            {supplier.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{supplier.phone}</div>}
            {supplier.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{supplier.email}</div>}
            {supplier.min_order > 0 && <div>Commande min : <strong>{supplier.min_order}</strong></div>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Package className="w-4 h-4" />Catalogue ({catalog.length})</h2>
        {cart.length > 0 && (
          <Button onClick={() => setOpen(true)}>
            <ShoppingCart className="w-4 h-4 mr-1.5" />Panier ({cart.length}) — {subtotal.toLocaleString()}
          </Button>
        )}
      </div>

      {catalog.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Ce fournisseur n'a pas encore publié de produits</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {catalog.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name}</p>
                    {p.category && <Badge variant="outline" className="text-[10px] mt-1">{p.category}</Badge>}
                  </div>
                  {p.in_stock ? <Badge className="bg-green-100 text-green-700 text-[10px]">En stock</Badge> : <Badge variant="outline" className="text-[10px]">Sur cmd</Badge>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{p.description}</p>}
                <div className="flex items-end justify-between mt-3 pt-3 border-t">
                  <div>
                    {p.show_public_price ? (
                      <p className="font-semibold">{(p.wholesale_price || p.unit_price).toLocaleString()} <span className="text-xs text-muted-foreground">/{p.unit}</span></p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Prix sur demande</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => addToCart(p)}><Plus className="w-3.5 h-3.5 mr-1" />Ajouter</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Votre demande</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              {cart.map(l => (
                <div key={l.product_id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{l.product_name}</p>
                    <p className="text-xs text-muted-foreground">PU : {l.unit_price.toLocaleString()}</p>
                  </div>
                  <Input type="number" min={1} className="w-20" value={l.quantity} onChange={e => updateLine(l.product_id, { quantity: Math.max(1, Number(e.target.value)) })} />
                  <Input type="number" min={0} className="w-24" value={l.unit_price} onChange={e => updateLine(l.product_id, { unit_price: Number(e.target.value) })} />
                  <Button size="sm" variant="ghost" onClick={() => removeLine(l.product_id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              ))}
              <div className="text-right text-sm text-muted-foreground">Sous-total : {subtotal.toLocaleString()} XAF</div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="w-4 h-4 text-primary" />Frais & délais de livraison
              </div>
              <div>
                <Label className="text-xs">Mode</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(['pickup','standard','express'] as const).map(m => (
                    <Button key={m} type="button" size="sm" variant={shippingMode === m ? 'default' : 'outline'} onClick={() => setShippingMode(m)}>
                      {shippingConfig[m].label}
                    </Button>
                  ))}
                </div>
              </div>
              {shippingMode !== 'pickup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Distance estimée (km)</Label>
                    <Input type="number" min={0} value={distanceKm} onChange={e => setDistanceKm(Math.max(0, Number(e.target.value)))} />
                  </div>
                  <div>
                    <Label className="text-xs">Poids total (kg)</Label>
                    <Input type="number" min={0} step="0.1" value={totalWeightKg} onChange={e => setTotalWeightKg(Math.max(0, Number(e.target.value)))} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Calculator className="w-3.5 h-3.5" />Frais estimés</span>
                <span className="font-semibold">{shippingCost.toLocaleString()} XAF</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Délai estimé</span>
                <span className="font-medium text-foreground">{deliveryEstimate}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold border-t pt-2">
                <span>Total TTC</span>
                <span>{grandTotal.toLocaleString()} XAF</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Estimation indicative — sera confirmée par le fournisseur.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
              <div className="sm:col-span-2">
                <Label>Type de demande</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" size="sm" variant={orderType === 'quote' ? 'default' : 'outline'} onClick={() => setOrderType('quote')}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Demande de devis
                  </Button>
                  <Button type="button" size="sm" variant={orderType === 'direct' ? 'default' : 'outline'} onClick={() => setOrderType('direct')}>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Commande directe
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {orderType === 'quote' ? 'Le fournisseur ajustera prix/délais avant confirmation' : 'Commande envoyée pour validation immédiate'}
                </p>
              </div>
              <div><Label>Adresse de livraison</Label><Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} /></div>
              <div><Label>Ville</Label><Input value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>Note pour le fournisseur</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submitOrder} disabled={submitting || cart.length === 0}>
              <Send className="w-4 h-4 mr-1.5" />{submitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}