import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Users, KeyRound, Shield, Printer } from 'lucide-react';
import { printElement } from '@/lib/printElement';
import { useCompany } from '@/contexts/CompanyContext';

interface Employee {
  id: string; full_name: string; email: string; phone: string; role: string;
  pin_code: string; is_active: boolean; hired_at: string;
}
interface Permissions {
  id?: string; employee_id: string;
  can_sell: boolean; can_refund: boolean; can_discount: boolean;
  can_open_cash: boolean; can_close_cash: boolean;
  can_view_reports: boolean; can_manage_stock: boolean; can_manage_products: boolean;
  max_discount_pct: number;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  manager: { label: 'Gérant', color: 'bg-purple-500' },
  cashier: { label: 'Caissier', color: 'bg-blue-500' },
  seller: { label: 'Vendeur', color: 'bg-green-500' },
  stockkeeper: { label: 'Magasinier', color: 'bg-amber-500' },
};

const defaultPerm = (employee_id: string): Permissions => ({
  employee_id, can_sell: true, can_refund: false, can_discount: false,
  can_open_cash: false, can_close_cash: false,
  can_view_reports: false, can_manage_stock: false, can_manage_products: false,
  max_discount_pct: 0,
});

export default function Employees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { company } = useCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [perm, setPerm] = useState<Permissions | null>(null);
  const [permOpen, setPermOpen] = useState(false);
  const [cardEmp, setCardEmp] = useState<Employee | null>(null);
  const [cardPin, setCardPin] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', role: 'cashier', pin_code: '', is_active: true,
  });

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('employees').select('*').eq('user_id', user.id).order('full_name');
    setEmployees((data as Employee[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!user) return;
    if (!form.full_name.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    if (!editing && !/^\d{4}$/.test(form.pin_code)) {
      toast({ title: 'PIN à 4 chiffres requis', variant: 'destructive' });
      return;
    }
    const { pin_code, ...rest } = form;
    const payload: any = { ...rest, user_id: user.id };
    if (pin_code && /^\d{4}$/.test(pin_code)) payload.pin_code = pin_code;
    const { error } = editing
      ? await supabase.from('employees').update(payload).eq('id', editing.id)
      : await supabase.from('employees').insert(payload);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'Employé modifié' : 'Employé ajouté' });
    setOpen(false); setEditing(null);
    setForm({ full_name: '', email: '', phone: '', role: 'cashier', pin_code: '', is_active: true });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet employé ?')) return;
    await supabase.from('employees').delete().eq('id', id);
    load();
  };

  const startEdit = (e: Employee) => {
    setEditing(e);
    // PINs are hashed server-side; leave blank to keep current PIN.
    setForm({ full_name: e.full_name, email: e.email, phone: e.phone, role: e.role, pin_code: '', is_active: e.is_active });
    setOpen(true);
  };

  const openPermissions = async (emp: Employee) => {
    const { data } = await supabase.from('employee_permissions').select('*').eq('employee_id', emp.id).maybeSingle();
    setPerm(data ? (data as Permissions) : defaultPerm(emp.id));
    setPermOpen(true);
  };

  const savePermissions = async () => {
    if (!user || !perm) return;
    const payload = { ...perm, user_id: user.id };
    const { error } = perm.id
      ? await supabase.from('employee_permissions').update(payload).eq('id', perm.id)
      : await supabase.from('employee_permissions').insert(payload);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Permissions enregistrées' }); setPermOpen(false); }
  };

  const openCard = (emp: Employee) => {
    setCardEmp(emp);
    setCardPin('');
  };

  const printCard = async () => {
    if (!cardEmp || !/^\d{4}$/.test(cardPin)) {
      toast({ title: 'PIN requis', description: 'Saisissez le PIN à 4 chiffres pour l\'imprimer sur la carte.', variant: 'destructive' });
      return;
    }
    await printElement(cardRef.current, {
      title: `Carte_${cardEmp.full_name.replace(/\s+/g, '_')}`,
      pageMargin: '0',
    });
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Employés & caissiers</h1>
          <p className="text-muted-foreground text-sm">Gérez votre équipe et leurs permissions</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nouvel employé</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvel'} employé</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom complet *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rôle</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PIN (4 chiffres) *</Label>
                  <Input maxLength={4} pattern="\d{4}" value={form.pin_code}
                    onChange={e => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label>Actif</Label>
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              </div>
              <Button onClick={save} className="w-full"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(e => {
          const r = roleLabels[e.role] || roleLabels.cashier;
          return (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{e.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{e.email || e.phone || '—'}</p>
                  </div>
                  <Badge className={r.color}>{r.label}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <KeyRound className="w-4 h-4" />PIN : <span className="font-mono font-semibold">••••</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={e.is_active ? 'default' : 'outline'}>{e.is_active ? 'Actif' : 'Inactif'}</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openPermissions(e)} className="flex-1">
                    <Shield className="w-3.5 h-3.5 mr-1" />Permissions
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openCard(e)} title="Imprimer la carte d'employé">
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(e)}>Modifier</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(e.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {employees.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />Aucun employé. Ajoutez votre premier collaborateur.
          </CardContent></Card>
        )}
      </div>

      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Permissions</DialogTitle></DialogHeader>
          {perm && (
            <div className="space-y-3">
              {([
                ['can_sell', 'Vendre (POS)'],
                ['can_refund', 'Effectuer des retours'],
                ['can_discount', 'Appliquer des remises'],
                ['can_open_cash', 'Ouvrir la caisse'],
                ['can_close_cash', 'Clôturer la caisse'],
                ['can_view_reports', 'Voir les rapports'],
                ['can_manage_stock', 'Gérer le stock'],
                ['can_manage_products', 'Gérer les produits'],
              ] as [keyof Permissions, string][]).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={perm[k] as boolean} onCheckedChange={v => setPerm({ ...perm, [k]: v })} />
                </div>
              ))}
              <div>
                <Label>Remise max autorisée (%)</Label>
                <Input type="number" step="0.1" value={perm.max_discount_pct}
                  onChange={e => setPerm({ ...perm, max_discount_pct: parseFloat(e.target.value) || 0 })} />
              </div>
              <Button onClick={savePermissions} className="w-full"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog impression carte employé */}
      <Dialog open={!!cardEmp} onOpenChange={(v) => { if (!v) setCardEmp(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Carte d'employé imprimable
            </DialogTitle>
          </DialogHeader>
          {cardEmp && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/40 border border-border p-3 text-sm">
                <p className="font-medium mb-1">{cardEmp.full_name}</p>
                <p className="text-muted-foreground text-xs">
                  Pour des raisons de sécurité, le PIN n'est pas stocké en clair.
                  Ressaisissez-le ci-dessous pour l'imprimer sur la carte à remettre au caissier.
                </p>
              </div>
              <div>
                <Label>PIN à imprimer (4 chiffres)</Label>
                <Input
                  maxLength={4}
                  inputMode="numeric"
                  pattern="\d{4}"
                  value={cardPin}
                  onChange={(e) => setCardPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="text-center text-xl tracking-[0.5em] font-mono"
                />
              </div>
              <Button onClick={printCard} className="w-full" disabled={cardPin.length !== 4}>
                <Printer className="w-4 h-4 mr-2" />Imprimer la carte
              </Button>

              {/* Aperçu / contenu imprimé (caché à l'écran sauf preview) */}
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Aperçu :</p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <div ref={cardRef} style={{
                    width: '105mm', minHeight: '74mm', padding: '8mm', boxSizing: 'border-box',
                    background: '#ffffff', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    border: '1px solid #e2e8f0', margin: '0 auto',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '4mm' }}>
                      <div>
                        <div style={{ fontSize: '10pt', color: '#64748b', fontWeight: 500 }}>Carte d'employé</div>
                        <div style={{ fontSize: '13pt', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                          {company.name || 'Ma Boutique'}
                        </div>
                      </div>
                      {company.logo && (
                        <img src={company.logo} alt="" style={{ height: '14mm', width: 'auto', objectFit: 'contain' }} />
                      )}
                    </div>

                    <div style={{ textAlign: 'center', padding: '4mm 0' }}>
                      <div style={{ fontSize: '16pt', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                        {cardEmp.full_name}
                      </div>
                      <div style={{ fontSize: '10pt', color: '#64748b', marginTop: '1mm', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {(roleLabels[cardEmp.role] || roleLabels.cashier).label}
                      </div>
                    </div>

                    <div style={{
                      background: '#eff6ff', border: '1px dashed #2563eb', borderRadius: '4px',
                      padding: '3mm', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '8pt', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Code PIN d'ouverture de caisse
                      </div>
                      <div style={{ fontSize: '28pt', fontWeight: 800, color: '#1d4ed8', letterSpacing: '8px', fontFamily: 'monospace', marginTop: '1mm' }}>
                        {cardPin || '••••'}
                      </div>
                    </div>

                    <div style={{ fontSize: '7.5pt', color: '#64748b', textAlign: 'center', lineHeight: 1.4, marginTop: '3mm' }}>
                      Saisissez ce code sur l'écran <strong>Caisse journalière</strong> pour ouvrir la caisse.<br />
                      Document confidentiel — ne pas partager.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}