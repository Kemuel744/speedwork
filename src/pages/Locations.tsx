import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocations } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Store, Warehouse, Plus, Edit2, Trash2, MapPin, Phone, User, Star, Lock, Crown } from 'lucide-react';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { planQuotas, planNames } from '@/lib/planLimits';
import { Link } from 'react-router-dom';

interface LocationRow {
  id: string;
  name: string;
  location_type: 'shop' | 'warehouse';
  address: string;
  city: string;
  phone: string;
  manager_name: string;
  is_default: boolean;
  is_active: boolean;
  notes: string;
}

const empty: Omit<LocationRow, 'id'> = {
  name: '', location_type: 'shop', address: '', city: '', phone: '',
  manager_name: '', is_default: false, is_active: true, notes: '',
};

export default function Locations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refresh } = useLocations();
  const { plan } = useCurrentPlan();
  const [items, setItems] = useState<LocationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [form, setForm] = useState(empty);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('locations').select('*').order('name');
    if (data) setItems(data as LocationRow[]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Plan-based depot quota (shop is always allowed; only depot/warehouse counts)
  const depotQuota = planQuotas[plan].maxDepots;
  const depotsUsed = items.filter(l => l.location_type === 'warehouse').length;
  const depotLimitReached = depotsUsed >= depotQuota;

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (l: LocationRow) => { setEditing(l); const { id, ...rest } = l; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!user || !form.name.trim()) {
      toast({ title: 'Le nom est requis', variant: 'destructive' });
      return;
    }
    // Enforce plan quota for depots/warehouses (shops are unlimited).
    const isCreatingDepot = form.location_type === 'warehouse';
    const wasDepot = editing?.location_type === 'warehouse';
    const wouldAddDepot = isCreatingDepot && (!editing || !wasDepot);
    if (wouldAddDepot && depotsUsed >= depotQuota) {
      toast({
        title: 'Limite du plan atteinte',
        description: `Le plan ${planNames[plan]} autorise ${depotQuota} dépôt${depotQuota > 1 ? 's' : ''}. Mettez à niveau votre abonnement pour en ajouter davantage.`,
        variant: 'destructive',
      });
      return;
    }
    // If marking as default, unset others first
    if (form.is_default) {
      await supabase.from('locations').update({ is_default: false } as never).eq('user_id', user.id);
    }
    if (editing) {
      const { error } = await supabase.from('locations').update(form as never).eq('id', editing.id);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Lieu mis à jour' });
    } else {
      const { error } = await supabase.from('locations').insert({ ...form, user_id: user.id } as never);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Lieu créé' });
    }
    setOpen(false); fetchAll(); refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce lieu ? Le stock associé sera également supprimé.')) return;
    await supabase.from('locations').delete().eq('id', id);
    toast({ title: 'Lieu supprimé' });
    fetchAll(); refresh();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('locations').update({ is_default: false } as never).eq('user_id', user.id);
    await supabase.from('locations').update({ is_default: true } as never).eq('id', id);
    toast({ title: 'Lieu par défaut mis à jour' });
    fetchAll(); refresh();
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            Boutiques & Dépôts
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Gérez vos points de vente et entrepôts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" />Nouveau lieu</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le lieu' : 'Nouveau lieu'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Boutique centre-ville" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.location_type} onValueChange={(v: 'shop' | 'warehouse') => setForm({ ...form, location_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Boutique</SelectItem>
                    <SelectItem value="warehouse" disabled={depotLimitReached && form.location_type !== 'warehouse'}>
                      Dépôt {depotLimitReached && form.location_type !== 'warehouse' ? '(limite atteinte)' : ''}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.location_type === 'warehouse' && depotLimitReached && (!editing || editing.location_type !== 'warehouse') && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Plan {planNames[plan]} : {depotsUsed}/{depotQuota} dépôt(s) utilisé(s).
                  </p>
                )}
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <Label>Ville</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default}
                  onChange={e => setForm({ ...form, is_default: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="is_default" className="cursor-pointer">Définir comme lieu par défaut</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>{editing ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan quota banner */}
      <div
        className={`rounded-xl border p-3 mb-5 text-sm flex items-center justify-between gap-3 ${
          depotLimitReached
            ? 'border-amber-300 bg-amber-500/10'
            : 'border-border bg-secondary/40'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Warehouse className={`w-4 h-4 shrink-0 ${depotLimitReached ? 'text-amber-600' : 'text-primary'}`} />
          <span className="truncate">
            Plan <strong>{planNames[plan]}</strong> · Dépôts utilisés : <strong>{depotsUsed}/{depotQuota}</strong>
            <span className="text-muted-foreground"> · Boutiques illimitées</span>
          </span>
        </div>
        {depotLimitReached && (
          <Link to="/subscription">
            <Button size="sm" variant="outline" className="shrink-0">
              <Crown className="w-3.5 h-3.5 mr-1.5" /> Mettre à niveau
            </Button>
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">Aucun lieu enregistré</p>
            <p className="text-xs">Créez votre première boutique ou dépôt pour commencer à gérer votre stock par lieu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(l => (
            <Card key={l.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {l.location_type === 'shop'
                        ? <Store className="w-4 h-4 text-primary" />
                        : <Warehouse className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{l.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {l.location_type === 'shop' ? 'Boutique' : 'Dépôt'}
                      </p>
                    </div>
                  </div>
                  {l.is_default && (
                    <Badge className="text-xs shrink-0"><Star className="w-3 h-3 mr-1" />Défaut</Badge>
                  )}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                  {l.address && <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="truncate">{[l.address, l.city].filter(Boolean).join(', ')}</span></div>}
                  {l.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{l.phone}</span></div>}
                  {l.manager_name && <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{l.manager_name}</span></div>}
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  {!l.is_default && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(l.id)} title="Définir par défaut">
                      <Star className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(l)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" />Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(l.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
