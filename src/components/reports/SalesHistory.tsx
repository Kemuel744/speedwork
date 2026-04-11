import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Printer, Trash2, Search, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SaleItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Sale {
  id: string;
  receipt_number: string;
  items: SaleItem[];
  total: number;
  sale_date: string;
}

interface SalesHistoryProps {
  displayAmount: (amount: number, currency: string) => string;
  currency: string;
}

export default function SalesHistory({ displayAmount, currency }: SalesHistoryProps) {
  const { company } = useCompany();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const filtered = sales.filter(s =>
    s.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const deleteSale = async (id: string) => {
    await supabase.from('sales').delete().eq('id', id);
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const printReceipt = (sale: Sale) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Reçu ${sale.receipt_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 16px; color: #000; }
        @page { size: 80mm auto; margin: 5mm; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 6px 0; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .small { font-size: 10px; color: #555; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head><body>
      <div class="center">
        <h1 class="bold">${company.name || 'Ma Boutique'}</h1>
        ${company.address ? `<p class="small">${company.address}</p>` : ''}
        ${company.phone ? `<p class="small">Tél: ${company.phone}</p>` : ''}
        ${company.email ? `<p class="small">${company.email}</p>` : ''}
      </div>
      <div class="line"></div>
      <div class="row"><span>Reçu N°:</span><span>${sale.receipt_number}</span></div>
      <div class="row"><span>Date:</span><span>${format(parseISO(sale.sale_date), 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
      <div class="line"></div>
      ${sale.items.map(i => `
        <div style="margin: 6px 0;">
          <div style="font-size: 12px; font-weight: bold;">${i.name}</div>
          <div class="row">
            <span>${i.quantity} x ${displayAmount(i.unit_price, currency)}</span>
            <span>${displayAmount(i.total, currency)}</span>
          </div>
        </div>
      `).join('')}
      <div class="line"></div>
      <div class="total-row"><span>TOTAL</span><span>${displayAmount(sale.total, currency)}</span></div>
      <div class="row"><span>Articles:</span><span>${sale.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
      <div class="line"></div>
      <div class="center small" style="margin-top: 12px;">
        <p>Merci pour votre achat !</p>
        <p>${company.name || 'SpeedWork'}</p>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
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
                    <p className="text-sm font-bold">{displayAmount(sale.total, currency)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printReceipt(sale)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSale(sale.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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

              <Button className="w-full gap-2" onClick={() => printReceipt(selectedSale)}>
                <Printer className="w-4 h-4" />
                Imprimer le reçu
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
