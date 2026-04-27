import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Undo2, Plus, Search, Trash2, Receipt, Printer } from 'lucide-react';
import { printReceipt } from '@/lib/thermalPrint';

interface SaleItem { product_id?: string; description: string; quantity: number; unit_price: number; total: number; variant_id?: string; }
interface Sale { id: string; receipt_number: string; sale_date: string; total: number; items: SaleItem[]; customer_id?: string; }
interface ReturnRow {
  id: string; number: string; sale_id: string | null; return_date: string;
  reason: string; refund_method: string; total_amount: number; restock: boolean; cashier_name: string;
  items?: { description: string; quantity: number; unit_price: number; total: number }[];
}
interface SelectedItem extends SaleItem { selected: boolean; returnQty: number; }

const refundMethods: Record<string, string> = {
  cash: 'Espèces', mobile_money: 'Mobile Money', bank: 'Virement', store_credit: 'Avoir magasin',
};

export default function Returns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [restock, setRestock] = useState(true);
  const [cashier, setCashier] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('sale_returns').select('*').order('created_at', { ascending: false });
    setReturns((data || []) as ReturnRow[]);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const searchSale = async () => {
    if (!search.trim()) return;
    const { data, error } = await supabase.from('sales').select('*').eq('receipt_number', search.trim()).maybeSingle();
    if (error || !data) { toast({ title: 'Vente introuvable', variant: 'destructive' }); setFoundSale(null); return; }
    const sale = data as unknown as Sale;
    setFoundSale(sale);
    setItems((sale.items || []).map(it => ({ ...it, selected: false, returnQty: it.quantity })));
  };

  const reset = () => {
    setSearch(''); setFoundSale(null); setItems([]);
    setReason(''); setRefundMethod('cash'); setRestock(true); setCashier('');
  };

  const totalRefund = items.filter(i => i.selected).reduce((s, i) => s + i.returnQty * i.unit_price, 0);

  const create = async () => {
    if (!user || !foundSale) return;
    const selected = items.filter(i => i.selected && i.returnQty > 0);
    if (selected.length === 0) { toast({ title: 'Sélectionnez au moins un produit', variant: 'destructive' }); return; }

    const { data: numData } = await supabase.rpc('generate_return_number', { _user_id: user.id });
    const number = numData || `RET-${Date.now()}`;

    // active session
    const { data: sess } = await supabase.from('cash_sessions').select('id').eq('status', 'open').maybeSingle();

    const { data: ret, error } = await supabase.from('sale_returns').insert({
      user_id: user.id, number, sale_id: foundSale.id,
      session_id: sess?.id || null,
      reason, refund_method: refundMethod, total_amount: totalRefund, restock,
      cashier_name: cashier,
    } as never).select('*').single();

    if (error || !ret) { toast({ title: 'Erreur', description: error?.message, variant: 'destructive' }); return; }
    const r = ret as unknown as ReturnRow;

    const itemsToInsert = selected.map(i => ({
      user_id: user.id, return_id: r.id, product_id: i.product_id || null, variant_id: i.variant_id || null,
      description: i.description, quantity: i.returnQty, unit_price: i.unit_price,
      total: i.returnQty * i.unit_price,
    }));
    await supabase.from('sale_return_items').insert(itemsToInsert as never);

    // Restock if requested
    if (restock) {
      for (const it of selected) {
        if (it.product_id) {
          const { data: prod } = await supabase.from('products').select('quantity_in_stock').eq('id', it.product_id).single();
          if (prod) {
            await supabase.from('products').update({
              quantity_in_stock: (prod.quantity_in_stock || 0) + it.returnQty,
            } as never).eq('id', it.product_id);
            await supabase.from('stock_movements').insert({
              user_id: user.id, product_id: it.product_id, movement_type: 'return',
              quantity: it.returnQty, reason: `Retour ${number}`,
            } as never);
          }
        }
      }
    }

    toast({ title: `Retour ${number} enregistré`, description: `Remboursement: ${displayAmount(totalRefund)}` });
    // Impression automatique du reçu de retour
    await printReceipt({
      kind: 'return',
      title: 'REÇU DE RETOUR',
      number,
      date: new Date(),
      cashier: cashier || undefined,
      lines: selected.map(i => ({
        label: i.description,
        qty: i.returnQty,
        unitPrice: i.unit_price,
        total: i.returnQty * i.unit_price,
      })),
      summary: [
        { label: 'Vente d\'origine', value: foundSale.receipt_number },
        { label: 'Mode remb.', value: refundMethods[refundMethod] || refundMethod },
        { label: 'Remis en stock', value: restock ? 'Oui' : 'Non' },
      ],
      totalLabel: 'REMBOURSÉ',
      totalValue: displayAmount(totalRefund),
      notes: reason || undefined,
      qrPayload: number,
    }).catch(() => { /* noop : ne bloque pas la sauvegarde */ });
    setOpen(false); reset(); fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce retour ?')) return;
    await supabase.from('sale_returns').delete().eq('id', id);
    fetchAll();
  };

  const reprint = async (r: ReturnRow) => {
    // Re-charge les items pour réimpression
    const { data } = await supabase.from('sale_return_items').select('description,quantity,unit_price,total').eq('return_id', r.id);
    await printReceipt({
      kind: 'return',
      title: 'REÇU DE RETOUR (copie)',
      number: r.number,
      date: new Date(r.return_date),
      cashier: r.cashier_name || undefined,
      lines: (data || []).map((i: any) => ({
        label: i.description, qty: i.quantity, unitPrice: Number(i.unit_price), total: Number(i.total),
      })),
      summary: [
        { label: 'Mode remb.', value: refundMethods[r.refund_method] || r.refund_method },
        { label: 'Remis en stock', value: r.restock ? 'Oui' : 'Non' },
      ],
      totalLabel: 'REMBOURSÉ',
      totalValue: displayAmount(Number(r.total_amount)),
      notes: r.reason || undefined,
      qrPayload: r.number,
    });
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Undo2 className="w-5 h-5 text-primary" />
            </div>
            Retours & remboursements
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Recherchez une vente par numéro de ticket et enregistrez le retour</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1.5" />Nouveau retour</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouveau retour</DialogTitle></DialogHeader>
            <div className="flex gap-2 mb-4">
              <Input placeholder="N° de ticket (ex: REC-2026-0001)" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchSale()} />
              <Button variant="outline" onClick={searchSale}><Search className="w-4 h-4 mr-1" />Chercher</Button>
            </div>

            {foundSale && (
              <>
                <div className="bg-muted/40 p-3 rounded-lg mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">{foundSale.receipt_number}</span>
                    <span className="font-mono">{displayAmount(Number(foundSale.total))}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(foundSale.sale_date).toLocaleString('fr-FR')}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <Label className="text-xs uppercase tracking-wide">Produits à retourner</Label>
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center bg-card border rounded-lg p-2">
                      <Checkbox className="col-span-1" checked={it.selected} onCheckedChange={(v) => {
                        const next = [...items]; next[i].selected = !!v; setItems(next);
                      }} />
                      <div className="col-span-7 sm:col-span-8 min-w-0">
                        <p className="text-sm font-medium truncate">{it.description}</p>
                        <p className="text-xs text-muted-foreground">{displayAmount(it.unit_price)} × {it.quantity}</p>
                      </div>
                      <Input
                        type="number" min="1" max={it.quantity}
                        value={it.returnQty}
                        onChange={e => {
                          const next = [...items];
                          next[i].returnQty = Math.min(Math.max(1, Number(e.target.value)), it.quantity);
                          setItems(next);
                        }}
                        disabled={!it.selected}
                        className="h-9 col-span-4 sm:col-span-3"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Mode de remboursement</Label>
                    <Select value={refundMethod} onValueChange={setRefundMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(refundMethods).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Caissier</Label>
                    <Input value={cashier} onChange={e => setCashier(e.target.value)} placeholder="Nom" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Motif</Label>
                    <Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Défectueux, mauvaise taille…" />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <Checkbox checked={restock} onCheckedChange={(v) => setRestock(!!v)} id="restock" />
                    <label htmlFor="restock" className="text-sm cursor-pointer">Remettre en stock</label>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Total à rembourser</span>
                  <span className="text-2xl font-bold">{displayAmount(totalRefund)}</span>
                </div>

                <Button onClick={create} className="w-full mt-3" disabled={totalRefund <= 0}>Valider le retour</Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {returns.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun retour</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {returns.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">{r.number}</span>
                      <Badge variant="secondary" className="text-xs">{refundMethods[r.refund_method] || r.refund_method}</Badge>
                      {r.restock && <Badge variant="outline" className="text-xs">Remis en stock</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.return_date).toLocaleString('fr-FR')}
                      {r.reason && ` • ${r.reason}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-destructive">-{displayAmount(Number(r.total_amount))}</span>
                    <Button size="sm" variant="ghost" onClick={() => reprint(r)} title="Réimprimer">
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}