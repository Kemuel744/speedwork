import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export default function SettingsPage() {
  const { company, updateCompany } = useCompany();

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
          <div className="space-y-1.5 max-w-xs">
            <Label>TVA par défaut (%)</Label>
            <Input type="number" value={company.defaultTaxRate} onChange={e => updateCompany({ defaultTaxRate: Number(e.target.value) })} min={0} max={100} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
