import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertCircle, AlertTriangle, CheckCircle2, Printer, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { printElement } from '@/lib/printElement';

interface Product {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  quantity_in_stock: number;
  alert_threshold: number;
  category: string;
}

interface InventoryReportProps {
  products: Product[];
  displayAmount: (amount: number, currency: string) => string;
  currency: string;
}

export default function InventoryReport({ products, displayAmount, currency }: InventoryReportProps) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const categorized = useMemo(() => {
    const outOfStock: Product[] = [];
    const lowStock: Product[] = [];
    const healthyStock: Product[] = [];

    products.forEach(p => {
      if (p.quantity_in_stock <= 0) {
        outOfStock.push(p);
      } else if (p.quantity_in_stock <= p.alert_threshold) {
        lowStock.push(p);
      } else {
        healthyStock.push(p);
      }
    });

    const totalValue = products.reduce((sum, p) => sum + p.unit_price * p.quantity_in_stock, 0);
    const totalUnits = products.reduce((sum, p) => sum + p.quantity_in_stock, 0);

    return { outOfStock, lowStock, healthyStock, totalValue, totalUnits };
  }, [products]);

  const printReport = () => printElement(printRef.current, { title: `Inventaire_${format(new Date(), 'yyyy-MM-dd')}` });

  const Section = ({
    title,
    items,
    icon: Icon,
    variant,
  }: {
    title: string;
    items: Product[];
    icon: any;
    variant: 'destructive' | 'warning' | 'success';
  }) => {
    const styles = {
      destructive: 'border-destructive/30 bg-destructive/5',
      warning: 'border-amber-500/30 bg-amber-500/5',
      success: 'border-emerald-500/30 bg-emerald-500/5',
    };
    const iconStyles = {
      destructive: 'text-destructive bg-destructive/10',
      warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    };

    return (
      <div className={`rounded-lg border p-4 ${styles[variant]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          </div>
          <Badge variant="secondary" className="font-bold">{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">Aucun produit dans cette catégorie.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {items.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-card rounded-md px-3 py-2 text-sm border border-border/50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Seuil : {p.alert_threshold}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-sm">{p.quantity_in_stock} u.</p>
                  <p className="text-xs text-muted-foreground">{displayAmount(p.unit_price * p.quantity_in_stock, currency)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-1.5">
          <ClipboardCheck className="w-4 h-4" />
          Faire l'inventaire
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Rapport d'inventaire — {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Produits</p>
            <p className="font-bold text-lg">{products.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Unités totales</p>
            <p className="font-bold text-lg">{categorized.totalUnits}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Valeur stock</p>
            <p className="font-bold text-sm">{displayAmount(categorized.totalValue, currency)}</p>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-muted-foreground">À recommander</p>
            <p className="font-bold text-lg text-destructive">{categorized.outOfStock.length + categorized.lowStock.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Section
            title="Rupture de stock (à recommander en urgence)"
            items={categorized.outOfStock}
            icon={AlertCircle}
            variant="destructive"
          />
          <Section
            title="Stock faible (proche du seuil d'alerte)"
            items={categorized.lowStock}
            icon={AlertTriangle}
            variant="warning"
          />
          <Section
            title="Stock suffisant"
            items={categorized.healthyStock}
            icon={CheckCircle2}
            variant="success"
          />
        </div>
        </div>

        {products.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun produit enregistré pour effectuer l'inventaire.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="w-4 h-4 mr-1" />Imprimer
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
