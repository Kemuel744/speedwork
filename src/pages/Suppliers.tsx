import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, Plus, Mail, Phone, MapPin, Edit2, Trash2, Search } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  payment_terms: string;
  notes: string;
  is_active: boolean;
}

const empty: Omit<Supplier, 'id'> = {
  name: '', contact_person: '', email: '', phone: '', address: '',
  city: '', country: '', tax_id: '', payment_terms: '', notes: '', is_active: true,
};

export default function Suppliers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data as Supplier[]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); const { id, ...rest } = s; setForm(rest); setOpen(true); };

  const save = async () => {
    if (!user || !form.name.trim()) {
      toast({ title: 'Le nom du fournisseur est requis', variant: 'destructive' });
      return;
    }
    if (editing) {
      const { error } = await supabase.from('suppliers').update(form as never).eq('id', editing.id);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Fournisseur mis à jour' });
    } else {
      const { error } = await supabase.from('suppliers').insert({ ...form, user_id: user.id } as never);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Fournisseur ajouté' });
    }
    setOpen(false); fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    await supabase.from('suppliers').delete().eq('id', id);
    toast({ title: 'Fournisseur supprimé' });
    fetchAll();
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            Fournisseurs
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Gérez vos fournisseurs et leurs conditions de paiement</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" />Nouveau fournisseur</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nom du fournisseur *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Personne de contact</Label>
                <Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>N° fiscal / RCCM</Label>
                <Input value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} />
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
                <Label>Pays</Label>
                <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Conditions de paiement</Label>
                <Input placeholder="Ex: Net 30 jours, Comptant, 50% à la commande..." value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>{editing ? 'Mettre à jour' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un fournisseur..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{suppliers.length === 0 ? 'Aucun fournisseur enregistré' : 'Aucun résultat'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    {s.contact_person && <p className="text-xs text-muted-foreground truncate">{s.contact_person}</p>}
                  </div>
                  {!s.is_active && <Badge variant="secondary" className="text-xs">Inactif</Badge>}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                  {s.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{s.email}</span></div>}
                  {s.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{s.phone}</span></div>}
                  {(s.city || s.country) && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{[s.city, s.country].filter(Boolean).join(', ')}</span></div>}
                </div>
                {s.payment_terms && <Badge variant="outline" className="text-xs mb-3">{s.payment_terms}</Badge>}
                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(s)}><Edit2 className="w-3.5 h-3.5 mr-1" />Modifier</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
