import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { formatAmount } from '@/lib/currencies';
import { ArrowLeft, FileText, FileCheck, Plus, DollarSign, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { label: string; class: string }> = {
  paid: { label: 'Payée', class: 'bg-success/10 text-success border-success/20' },
  unpaid: { label: 'Impayée', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'En attente', class: 'bg-warning/10 text-warning border-warning/20' },
  draft: { label: 'Brouillon', class: 'bg-muted text-muted-foreground border-border' },
};

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { documents } = useDocuments();
  const { company } = useCompany();
  const navigate = useNavigate();
  const decodedId = decodeURIComponent(clientId || '');

  const clientDocs = useMemo(() => {
    return documents.filter(d => (d.client.email || d.client.name) === decodedId);
  }, [documents, decodedId]);

  const client = clientDocs[0]?.client;
  const invoices = clientDocs.filter(d => d.type === 'invoice');
  const quotes = clientDocs.filter(d => d.type === 'quote');
  const totalPaid = invoices.filter(d => d.status === 'paid').reduce((s, d) => s + d.total, 0);
  const totalUnpaid = invoices.filter(d => d.status === 'unpaid').reduce((s, d) => s + d.total, 0);
  const totalAmount = clientDocs.reduce((s, d) => s + d.total, 0);

  if (!client) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-muted-foreground">Client introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="section-title">{client.name}</h1>
          <p className="text-muted-foreground text-sm">Dossier client</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link to="/create/invoice"><Plus className="w-4 h-4 mr-1" />Facture</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/create/quote"><Plus className="w-4 h-4 mr-1" />Devis</Link>
          </Button>
        </div>
      </div>

      {/* Client info + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card space-y-2">
          <h3 className="font-semibold text-foreground text-sm">Coordonnées</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />{client.email}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />{client.phone}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />{client.address}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Volume total</p>
          <p className="text-2xl font-bold text-foreground">{formatAmount(totalAmount, company.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">{clientDocs.length} document(s)</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-success" />
            <p className="text-sm text-muted-foreground">Encaissé</p>
          </div>
          <p className="text-2xl font-bold text-success">{formatAmount(totalPaid, company.currency)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-muted-foreground">Impayé</p>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatAmount(totalUnpaid, company.currency)}</p>
        </div>
      </div>

      {/* Documents */}
      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Documents</h3>
        {clientDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun document</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Numéro</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {clientDocs.sort((a, b) => b.date.localeCompare(a.date)).map(doc => {
                  const st = statusMap[doc.status];
                  return (
                    <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/document/${doc.id}`} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                          {doc.type === 'invoice' ? <FileText className="w-4 h-4 text-primary" /> : <FileCheck className="w-4 h-4 text-accent" />}
                          {doc.number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{doc.type === 'invoice' ? 'Facture' : 'Devis'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{doc.date}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className={`text-xs ${st.class}`}>{st.label}</Badge></td>
                      <td className="py-3 px-4 text-sm font-semibold text-foreground text-right">{formatAmount(doc.total, company.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
