import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { currencies } from '@/lib/currencies';

export default function SettingsPage() {
  const { company, updateCompany } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 2 Mo)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateCompany({ logo: ev.target?.result as string });
      toast.success('Logo mis à jour');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Paramètres enregistrés');
  };

  return (
    <div className="page-container">
      <h1 className="section-title mb-6">Paramètres</h1>
      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">Informations entreprise</h3>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Logo de l'entreprise</Label>
            <div className="flex items-center gap-4">
              {company.logo ? (
                <div className="relative">
                  <img src={company.logo} alt="Logo" className="h-16 w-auto rounded-lg border border-border object-contain" />
                  <button
                    type="button"
                    onClick={() => updateCompany({ logo: undefined })}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  Aucun logo
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />Choisir un fichier
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nom de l'entreprise</Label>
              <Input value={company.name} onChange={e => updateCompany({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={company.email} onChange={e => updateCompany({ email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={company.phone} onChange={e => updateCompany({ phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={company.address} onChange={e => updateCompany({ address: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description de l'entreprise <span className="text-muted-foreground text-xs">(facultatif)</span></Label>
            <Textarea
              value={company.description || ''}
              onChange={e => updateCompany({ description: e.target.value })}
              placeholder="Brève description de votre activité (apparaît sur vos factures et devis)"
              rows={2}
            />
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">Informations bancaires</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Banque</Label>
              <Input value={company.bankName || ''} onChange={e => updateCompany({ bankName: e.target.value })} placeholder="Nom de la banque" />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN</Label>
              <Input value={company.iban || ''} onChange={e => updateCompany({ iban: e.target.value })} placeholder="FR76 XXXX XXXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>BIC</Label>
              <Input value={company.bic || ''} onChange={e => updateCompany({ bic: e.target.value })} placeholder="BNPAFRPP" />
            </div>
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">Facturation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div className="space-y-1.5">
              <Label>TVA par défaut (%)</Label>
              <Input type="number" value={company.defaultTaxRate} onChange={e => updateCompany({ defaultTaxRate: Number(e.target.value) })} min={0} max={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Devise</Label>
              <Select value={company.currency || 'EUR'} onValueChange={v => updateCompany({ currency: v })}>
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

        <div className="flex justify-end">
          <Button type="submit"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
