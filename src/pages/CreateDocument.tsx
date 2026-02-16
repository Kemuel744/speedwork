import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { DocumentType, LineItem, DocumentData, DocumentTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Upload, Image, Camera, Loader2, Palette, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { currencies, formatAmount } from '@/lib/currencies';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { supabase } from '@/integrations/supabase/client';
import { extractColorsFromImage, ExtractedColors } from '@/lib/colorExtractor';
import DocumentPreview from '@/components/document/DocumentPreview';

function generateNumber(type: DocumentType) {
  const prefix = type === 'invoice' ? 'FAC' : 'DEV';
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  return `${prefix}-${year}-${rand}`;
}

const templateOptions: { value: DocumentTemplate; label: string; desc: string }[] = [
  { value: 'moderne', label: 'Moderne', desc: 'Design épuré avec accents colorés' },
  { value: 'classique', label: 'Classique', desc: 'Mise en page traditionnelle' },
  { value: 'minimaliste', label: 'Minimaliste', desc: 'Sobre et élégant' },
  { value: 'corporate', label: 'Corporate', desc: 'Professionnel et structuré' },
];

export default function CreateDocument() {
  const { type, id: editId } = useParams<{ type?: string; id?: string }>();
  const navigate = useNavigate();
  const { addDocument, updateDocument, getDocument } = useDocuments();
  const { company: savedCompany } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const editingDoc = editId ? getDocument(editId) : null;
  const isEditing = !!editingDoc;
  const docType: DocumentType = editingDoc ? editingDoc.type : (type === 'quote' ? 'quote' : 'invoice');

  const [company, setCompany] = useState({
    name: editingDoc?.company.name ?? savedCompany.name,
    address: editingDoc?.company.address ?? savedCompany.address,
    phone: editingDoc?.company.phone ?? savedCompany.phone,
    email: editingDoc?.company.email ?? savedCompany.email,
    description: editingDoc?.company.description ?? savedCompany.description ?? '',
    logo: editingDoc?.company.logo ?? savedCompany.logo,
    logoPosition: (editingDoc?.company.logoPosition ?? savedCompany.logoPosition ?? 'left') as 'left' | 'center' | 'right',
    iban: editingDoc?.company.iban ?? savedCompany.iban ?? '',
    bic: editingDoc?.company.bic ?? savedCompany.bic ?? '',
    bankName: editingDoc?.company.bankName ?? savedCompany.bankName ?? '',
    currency: editingDoc?.company.currency ?? savedCompany.currency ?? 'EUR',
    signatoryTitle: editingDoc?.company.signatoryTitle ?? savedCompany.signatoryTitle ?? 'Le Directeur Général',
    brandColors: editingDoc?.company.brandColors ?? savedCompany.brandColors ?? undefined,
    documentTemplate: editingDoc?.company.documentTemplate ?? savedCompany.documentTemplate ?? 'moderne' as DocumentTemplate,
    customNote: editingDoc?.company.customNote ?? savedCompany.customNote ?? '',
  });

  const [client, setClient] = useState(editingDoc?.client ?? { name: '', email: '', phone: '', address: '' });
  const [status, setStatus] = useState<DocumentData['status']>(editingDoc?.status ?? 'draft');
  const [dueDate, setDueDate] = useState(editingDoc?.dueDate ?? '');
  const [subject, setSubject] = useState(editingDoc?.subject ?? '');
  const [taxRate, setTaxRate] = useState(editingDoc?.taxRate ?? savedCompany.defaultTaxRate);
  const [laborCost, setLaborCost] = useState(editingDoc?.laborCost ?? 0);
  const [withholdingRate, setWithholdingRate] = useState(editingDoc?.withholdingRate ?? 0);
  const [items, setItems] = useState<LineItem[]>(
    editingDoc?.items ?? [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }],
  );
  const [extractedColors, setExtractedColors] = useState<ExtractedColors | null>(company.brandColors ?? null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  // Auto-extract colors when logo changes
  useEffect(() => {
    if (company.logo && !company.brandColors) {
      setIsExtractingColors(true);
      extractColorsFromImage(company.logo).then(colors => {
        setExtractedColors(colors);
        setCompany(prev => ({ ...prev, brandColors: colors }));
        setIsExtractingColors(false);
      });
    }
  }, [company.logo]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const logoData = ev.target?.result as string;
      setCompany(prev => ({ ...prev, logo: logoData, brandColors: undefined }));
      // Colors will be extracted by the useEffect
    };
    reader.readAsDataURL(file);
  };

  const handleReExtractColors = async () => {
    if (!company.logo) return;
    setIsExtractingColors(true);
    const colors = await extractColorsFromImage(company.logo);
    setExtractedColors(colors);
    setCompany(prev => ({ ...prev, brandColors: colors }));
    setIsExtractingColors(false);
    toast.success('Couleurs extraites du logo !');
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez prendre ou sélectionner une image');
      return;
    }

    setIsExtracting(true);
    toast.info('Analyse de la photo en cours...');

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('extract-document', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted = data?.data;
      if (!extracted) throw new Error('Aucune donnée extraite');

      if (extracted.client) {
        setClient(prev => ({
          name: extracted.client.name || prev.name,
          email: extracted.client.email || prev.email,
          phone: extracted.client.phone || prev.phone,
          address: extracted.client.address || prev.address,
        }));
      }

      if (extracted.items?.length) {
        setItems(extracted.items.map((item: any) => ({
          id: crypto.randomUUID(),
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          total: Math.round((item.quantity || 1) * (item.unitPrice || 0) * 100) / 100,
        })));
      }

      if (extracted.subject) setSubject(extracted.subject);
      if (extracted.taxRate) setTaxRate(extracted.taxRate);
      if (extracted.laborCost) setLaborCost(extracted.laborCost);
      if (extracted.dueDate) setDueDate(extracted.dueDate);

      toast.success('Données extraites avec succès !');
    } catch (err: any) {
      console.error('Extraction error:', err);
      toast.error(err.message || 'Erreur lors de l\'extraction des données');
    } finally {
      setIsExtracting(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
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

  const { canCreateDocument, trialExpired, docsUsed, docsLimit } = useTrialStatus();
  const [showPreview, setShowPreview] = useState(false);

  // Live preview document object
  const previewDoc = useMemo<DocumentData>(() => ({
    id: editingDoc?.id ?? 'preview',
    number: editingDoc?.number ?? generateNumber(docType),
    type: docType,
    status,
    date: editingDoc?.date ?? new Date().toISOString().split('T')[0],
    dueDate: dueDate || undefined,
    client,
    company,
    items,
    subject: subject || undefined,
    subtotal,
    laborCost,
    taxRate,
    taxAmount,
    withholdingRate,
    withholdingAmount,
    total,
    createdBy: editingDoc?.createdBy ?? '1',
    clientId: editingDoc?.clientId ?? '',
  }), [company, client, items, status, dueDate, subject, subtotal, laborCost, taxRate, taxAmount, withholdingRate, withholdingAmount, total, docType, editingDoc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && !canCreateDocument) {
      toast.error(`Essai terminé. Vous avez atteint la limite de ${docsLimit} documents ou les 3 jours d'essai sont écoulés. Souscrivez un abonnement pour continuer.`);
      return;
    }

    if (!client.name || !client.email) {
      toast.error('Veuillez remplir les informations client');
      return;
    }
    if (items.some(i => !i.description || i.unitPrice <= 0)) {
      toast.error('Veuillez remplir toutes les lignes du tableau');
      return;
    }

    const doc: DocumentData = {
      id: editingDoc?.id ?? crypto.randomUUID(),
      number: editingDoc?.number ?? generateNumber(docType),
      type: docType,
      status,
      date: editingDoc?.date ?? new Date().toISOString().split('T')[0],
      dueDate: dueDate || undefined,
      client,
      company,
      items,
      subject: subject || undefined,
      subtotal,
      laborCost,
      taxRate,
      taxAmount,
      withholdingRate,
      withholdingAmount,
      total,
      createdBy: editingDoc?.createdBy ?? '1',
      clientId: editingDoc?.clientId ?? '',
    };

    try {
      if (isEditing) {
        await updateDocument(doc.id, doc);
        toast.success(`${docType === 'invoice' ? 'Facture' : 'Devis'} mis(e) à jour !`);
      } else {
        await addDocument(doc);
        toast.success(`${docType === 'invoice' ? 'Facture' : 'Devis'} créé(e) avec succès !`);
      }
      navigate(`/document/${doc.id}`);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="section-title">
          {isEditing
            ? `Modifier ${docType === 'invoice' ? 'la facture' : 'le devis'} ${editingDoc?.number}`
            : docType === 'invoice' ? 'Nouvelle Facture' : 'Nouveau Devis'}
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={showPreview ? 'default' : 'outline'}
            onClick={() => setShowPreview(prev => !prev)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Masquer' : 'Aperçu'}
          </Button>
          {!isEditing && (
            <>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {isExtracting ? 'Analyse...' : 'Scanner'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={showPreview ? 'flex gap-6 items-start' : ''}>
        <div className={showPreview ? 'flex-1 min-w-0' : ''}>

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
                    <button type="button" className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center" onClick={() => setCompany(prev => ({ ...prev, logo: undefined, brandColors: undefined }))}>×</button>
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

            {/* Brand Colors */}
            {/* Brand Colors - improved UX */}
            {company.logo && (
              <div className="space-y-2 p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    Couleurs de marque
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleReExtractColors} disabled={isExtractingColors} className="h-7 text-xs">
                    {isExtractingColors ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Ré-extraire
                  </Button>
                </div>
                {extractedColors && (
                  <div className="flex items-center gap-4">
                    {(['primary', 'secondary', 'accent'] as const).map((key) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg border-2 border-border shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: extractedColors[key] }} />
                          <input
                            type="color"
                            value={extractedColors[key]}
                            onChange={e => {
                              const c = { ...extractedColors, [key]: e.target.value };
                              setExtractedColors(c);
                              setCompany(prev => ({ ...prev, brandColors: c }));
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                          {key === 'primary' ? 'Primaire' : key === 'secondary' ? 'Secondaire' : 'Accent'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">Couleurs détectées depuis votre logo. Cliquez pour modifier.</p>
              </div>
            )}

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
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Description <span className="text-muted-foreground">(facultatif)</span></Label>
                <Input value={company.description || ''} onChange={e => setCompany({ ...company, description: e.target.value })} placeholder="Brève description de votre activité" />
              </div>
            </div>
            <h4 className="font-medium text-sm text-muted-foreground mt-2">Signataire</h4>
            <div className="space-y-1.5">
              <Label className="text-xs">Titre du signataire</Label>
              <Select value={company.signatoryTitle} onValueChange={v => setCompany(prev => ({ ...prev, signatoryTitle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Le Directeur Général">Le Directeur Général</SelectItem>
                  <SelectItem value="La Direction Générale">La Direction Générale</SelectItem>
                  <SelectItem value="Le Responsable">Le Responsable</SelectItem>
                  <SelectItem value="Le Gérant">Le Gérant</SelectItem>
                  <SelectItem value="Le Chargé de projet">Le Chargé de projet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <h4 className="font-medium text-sm text-muted-foreground mt-2">Informations bancaires</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Banque</Label>
                <Input value={company.bankName} onChange={e => setCompany({ ...company, bankName: e.target.value })} placeholder="Nom de la banque" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">IBAN</Label>
                <Input value={company.iban} onChange={e => setCompany({ ...company, iban: e.target.value })} placeholder="FR76 XXXX XXXX XXXX" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">BIC</Label>
                <Input value={company.bic} onChange={e => setCompany({ ...company, bic: e.target.value })} placeholder="BNPAFRPP" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="space-y-1.5">
              <Label className="text-xs">Devise</Label>
              <Select value={company.currency} onValueChange={v => setCompany(prev => ({ ...prev, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Template selection */}
        <div className="stat-card">
          <Label className="text-xs font-medium mb-3 block">Modèle de document</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {templateOptions.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setCompany(prev => ({ ...prev, documentTemplate: t.value }))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  company.documentTemplate === t.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
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

        {/* Subject & Custom Note */}
        <div className="stat-card space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Objet</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={`Objet du ${docType === 'invoice' ? 'de la facture' : 'devis'}...`} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes / Conditions <span className="text-muted-foreground">(facultatif)</span></Label>
            <Input value={company.customNote || ''} onChange={e => setCompany(prev => ({ ...prev, customNote: e.target.value }))} placeholder="Ex: Conditions de paiement, mentions légales..." />
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
                <div className="sm:col-span-2 text-right text-sm font-semibold text-foreground">{formatAmount(item.total, company.currency)}</div>
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
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lignes</span><span className="font-medium text-foreground">{formatAmount(items.reduce((s, i) => s + i.total, 0), company.currency)}</span></div>
              {laborCost > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Main d'œuvre</span><span className="font-medium text-foreground">{formatAmount(laborCost, company.currency)}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="font-medium text-foreground">{formatAmount(subtotal, company.currency)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA ({taxRate}%)</span><span className="font-medium text-foreground">{formatAmount(taxAmount, company.currency)}</span></div>
              {withholdingRate > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Retenue à la source ({withholdingRate}%)</span><span className="font-medium text-destructive">-{formatAmount(withholdingAmount, company.currency)}</span></div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border"><span className="text-foreground">Total</span><span className="text-primary">{formatAmount(total, company.currency)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
          <Button type="submit"><Save className="w-4 h-4 mr-2" />{isEditing ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </div>
      </form>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="hidden lg:block w-[400px] shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
            <div className="rounded-lg border border-border bg-muted/30 p-2">
              <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Aperçu en direct</p>
              <div className="overflow-hidden rounded" style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                <DocumentPreview doc={previewDoc} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
