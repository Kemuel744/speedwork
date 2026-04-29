import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Receipt, FileText, Loader2 } from 'lucide-react';

interface VatSummary {
  sales_ht: number; vat_collected: number;
  purchases_ht: number; vat_deductible: number;
  vat_to_pay: number;
}

const monthStartISO = () => {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
};
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function VatDeclaration() {
  const { user } = useAuth();
  const { displayAmount } = useCurrency();
  const { company } = useCompany();
  const { toast } = useToast();
  const [start, setStart] = useState(monthStartISO());
  const [end, setEnd] = useState(todayISO());
  const [vat, setVat] = useState<VatSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_vat_summary', { _start: start, _end: end });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setVat(data as unknown as VatSummary);
    setLoading(false);
  }, [user, start, end, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6 print-zone">
      <div className="hidden print:block mb-4 pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <p className="text-xs text-muted-foreground">{company.address}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold">Déclaration TVA</p>
            <p>Du {start} au {end}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Déclaration TVA</h1>
          <p className="text-muted-foreground text-sm">TVA collectée, déductible et à payer</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><FileText className="w-4 h-4 mr-2" />Imprimer</Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Début</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
          <div><Label>Fin</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
          <div className="flex items-end">
            <Button onClick={load} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Calculer
            </Button>
          </div>
        </CardContent>
      </Card>

      {vat && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" />Récapitulatif TVA — {start} au {end}</h2>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm min-w-[320px]">
              <tbody className="divide-y">
                <tr><td className="py-2">Total ventes HT</td><td className="text-right font-semibold">{displayAmount(vat.sales_ht)}</td></tr>
                <tr className="bg-muted/30"><td className="py-2 font-bold">TVA collectée</td><td className="text-right font-bold">{displayAmount(vat.vat_collected)}</td></tr>
                <tr><td className="py-2">Total achats HT</td><td className="text-right font-semibold">{displayAmount(vat.purchases_ht)}</td></tr>
                <tr className="bg-muted/30"><td className="py-2 font-bold">TVA déductible</td><td className="text-right font-bold">{displayAmount(vat.vat_deductible)}</td></tr>
                <tr className="bg-primary/10">
                  <td className="py-3 font-bold text-base">TVA à payer (collectée - déductible)</td>
                  <td className={`text-right font-bold text-base ${vat.vat_to_pay >= 0 ? 'text-destructive' : 'text-green-600'}`}>{displayAmount(vat.vat_to_pay)}</td>
                </tr>
              </tbody>
            </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Si le résultat est négatif, vous bénéficiez d'un crédit de TVA reportable.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}