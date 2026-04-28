import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ShoppingCart, MessageCircle, Send, Package, Check, X, Truck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string; number: string; buyer_user_id: string; supplier_user_id: string;
  status: string; order_type: string; subtotal: number; total: number; currency: string;
  delivery_address: string; delivery_city: string; expected_delivery: string | null;
  buyer_notes: string; supplier_notes: string; created_at: string;
}
interface OrderItem { id: string; product_name: string; quantity: number; unit_price: number; total: number; }
interface Message { id: string; order_id: string; sender_user_id: string; content: string; created_at: string; }
interface PartyProfile { user_id: string; company_name: string; email: string; phone: string; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  quote_request: { label: 'Devis demandé', color: 'bg-amber-100 text-amber-700' },
  quote_sent: { label: 'Devis envoyé', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmée', color: 'bg-green-100 text-green-700' },
  shipped: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Livrée', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-600' },
  rejected: { label: 'Refusée', color: 'bg-red-100 text-red-700' },
};

export default function MarketplaceOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PartyProfile>>({});
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from as any)('marketplace_orders')
      .select('*')
      .or(`buyer_user_id.eq.${user.id},supplier_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (data) {
      setOrders(data as Order[]);
      const userIds = Array.from(new Set((data as Order[]).flatMap(o => [o.buyer_user_id, o.supplier_user_id])));
      const { data: profs } = await supabase.from('profiles').select('user_id,company_name,email,phone').in('user_id', userIds);
      if (profs) {
        const map: Record<string, PartyProfile> = {};
        (profs as PartyProfile[]).forEach(p => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = async (o: Order) => {
    setSelected(o);
    const [itemsRes, msgsRes]: [any, any] = await Promise.all([
      (supabase.from as any)('marketplace_order_items').select('*').eq('order_id', o.id).order('created_at'),
      (supabase.from as any)('marketplace_messages').select('*').eq('order_id', o.id).order('created_at'),
    ]);
    if (itemsRes?.data) setItems(itemsRes.data as OrderItem[]);
    if (msgsRes?.data) setMessages(msgsRes.data as Message[]);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    const { error } = await (supabase.from as any)('marketplace_orders').update({ status }).eq('id', selected.id);
    if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    toast({ title: `Statut → ${STATUS_LABEL[status]?.label || status}` });
    setSelected({ ...selected, status });
    fetchOrders();
  };

  const sendMessage = async () => {
    if (!user || !selected || !newMsg.trim()) return;
    const { error } = await (supabase.from as any)('marketplace_messages').insert({
      order_id: selected.id, sender_user_id: user.id, content: newMsg.trim(),
    });
    if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    setNewMsg('');
    const { data } = await (supabase.from as any)('marketplace_messages').select('*').eq('order_id', selected.id).order('created_at');
    if (data) setMessages(data as Message[]);
  };

  const asBuyer = orders.filter(o => o.buyer_user_id === user?.id);
  const asSupplier = orders.filter(o => o.supplier_user_id === user?.id);

  const renderList = (list: Order[], role: 'buyer' | 'supplier') => list.length === 0 ? (
    <Card><CardContent className="p-12 text-center text-muted-foreground">
      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Aucune commande {role === 'buyer' ? 'envoyée' : 'reçue'}</p>
    </CardContent></Card>
  ) : (
    <div className="space-y-2">
      {list.map(o => {
        const otherId = role === 'buyer' ? o.supplier_user_id : o.buyer_user_id;
        const other = profiles[otherId];
        const st = STATUS_LABEL[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-600' };
        return (
          <Card key={o.id} className="hover:shadow-sm cursor-pointer transition-shadow" onClick={() => openDetail(o)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{o.number}</p>
                  <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                  <Badge variant="outline" className="text-[10px]">{o.order_type === 'quote' ? 'Devis' : 'Direct'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {role === 'buyer' ? 'Fournisseur' : 'Client'} : {other?.company_name || other?.email || '—'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">{o.total.toLocaleString()} {o.currency}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const isSupplierView = selected?.supplier_user_id === user?.id;
  const otherProfile = selected ? profiles[isSupplierView ? selected.buyer_user_id : selected.supplier_user_id] : null;

  return (
    <div className="page-container">
      <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4 mr-1.5" />Marketplace
      </Link>
      <h1 className="section-title mb-6 flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" />Mes commandes marketplace</h1>

      <Tabs defaultValue="buyer">
        <TabsList>
          <TabsTrigger value="buyer">Mes achats ({asBuyer.length})</TabsTrigger>
          <TabsTrigger value="supplier">Mes ventes ({asSupplier.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="buyer">{renderList(asBuyer, 'buyer')}</TabsContent>
        <TabsContent value="supplier">{renderList(asSupplier, 'supplier')}</TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  Commande {selected.number}
                  <Badge className={`text-xs ${STATUS_LABEL[selected.status]?.color || 'bg-gray-100'}`}>{STATUS_LABEL[selected.status]?.label}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="text-sm space-y-1 pb-3 border-b">
                <p><strong>{isSupplierView ? 'Acheteur' : 'Fournisseur'} :</strong> {otherProfile?.company_name || '—'}</p>
                {otherProfile?.email && <p className="text-xs text-muted-foreground">{otherProfile.email}{otherProfile.phone && ` · ${otherProfile.phone}`}</p>}
                {selected.delivery_address && <p className="text-xs text-muted-foreground">Livraison : {selected.delivery_address}, {selected.delivery_city}</p>}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Articles</h3>
                <div className="space-y-1">
                  {items.map(i => (
                    <div key={i.id} className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded">
                      <span className="truncate">{i.product_name} <span className="text-xs text-muted-foreground">× {i.quantity}</span></span>
                      <span className="font-medium">{i.total.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                    <span>Total</span><span>{selected.total.toLocaleString()} {selected.currency}</span>
                  </div>
                </div>
              </div>

              {/* Actions selon rôle + statut */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {isSupplierView && selected.status === 'quote_request' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus('quote_sent')}><Send className="w-3.5 h-3.5 mr-1" />Envoyer devis</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus('rejected')}><X className="w-3.5 h-3.5 mr-1" />Refuser</Button>
                  </>
                )}
                {isSupplierView && selected.status === 'confirmed' && (
                  <Button size="sm" onClick={() => updateStatus('shipped')}><Truck className="w-3.5 h-3.5 mr-1" />Marquer expédiée</Button>
                )}
                {isSupplierView && selected.status === 'shipped' && (
                  <Button size="sm" onClick={() => updateStatus('delivered')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Marquer livrée</Button>
                )}
                {!isSupplierView && (selected.status === 'quote_sent') && (
                  <>
                    <Button size="sm" onClick={() => updateStatus('confirmed')}><Check className="w-3.5 h-3.5 mr-1" />Accepter le devis</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus('cancelled')}><X className="w-3.5 h-3.5 mr-1" />Annuler</Button>
                  </>
                )}
                {!isSupplierView && selected.status === 'shipped' && (
                  <Button size="sm" onClick={() => updateStatus('delivered')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Confirmer réception</Button>
                )}
                {!isSupplierView && ['quote_request', 'quote_sent', 'confirmed'].includes(selected.status) && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus('cancelled')}>Annuler</Button>
                )}
              </div>

              {/* Messagerie */}
              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageCircle className="w-4 h-4" />Discussion ({messages.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto bg-secondary/20 p-2 rounded">
                  {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucun message</p>}
                  {messages.map(m => (
                    <div key={m.id} className={`text-sm p-2 rounded max-w-[85%] ${m.sender_user_id === user?.id ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Écrire un message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <Button size="sm" onClick={sendMessage} disabled={!newMsg.trim()}><Send className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}