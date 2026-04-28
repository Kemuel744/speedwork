import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PO {
  id: string; number: string; status: string; order_date: string;
  expected_date: string | null; subtotal: number; total: number; currency: string;
  notes: string; supplier_id: string;
}
interface POItem {
  description: string; quantity_ordered: number; unit_price: number; total: number;
}
interface Supplier { name: string; email: string; phone: string; address: string; city: string; }

export default function PublicPurchaseOrder() {
  const { token } = useParams<{ token: string }>();
  const [po, setPO] = useState<PO | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase.rpc('get_purchase_order_by_token', { _token: token });
      if (data) {
        const payload = data as { po: PO; items: POItem[]; supplier: Supplier | null };
        setPO(payload.po);
        setItems(payload.items || []);
        setSupplier(payload.supplier ?? null);
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!po) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Bon de commande introuvable</div>;

  return (
    <div className="min-h-screen bg-muted/30 py-6 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Imprimer</Button>
        </div>

        <div className="a4-preview bg-card rounded-lg shadow-sm p-8 print:shadow-none print:p-0">
          <div className="flex justify-between items-start border-b border-border pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">BON DE COMMANDE</h1>
              <p className="text-muted-foreground mt-1 font-mono">{po.number}</p>
            </div>
            <div className="text-right text-sm">
              <p><span className="text-muted-foreground">Date :</span> {new Date(po.order_date).toLocaleDateString('fr-FR')}</p>
              {po.expected_date && (
                <p className="mt-1"><span className="text-muted-foreground">Livraison prévue :</span> {new Date(po.expected_date).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>

          {supplier && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fournisseur</p>
                <p className="font-semibold">{supplier.name}</p>
                {supplier.address && <p className="text-sm text-muted-foreground">{supplier.address}</p>}
                {supplier.city && <p className="text-sm text-muted-foreground">{supplier.city}</p>}
                {supplier.email && <p className="text-sm text-muted-foreground mt-1">{supplier.email}</p>}
                {supplier.phone && <p className="text-sm text-muted-foreground">{supplier.phone}</p>}
              </div>
            </div>
          )}

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 w-20">Qté</th>
                <th className="text-right py-2 w-24">Prix unit.</th>
                <th className="text-right py-2 w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2">{it.description}</td>
                  <td className="text-right py-2">{it.quantity_ordered}</td>
                  <td className="text-right py-2">{Number(it.unit_price).toFixed(0)}</td>
                  <td className="text-right py-2 font-medium">{Number(it.total).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="text-right pt-3 font-semibold">Total</td>
                <td className="text-right pt-3 font-bold text-lg">
                  {Number(po.total).toFixed(0)} {po.currency}
                </td>
              </tr>
            </tfoot>
          </table>

          {po.notes && (
            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
