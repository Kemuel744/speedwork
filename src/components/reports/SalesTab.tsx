import React, { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShoppingCart, TrendingUp, Download, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { printHtmlInIframe } from '@/lib/thermalPrint';

interface Product {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  quantity_in_stock: number;
  alert_threshold: number;
  category: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  reason: string;
  created_at: string;
}

interface SalesTabProps {
  products: Product[];
  movements: StockMovement[];
  displayAmount: (amount: number, currency: string) => string;
  currency: string;
}

export default function SalesTab({ products, movements, displayAmount, currency }: SalesTabProps) {
  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  // Sales = stock exits
  const salesData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));

    const exits = movements.filter(m => m.movement_type === 'exit');
    const monthExits = exits.filter(m => {
      try { return isWithinInterval(parseISO(m.created_at), { start: monthStart, end: monthEnd }); } catch { return false; }
    });
    const prevExits = exits.filter(m => {
      try { return isWithinInterval(parseISO(m.created_at), { start: prevStart, end: prevEnd }); } catch { return false; }
    });

    const totalSalesQty = monthExits.reduce((s, m) => s + m.quantity, 0);
    const prevSalesQty = prevExits.reduce((s, m) => s + m.quantity, 0);

    const totalSalesValue = monthExits.reduce((s, m) => {
      const prod = products.find(p => p.id === m.product_id);
      return s + (prod ? prod.unit_price * m.quantity : 0);
    }, 0);

    const prevSalesValue = prevExits.reduce((s, m) => {
      const prod = products.find(p => p.id === m.product_id);
      return s + (prod ? prod.unit_price * m.quantity : 0);
    }, 0);

    // Per-product sales
    const productSales = new Map<string, { qty: number; value: number }>();
    monthExits.forEach(m => {
      const existing = productSales.get(m.product_id) || { qty: 0, value: 0 };
      const prod = products.find(p => p.id === m.product_id);
      existing.qty += m.quantity;
      existing.value += prod ? prod.unit_price * m.quantity : 0;
      productSales.set(m.product_id, existing);
    });

    const topProducts = [...productSales.entries()]
      .map(([id, data]) => ({ product: products.find(p => p.id === id), ...data }))
      .filter(e => e.product)
      .sort((a, b) => b.value - a.value);

    return { totalSalesQty, totalSalesValue, prevSalesValue, topProducts, monthExits };
  }, [movements, products]);

  const salesTrend = salesData.prevSalesValue > 0
    ? ((salesData.totalSalesValue - salesData.prevSalesValue) / salesData.prevSalesValue) * 100
    : 0;

  const downloadInventoryPDF = () => {
    const now = new Date();
    const html = `<!DOCTYPE html><html><head><title>Inventaire</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; }
        @page { size: A4; margin: 15mm; }
        .page { max-width: 210mm; margin: 0 auto; padding: 15mm; }
        h1 { font-size: 22px; text-align: center; margin-bottom: 8px; color: #1e3a5f; }
        .date { text-align: center; font-size: 12px; color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        th { background: #f0f4ff; font-weight: 600; color: #1e3a5f; }
        .low { background: #fff3cd; }
        .total-row { font-weight: 700; background: #f8f9fa; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head><body><div class="page">
      <h1>Inventaire des Produits</h1>
      <p class="date">Généré le ${format(now, 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
      <table>
        <thead><tr><th>N°</th><th>Produit</th><th>Catégorie</th><th>Prix unitaire</th><th>Quantité</th><th>Valeur stock</th><th>Statut</th></tr></thead>
        <tbody>
          ${products.map((p, i) => {
            const isLow = p.quantity_in_stock <= p.alert_threshold;
            return `<tr class="${isLow ? 'low' : ''}">
              <td>${i + 1}</td>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td>${displayAmount(p.unit_price, currency)}</td>
              <td>${p.quantity_in_stock}</td>
              <td>${displayAmount(p.unit_price * p.quantity_in_stock, currency)}</td>
              <td>${isLow ? '⚠️ Stock bas' : '✅ OK'}</td>
            </tr>`;
          }).join('')}
          <tr class="total-row">
            <td colspan="4">TOTAL</td>
            <td>${products.reduce((s, p) => s + p.quantity_in_stock, 0)}</td>
            <td>${displayAmount(products.reduce((s, p) => s + p.unit_price * p.quantity_in_stock, 0), currency)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Document généré automatiquement — SpeedWork</div>
    </div></body></html>`;
    void printHtmlInIframe(html, 1);
  };

  return (
    <div className="space-y-6">
      {/* Sales KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ventes du mois</p>
                <p className="text-xl font-bold">{displayAmount(salesData.totalSalesValue, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Articles vendus</p>
                <p className="text-xl font-bold">{salesData.totalSalesQty}</p>
                {salesTrend !== 0 && (
                  <p className={`text-xs ${salesTrend >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {salesTrend >= 0 ? '+' : ''}{salesTrend.toFixed(1)}% vs mois dernier
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Button variant="outline" className="w-full gap-2" onClick={downloadInventoryPDF}>
              <Download className="w-4 h-4" /> Télécharger inventaire PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top selling products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Produits les plus vendus (ce mois)</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.topProducts.length > 0 ? (
            <div className="space-y-3">
              {salesData.topProducts.map((item, i) => {
                const pct = salesData.totalSalesValue > 0 ? (item.value / salesData.totalSalesValue) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{displayAmount(item.value, currency)}</p>
                      <p className="text-xs text-muted-foreground">{item.qty} unités</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setQrProduct(item.product!)}>
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">
              Aucune vente ce mois. Enregistrez des sorties de stock pour suivre vos ventes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All products with QR */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Codes QR des produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Aucun produit enregistré</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div
                  key={p.id}
                  className="flex flex-col items-center p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setQrProduct(p)}
                >
                  <QRCodeSVG
                    value={JSON.stringify({ id: p.id, name: p.name, price: p.unit_price, currency })}
                    size={80}
                    level="M"
                  />
                  <p className="text-xs font-medium mt-2 text-center truncate w-full">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{displayAmount(p.unit_price, currency)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Dialog */}
      <Dialog open={!!qrProduct} onOpenChange={() => setQrProduct(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle>{qrProduct?.name}</DialogTitle></DialogHeader>
          {qrProduct && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG
                value={JSON.stringify({ id: qrProduct.id, name: qrProduct.name, price: qrProduct.unit_price, currency })}
                size={200}
                level="H"
                includeMargin
              />
              <div className="space-y-1">
                <p className="text-lg font-bold">{displayAmount(qrProduct.unit_price, currency)}</p>
                <p className="text-sm text-muted-foreground">Stock: {qrProduct.quantity_in_stock} unités</p>
                <Badge variant={qrProduct.quantity_in_stock <= qrProduct.alert_threshold ? 'destructive' : 'secondary'}>
                  {qrProduct.quantity_in_stock <= qrProduct.alert_threshold ? 'Stock bas' : 'En stock'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const svg = document.querySelector('.qr-print-target svg') as SVGElement | null;
                  const container = document.querySelector('[role="dialog"] svg');
                  if (!container) return;
                  const svgData = new XMLSerializer().serializeToString(container);
                  const blob = new Blob([svgData], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `qr-${qrProduct.name.replace(/\s+/g, '-')}.svg`;
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-1" /> Télécharger QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
