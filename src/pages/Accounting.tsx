import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Receipt, FileText, Loader2 } from 'lucide-react';

interface PnL {
  revenue: number; vat_collected: number; returns: number; net_revenue: number;
  purchases: number; expenses: number; gross_margin: number; net_result: number;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
};

export default function Accounting() {
  const { user } = useAuth();
  const { displayAmount } = useCurrency();
  const { toast } = useToast();
  const [start, setStart] = useState(monthStartISO());
  const [end, setEnd] = useState(todayISO());
  const [pnl, setPnl] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_pnl', { _start: start, _end: end });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setPnl(data as unknown as PnL);
    }
    setLoading(false);
  }, [user, start, end, toast]);

  useEffect(() => { load(); }, [load]);

  const print = () => window.print();

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Comptabilité</h1>
          <p className="text-muted-foreground text-sm">Compte de résultat & analyse financière</p>
        </div>
        <Button onClick={print} variant="outline"><FileText className="w-4 h-4 mr-2" />Imprimer</Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Début</Label>
            <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <Label>Fin</Label>
            <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={load} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Calculer
            </Button>
          </div>
        </CardContent>
      </Card>

      {pnl && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><DollarSign className="w-4 h-4" />Chiffre d'affaires</div>
              <p className="text-2xl font-bold mt-1">{displayAmount(pnl.revenue)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Receipt className="w-4 h-4" />TVA collectée</div>
              <p className="text-2xl font-bold mt-1">{displayAmount(pnl.vat_collected)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="w-4 h-4" />Marge brute</div>
              <p className="text-2xl font-bold mt-1 text-primary">{displayAmount(pnl.gross_margin)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                {pnl.net_result >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Résultat net
              </div>
              <p className={`text-2xl font-bold mt-1 ${pnl.net_result >= 0 ? 'text-green-600' : 'text-destructive'}`}>{displayAmount(pnl.net_result)}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Compte de résultat — {start} au {end}</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  <tr><td className="py-2 font-semibold">Ventes brutes</td><td className="text-right">{displayAmount(pnl.revenue)}</td></tr>
                  <tr><td className="py-2 pl-4 text-muted-foreground">- Retours</td><td className="text-right text-destructive">-{displayAmount(pnl.returns)}</td></tr>
                  <tr className="bg-muted/30"><td className="py-2 font-bold">Chiffre d'affaires net</td><td className="text-right font-bold">{displayAmount(pnl.net_revenue)}</td></tr>
                  <tr><td className="py-2 pl-4 text-muted-foreground">- Achats marchandises</td><td className="text-right text-destructive">-{displayAmount(pnl.purchases)}</td></tr>
                  <tr className="bg-muted/30"><td className="py-2 font-bold">Marge brute</td><td className="text-right font-bold text-primary">{displayAmount(pnl.gross_margin)}</td></tr>
                  <tr><td className="py-2 pl-4 text-muted-foreground">- Charges & dépenses</td><td className="text-right text-destructive">-{displayAmount(pnl.expenses)}</td></tr>
                  <tr className="bg-primary/10"><td className="py-3 font-bold text-base">Résultat net</td>
                    <td className={`text-right font-bold text-base ${pnl.net_result >= 0 ? 'text-green-600' : 'text-destructive'}`}>{displayAmount(pnl.net_result)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}