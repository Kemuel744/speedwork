import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocuments } from '@/contexts/DocumentsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Download, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const statusMap: Record<string, { label: string; class: string }> = {
  paid: { label: 'Payée', class: 'bg-success/10 text-success border-success/20' },
  unpaid: { label: 'Impayée', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'En attente', class: 'bg-warning/10 text-warning border-warning/20' },
  draft: { label: 'Brouillon', class: 'bg-muted text-muted-foreground border-border' },
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, addDocument } = useDocuments();
  const doc = getDocument(id || '');

  if (!doc) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-muted-foreground">Document non trouvé</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  const st = statusMap[doc.status];

  const handlePrint = () => window.print();

  const handleConvertToInvoice = () => {
    if (doc.type !== 'quote') return;
    const newDoc = {
      ...doc,
      id: crypto.randomUUID(),
      type: 'invoice' as const,
      number: doc.number.replace('DEV', 'FAC'),
      status: 'unpaid' as const,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };
    addDocument(newDoc);
    toast.success('Devis converti en facture');
    navigate(`/document/${newDoc.id}`);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{doc.number}</h1>
            <Badge variant="outline" className={st.class}>{st.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {doc.type === 'quote' && (
            <Button variant="outline" size="sm" onClick={handleConvertToInvoice}>
              <RefreshCw className="w-4 h-4 mr-2" />Convertir en facture
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />Imprimer
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />PDF
          </Button>
        </div>
      </div>

      {/* A4 Preview */}
      <div className="flex justify-center">
        <div className="a4-preview bg-card rounded-lg shadow-lg border border-border w-full max-w-[210mm] p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">{doc.company.name}</h2>
              <p className="text-sm text-muted-foreground">{doc.company.address}</p>
              <p className="text-sm text-muted-foreground">{doc.company.phone}</p>
              <p className="text-sm text-muted-foreground">{doc.company.email}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-foreground uppercase">
                {doc.type === 'invoice' ? 'Facture' : 'Devis'}
              </h3>
              <p className="text-sm font-medium text-foreground mt-1">{doc.number}</p>
              <p className="text-sm text-muted-foreground mt-2">Date : {doc.date}</p>
              {doc.dueDate && <p className="text-sm text-muted-foreground">Échéance : {doc.dueDate}</p>}
            </div>
          </div>

          {/* Client */}
          <div className="mb-8 p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Facturer à</p>
            <p className="font-semibold text-foreground">{doc.client.name}</p>
            <p className="text-sm text-muted-foreground">{doc.client.address}</p>
            <p className="text-sm text-muted-foreground">{doc.client.email}</p>
            <p className="text-sm text-muted-foreground">{doc.client.phone}</p>
          </div>

          {/* Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-primary/20">
                <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                <th className="text-center py-3 text-xs font-semibold text-muted-foreground uppercase">Qté</th>
                <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">P.U.</th>
                <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 text-sm text-foreground">{item.description}</td>
                  <td className="py-3 text-sm text-center text-foreground">{item.quantity}</td>
                  <td className="py-3 text-sm text-right text-foreground">{item.unitPrice.toLocaleString('fr-FR')} €</td>
                  <td className="py-3 text-sm text-right font-medium text-foreground">{item.total.toLocaleString('fr-FR')} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="text-foreground">{doc.subtotal.toLocaleString('fr-FR')} €</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA ({doc.taxRate}%)</span><span className="text-foreground">{doc.taxAmount.toLocaleString('fr-FR')} €</span></div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-primary/20">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{doc.total.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">{doc.company.name} — {doc.company.address}</p>
            <p className="text-xs text-muted-foreground">{doc.company.email} — {doc.company.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
