import React, { useState, useEffect, useCallback } from 'react';
import MissionProofs from '@/components/missions/MissionProofs';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus, MapPin, Clock, Users, Briefcase, Send, CheckCircle, XCircle,
  AlertTriangle, Flag, Search, CalendarDays, Target, UserCheck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mission {
  id: string; user_id: string; title: string; description: string; workers_needed: number;
  duration: string; salary: number; salary_currency: string; location: string;
  latitude: number | null; longitude: number | null;
  status: string; deadline: string | null; created_at: string;
  start_time: string | null; estimated_duration_hours: number;
  priority: string; mission_date: string | null;
  assigned_team_id: string | null; assigned_worker_id: string | null;
}

interface Application {
  id: string; mission_id: string; user_id: string; applicant_name: string;
  applicant_phone: string; applicant_email: string; message: string;
  status: string; created_at: string;
}

interface Team { id: string; name: string; }
interface Worker { id: string; first_name: string; last_name: string; position: string; }

const PRIORITIES = [
  { value: 'basse', label: 'Basse', color: 'bg-muted text-muted-foreground' },
  { value: 'normale', label: 'Normale', color: 'bg-primary/10 text-primary' },
  { value: 'haute', label: 'Haute', color: 'bg-warning/10 text-warning' },
  { value: 'urgente', label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
];

const priorityInfo = (v: string) => PRIORITIES.find(p => p.value === v) || PRIORITIES[1];

export default function Missions() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mine');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMissionId, setApplyMissionId] = useState('');
  const [viewAppsId, setViewAppsId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [assignType, setAssignType] = useState<'none' | 'team' | 'worker'>('none');

  const [form, setForm] = useState({
    title: '', description: '', workers_needed: '1', duration: '', salary: '',
    location: '', deadline: '', mission_date: '', start_time: '',
    estimated_duration_hours: '1', priority: 'normale',
    latitude: '', longitude: '',
    assigned_team_id: '', assigned_worker_id: '',
  });
  const [applyForm, setApplyForm] = useState({ name: '', phone: '', email: '', message: '' });

  const fetchData = useCallback(async () => {
    const [all, mine, t, w] = await Promise.all([
      supabase.from('missions').select('*').eq('status', 'open').neq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('missions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('teams').select('id, name').eq('status', 'active'),
      (supabase as any).from('workers').select('id, first_name, last_name, position').eq('status', 'active'),
    ]);
    if (all.data) setMissions(all.data as Mission[]);
    if (t.data) setTeams(t.data);
    if (w.data) setWorkers(w.data);
    if (mine.data) {
      setMyMissions(mine.data as Mission[]);
      const ids = (mine.data as Mission[]).map(m => m.id);
      if (ids.length > 0) {
        const { data: apps } = await supabase.from('mission_applications').select('*').in('mission_id', ids);
        if (apps) {
          const grouped: Record<string, Application[]> = {};
          (apps as Application[]).forEach(a => {
            if (!grouped[a.mission_id]) grouped[a.mission_id] = [];
            grouped[a.mission_id].push(a);
          });
          setApplications(grouped);
        }
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const captureGPS = () => {
    if (!navigator.geolocation) { toast({ title: 'GPS non disponible', variant: 'destructive' }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })),
      () => toast({ title: 'Impossible d\'obtenir la position', variant: 'destructive' })
    );
  };

  const resetForm = () => {
    setForm({ title: '', description: '', workers_needed: '1', duration: '', salary: '', location: '', deadline: '', mission_date: '', start_time: '', estimated_duration_hours: '1', priority: 'normale', latitude: '', longitude: '', assigned_team_id: '', assigned_worker_id: '' });
    setAssignType('none');
  };

  const createMission = async () => {
    if (!form.title.trim()) { toast({ title: 'Titre requis', variant: 'destructive' }); return; }
    const payload: any = {
      user_id: user!.id, title: form.title.trim(), description: form.description.trim(),
      workers_needed: parseInt(form.workers_needed) || 1, duration: form.duration.trim(),
      salary: parseFloat(form.salary) || 0, location: form.location.trim(),
      deadline: form.deadline || null,
      mission_date: form.mission_date || null,
      start_time: form.start_time || null,
      estimated_duration_hours: parseFloat(form.estimated_duration_hours) || 1,
      priority: form.priority,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      assigned_team_id: assignType === 'team' && form.assigned_team_id ? form.assigned_team_id : null,
      assigned_worker_id: assignType === 'worker' && form.assigned_worker_id ? form.assigned_worker_id : null,
    };
    const { error } = await supabase.from('missions').insert(payload);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Mission créée !' });
    resetForm();
    setCreateOpen(false);
    fetchData();
  };

  const applyToMission = async () => {
    if (!applyForm.name.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    const { error } = await supabase.from('mission_applications').insert({
      mission_id: applyMissionId, user_id: user!.id,
      applicant_name: applyForm.name.trim(), applicant_phone: applyForm.phone.trim(),
      applicant_email: applyForm.email.trim(), message: applyForm.message.trim(),
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Candidature envoyée !' });
    setApplyOpen(false);
    setApplyForm({ name: '', phone: '', email: '', message: '' });
  };

  const updateAppStatus = async (appId: string, status: string) => {
    await supabase.from('mission_applications').update({ status }).eq('id', appId);
    toast({ title: status === 'accepted' ? 'Candidature acceptée' : 'Candidature refusée' });
    fetchData();
  };

  const closeMission = async (id: string) => {
    await supabase.from('missions').update({ status: 'closed' }).eq('id', id);
    toast({ title: 'Mission fermée' });
    fetchData();
  };

  const formatSalary = (m: Mission) => m.salary > 0 ? `${m.salary.toLocaleString()} ${m.salary_currency}` : 'À discuter';

  const getAssignment = (m: Mission) => {
    if (m.assigned_team_id) {
      const team = teams.find(t => t.id === m.assigned_team_id);
      return { type: 'Équipe', name: team?.name || 'Inconnue' };
    }
    if (m.assigned_worker_id) {
      const w = workers.find(w => w.id === m.assigned_worker_id);
      return { type: 'Individuel', name: w ? `${w.first_name} ${w.last_name}` : 'Inconnu' };
    }
    return null;
  };

  const filteredMy = myMissions.filter(m => {
    const matchSearch = `${m.title} ${m.location} ${m.description}`.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'all' || m.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const info = priorityInfo(priority);
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>;
  };

  const MissionCard = ({ m, showApply }: { m: Mission; showApply?: boolean }) => {
    const assignment = getAssignment(m);
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg">{m.title}</CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              <PriorityBadge priority={m.priority} />
              <Badge variant={m.status === 'open' ? 'default' : 'secondary'}>{m.status === 'open' ? 'Ouverte' : 'Fermée'}</Badge>
            </div>
          </div>
          {m.description && <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {m.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{m.location}</div>}
            {m.mission_date && <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{format(new Date(m.mission_date), 'dd MMM yyyy', { locale: fr })}</div>}
            {m.start_time && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{m.start_time.slice(0, 5)}</div>}
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{m.estimated_duration_hours}h estimé</div>
            <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{m.workers_needed} travailleur(s)</div>
            <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{formatSalary(m)}</div>
          </div>
          {assignment && (
            <div className="flex items-center gap-1.5 text-sm bg-primary/5 rounded-lg px-3 py-1.5">
              <Target className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Assigné à : <strong>{assignment.name}</strong> ({assignment.type})</span>
            </div>
          )}
          {m.latitude && m.longitude && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> GPS: {Number(m.latitude).toFixed(4)}, {Number(m.longitude).toFixed(4)}
            </div>
          )}
          {showApply && m.status === 'open' && (
            <Button size="sm" className="w-full mt-2" onClick={() => { setApplyMissionId(m.id); setApplyOpen(true); }}>
              <Send className="w-4 h-4 mr-1" /> Postuler
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Missions terrain</h1>
          <p className="text-muted-foreground">Créez et assignez des missions à vos équipes ou travailleurs</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouvelle mission</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Créer une mission</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Inspection chantier Nord" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails de la mission..." /></div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date de mission</Label><Input type="date" value={form.mission_date} onChange={e => setForm(f => ({ ...f, mission_date: e.target.value }))} /></div>
                <div><Label>Heure de début</Label><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Durée estimée (heures)</Label><Input type="number" min="0.5" step="0.5" value={form.estimated_duration_hours} onChange={e => setForm(f => ({ ...f, estimated_duration_hours: e.target.value }))} /></div>
                <div>
                  <Label>Priorité</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Lieu</Label>
                <div className="flex gap-2">
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Brazzaville Centre" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={captureGPS}><MapPin className="w-4 h-4" /></Button>
                </div>
                {form.latitude && form.longitude && (
                  <p className="text-xs text-muted-foreground mt-1">GPS: {form.latitude}, {form.longitude}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Travailleurs recherchés</Label><Input type="number" min="1" value={form.workers_needed} onChange={e => setForm(f => ({ ...f, workers_needed: e.target.value }))} /></div>
                <div><Label>Salaire (FCFA)</Label><Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="0" /></div>
              </div>

              {/* Assignment */}
              <div className="space-y-2">
                <Label>Assigner la mission</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={assignType === 'none' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('none')}>Aucun</Button>
                  <Button type="button" variant={assignType === 'team' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('team')}>
                    <Users className="w-4 h-4 mr-1" /> Équipe
                  </Button>
                  <Button type="button" variant={assignType === 'worker' ? 'default' : 'outline'} size="sm" onClick={() => setAssignType('worker')}>
                    <UserCheck className="w-4 h-4 mr-1" /> Individuel
                  </Button>
                </div>
                {assignType === 'team' && (
                  <Select value={form.assigned_team_id} onValueChange={v => setForm(f => ({ ...f, assigned_team_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir une équipe" /></SelectTrigger>
                    <SelectContent>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {assignType === 'worker' && (
                  <Select value={form.assigned_worker_id} onValueChange={v => setForm(f => ({ ...f, assigned_worker_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir un travailleur" /></SelectTrigger>
                    <SelectContent>
                      {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.first_name} {w.last_name} — {w.position}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div><Label>Date limite</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
              <Button onClick={createMission} className="w-full">Créer la mission</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une mission..." className="pl-10" />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mine">Mes missions ({myMissions.length})</TabsTrigger>
          <TabsTrigger value="available">Disponibles ({missions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filteredMy.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              {myMissions.length === 0 ? 'Aucune mission créée. Commencez par en créer une.' : 'Aucun résultat.'}
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {filteredMy.map(m => (
                <div key={m.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1"><MissionCard m={m} /></div>
                  </div>
                  {/* Actions & applications */}
                  <div className="ml-0 mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      {m.status === 'open' && <Button size="sm" variant="outline" onClick={() => closeMission(m.id)}>Fermer la mission</Button>}
                      {applications[m.id]?.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setViewAppsId(viewAppsId === m.id ? null : m.id)}>
                          {viewAppsId === m.id ? 'Masquer' : `Voir candidatures (${applications[m.id].length})`}
                        </Button>
                      )}
                    </div>
                    {viewAppsId === m.id && applications[m.id] && (
                      <Card>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader><TableRow>
                              <TableHead>Nom</TableHead><TableHead className="hidden sm:table-cell">Téléphone</TableHead><TableHead>Message</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                              {applications[m.id].map(a => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-medium">{a.applicant_name}</TableCell>
                                  <TableCell className="hidden sm:table-cell">{a.applicant_phone || '—'}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{a.message || '—'}</TableCell>
                                  <TableCell><Badge variant={a.status === 'accepted' ? 'default' : a.status === 'rejected' ? 'destructive' : 'secondary'}>{a.status === 'accepted' ? 'Acceptée' : a.status === 'rejected' ? 'Refusée' : 'En attente'}</Badge></TableCell>
                                  <TableCell>
                                    {a.status === 'pending' && (
                                      <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => updateAppStatus(a.id, 'accepted')}><CheckCircle className="w-4 h-4 text-success" /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => updateAppStatus(a.id, 'rejected')}><XCircle className="w-4 h-4 text-destructive" /></Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : missions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune mission disponible pour le moment</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {missions.map(m => <MissionCard key={m.id} m={m} showApply />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Apply dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Postuler à cette mission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Votre nom *</Label><Input value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Téléphone</Label><Input value={applyForm.phone} onChange={e => setApplyForm(f => ({ ...f, phone: e.target.value }))} placeholder="+242..." /></div>
            <div><Label>Email</Label><Input type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Message</Label><Textarea value={applyForm.message} onChange={e => setApplyForm(f => ({ ...f, message: e.target.value }))} placeholder="Présentez-vous..." /></div>
            <Button onClick={applyToMission} className="w-full"><Send className="w-4 h-4 mr-2" /> Envoyer ma candidature</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
