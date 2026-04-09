import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Star, Users, MapPin, Building2, Calendar, UserPlus, Search, FileText } from 'lucide-react';
import FieldReportsList from '@/components/reports/FieldReportsList';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string; name: string; description: string; leader_name: string; leader_phone: string;
  zone: string; site_name: string; status: string; team_type: string;
  start_date: string | null; end_date: string | null;
  latitude: number | null; longitude: number | null;
}

interface Member {
  id: string; worker_name: string; worker_phone: string; worker_role: string;
  is_leader: boolean; created_at: string; worker_id: string | null;
}

interface Worker {
  id: string; first_name: string; last_name: string; phone: string;
  position: string; photo_url: string | null; status: string;
}

const TEAM_TYPES: Record<string, string> = {
  journaliere: 'Journalière', hebdomadaire: 'Hebdomadaire',
  chantier: 'Chantier', projet: 'Projet', permanente: 'Permanente',
};

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState<'registry' | 'manual'>('registry');
  const [form, setForm] = useState({ worker_name: '', worker_phone: '', worker_role: 'ouvrier' });
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    const [t, m, w] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('team_members').select('*').eq('team_id', teamId).order('created_at'),
      (supabase as any).from('workers').select('*').eq('status', 'active').order('first_name'),
    ]);
    if (t.data) setTeam(t.data as Team);
    if (m.data) setMembers(m.data as Member[]);
    if (w.data) setWorkers(w.data as Worker[]);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter workers already in the team
  const memberWorkerIds = new Set(members.map(m => m.worker_id).filter(Boolean));
  const availableWorkers = workers.filter(w =>
    !memberWorkerIds.has(w.id) &&
    `${w.first_name} ${w.last_name} ${w.position}`.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const addFromRegistry = async (worker: Worker) => {
    const { error } = await supabase.from('team_members').insert({
      team_id: teamId!,
      user_id: user!.id,
      worker_name: `${worker.first_name} ${worker.last_name}`,
      worker_phone: worker.phone,
      worker_role: worker.position,
      worker_id: worker.id,
    } as any);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `${worker.first_name} ajouté à l'équipe` });
    fetchData();
  };

  const addManual = async () => {
    if (!form.worker_name.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    const { error } = await supabase.from('team_members').insert({
      team_id: teamId!,
      user_id: user!.id,
      worker_name: form.worker_name.trim(),
      worker_phone: form.worker_phone.trim(),
      worker_role: form.worker_role,
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Membre ajouté' });
    setForm({ worker_name: '', worker_phone: '', worker_role: 'ouvrier' });
    setOpen(false);
    fetchData();
  };

  const removeMember = async (id: string) => {
    if (!confirm('Retirer ce membre ?')) return;
    await supabase.from('team_members').delete().eq('id', id);
    toast({ title: 'Membre retiré' });
    fetchData();
  };

  const toggleLeader = async (member: Member) => {
    if (!member.is_leader) {
      await supabase.from('team_members').update({ is_leader: false }).eq('team_id', teamId!);
    }
    await supabase.from('team_members').update({ is_leader: !member.is_leader }).eq('id', member.id);
    if (!member.is_leader) {
      await supabase.from('teams').update({ leader_name: member.worker_name }).eq('id', teamId!);
    }
    toast({ title: member.is_leader ? 'Chef d\'équipe retiré' : 'Chef d\'équipe désigné' });
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!team) return <div className="p-6 text-center text-muted-foreground">Équipe introuvable</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/teams')} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux équipes
      </Button>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Membres</p><p className="text-2xl font-bold">{members.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Zone</p><p className="text-lg font-semibold truncate">{team.zone || '—'}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Chantier</p><p className="text-lg font-semibold truncate">{team.site_name || '—'}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Durée</p><p className="text-sm font-semibold">
              {team.start_date ? new Date(team.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
              {' → '}
              {team.end_date ? new Date(team.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '∞'}
            </p></div>
          </CardContent>
        </Card>
      </div>

      {/* Team info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              {team.description && <p className="text-sm text-muted-foreground mt-1">{team.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full border bg-primary/10 text-primary">{TEAM_TYPES[team.team_type] || team.team_type}</span>
              <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>{team.status === 'active' ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Travailleurs ({members.length})</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Ajouter un travailleur</DialogTitle></DialogHeader>

                {/* Toggle mode */}
                <div className="flex gap-2 mb-4">
                  <Button variant={addMode === 'registry' ? 'default' : 'outline'} size="sm" onClick={() => setAddMode('registry')}>
                    <UserPlus className="w-4 h-4 mr-1" /> Depuis le registre
                  </Button>
                  <Button variant={addMode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setAddMode('manual')}>
                    <Plus className="w-4 h-4 mr-1" /> Saisie manuelle
                  </Button>
                </div>

                {addMode === 'registry' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Rechercher un travailleur..." className="pl-10" />
                    </div>
                    {availableWorkers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {workers.length === 0 ? 'Aucun travailleur enregistré. Créez-en depuis la page Travailleurs.' : 'Tous les travailleurs sont déjà dans cette équipe.'}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableWorkers.map(w => (
                          <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                {w.photo_url ? <AvatarImage src={w.photo_url} /> : null}
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{w.first_name[0]}{w.last_name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{w.first_name} {w.last_name}</p>
                                <p className="text-xs text-muted-foreground">{w.position}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => addFromRegistry(w)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div><Label>Nom *</Label><Input value={form.worker_name} onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))} placeholder="Nom complet" /></div>
                    <div><Label>Téléphone</Label><Input value={form.worker_phone} onChange={e => setForm(f => ({ ...f, worker_phone: e.target.value }))} placeholder="+242..." /></div>
                    <div><Label>Rôle</Label><Input value={form.worker_role} onChange={e => setForm(f => ({ ...f, worker_role: e.target.value }))} placeholder="Ex: Maçon, Ouvrier" /></div>
                    <Button onClick={addManual} className="w-full">Ajouter</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Aucun travailleur dans cette équipe</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Chef</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.worker_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{m.worker_phone || '—'}</TableCell>
                      <TableCell>{m.worker_role}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toggleLeader(m)}>
                          <Star className={`w-4 h-4 ${m.is_leader ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Rapports d'intervention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldReportsList />
        </CardContent>
      </Card>
    </div>
  );
}
