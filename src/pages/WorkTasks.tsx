import React, { useState, useEffect, useRef } from 'react';
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
import { Plus, Camera, MapPin, Clock, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Task {
  id: string; title: string; description: string; zone: string; status: string;
  assigned_to: string; due_date: string | null; team_id: string | null; created_at: string;
}

interface Proof {
  id: string; task_id: string; photo_url: string; latitude: number | null;
  longitude: number | null; completed_at: string; notes: string;
}

export default function WorkTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [proofs, setProofs] = useState<Record<string, Proof[]>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofTaskId, setProofTaskId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', description: '', zone: '', assigned_to: '', team_id: '', due_date: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    const [t, tm] = await Promise.all([
      supabase.from('work_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('teams').select('id, name').order('name'),
    ]);
    if (t.data) {
      setTasks(t.data as Task[]);
      // Fetch proofs for all tasks
      const taskIds = (t.data as Task[]).map(tk => tk.id);
      if (taskIds.length > 0) {
        const { data: proofsData } = await supabase.from('work_proofs').select('*').in('task_id', taskIds);
        if (proofsData) {
          const grouped: Record<string, Proof[]> = {};
          (proofsData as Proof[]).forEach(p => {
            if (!grouped[p.task_id]) grouped[p.task_id] = [];
            grouped[p.task_id].push(p);
          });
          setProofs(grouped);
        }
      }
    }
    if (tm.data) setTeams(tm.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createTask = async () => {
    if (!form.title.trim()) { toast({ title: 'Titre requis', variant: 'destructive' }); return; }
    const insert: any = {
      user_id: user!.id, title: form.title.trim(), description: form.description.trim(),
      zone: form.zone.trim(), assigned_to: form.assigned_to.trim(), status: 'pending',
    };
    if (form.team_id) insert.team_id = form.team_id;
    if (form.due_date) insert.due_date = form.due_date;
    const { error } = await supabase.from('work_tasks').insert(insert);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Tâche créée' });
    setForm({ title: '', description: '', zone: '', assigned_to: '', team_id: '', due_date: '' });
    setCreateOpen(false);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('work_tasks').update({ status }).eq('id', id);
    fetchData();
  };

  const captureGPS = () => {
    setCapturingGPS(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setCapturingGPS(false); },
      () => { toast({ title: 'GPS indisponible', description: 'Activez la géolocalisation', variant: 'destructive' }); setCapturingGPS(false); }
    );
  };

  const submitProof = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: 'Photo requise', variant: 'destructive' }); return; }
    setUploading(true);
    const path = `${user!.id}/${proofTaskId}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('work-proofs').upload(path, file);
    if (uploadErr) { toast({ title: 'Erreur upload', description: uploadErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('work-proofs').getPublicUrl(path);
    const { error } = await supabase.from('work_proofs').insert({
      task_id: proofTaskId, user_id: user!.id, photo_url: urlData.publicUrl,
      latitude: gps?.lat ?? null, longitude: gps?.lng ?? null, notes: proofNotes,
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); setUploading(false); return; }
    // Mark task as completed
    await supabase.from('work_tasks').update({ status: 'completed' }).eq('id', proofTaskId);
    toast({ title: 'Preuve envoyée avec succès !' });
    setProofOpen(false); setProofNotes(''); setGps(null); setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    fetchData();
  };

  const openProofDialog = (taskId: string) => {
    setProofTaskId(taskId);
    setProofOpen(true);
    setGps(null);
    setProofNotes('');
  };

  const filtered = tasks.filter(t => statusFilter === 'all' || t.status === statusFilter);
  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s === 'in_progress') return <Clock className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };
  const statusLabel = (s: string) => s === 'completed' ? 'Terminée' : s === 'in_progress' ? 'En cours' : 'En attente';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tâches & Preuves de travail</h1>
          <p className="text-muted-foreground">Assignez des tâches et validez leur réalisation avec preuves</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nouvelle tâche</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une tâche</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Zone</Label><Input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} /></div>
                <div><Label>Assigné à</Label><Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} /></div>
              </div>
              {teams.length > 0 && (
                <div><Label>Équipe</Label>
                  <Select value={form.team_id} onValueChange={v => setForm(f => ({ ...f, team_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Date limite</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              <Button onClick={createTask} className="w-full">Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({tasks.filter(t => t.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="in_progress">En cours ({tasks.filter(t => t.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Terminées ({tasks.filter(t => t.status === 'completed').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune tâche trouvée</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <Card key={task.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {statusIcon(task.status)}
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>{statusLabel(task.status)}</Badge>
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      {task.zone && <span><MapPin className="w-3 h-3 inline mr-1" />{task.zone}</span>}
                      {task.assigned_to && <span>Assigné : {task.assigned_to}</span>}
                      {task.due_date && <span>Échéance : {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}</span>}
                    </div>
                    {/* Proofs */}
                    {proofs[task.id] && proofs[task.id].length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {proofs[task.id].map(p => (
                          <div key={p.id} className="relative group">
                            <img src={p.photo_url} alt="Preuve" className="w-16 h-16 object-cover rounded border" />
                            <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[10px] text-center py-0.5 rounded-b">
                              {format(new Date(p.completed_at), 'HH:mm')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {task.status !== 'completed' && (
                      <>
                        {task.status === 'pending' && <Button size="sm" variant="outline" onClick={() => updateStatus(task.id, 'in_progress')}>Démarrer</Button>}
                        <Button size="sm" onClick={() => openProofDialog(task.id)}>
                          <Camera className="w-4 h-4 mr-1" /> Preuve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Proof dialog */}
      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Envoyer une preuve de travail</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Photo du travail *</Label>
              <Input ref={fileRef} type="file" accept="image/*" capture="environment" className="mt-1" />
            </div>
            <div>
              <Label>Position GPS</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button type="button" variant="outline" size="sm" onClick={captureGPS} disabled={capturingGPS}>
                  {capturingGPS ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MapPin className="w-4 h-4 mr-1" />}
                  Capturer la position
                </Button>
                {gps && <span className="text-xs text-green-600">📍 {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>}
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={proofNotes} onChange={e => setProofNotes(e.target.value)} placeholder="Observations..." />
            </div>
            <div className="bg-muted/50 rounded p-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              Heure de réalisation : {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </div>
            <Button onClick={submitProof} disabled={uploading} className="w-full">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Valider la preuve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
