import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLocations } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, FileText, Mail, MessageSquare, Trash2, Check, Eye, CheckCheck, X } from 'lucide-react';
import { sendDocumentByEmail, sendDocumentByWhatsApp } from '@/lib/emailHelper';

interface POItem {
  id?: string;
  product_id: string | null;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total: number;
}

interface PORow {
  id: string;
  number: string;
  supplier_id: string;
  location_id: string | null;
  status: string;
  order_date: string;
  expected_date: string | null;
  subtotal: number;
  total: number;
  currency: string;
  notes: string;
  share_token: string | null;
}

interface Supplier { id: string; name: string; email: string; phone: string; }
interface Product { id: string; name: string; unit_price: number; cost_price: number; }

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  sent: { label: 'Envoyée', variant: 'secondary' },
  partial: { label: 'Partielle', variant: 'secondary' },
  received: { label: 'Reçue', variant: 'default' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
};

export default function PurchaseOrders() {
  const { user } = useAuth();
  const { company } = useCompany();
  const { locations } = useLocations();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PORow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [locationId, setLocationId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([
    { product_id: null, description: '', quantity_ordered: 1, quantity_received: 0, unit_price: 0, total: 0 },
  ]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [ordersRes, supRes, prodRes] = await Promise.all([
      supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('id,name,email,phone').eq('is_active', true).order('name'),
      supabase.from('products').select('id,name,unit_price,cost_price').order('name'),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as PORow[]);
    if (supRes.data) setSuppliers(supRes.data as Supplier[]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addLine = () => setItems([...items, { product_id: null, description: '', quantity_ordered: 1, quantity_received: 0, unit_price: 0, total: 0 }]);
  const removeLine = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof POItem, value: string | number) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    if (field === 'quantity_ordered' || field === 'unit_price') {
      next[i].total = Number(next[i].quantity_ordered || 0) * Number(next[i].unit_price || 0);
    }
    setItems(next);
  };

  const selectProduct = (i: number, productId: string) => {
    const p = products.find(p => p.id === productId);
    if (!p) return;
    const next = [...items];
    next[i] = {
      ...next[i],
      product_id: p.id,
      description: p.name,
      unit_price: p.cost_price || p.unit_price,
      total: Number(next[i].quantity_ordered) * (p.cost_price || p.unit_price),
    };
    setItems(next);
  };

  const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const total = subtotal;

  const reset = () => {
    setSupplierId(''); setLocationId(''); setNotes(''); setExpectedDate('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setItems([{ product_id: null, description: '', quantity_ordered: 1, quantity_received: 0, unit_price: 0, total: 0 }]);
  };

  const create = async () => {
    if (!user || !supplierId) {
      toast({ title: 'Sélectionnez un fournisseur', variant: 'destructive' });
      return;
    }
    const validItems = items.filter(it => it.description.trim() && it.quantity_ordered > 0);
    if (validItems.length === 0) {
      toast({ title: 'Ajoutez au moins une ligne', variant: 'destructive' });
      return;
    }

    const { data: numberData } = await supabase.rpc('generate_po_number', { _user_id: user.id });
    const number = numberData || `BC-${Date.now()}`;

    const { data: po, error } = await supabase.from('purchase_orders').insert({
      user_id: user.id,
      number,
      supplier_id: supplierId,
      location_id: locationId || null,
      status: 'draft',
      order_date: orderDate,
      expected_date: expectedDate || null,
      subtotal,
      total,
      currency: company.currency || 'XAF',
      notes,
    } as never).select('*').single();

    if (error || !po) {
      toast({ title: 'Erreur', description: error?.message, variant: 'destructive' });
      return;
    }

    const itemsToInsert = validItems.map(it => ({
      user_id: user.id,
      purchase_order_id: (po as PORow).id,
      product_id: it.product_id,
      description: it.description,
      quantity_ordered: it.quantity_ordered,
      quantity_received: 0,
      unit_price: it.unit_price,
      total: it.total,
    }));
    await supabase.from('purchase_order_items').insert(itemsToInsert as never);

    toast({ title: `Bon de commande ${number} créé` });
    setOpen(false); reset(); fetchAll();
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'received') patch.received_date = new Date().toISOString().slice(0, 10);
    await supabase.from('purchase_orders').update(patch as never).eq('id', id);

    if (status === 'received') {
      // Increment stock for each item
      const { data: poItems } = await supabase
        .from('purchase_order_items').select('*').eq('purchase_order_id', id);
      if (poItems) {
        for (const it of poItems) {
          const item = it as { product_id: string | null; quantity_ordered: number; id: string };
          if (item.product_id) {
            const { data: prod } = await supabase
              .from('products').select('quantity_in_stock').eq('id', item.product_id).single();
            if (prod) {
              const current = (prod as { quantity_in_stock: number }).quantity_in_stock;
              await supabase.from('products')
                .update({ quantity_in_stock: current + item.quantity_ordered } as never)
                .eq('id', item.product_id);
              await supabase.from('stock_movements').insert({
                user_id: user!.id,
                product_id: item.product_id,
                movement_type: 'entry',
                quantity: item.quantity_ordered,
                reason: `Réception bon de commande`,
              } as never);
            }
          }
          await supabase.from('purchase_order_items')
            .update({ quantity_received: item.quantity_ordered } as never).eq('id', item.id);
        }
      }
      toast({ title: 'Réception enregistrée — stock mis à jour' });
    } else {
      toast({ title: 'Statut mis à jour' });
    }
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce bon de commande ?')) return;
    await supabase.from('purchase_orders').delete().eq('id', id);
    toast({ title: 'Bon de commande supprimé' });
    fetchAll();
  };

  const sharePO = (po: PORow, channel: 'email' | 'whatsapp') => {
    const sup = suppliers.find(s => s.id === po.supplier_id);
    if (!sup) return;
    const url = `${window.location.origin}/purchase-order/${po.share_token}`;
    if (channel === 'email') {
      sendDocumentByEmail({
        recipientEmail: sup.email,
        recipientName: sup.name,
        documentType: 'invoice',
        documentNumber: po.number,
        companyName: company.name,
        subject: `Bon de commande ${po.number} — ${company.name}`,
        body: `Bonjour ${sup.name},\n\nVeuillez trouver notre bon de commande ${po.number}.\n\n📄 Consulter : ${url}\n\nMerci de confirmer la disponibilité et le délai de livraison.\n\nCordialement,\n${company.name}`,
        shareUrl: url,
      });
    } else {
      sendDocumentByWhatsApp({
        recipientPhone: sup.phone,
        recipientName: sup.name,
        documentType: 'invoice',
        documentNumber: po.number,
        companyName: company.name,
        message: `Bonjour ${sup.name},\n\nVeuillez trouver notre bon de commande ${po.number} de ${company.name}.\n\n📄 Consulter : ${url}\n\nMerci de confirmer la disponibilité et le délai de livraison.`,
        shareUrl: url,
      });
    }
    if (po.status === 'draft') updateStatus(po.id, 'sent');
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            Bons de commande
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Commandez à vos fournisseurs et suivez les réceptions</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button disabled={suppliers.length === 0}>
              <Plus className="w-4 h-4 mr-1.5" />Nouveau bon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau bon de commande</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Fournisseur *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Livrer à</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger><SelectValue placeholder="Aucun lieu spécifique" /></SelectTrigger>
                  <SelectContent>
                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de commande</Label>
                <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
              </div>
              <div>
                <Label>Date de livraison prévue</Label>
                <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <Label>Articles</Label>
                <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-3.5 h-3.5 mr-1" />Ligne</Button>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start bg-muted/30 p-2 rounded-lg">
                    <div className="col-span-12 sm:col-span-5">
                      {products.length > 0 && (
                        <Select value={it.product_id || ''} onValueChange={(v) => selectProduct(i, v)}>
                          <SelectTrigger className="h-9 mb-1.5 text-xs"><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      <Input
                        placeholder="Description *"
                        value={it.description}
                        onChange={e => updateLine(i, 'description', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Input
                      type="number" min="1" placeholder="Qté"
                      value={it.quantity_ordered}
                      onChange={e => updateLine(i, 'quantity_ordered', Number(e.target.value))}
                      className="h-9 col-span-3 sm:col-span-2"
                    />
                    <Input
                      type="number" min="0" step="0.01" placeholder="Prix"
                      value={it.unit_price}
                      onChange={e => updateLine(i, 'unit_price', Number(e.target.value))}
                      className="h-9 col-span-4 sm:col-span-2"
                    />
                    <div className="col-span-4 sm:col-span-2 text-right text-sm font-medium pt-2">
                      {it.total.toFixed(0)}
                    </div>
                    <Button variant="ghost" size="icon" className="col-span-1 h-9 w-9" onClick={() => removeLine(i)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 text-lg font-semibold">
                Total : {total.toFixed(0)} {company.currency || 'XAF'}
              </div>
            </div>

            <div className="mt-3">
              <Label>Notes</Label>
              <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions, instructions de livraison..." />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={create}>Créer le bon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {suppliers.length === 0 && (
        <Card className="mb-4 border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground text-center">
            Ajoutez d'abord des fournisseurs dans la section <strong>Fournisseurs</strong> avant de créer des bons de commande.
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun bon de commande</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(po => {
            const sup = suppliers.find(s => s.id === po.supplier_id);
            const loc = locations.find(l => l.id === po.location_id);
            const st = statusLabels[po.status] || statusLabels.draft;
            return (
              <Card key={po.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{po.number}</span>
                        <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                      </div>
                      <p className="font-medium mt-1 truncate">{sup?.name || 'Fournisseur supprimé'}</p>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(po.order_date).toLocaleDateString('fr-FR')}
                        {loc && ` • Livré à ${loc.name}`}
                        {po.expected_date && ` • Prévu ${new Date(po.expected_date).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">{Number(po.total).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">{po.currency}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    {po.share_token && (
                      <Button size="sm" variant="outline" onClick={() => window.open(`/purchase-order/${po.share_token}`, '_blank')}>
                        <Eye className="w-3.5 h-3.5 mr-1" />Voir
                      </Button>
                    )}
                    {sup?.email && (
                      <Button size="sm" variant="outline" onClick={() => sharePO(po, 'email')}>
                        <Mail className="w-3.5 h-3.5 mr-1" />Email
                      </Button>
                    )}
                    {sup?.phone && (
                      <Button size="sm" variant="outline" onClick={() => sharePO(po, 'whatsapp')}>
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />WhatsApp
                      </Button>
                    )}
                    {po.status !== 'received' && po.status !== 'cancelled' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(po.id, 'received')}>
                        <CheckCheck className="w-3.5 h-3.5 mr-1" />Marquer reçue
                      </Button>
                    )}
                    {po.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(po.id, 'cancelled')}>
                        <X className="w-3.5 h-3.5 mr-1" />Annuler
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(po.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
