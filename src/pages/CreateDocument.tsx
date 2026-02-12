import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocuments } from '@/contexts/DocumentsContext';
import { DocumentType, LineItem, DocumentData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

function generateNumber(type: DocumentType) {
  const prefix = type === 'invoice' ? 'FAC' : 'DEV';
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  return `${prefix}-${year}-${rand}`;
}

export default function CreateDocument() {
  const { type } = useParams<{ type: string }>();
  const docType: DocumentType = type === 'quote' ? 'quote' : 'invoice';
  const navigate = useNavigate();
  const { addDocument } = useDocuments();

  const [company, setCompany] = useState({ name: 'SpeedWork SAS', address: '12 Rue de la Paix, 75002 Paris', phone: '+33 1 23 45 67 89', email: 'contact@speedwork.com' });
  const [client, setClient] = useState({ name: '', email: '', phone: '', address: '' });
  const [status, setStatus] = useState<DocumentData['status']>('draft');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(20);
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const addLine = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeLine = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.total = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * taxRate / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.name || !client.email) {
      toast.error('Veuillez remplir les informations client');
      return;
    }
    if (items.some(i => !i.description || i.unitPrice <= 0)) {
      toast.error('Veuillez remplir toutes les lignes du tableau');
      return;
    }

    const doc: DocumentData = {
      id: crypto.randomUUID(),
      number: generateNumber(docType),
      type: docType,
      status,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || undefined,
      client,
      company,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      createdBy: '1',
      clientId: '',
    };

    addDocument(doc);
    toast.success(`${docType === 'invoice' ? 'Facture' : 'Devis'} créé(e) avec succès !`);
    navigate(`/document/${doc.id}`);
  };

  return (
    <div className="page-container">
      <h1 className="section-title mb-6">
        {docType === 'invoice' ? 'Nouvelle Facture' : 'Nouveau Devis'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company & Client info - side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card space-y-4">
            <h3 className="font-semibold text-foreground">Votre entreprise</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom</Label>
                <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone</Label>
                <Input value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adresse</Label>
                <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="stat-card space-y-4">
            <h3 className="font-semibold text-foreground">Client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} required placeholder="Nom du client" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} required placeholder="email@exemple.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone</Label>
                <Input value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} placeholder="+33 6 ..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adresse</Label>
                <Input value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} placeholder="Adresse complète" />
              </div>
            </div>
          </div>
        </div>

        {/* Document meta */}
        <div className="stat-card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Statut</Label>
              <Select value={status} onValueChange={(v: DocumentData['status']) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="unpaid">Impayée</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {docType === 'invoice' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Date d'échéance</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">TVA (%)</Label>
              <Input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} min={0} max={100} />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Lignes</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="w-4 h-4 mr-1" />Ajouter
            </Button>
          </div>
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Quantité</div>
              <div className="col-span-2">Prix unitaire</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <Input className="sm:col-span-5" placeholder="Description" value={item.description} onChange={e => updateLine(item.id, 'description', e.target.value)} required />
                <Input className="sm:col-span-2" type="number" min={1} value={item.quantity} onChange={e => updateLine(item.id, 'quantity', Number(e.target.value))} />
                <Input className="sm:col-span-2" type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateLine(item.id, 'unitPrice', Number(e.target.value))} />
                <div className="sm:col-span-2 text-right text-sm font-semibold text-foreground">{item.total.toLocaleString('fr-FR')} €</div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(item.id)} disabled={items.length === 1}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="font-medium text-foreground">{subtotal.toLocaleString('fr-FR')} €</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA ({taxRate}%)</span><span className="font-medium text-foreground">{taxAmount.toLocaleString('fr-FR')} €</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border"><span className="text-foreground">Total</span><span className="text-primary">{total.toLocaleString('fr-FR')} €</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
          <Button type="submit"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
