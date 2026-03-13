import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash2, UserPlus, Users, UserCheck, UserX, Camera, Eye, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  position: string;
  base_salary: number;
  status: string;
  photo_url: string | null;
  contract_type: string;
  hire_date: string;
  created_at: string;
  linked_user_id: string | null;
}

const CONTRACT_TYPES = [
  { value: 'journalier', label: 'Journalier' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'cdd', label: 'CDD' },
  { value: 'cdi', label: 'CDI' },
  { value: 'stage', label: 'Stage' },
];

const POSITIONS = [
  'Ouvrier', 'Maçon', 'Électricien', 'Plombier', 'Peintre', 'Soudeur',
  'Charpentier', 'Carreleur', 'Manœuvre', 'Chef de chantier', 'Conducteur',
  'Technicien', 'Gardien', 'Nettoyeur', 'Logisticien', 'Autre',
];

const emptyForm = {
  first_name: '', last_name: '', phone: '', email: '', position: 'Ouvrier',
  base_salary: 0, status: 'active', contract_type: 'journalier',
  hire_date: new Date().toISOString().split('T')[0],
};

export default function Workers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    const { data, error } = await (supabase as any).from('workers').select('*').order('created_at', { ascending: false });
    if (!error && data) setWorkers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const uploadPhoto = async (workerId: string): Promise<string | null> => {
    if (!photoFile || !user) return null;
    const ext = photoFile.name.split('.').pop();
    const path = `${user.id}/${workerId}.${ext}`;
    const { error } = await supabase.storage.from('worker-photos').upload(path, photoFile, { upsert: true });
    if (error) { console.error('Photo upload error:', error); return null; }
    const { data } = supabase.storage.from('worker-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: 'Nom et prénom requis', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const workerId = editingId || crypto.randomUUID();
      let photo_url: string | null = null;
      if (photoFile) {
        photo_url = await uploadPhoto(workerId);
      }

      const payload: any = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        position: form.position,
        base_salary: Number(form.base_salary) || 0,
        status: form.status,
        contract_type: form.contract_type,
        hire_date: form.hire_date,
      };
      if (photo_url) payload.photo_url = photo_url;

      if (editingId) {
        const { error } = await (supabase as any).from('workers').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Travailleur modifié' });
      } else {
        payload.id = workerId;
        payload.user_id = user!.id;
        const { error } = await (supabase as any).from('workers').insert(payload);
        if (error) throw error;
        toast({ title: 'Travailleur enregistré' });
      }

      setForm(emptyForm);
      setEditingId(null);
      setPhotoFile(null);
      setOpen(false);
      fetchWorkers();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (w: Worker) => {
    setEditingId(w.id);
    setForm({
      first_name: w.first_name,
      last_name: w.last_name,
      phone: w.phone,
      email: w.email || '',
      position: w.position,
      base_salary: w.base_salary,
      status: w.status,
      contract_type: w.contract_type,
      hire_date: w.hire_date,
    });
    setPhotoFile(null);
    setOpen(true);
  };

  const handleInvite = async (w: Worker) => {
    if (!w.email) {
      toast({ title: 'Email requis', description: 'Ajoutez l\'email du travailleur avant de l\'inviter.', variant: 'destructive' });
      return;
    }
    if (w.linked_user_id) {
      toast({ title: 'Déjà lié', description: 'Ce travailleur a déjà un compte associé.' });
      return;
    }
    setInviting(w.id);
    try {
      const { data, error } = await supabase.functions.invoke('invite-worker', {
        body: { worker_id: w.id, email: w.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Invitation envoyée ✓', description: data?.message || `Email envoyé à ${w.email}` });
      fetchWorkers();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setInviting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce travailleur ?')) return;
    await (supabase as any).from('workers').delete().eq('id', id);
    toast({ title: 'Travailleur supprimé' });
    fetchWorkers();
  };

  const toggleStatus = async (w: Worker) => {
    const newStatus = w.status === 'active' ? 'inactive' : 'active';
    await (supabase as any).from('workers').update({ status: newStatus }).eq('id', w.id);
    toast({ title: `Statut mis à jour : ${newStatus === 'active' ? 'Actif' : 'Inactif'}` });
    fetchWorkers();
  };

  const filtered = workers.filter(w => {
    const matchSearch = `${w.first_name} ${w.last_name} ${w.position} ${w.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: workers.length,
    active: workers.filter(w => w.status === 'active').length,
    inactive: workers.filter(w => w.status === 'inactive').length,
  };

  const initials = (w: Worker) => `${w.first_name[0] || ''}${w.last_name[0] || ''}`.toUpperCase();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Travailleurs</h1>
          <p className="text-muted-foreground">Base de données des employés de votre entreprise</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); setPhotoFile(null); } }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" /> Nouveau travailleur</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier le travailleur' : 'Enregistrer un travailleur'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    {photoFile ? (
                      <AvatarImage src={URL.createObjectURL(photoFile)} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">{form.first_name[0] || '?'}{form.last_name[0] || ''}</AvatarFallback>
                    )}
                  </Avatar>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">Photo du travailleur (optionnel)</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom *</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Prénom" /></div>
                <div><Label>Nom *</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Nom" /></div>
              </div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+242 06 000 0000" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="travailleur@email.com" /></div>
                <Label>Poste / Métier</Label>
                <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type de contrat</Label>
                  <Select value={form.contract_type} onValueChange={v => setForm(f => ({ ...f, contract_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Salaire de base (FCFA)</Label><Input type="number" value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date d'entrée</Label><Input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} /></div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center"><UserCheck className="w-5 h-5 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Actifs</p><p className="text-2xl font-bold">{stats.active}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><UserX className="w-5 h-5 text-muted-foreground" /></div>
            <div><p className="text-sm text-muted-foreground">Inactifs</p><p className="text-2xl font-bold">{stats.inactive}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, poste, téléphone..." className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workers table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {workers.length === 0 ? 'Aucun travailleur enregistré. Commencez par ajouter vos employés.' : 'Aucun résultat pour votre recherche.'}
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Travailleur</TableHead>
                    <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead className="hidden md:table-cell">Contrat</TableHead>
                    <TableHead className="hidden md:table-cell">Salaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(w => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            {w.photo_url ? <AvatarImage src={w.photo_url} alt={`${w.first_name} ${w.last_name}`} /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(w)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{w.first_name} {w.last_name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{w.phone || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{w.phone || '—'}</TableCell>
                      <TableCell className="text-sm">{w.position}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm capitalize">{CONTRACT_TYPES.find(c => c.value === w.contract_type)?.label || w.contract_type}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-medium">{Number(w.base_salary).toLocaleString('fr-FR')} F</TableCell>
                      <TableCell>
                        <Badge
                          variant={w.status === 'active' ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(w)}
                        >
                          {w.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/workers/${w.id}`)} title="Voir dashboard">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(w)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
