import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Truck, Plus, QrCode, Trash2, ArrowRight, ScanLine, X, Store, Warehouse } from 'lucide-react';
import QRScanner from '@/components/reports/QRScanner';
import QRCodeLib from 'qrcode';

interface TransferItem {
  product_id: string;
  description: string;
  quantity_sent: number;
}

interface Transfer {
  id: string; number: string; from_location_id: string; to_location_id: string;
  status: string; transfer_date: string; received_date: string | null;
  qr_token: string; notes: string;
}

interface Product { id: string; name: string; quantity_in_stock: number; }

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'En attente', variant: 'outline' },
  in_transit: { label: 'En transit', variant: 'secondary' },
  received: { label: 'Reçu', variant: 'default' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

export default function StockTransfers() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ token: string; number: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([
    { product_id: '', description: '', quantity_sent: 1 },
  ]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [trRes, prodRes] = await Promise.all([
      supabase.from('stock_transfers').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id,name,quantity_in_stock').order('name'),
    ]);
    if (trRes.data) setTransfers(trRes.data as Transfer[]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (qrModal) {
      const payload = JSON.stringify({ type: 'transfer', token: qrModal.token });
      QRCodeLib.toDataURL(payload, { width: 320, margin: 2 })
        .then(setQrDataUrl).catch(() => {});
    }
  }, [qrModal]);

  const addLine = () => setItems([...items, { product_id: '', description: '', quantity_sent: 1 }]);
  const removeLine = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof TransferItem, value: string | number) => {
    const next = [...items]; next[i] = { ...next[i], [field]: value };
    if (field === 'product_id') {
      const p = products.find(p => p.id === value);
      if (p) next[i].description = p.name;
    }
    setItems(next);
  };

  const reset = () => {
    setFromId(''); setToId(''); setNotes('');
    setTransferDate(new Date().toISOString().slice(0, 10));
    setItems([{ product_id: '', description: '', quantity_sent: 1 }]);
  };

  const create = async () => {
    if (!user || !fromId || !toId) {
      toast({ title: 'Sélectionnez les deux lieux', variant: 'destructive' });
      return;
    }
    if (fromId === toId) {
      toast({ title: 'Les lieux doivent être différents', variant: 'destructive' });
      return;
    }
    const validItems = items.filter(it => it.product_id && it.quantity_sent > 0);
    if (validItems.length === 0) {
      toast({ title: 'Ajoutez au moins un produit', variant: 'destructive' });
      return;
    }

    const { data: numberData } = await supabase.rpc('generate_transfer_number', { _user_id: user.id });
    const number = numberData || `TRF-${Date.now()}`;

    const { data: tr, error } = await supabase.from('stock_transfers').insert({
      user_id: user.id,
      number,
      from_location_id: fromId,
      to_location_id: toId,
      status: 'in_transit',
      transfer_date: transferDate,
      notes,
    } as never).select('*').single();

    if (error || !tr) {
      toast({ title: 'Erreur', description: error?.message, variant: 'destructive' });
      return;
    }

    const transfer = tr as unknown as Transfer;
    const itemsToInsert = validItems.map(it => ({
      user_id: user.id,
      transfer_id: transfer.id,
      product_id: it.product_id,
      quantity_sent: it.quantity_sent,
      quantity_received: 0,
    }));
    await supabase.from('stock_transfer_items').insert(itemsToInsert as never);

    toast({ title: `Transfert ${number} créé` });
    setOpen(false); reset(); fetchAll();
    setQrModal({ token: transfer.qr_token, number: transfer.number });
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce transfert ?')) return;
    await supabase.from('stock_transfers').delete().eq('id', id);
    toast({ title: 'Transfert supprimé' });
    fetchAll();
  };

  const handleScan = async (data: string) => {
    setScannerOpen(false);
    let token = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'transfer' && parsed.token) token = parsed.token;
    } catch { /* plain token */ }

    const { data: result, error } = await supabase.rpc('receive_stock_transfer', { _qr_token: token });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    const res = result as { success: boolean; transfer_number?: string; error?: string };
    if (res.success) {
      toast({ title: `Transfert ${res.transfer_number} reçu`, description: 'Stock mis à jour' });
      fetchAll();
    } else {
      toast({ title: 'Échec', description: res.error, variant: 'destructive' });
    }
  };

  const printQR = () => {
    if (!qrDataUrl || !qrModal) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${qrModal.number}</title></head><body style="text-align:center;padding:40px;font-family:sans-serif"><h2>Transfert ${qrModal.number}</h2><img src="${qrDataUrl}" style="max-width:320px"/><p style="color:#666;margin-top:16px">Scanner à la réception pour valider</p></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 200);
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            Transferts de stock
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Déplacez du stock entre vos lieux avec validation par QR code</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)} disabled={locations.length < 2}>
            <ScanLine className="w-4 h-4 mr-1.5" />Scanner réception
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button disabled={locations.length < 2}><Plus className="w-4 h-4 mr-1.5" />Nouveau transfert</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau transfert de stock</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Depuis *</Label>
                  <Select value={fromId} onValueChange={setFromId}>
                    <SelectTrigger><SelectValue placeholder="Lieu de départ" /></SelectTrigger>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vers *</Label>
                  <Select value={toId} onValueChange={setToId}>
                    <SelectTrigger><SelectValue placeholder="Lieu de destination" /></SelectTrigger>
                    <SelectContent>
                      {locations.filter(l => l.id !== fromId).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Date</Label>
                  <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <Label>Produits à transférer</Label>
                  <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-3.5 h-3.5 mr-1" />Ligne</Button>
                </div>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 bg-muted/30 p-2 rounded-lg">
                      <Select value={it.product_id} onValueChange={(v) => updateLine(i, 'product_id', v)}>
                        <SelectTrigger className="h-9 col-span-7 sm:col-span-8 text-xs">
                          <SelectValue placeholder="Choisir un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} <span className="text-muted-foreground">({p.quantity_in_stock})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number" min="1" placeholder="Qté"
                        value={it.quantity_sent}
                        onChange={e => updateLine(i, 'quantity_sent', Number(e.target.value))}
                        className="h-9 col-span-4 sm:col-span-3"
                      />
                      <Button variant="ghost" size="icon" className="col-span-1 h-9 w-9" onClick={() => removeLine(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <Label>Notes</Label>
                <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={create}>Créer & générer QR</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {locations.length < 2 && (
        <Card className="mb-4 border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground text-center">
            Vous devez avoir au moins <strong>2 lieux</strong> (boutiques/dépôts) pour créer un transfert. Allez dans <strong>Boutiques & Dépôts</strong>.
          </CardContent>
        </Card>
      )}

      {transfers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun transfert</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transfers.map(tr => {
            const from = locations.find(l => l.id === tr.from_location_id);
            const to = locations.find(l => l.id === tr.to_location_id);
            const st = statusLabels[tr.status] || statusLabels.pending;
            return (
              <Card key={tr.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{tr.number}</span>
                        <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-sm">
                        <span className="flex items-center gap-1">
                          {from?.location_type === 'shop' ? <Store className="w-3.5 h-3.5" /> : <Warehouse className="w-3.5 h-3.5" />}
                          <span className="truncate">{from?.name || '?'}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="flex items-center gap-1">
                          {to?.location_type === 'shop' ? <Store className="w-3.5 h-3.5" /> : <Warehouse className="w-3.5 h-3.5" />}
                          <span className="truncate">{to?.name || '?'}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(tr.transfer_date).toLocaleDateString('fr-FR')}
                        {tr.received_date && ` • Reçu le ${new Date(tr.received_date).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {tr.status !== 'received' && (
                        <Button size="sm" variant="outline" onClick={() => setQrModal({ token: tr.qr_token, number: tr.number })}>
                          <QrCode className="w-3.5 h-3.5 mr-1" />QR
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(tr.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!qrModal} onOpenChange={(v) => !v && setQrModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR de validation — {qrModal?.number}</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="mx-auto rounded-lg border" />}
            <p className="text-xs text-muted-foreground">
              Scannez ce QR au lieu d'arrivée pour valider la réception et mettre à jour le stock.
            </p>
            <Button onClick={printQR} variant="outline" className="w-full">Imprimer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </div>
  );
}
