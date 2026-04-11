import React, { useState, useRef, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Receipt, Printer, X, ScanLine } from 'lucide-react';
import QRScanner from './QRScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  quantity_in_stock: number;
  alert_threshold: number;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSCartProps {
  products: Product[];
  displayAmount: (amount: number, currency: string) => string;
  currency: string;
  onSaleComplete: (items: CartItem[]) => Promise<void>;
}

export default function POSCart({ products, displayAmount, currency, onSaleComplete }: POSCartProps) {
  const { company } = useCompany();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [receiptData, setReceiptData] = useState<{ items: CartItem[]; total: number; date: Date; receiptNo: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleQRScan = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart(product);
      setScannerOpen(false);
    }
  }, [products]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) return prev;
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.quantity_in_stock <= 0) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      if (newQty > i.product.quantity_in_stock) return i;
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.unit_price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const completeSale = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);
    try {
      await onSaleComplete(cart);
      const receiptNo = `REC-${Date.now().toString(36).toUpperCase()}`;
      setReceiptData({ items: [...cart], total: cartTotal, date: new Date(), receiptNo });
      setCart([]);
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = () => {
    if (!receiptData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Reçu ${receiptData.receiptNo}</title>
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
      <div class="row"><span>Reçu N°:</span><span>${receiptData.receiptNo}</span></div>
      <div class="row"><span>Date:</span><span>${format(receiptData.date, 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
      <div class="line"></div>
      ${receiptData.items.map(i => `
        <div style="margin: 6px 0;">
          <div style="font-size: 12px; font-weight: bold;">${i.product.name}</div>
          <div class="row">
            <span>${i.quantity} x ${displayAmount(i.product.unit_price, currency)}</span>
            <span>${displayAmount(i.product.unit_price * i.quantity, currency)}</span>
          </div>
        </div>
      `).join('')}
      <div class="line"></div>
      <div class="total-row"><span>TOTAL</span><span>${displayAmount(receiptData.total, currency)}</span></div>
      <div class="row"><span>Articles:</span><span>${receiptData.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product catalog */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-sm"
          />
          <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Scanner QR">
            <ScanLine className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-8 text-sm">
              {products.length === 0 ? 'Ajoutez des produits dans l\'onglet "Produits & Stock"' : 'Aucun produit trouvé'}
            </p>
          ) : filteredProducts.map(p => {
            const inCart = cart.find(i => i.product.id === p.id);
            const outOfStock = p.quantity_in_stock <= 0;
            return (
              <Card
                key={p.id}
                className={`cursor-pointer transition-all hover:shadow-md ${outOfStock ? 'opacity-50' : ''} ${inCart ? 'ring-2 ring-primary' : ''}`}
                onClick={() => !outOfStock && addToCart(p)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-sm font-bold text-primary">{displayAmount(p.unit_price, currency)}</p>
                    <Badge variant={outOfStock ? 'destructive' : 'secondary'} className="text-[10px]">
                      {outOfStock ? 'Épuisé' : `${p.quantity_in_stock}`}
                    </Badge>
                  </div>
                  {inCart && (
                    <Badge className="mt-1.5 text-[10px]">{inCart.quantity} dans le panier</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Panier
              {cartCount > 0 && <Badge className="ml-auto">{cartCount}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                Cliquez sur un produit pour l'ajouter
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{displayAmount(item.product.unit_price, currency)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, -1); }}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, 1); }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-bold w-20 text-right">{displayAmount(item.product.unit_price * item.quantity, currency)}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id); }}>
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-xl font-bold">{displayAmount(cartTotal, currency)}</span>
                  </div>
                  <Button className="w-full gap-2" size="lg" onClick={completeSale} disabled={processing}>
                    <Receipt className="w-4 h-4" />
                    {processing ? 'Enregistrement...' : 'Valider la vente'}
                  </Button>
                  <Button variant="outline" className="w-full" size="sm" onClick={() => setCart([])}>
                    Vider le panier
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptData} onOpenChange={() => setReceiptData(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Vente enregistrée
            </DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4">
              <div className="text-center border rounded-lg p-4 bg-muted/30">
                <p className="font-bold text-lg">{company.name || 'Ma Boutique'}</p>
                {company.address && <p className="text-xs text-muted-foreground">{company.address}</p>}
                <p className="text-xs text-muted-foreground mt-1">Reçu N° {receiptData.receiptNo}</p>
                <p className="text-xs text-muted-foreground">{format(receiptData.date, 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
              </div>

              <div className="space-y-1">
                {receiptData.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="font-medium">{displayAmount(item.product.unit_price * item.quantity, currency)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-bold">TOTAL</span>
                <span className="text-xl font-bold text-primary">{displayAmount(receiptData.total, currency)}</span>
              </div>

              <Button className="w-full gap-2" onClick={printReceipt}>
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
