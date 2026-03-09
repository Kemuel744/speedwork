import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Star, Users, MapPin, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string; name: string; description: string; leader_name: string; leader_phone: string;
  zone: string; site_name: string; status: string; latitude: number | null; longitude: number | null;
}

interface Member {
  id: string; worker_name: string; worker_phone: string; worker_role: string; is_leader: boolean; created_at: string;
}

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ worker_name: '', worker_phone: '', worker_role: 'ouvrier' });

  const fetchData = async () => {
    if (!teamId) return;
    const [t, m] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('team_members').select('*').eq('team_id', teamId).order('created_at'),
    ]);
    if (t.data) setTeam(t.data as Team);
    if (m.data) setMembers(m.data as Member[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [teamId]);

  const addMember = async () => {
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
    await supabase.from('team_members').delete().eq('id', id);
    toast({ title: 'Membre retiré' });
    fetchData();
  };

  const toggleLeader = async (member: Member) => {
    // Unset current leader, set new one
    if (!member.is_leader) {
      await supabase.from('team_members').update({ is_leader: false }).eq('team_id', teamId!);
    }
    await supabase.from('team_members').update({ is_leader: !member.is_leader }).eq('id', member.id);
    // Also update team leader_name
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Membres</p><p className="text-2xl font-bold">{members.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Zone</p><p className="text-lg font-semibold">{team.zone || '—'}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Chantier</p><p className="text-lg font-semibold">{team.site_name || '—'}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              {team.description && <p className="text-sm text-muted-foreground mt-1">{team.description}</p>}
            </div>
            <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>{team.status === 'active' ? 'Active' : 'Inactive'}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Travailleurs ({members.length})</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Ajouter un travailleur</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nom *</Label><Input value={form.worker_name} onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))} placeholder="Nom complet" /></div>
                  <div><Label>Téléphone</Label><Input value={form.worker_phone} onChange={e => setForm(f => ({ ...f, worker_phone: e.target.value }))} placeholder="+242..." /></div>
                  <div><Label>Rôle</Label><Input value={form.worker_role} onChange={e => setForm(f => ({ ...f, worker_role: e.target.value }))} placeholder="Ex: Maçon, Ouvrier" /></div>
                  <Button onClick={addMember} className="w-full">Ajouter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Aucun travailleur dans cette équipe</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Chef</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.worker_name}</TableCell>
                    <TableCell>{m.worker_phone || '—'}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
