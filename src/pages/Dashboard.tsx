import React from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

export default function Dashboard() {
  const { documents } = useDocuments();
  const { displayAmount, convertAmount, displayCurrency } = useCurrency();
  const { t } = useLanguage();
  const invoices = documents.filter(d => d.type === 'invoice');
  const quotes = documents.filter(d => d.type === 'quote');
  const totalRevenue = invoices.filter(d => d.status === 'paid').reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const unpaid = invoices.filter(d => d.status === 'unpaid');
  const unpaidTotal = unpaid.reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0);
  const recent = documents.slice(0, 5);

  const statusMap: Record<string, { label: string; class: string }> = {
    paid: { label: t('status.paid'), class: 'bg-success/10 text-success border-success/20' },
    unpaid: { label: t('status.unpaid'), class: 'bg-destructive/10 text-destructive border-destructive/20' },
    pending: { label: t('status.pending'), class: 'bg-warning/10 text-warning border-warning/20' },
    draft: { label: t('status.draft'), class: 'bg-muted text-muted-foreground border-border' },
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/create/invoice"><Plus className="w-4 h-4 mr-2" />{t('dashboard.newInvoice')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/create/quote"><Plus className="w-4 h-4 mr-2" />{t('dashboard.newQuote')}</Link>
          </Button>
        </div>
      </div>

      <TrialBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label={t('dashboard.invoices')} value={String(invoices.length)} sub={t('dashboard.unpaidCount').replace('{count}', String(unpaid.length))} color="bg-primary/10 text-primary" />
        <StatCard icon={FileCheck} label={t('dashboard.quotes')} value={String(quotes.length)} color="bg-accent/10 text-accent" />
        <StatCard icon={DollarSign} label={t('dashboard.revenue')} value={displayAmount(totalRevenue, displayCurrency)} sub={t('dashboard.totalCollected')} color="bg-success/10 text-success" />
        <StatCard icon={AlertCircle} label={t('dashboard.unpaid')} value={displayAmount(unpaidTotal, displayCurrency)} sub={t('dashboard.invoiceCount').replace('{count}', String(unpaid.length))} color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">{t('dashboard.monthlyRevenue')}</h3>
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
                formatter={(value: number) => [displayAmount(value, displayCurrency), t('dashboard.revenue')]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-4">{t('dashboard.recentDocs')}</h3>
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

      <div className="mt-6">
        <CurrencyConverter />
      </div>
    </div>
  );
}
