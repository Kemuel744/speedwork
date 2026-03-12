import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, MapPin, ChevronRight, Trash2, Calendar, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string;
  leader_name: string;
  zone: string;
  site_name: string;
  status: string;
  team_type: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

const TEAM_TYPES = [
  { value: 'journaliere', label: 'Journalière' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'chantier', label: 'Chantier' },
  { value: 'projet', label: 'Projet' },
  { value: 'permanente', label: 'Permanente' },
];

const teamTypeLabel = (v: string) => TEAM_TYPES.find(t => t.value === v)?.label || v;

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [form, setForm] = useState({
    name: '', description: '', leader_name: '', leader_phone: '',
    zone: '', site_name: '', status: 'active', team_type: 'chantier',
    start_date: '', end_date: '',
  });

  const fetchTeams = useCallback(async () => {
    const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (!error && data) setTeams(data as Team[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    const { error } = await supabase.from('teams').insert({
      user_id: user!.id,
      name: form.name.trim(),
      description: form.description.trim(),
      leader_name: form.leader_name.trim(),
      leader_phone: form.leader_phone.trim(),
      zone: form.zone.trim(),
      site_name: form.site_name.trim(),
      status: form.status,
      team_type: form.team_type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    } as any);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Équipe créée avec succès' });
    setForm({ name: '', description: '', leader_name: '', leader_phone: '', zone: '', site_name: '', status: 'active', team_type: 'chantier', start_date: '', end_date: '' });
    setOpen(false);
    fetchTeams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    await supabase.from('teams').delete().eq('id', id);
    toast({ title: 'Équipe supprimée' });
    fetchTeams();
  };

  const filtered = teams.filter(t => {
    const matchSearch = `${t.name} ${t.leader_name} ${t.zone} ${t.site_name}`.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.team_type === filterType;
    return matchSearch && matchType;
  });

  const typeColor = (t: string) => {
    const colors: Record<string, string> = {
      journaliere: 'bg-warning/10 text-warning border-warning/20',
      hebdomadaire: 'bg-primary/10 text-primary border-primary/20',
      chantier: 'bg-success/10 text-success border-success/20',
      projet: 'bg-accent/10 text-accent border-accent/20',
      permanente: 'bg-foreground/10 text-foreground border-foreground/20',
    };
    return colors[t] || '';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Équipes terrain</h1>
          <p className="text-muted-foreground">Créez et gérez vos équipes dynamiques</p>
        </div>
        <div className="flex gap-2">
          <Link to="/teams-map">
            <Button variant="outline" size="sm"><MapPin className="w-4 h-4 mr-1" /> Carte</Button>
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nouvelle équipe</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Créer une équipe</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nom de l'équipe *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Équipe Alpha" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de l'équipe" /></div>
                <div>
                  <Label>Type d'équipe</Label>
                  <Select value={form.team_type} onValueChange={v => setForm(f => ({ ...f, team_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Chef d'équipe</Label><Input value={form.leader_name} onChange={e => setForm(f => ({ ...f, leader_name: e.target.value }))} placeholder="Nom du chef" /></div>
                <div><Label>Tél. du chef</Label><Input value={form.leader_phone} onChange={e => setForm(f => ({ ...f, leader_phone: e.target.value }))} placeholder="+242..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Zone</Label><Input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} placeholder="Ex: Zone Nord" /></div>
                  <div><Label>Chantier</Label><Input value={form.site_name} onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))} placeholder="Ex: Chantier A" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date début</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                  <div><Label>Date fin</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Créer l'équipe</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une équipe..." className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {TEAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {teams.length === 0 ? 'Aucune équipe créée. Commencez par créer votre première équipe terrain.' : 'Aucun résultat pour votre recherche.'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(team => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColor(team.team_type)}`}>{teamTypeLabel(team.team_type)}</span>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>{team.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
                {team.description && <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>}
              </CardHeader>
              <CardContent className="space-y-2">
                {team.leader_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Chef : <strong>{team.leader_name}</strong></span>
                  </div>
                )}
                {team.zone && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{team.zone}{team.site_name ? ` — ${team.site_name}` : ''}</span>
                  </div>
                )}
                {(team.start_date || team.end_date) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      {team.start_date ? new Date(team.start_date).toLocaleDateString('fr-FR') : '—'}
                      {' → '}
                      {team.end_date ? new Date(team.end_date).toLocaleDateString('fr-FR') : 'Indéterminée'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Link to={`/teams/${team.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Détails <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
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
