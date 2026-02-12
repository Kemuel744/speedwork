import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('SpeedWork SAS');
  const [companyEmail, setCompanyEmail] = useState('contact@speedwork.com');
  const [companyPhone, setCompanyPhone] = useState('+33 1 23 45 67 89');
  const [companyAddress, setCompanyAddress] = useState('12 Rue de la Paix, 75002 Paris');
  const [defaultTax, setDefaultTax] = useState(20);

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
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">Facturation</h3>
          <div className="space-y-1.5 max-w-xs">
            <Label>TVA par défaut (%)</Label>
            <Input type="number" value={defaultTax} onChange={e => setDefaultTax(Number(e.target.value))} min={0} max={100} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
