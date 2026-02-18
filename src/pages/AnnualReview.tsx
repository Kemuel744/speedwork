import React, { useState, useCallback } from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, Rocket, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

const REVIEW_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/annual-review`;

export default function AnnualReview() {
  const { documents } = useDocuments();
  const { company } = useCompany();
  const { user } = useAuth();
  const { displayAmount, convertAmount, displayCurrency } = useCurrency();
  const isClient = user?.role === 'client';

  const allDocs = isClient
    ? documents.filter(d => d.clientId === user?.id || d.client.email === user?.email)
    : documents;

  // Get available years
  const years = [...new Set(allDocs.map(d => new Date(d.date).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(years[0] || currentYear));
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const yearDocs = allDocs.filter(d => new Date(d.date).getFullYear() === Number(selectedYear));
  const invoices = yearDocs.filter(d => d.type === 'invoice');
  const quotes = yearDocs.filter(d => d.type === 'quote');
  const paid = invoices.filter(d => d.status === 'paid');
  const unpaid = invoices.filter(d => d.status === 'unpaid');

  const totalInvoiced = invoices.reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const totalPaid = paid.reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const totalUnpaid = unpaid.reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const totalQuoted = quotes.reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);

  const buildSummary = useCallback(() => {
    const monthlyData: Record<string, { invoiced: number; paid: number; count: number }> = {};
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    invoices.forEach(inv => {
      const m = months[new Date(inv.date).getMonth()];
      if (!monthlyData[m]) monthlyData[m] = { invoiced: 0, paid: 0, count: 0 };
      monthlyData[m].invoiced += inv.total;
      monthlyData[m].count++;
      if (inv.status === 'paid') monthlyData[m].paid += inv.total;
    });

    const monthlyBreakdown = months
      .filter(m => monthlyData[m])
      .map(m => `- ${m}: ${monthlyData[m].count} facture(s), ${displayAmount(monthlyData[m].invoiced, displayCurrency)} facturé, ${displayAmount(monthlyData[m].paid, displayCurrency)} payé`)
      .join('\n');

    return `Résumé de l'année ${selectedYear} :
- Total facturé : ${displayAmount(totalInvoiced, displayCurrency)}
- Total encaissé (payé) : ${displayAmount(totalPaid, displayCurrency)}
- Total impayé : ${displayAmount(totalUnpaid, displayCurrency)}
- Nombre de factures : ${invoices.length} (dont ${paid.length} payées, ${unpaid.length} impayées)
- Nombre de devis : ${quotes.length} (total : ${displayAmount(totalQuoted, displayCurrency)})
- Taux de recouvrement : ${totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%

Détail mensuel :
${monthlyBreakdown || 'Aucune donnée mensuelle disponible.'}`;
  }, [invoices, quotes, paid, unpaid, selectedYear, totalInvoiced, totalPaid, totalUnpaid, totalQuoted, displayAmount, displayCurrency]);

  const generateReview = async () => {
    setIsLoading(true);
    setReport('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setReport('❌ Erreur : Vous devez être connecté pour générer un bilan.');
        setIsLoading(false);
        return;
      }

      const resp = await fetch(REVIEW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          documentsSummary: buildSummary(),
          year: selectedYear,
          clientName: isClient ? user?.name : company.name,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(err.error || 'Erreur lors de la génération');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setReport(fullText);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setReport(`❌ Erreur : ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Bilan Annuel</h1>
          <p className="text-muted-foreground text-sm mt-1">Analyse IA de votre activité annuelle</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(years.length > 0 ? years : [currentYear]).map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateReview} disabled={isLoading || yearDocs.length === 0}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Générer le bilan
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Factures</span>
          </div>
          <p className="text-xl font-bold text-foreground">{invoices.length}</p>
          <p className="text-xs text-muted-foreground">{displayAmount(totalInvoiced, displayCurrency)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Encaissé</span>
          </div>
          <p className="text-xl font-bold text-success">{displayAmount(totalPaid, displayCurrency)}</p>
          <p className="text-xs text-muted-foreground">{paid.length} facture(s) payée(s)</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-xs font-medium text-muted-foreground">Impayé</span>
          </div>
          <p className="text-xl font-bold text-destructive">{displayAmount(totalUnpaid, displayCurrency)}</p>
          <p className="text-xs text-muted-foreground">{unpaid.length} facture(s)</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium text-muted-foreground">Devis</span>
          </div>
          <p className="text-xl font-bold text-foreground">{quotes.length}</p>
          <p className="text-xs text-muted-foreground">{displayAmount(totalQuoted, displayCurrency)}</p>
        </div>
      </div>

      {yearDocs.length === 0 && (
        <div className="stat-card text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun document trouvé pour {selectedYear}</p>
        </div>
      )}

      {/* AI Report */}
      {report && (
        <div className="stat-card animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Rocket className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Bilan {selectedYear}</h2>
          </div>
          <div className="prose prose-sm max-w-none text-foreground
            prose-headings:text-foreground prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
            prose-p:text-muted-foreground prose-li:text-muted-foreground
            prose-strong:text-foreground prose-ul:my-2">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}

      {isLoading && !report && (
        <div className="stat-card text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Analyse en cours...</p>
        </div>
      )}
    </div>
  );
}
