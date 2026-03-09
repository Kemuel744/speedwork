import React, { useState, useEffect } from 'react';
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
import { Plus, Users, MapPin, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string;
  leader_name: string;
  zone: string;
  site_name: string;
  status: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', leader_name: '', leader_phone: '', zone: '', site_name: '', status: 'active' });

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (!error && data) setTeams(data as Team[]);
    setLoading(false);
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    const { error } = await supabase.from('teams').insert({
      user_id: user!.id,
      name: form.name.trim(),
      description: form.description.trim(),
      leader_name: form.leader_name.trim(),
      leader_phone: '',
      zone: form.zone.trim(),
      site_name: form.site_name.trim(),
      status: form.status,
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Équipe créée avec succès' });
    setForm({ name: '', description: '', leader_name: '', leader_phone: '', zone: '', site_name: '', status: 'active' });
    setOpen(false);
    fetchTeams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette équipe ?')) return;
    await supabase.from('teams').delete().eq('id', id);
    toast({ title: 'Équipe supprimée' });
    fetchTeams();
  };

  const statusColor = (s: string) => s === 'active' ? 'default' : 'secondary';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Équipes terrain</h1>
          <p className="text-muted-foreground">Gérez vos équipes et assignez-les à des zones de travail</p>
        </div>
        <div className="flex gap-2">
          <Link to="/teams-map">
            <Button variant="outline" size="sm"><MapPin className="w-4 h-4 mr-1" /> Carte</Button>
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nouvelle équipe</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer une équipe</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nom de l'équipe *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Équipe Alpha" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de l'équipe" /></div>
                <div><Label>Chef d'équipe</Label><Input value={form.leader_name} onChange={e => setForm(f => ({ ...f, leader_name: e.target.value }))} placeholder="Nom du chef" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Zone</Label><Input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} placeholder="Ex: Zone Nord" /></div>
                  <div><Label>Chantier</Label><Input value={form.site_name} onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))} placeholder="Ex: Chantier A" /></div>
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

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : teams.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune équipe créée. Commencez par créer votre première équipe terrain.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant={statusColor(team.status)}>{team.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                </div>
                {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {team.leader_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Chef : <strong>{team.leader_name}</strong></span>
                  </div>
                )}
                {team.zone && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{team.zone}{team.site_name ? ` — ${team.site_name}` : ''}</span>
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
