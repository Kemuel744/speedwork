import React from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'react-router-dom';
import { FileText, FileCheck, DollarSign, AlertCircle, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyRevenue } from '@/lib/mockData';
import CurrencyConverter from '@/components/CurrencyConverter';
import TrialBanner from '@/components/TrialBanner';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const statusMap: Record<string, { label: string; class: string }> = {
  paid: { label: 'Payée', class: 'bg-success/10 text-success border-success/20' },
  unpaid: { label: 'Impayée', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'En attente', class: 'bg-warning/10 text-warning border-warning/20' },
  draft: { label: 'Brouillon', class: 'bg-muted text-muted-foreground border-border' },
};

export default function Dashboard() {
  const { documents } = useDocuments();
  const { displayAmount, convertAmount, displayCurrency } = useCurrency();
  const invoices = documents.filter(d => d.type === 'invoice');
  const quotes = documents.filter(d => d.type === 'quote');
  const totalRevenue = invoices.filter(d => d.status === 'paid').reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const unpaid = invoices.filter(d => d.status === 'unpaid');
  const unpaidTotal = unpaid.reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const recent = documents.slice(0, 5);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/create/invoice"><Plus className="w-4 h-4 mr-2" />Facture</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/create/quote"><Plus className="w-4 h-4 mr-2" />Devis</Link>
          </Button>
        </div>
      </div>

      <TrialBanner />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Factures" value={String(invoices.length)} sub={`${unpaid.length} impayée(s)`} color="bg-primary/10 text-primary" />
        <StatCard icon={FileCheck} label="Devis" value={String(quotes.length)} color="bg-accent/10 text-accent" />
        <StatCard icon={DollarSign} label="Revenus" value={displayAmount(totalRevenue, displayCurrency)} sub="Total encaissé" color="bg-success/10 text-success" />
        <StatCard icon={AlertCircle} label="Impayées" value={displayAmount(unpaidTotal, displayCurrency)} sub={`${unpaid.length} facture(s)`} color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Revenus mensuels</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [displayAmount(value, displayCurrency), 'Revenus']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent documents */}
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">Derniers documents</h3>
          <div className="space-y-3">
            {recent.map(doc => {
              const st = statusMap[doc.status];
              return (
                <Link key={doc.id} to={`/document/${doc.id}`} className="flex items-center justify-between py-2 hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.number}</p>
                    <p className="text-xs text-muted-foreground">{doc.client.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{displayAmount(doc.total, doc.company.currency)}</p>
                    <Badge variant="outline" className={`text-xs ${st.class}`}>{st.label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Currency Converter */}
      <div className="mt-6">
        <CurrencyConverter />
      </div>
    </div>
  );
}
