import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '@/contexts/DocumentsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Download, RefreshCw, Pencil, Bell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import DocumentPreview from '@/components/document/DocumentPreview';

const statusMap: Record<string, { label: string; class: string }> = {
  paid: { label: 'Payée', class: 'bg-success/10 text-success border-success/20' },
  unpaid: { label: 'Impayée', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'En attente', class: 'bg-warning/10 text-warning border-warning/20' },
  draft: { label: 'Brouillon', class: 'bg-muted text-muted-foreground border-border' },
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, addDocument, getReminders, sendManualReminder } = useDocuments();
  const doc = getDocument(id || '');
  const [reminders, setReminders] = useState<any[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    if (id) {
      getReminders(id).then(setReminders);
    }
  }, [id, getReminders]);

  if (!doc) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-muted-foreground">Document non trouvé</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  const handleSendReminder = async () => {
    if (!id) return;
    setSendingReminder(true);
    try {
      await sendManualReminder(id);
      toast.success('Relance envoyée avec succès');
      const updated = await getReminders(id);
      setReminders(updated);
    } catch {
      toast.error('Erreur lors de l\'envoi de la relance');
    } finally {
      setSendingReminder(false);
    }
  };

  const st = statusMap[doc.status];
  const handlePrint = () => window.print();

  const handleConvertToInvoice = async () => {
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
    try {
      await addDocument(newDoc);
      toast.success('Devis converti en facture');
      navigate(`/document/${newDoc.id}`);
    } catch {
      toast.error('Erreur lors de la conversion');
    }
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
          <Button variant="outline" size="sm" onClick={() => navigate(`/edit/${doc.id}`)}>
            <Pencil className="w-4 h-4 mr-2" />Modifier
          </Button>
          {doc.type === 'quote' && (
            <Button variant="outline" size="sm" onClick={handleConvertToInvoice}>
              <RefreshCw className="w-4 h-4 mr-2" />Convertir en facture
            </Button>
          )}
          {doc.type === 'invoice' && (doc.status === 'unpaid' || doc.status === 'pending') && (
            <Button variant="outline" size="sm" onClick={handleSendReminder} disabled={sendingReminder}>
              <Bell className="w-4 h-4 mr-2" />{sendingReminder ? 'Envoi...' : 'Relancer'}
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

      {/* Document Preview */}
      <div className="flex justify-center">
        <DocumentPreview doc={doc} />
      </div>

      {/* Reminders history */}
      {reminders.length > 0 && (
        <div className="stat-card mt-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Historique des relances</h3>
          </div>
          <div className="space-y-3">
            {reminders.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {r.reminder_type === 'auto' ? 'Automatique' : 'Manuelle'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {r.message && <p className="text-xs text-muted-foreground line-clamp-2">{r.message}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
