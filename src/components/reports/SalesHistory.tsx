import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Printer, Ban, Search, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { printReceipt } from '@/lib/thermalPrint';

interface SaleItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_id?: string;
}

interface Sale {
  id: string;
  receipt_number: string;
  items: SaleItem[];
  total: number;
  sale_date: string;
  status?: string;
  session_id?: string | null;
  payment_method?: string | null;
}

interface SalesHistoryProps {
  displayAmount: (amount: number, currency: string) => string;
  currency: string;
}

export default function SalesHistory({ displayAmount, currency }: SalesHistoryProps) {
  const { company } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false })
      .limit(200);
    if (data) {
      setSales(data.map((s: any) => ({
        id: s.id,
        receipt_number: s.receipt_number,
        items: (s.items as SaleItem[]) || [],
        total: Number(s.total),
        sale_date: s.sale_date,
        status: s.status || 'completed',
        session_id: s.session_id,
        payment_method: s.payment_method,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const filtered = sales.filter(s =>
    s.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const confirmCancelSale = async () => {
    if (!cancelTarget || !user || cancelling) return;
    setCancelling(true);
    try {
      const sale = cancelTarget;
      // 1) Mark sale as cancelled (keep traceability instead of hard delete)
      const { error: upErr } = await supabase
        .from('sales')
        .update({
          status: 'cancelled',
          notes: cancelReason ? `Annulée : ${cancelReason}` : 'Annulée',
        } as any)
        .eq('id', sale.id);
      if (upErr) throw upErr;

      // 2) Restore stock for each line item with a known product
      for (const item of sale.items) {
        if (!item.product_id) continue;
        const { data: prod } = await supabase
          .from('products')
          .select('quantity_in_stock')
          .eq('id', item.product_id)
          .maybeSingle();
        if (prod) {
          await supabase
            .from('products')
            .update({ quantity_in_stock: Number((prod as any).quantity_in_stock || 0) + item.quantity } as any)
            .eq('id', item.product_id);
        }
        await supabase.from('stock_movements').insert({
          user_id: user.id,
          product_id: item.product_id,
          movement_type: 'entry',
          quantity: item.quantity,
          reason: `Annulation vente ${sale.receipt_number}`,
        } as any);
      }

      // 3) If sale was attached to a cash session and paid in cash, register a cash-out adjustment
      if (sale.session_id && (sale.payment_method ?? 'cash') === 'cash' && sale.total > 0) {
        await supabase.from('cash_movements').insert({
          user_id: user.id,
          session_id: sale.session_id,
          movement_type: 'expense',
          amount: sale.total,
          description: `Ajustement annulation ${sale.receipt_number}${cancelReason ? ` — ${cancelReason}` : ''}`,
        } as any);
      }

      toast({
        title: 'Vente annulée',
        description: 'Stock restauré et caisse ajustée.',
      });
      setCancelTarget(null);
      setCancelReason('');
      await fetchSales();
    } catch (e: any) {
      toast({
        title: 'Annulation impossible',
        description: e?.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const printSaleReceipt = (sale: Sale) => {
    return printReceipt({
      kind: 'sale',
      title: 'REÇU DE VENTE',
      number: sale.receipt_number,
      date: parseISO(sale.sale_date),
      lines: sale.items.map(i => ({
        label: i.name,
        qty: i.quantity,
        unitPrice: i.unit_price,
        total: i.total,
      })),
      summary: [
        { label: 'Articles', value: String(sale.items.reduce((s, i) => s + i.quantity, 0)) },
      ],
      totalLabel: 'TOTAL',
      totalValue: displayAmount(sale.total, currency),
      qrPayload: sale.receipt_number,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un reçu ou produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="self-start">
          {filtered.length} vente(s)
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? 'Aucune vente trouvée' : 'Aucune vente enregistrée. Utilisez la caisse pour commencer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(sale => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold">{sale.receipt_number}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(sale.sale_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {sale.items.reduce((s, i) => s + i.quantity, 0)} article(s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${sale.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>
                      {displayAmount(sale.total, currency)}
                    </p>
                    {sale.status === 'cancelled' && (
                      <Badge variant="destructive" className="text-[10px] mt-1">Annulée</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printSaleReceipt(sale)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    {sale.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Annuler la vente"
                        onClick={() => { setCancelTarget(sale); setCancelReason(''); }}
                      >
                        <Ban className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {selectedSale?.receipt_number}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="text-center border rounded-lg p-4 bg-muted/30">
                <p className="font-bold text-lg">{company.name || 'Ma Boutique'}</p>
                {company.address && <p className="text-xs text-muted-foreground">{company.address}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(selectedSale.sale_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
              </div>

              <div className="space-y-1">
                {selectedSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">{displayAmount(item.total, currency)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-bold">TOTAL</span>
                <span className="text-xl font-bold text-primary">{displayAmount(selectedSale.total, currency)}</span>
              </div>

              <Button className="w-full gap-2" onClick={() => printSaleReceipt(selectedSale)}>
                <Printer className="w-4 h-4" />
                Imprimer le reçu
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) { setCancelTarget(null); setCancelReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Annuler la vente {cancelTarget?.receipt_number} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Le stock des produits sera restauré automatiquement.
              </span>
              {cancelTarget?.session_id && (cancelTarget?.payment_method ?? 'cash') === 'cash' && (
                <span className="block">
                  Un mouvement de sortie de <strong>{cancelTarget && displayAmount(cancelTarget.total, currency)}</strong> sera enregistré dans la session de caisse.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Motif (optionnel)</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Erreur de saisie, retour client, doublon…"
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmCancelSale(); }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
