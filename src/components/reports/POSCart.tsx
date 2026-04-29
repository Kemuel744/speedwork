import React, { useState, useRef, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Receipt, Printer, X, ScanLine, Lock, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRScanner from './QRScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { printReceipt, getReceiptSettings } from '@/lib/thermalPrint';

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
  activeSession?: { id: string; number: string } | null;
}

export default function POSCart({ products, displayAmount, currency, onSaleComplete, activeSession }: POSCartProps) {
  const { company } = useCompany();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [receiptData, setReceiptData] = useState<{ items: CartItem[]; total: number; date: Date; receiptNo: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

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
      const items = [...cart];
      const total = cartTotal;
      const date = new Date();
      setCart([]);
      // Auto-impression si activée dans les réglages
      const settings = await getReceiptSettings();
      if (settings.auto_print) {
        await thermalPrint(items, total, date, receiptNo);
      } else {
        setReceiptData({ items, total, date, receiptNo });
      }
    } finally {
      setProcessing(false);
    }
  };

  const thermalPrint = async (
    items: CartItem[],
    total: number,
    date: Date,
    receiptNo: string,
  ) => {
    await printReceipt({
      kind: 'sale',
      title: 'REÇU DE VENTE',
      number: receiptNo,
      date,
      lines: items.map(i => ({
        label: i.product.name,
        sub: i.product.category,
        qty: i.quantity,
        unitPrice: i.product.unit_price,
        total: i.product.unit_price * i.quantity,
      })),
      summary: [
        { label: 'Articles', value: String(items.reduce((s, i) => s + i.quantity, 0)) },
      ],
      totalLabel: 'TOTAL',
      totalValue: displayAmount(total, currency),
      qrPayload: receiptNo,
    });
  };

  const handlePrintFromDialog = () => {
    if (!receiptData) return;
    thermalPrint(receiptData.items, receiptData.total, receiptData.date, receiptData.receiptNo);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cash session banner */}
      <div className="lg:col-span-3">
        {activeSession ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <Banknote className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground">
              Caisse ouverte : <span className="font-mono font-semibold">{activeSession.number}</span> — chaque vente sera rattachée à cette session.
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/30 text-sm">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-foreground flex-1">
              Aucune caisse ouverte. Les ventes seront enregistrées sans rattachement à une session journalière.
            </span>
            <Link to="/cash-register" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              Ouvrir la caisse →
            </Link>
          </div>
        )}
      </div>

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

              <Button className="w-full gap-2" onClick={handlePrintFromDialog}>
                <Printer className="w-4 h-4" />
                Imprimer sur l'imprimante de caisse
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <QRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}
