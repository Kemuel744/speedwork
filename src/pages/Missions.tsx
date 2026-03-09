import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MapPin, Clock, Users, Briefcase, Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mission {
  id: string; user_id: string; title: string; description: string; workers_needed: number;
  duration: string; salary: number; salary_currency: string; location: string;
  status: string; deadline: string | null; created_at: string;
}

interface Application {
  id: string; mission_id: string; user_id: string; applicant_name: string;
  applicant_phone: string; applicant_email: string; message: string;
  status: string; created_at: string;
}

export default function Missions() {
  const { user } = useAuth();
  const [tab, setTab] = useState('available');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMissionId, setApplyMissionId] = useState('');
  const [viewAppsId, setViewAppsId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', workers_needed: '1', duration: '', salary: '', location: '', deadline: '' });
  const [applyForm, setApplyForm] = useState({ name: '', phone: '', email: '', message: '' });

  const fetchData = async () => {
    const [all, mine] = await Promise.all([
      supabase.from('missions').select('*').eq('status', 'open').neq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('missions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    ]);
    if (all.data) setMissions(all.data as Mission[]);
    if (mine.data) {
      setMyMissions(mine.data as Mission[]);
      // Fetch applications for my missions
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
  };

  useEffect(() => { fetchData(); }, []);

  const createMission = async () => {
    if (!form.title.trim()) { toast({ title: 'Titre requis', variant: 'destructive' }); return; }
    const { error } = await supabase.from('missions').insert({
      user_id: user!.id, title: form.title.trim(), description: form.description.trim(),
      workers_needed: parseInt(form.workers_needed) || 1, duration: form.duration.trim(),
      salary: parseFloat(form.salary) || 0, location: form.location.trim(),
      deadline: form.deadline || null,
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Mission publiée !' });
    setForm({ title: '', description: '', workers_needed: '1', duration: '', salary: '', location: '', deadline: '' });
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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recrutement rapide</h1>
          <p className="text-muted-foreground">Publiez des missions et trouvez des travailleurs terrain</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Publier une mission</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle mission</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Maçons pour chantier" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails de la mission..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Travailleurs recherchés</Label><Input type="number" min="1" value={form.workers_needed} onChange={e => setForm(f => ({ ...f, workers_needed: e.target.value }))} /></div>
                <div><Label>Durée</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="Ex: 2 semaines" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Salaire (FCFA)</Label><Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="0" /></div>
                <div><Label>Localisation</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Brazzaville" /></div>
              </div>
              <div><Label>Date limite</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
              <Button onClick={createMission} className="w-full">Publier la mission</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="available">Missions disponibles ({missions.length})</TabsTrigger>
          <TabsTrigger value="mine">Mes missions ({myMissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : missions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune mission disponible pour le moment</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {missions.map(m => (
                <Card key={m.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{m.title}</CardTitle>
                      <Badge>Ouverte</Badge>
                    </div>
                    {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-muted-foreground" />{m.workers_needed} travailleur(s)</div>
                      {m.duration && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{m.duration}</div>}
                      <div className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-muted-foreground" />{formatSalary(m)}</div>
                      {m.location && <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{m.location}</div>}
                    </div>
                    {m.deadline && <p className="text-xs text-muted-foreground">Date limite : {format(new Date(m.deadline), 'dd MMM yyyy', { locale: fr })}</p>}
                    <Button size="sm" className="w-full mt-2" onClick={() => { setApplyMissionId(m.id); setApplyOpen(true); }}>
                      <Send className="w-4 h-4 mr-1" /> Postuler
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="space-y-4 mt-4">
          {myMissions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Vous n'avez publié aucune mission</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {myMissions.map(m => (
                <Card key={m.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{m.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{m.location} • {m.workers_needed} travailleur(s) • {formatSalary(m)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={m.status === 'open' ? 'default' : 'secondary'}>{m.status === 'open' ? 'Ouverte' : 'Fermée'}</Badge>
                        {m.status === 'open' && <Button size="sm" variant="outline" onClick={() => closeMission(m.id)}>Fermer</Button>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Candidatures ({applications[m.id]?.length || 0})</p>
                      {applications[m.id]?.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setViewAppsId(viewAppsId === m.id ? null : m.id)}>
                          {viewAppsId === m.id ? 'Masquer' : 'Voir'}
                        </Button>
                      )}
                    </div>
                    {viewAppsId === m.id && applications[m.id] && (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Nom</TableHead><TableHead>Téléphone</TableHead><TableHead>Message</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {applications[m.id].map(a => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.applicant_name}</TableCell>
                              <TableCell>{a.applicant_phone || '—'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{a.message || '—'}</TableCell>
                              <TableCell><Badge variant={a.status === 'accepted' ? 'default' : a.status === 'rejected' ? 'destructive' : 'secondary'}>{a.status === 'accepted' ? 'Acceptée' : a.status === 'rejected' ? 'Refusée' : 'En attente'}</Badge></TableCell>
                              <TableCell>
                                {a.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => updateAppStatus(a.id, 'accepted')}><CheckCircle className="w-4 h-4 text-green-500" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => updateAppStatus(a.id, 'rejected')}><XCircle className="w-4 h-4 text-destructive" /></Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))}
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
