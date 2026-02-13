import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocuments } from '@/contexts/DocumentsContext';
import { DocumentType, LineItem, DocumentData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Upload, Image } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState({ name: 'SpeedWork SAS', address: '12 Rue de la Paix, 75002 Paris', phone: '+33 1 23 45 67 89', email: 'contact@speedwork.com', logo: '' as string | undefined, logoPosition: 'left' as 'left' | 'center' | 'right' });
  const [client, setClient] = useState({ name: '', email: '', phone: '', address: '' });
  const [status, setStatus] = useState<DocumentData['status']>('draft');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(20);
  const [laborCost, setLaborCost] = useState(0);
  const [withholdingRate, setWithholdingRate] = useState(0);
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompany(prev => ({ ...prev, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

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

  const subtotal = items.reduce((s, i) => s + i.total, 0) + laborCost;
  const taxAmount = Math.round(subtotal * taxRate / 100 * 100) / 100;
  const withholdingAmount = Math.round(subtotal * withholdingRate / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmount - withholdingAmount) * 100) / 100;

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
      laborCost,
      taxRate,
      taxAmount,
      withholdingRate,
      withholdingAmount,
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
        {/* Company & Client info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card space-y-4">
            <h3 className="font-semibold text-foreground">Votre entreprise</h3>

            {/* Logo upload */}
            <div className="space-y-2">
              <Label className="text-xs">Logo</Label>
              <div className="flex items-center gap-4">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {company.logo ? (
                  <div className="relative">
                    <img src={company.logo} alt="Logo" className="h-16 w-auto max-w-[160px] object-contain rounded border border-border" />
                    <button type="button" className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center" onClick={() => setCompany(prev => ({ ...prev, logo: undefined }))}>×</button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />Ajouter un logo
                  </Button>
                )}
                {company.logo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Image className="w-4 h-4 mr-1" />Changer
                  </Button>
                )}
              </div>
              {company.logo && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Position du logo</Label>
                  <Select value={company.logoPosition} onValueChange={(v: 'left' | 'center' | 'right') => setCompany(prev => ({ ...prev, logoPosition: v }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Gauche</SelectItem>
                      <SelectItem value="center">Centre</SelectItem>
                      <SelectItem value="right">Droite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="space-y-1.5">
              <Label className="text-xs">Retenue à la source (%)</Label>
              <Input type="number" value={withholdingRate} onChange={e => setWithholdingRate(Number(e.target.value))} min={0} max={100} />
            </div>
          </div>
        </div>

        {/* Labor cost */}
        <div className="stat-card">
          <div className="max-w-xs space-y-1.5">
            <Label className="text-xs">Main d'œuvre (€)</Label>
            <Input type="number" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} min={0} step={0.01} placeholder="0.00" />
            <p className="text-xs text-muted-foreground">Coût de la main d'œuvre ajouté au sous-total</p>
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
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lignes</span><span className="font-medium text-foreground">{items.reduce((s, i) => s + i.total, 0).toLocaleString('fr-FR')} €</span></div>
              {laborCost > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Main d'œuvre</span><span className="font-medium text-foreground">{laborCost.toLocaleString('fr-FR')} €</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="font-medium text-foreground">{subtotal.toLocaleString('fr-FR')} €</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA ({taxRate}%)</span><span className="font-medium text-foreground">{taxAmount.toLocaleString('fr-FR')} €</span></div>
              {withholdingRate > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Retenue à la source ({withholdingRate}%)</span><span className="font-medium text-destructive">-{withholdingAmount.toLocaleString('fr-FR')} €</span></div>
              )}
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
