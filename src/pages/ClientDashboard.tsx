import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'react-router-dom';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TrialBanner from '@/components/TrialBanner';

const statusMap: Record<string, { label: string; class: string }> = {
  paid: { label: 'Payée', class: 'bg-success/10 text-success border-success/20' },
  unpaid: { label: 'Impayée', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'En attente', class: 'bg-warning/10 text-warning border-warning/20' },
  draft: { label: 'Brouillon', class: 'bg-muted text-muted-foreground border-border' },
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const { documents } = useDocuments();
  const { displayAmount, convertAmount, displayCurrency } = useCurrency();
  const myDocs = documents.filter(d => d.clientId === user?.id || d.client.email === user?.email);
  const myInvoices = myDocs.filter(d => d.type === 'invoice');
  const myQuotes = myDocs.filter(d => d.type === 'quote');

  const DocList = ({ docs, title }: { docs: typeof myDocs; title: string }) => (
    <div className="stat-card animate-fade-in">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const st = statusMap[doc.status];
            return (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                <Link to={`/document/${doc.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.number}</p>
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                </Link>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${st.class}`}>{st.label}</Badge>
                  <span className="text-sm font-semibold text-foreground">{displayAmount(doc.total, doc.company.currency)}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/document/${doc.id}`}><FileText className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title">Mon espace</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenue, {user?.name}</p>
      </div>

      <TrialBanner />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Mes factures</p>
          <p className="text-2xl font-bold text-foreground">{myInvoices.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Mes devis</p>
          <p className="text-2xl font-bold text-foreground">{myQuotes.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total dû</p>
          <p className="text-2xl font-bold text-foreground">
            {displayAmount(
              myInvoices.filter(d => d.status === 'unpaid').reduce((s, d) => s + convertAmount(d.total, d.company.currency || 'XOF'), 0),
              displayCurrency
            )}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <DocList docs={myInvoices} title="Mes Factures" />
        <DocList docs={myQuotes} title="Mes Devis" />
      </div>
    </div>
  );
}
