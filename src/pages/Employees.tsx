import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Trash2, Save, Users, KeyRound, Shield } from 'lucide-react';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [perm, setPerm] = useState<Permissions | null>(null);
  const [permOpen, setPermOpen] = useState(false);
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
    const payload: Record<string, unknown> = { ...rest, user_id: user.id };
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
    </div>
  );
}