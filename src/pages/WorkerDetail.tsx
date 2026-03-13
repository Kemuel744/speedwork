import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, MapPin, Users, Star, Clock, CalendarDays, CheckCircle,
  TrendingUp, Target, Briefcase, Navigation, Award, BarChart3,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkerProfile {
  id: string; first_name: string; last_name: string; phone: string;
  position: string; photo_url: string | null; base_salary: number;
  contract_type: string; status: string; hire_date: string;
}

interface TeamInfo {
  id: string; name: string; zone: string; site_name: string;
  leader_name: string; leader_phone: string; status: string;
  start_date: string | null; end_date: string | null; team_type: string;
}

interface TeamMember {
  id: string; worker_name: string; worker_role: string; is_leader: boolean;
}

interface Mission {
  id: string; title: string; description: string; location: string;
  mission_date: string | null; start_time: string | null;
  estimated_duration_hours: number; priority: string; status: string;
  latitude: number | null; longitude: number | null;
}

interface TimeEntry {
  id: string; entry_type: string; timestamp: string;
  mission_id: string | null; notes: string;
}

interface WorkProof {
  id: string; photo_url: string; proof_type: string; notes: string;
  completed_at: string; mission_id: string | null;
}

interface PayrollRecord {
  id: string; month_year: string; days_worked: number; hours_worked: number;
  missions_completed: number; net_salary: number; status: string;
  performance_bonus: number; late_count: number; days_absent: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  basse: 'bg-muted text-muted-foreground',
  normale: 'bg-primary/10 text-primary',
  haute: 'bg-warning/10 text-warning',
  urgente: 'bg-destructive/10 text-destructive',
};

const CONTRACT_LABELS: Record<string, string> = {
  journalier: 'Journalier', hebdomadaire: 'Hebdomadaire', mensuel: 'Mensuel',
  cdd: 'CDD', cdi: 'CDI', stage: 'Stage',
};

export default function WorkerDetail() {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [workProofs, setWorkProofs] = useState<WorkProof[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!workerId || !user) return;

    // Fetch worker profile
    const { data: workerData } = await (supabase as any)
      .from('workers').select('*').eq('id', workerId).single();
    if (!workerData) { setLoading(false); return; }
    setWorker(workerData);

    // Parallel fetches
    const [memberRes, missionsActiveRes, missionsCompletedRes, entriesRes, proofsRes, payrollRes] = await Promise.all([
      supabase.from('team_members').select('team_id').eq('worker_id', workerId),
      supabase.from('missions').select('*')
        .or(`assigned_worker_id.eq.${workerId}`)
        .in('status', ['open', 'in_progress'])
        .order('mission_date', { ascending: true }),
      supabase.from('missions').select('*')
        .or(`assigned_worker_id.eq.${workerId}`)
        .eq('status', 'completed')
        .order('mission_date', { ascending: false })
        .limit(20),
      (supabase as any).from('time_entries').select('*')
        .eq('worker_id', workerId)
        .gte('timestamp', subDays(new Date(), 30).toISOString())
        .order('timestamp', { ascending: false }),
      (supabase as any).from('work_proofs').select('*')
        .eq('user_id', workerData.linked_user_id || workerData.user_id)
        .order('completed_at', { ascending: false })
        .limit(20),
      (supabase as any).from('payroll').select('*')
        .eq('worker_id', workerId)
        .order('month_year', { ascending: false })
        .limit(6),
    ]);

    if (missionsActiveRes.data) setMissions(missionsActiveRes.data as Mission[]);
    if (missionsCompletedRes.data) setCompletedMissions(missionsCompletedRes.data as Mission[]);
    if (entriesRes.data) setTimeEntries(entriesRes.data as TimeEntry[]);
    if (proofsRes.data) setWorkProofs(proofsRes.data as WorkProof[]);
    if (payrollRes.data) setPayroll(payrollRes.data as PayrollRecord[]);

    // Teams
    const teamIds = (memberRes.data || []).map((m: any) => m.team_id);
    if (teamIds.length > 0) {
      const [teamsRes, allMembersRes] = await Promise.all([
        supabase.from('teams').select('*').in('id', teamIds),
        supabase.from('team_members').select('*').in('team_id', teamIds),
      ]);
      if (teamsRes.data) setTeams(teamsRes.data as TeamInfo[]);
      if (allMembersRes.data) {
        const grouped: Record<string, TeamMember[]> = {};
        (allMembersRes.data as TeamMember[]).forEach((m: any) => {
          if (!grouped[m.team_id]) grouped[m.team_id] = [];
          grouped[m.team_id].push(m);
        });
        setTeamMembers(grouped);
      }
    }

    setLoading(false);
  }, [workerId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!worker) return (
    <div className="p-4 lg:p-6">
      <Button variant="ghost" onClick={() => navigate('/workers')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
      <Card><CardContent className="py-16 text-center text-muted-foreground">Travailleur introuvable</CardContent></Card>
    </div>
  );

  // Stats calculations
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weekEntries = timeEntries.filter(e => {
    const d = new Date(e.timestamp);
    return d >= weekStart && d <= weekEnd;
  });
  const monthEntries = timeEntries.filter(e => {
    const d = new Date(e.timestamp);
    return d >= monthStart && d <= monthEnd;
  });

  const countArrivals = (entries: TimeEntry[]) => entries.filter(e => e.entry_type === 'arrival').length;
  const daysWorkedWeek = countArrivals(weekEntries);
  const daysWorkedMonth = countArrivals(monthEntries);

  const totalMissionsCompleted = completedMissions.length;
  const _totalProofs = workProofs.length;

  // Reliability score approximation
  const lastPayroll = payroll[0];
  const reliabilityScore = lastPayroll
    ? Math.min(100, Math.round((lastPayroll.days_worked / Math.max(1, lastPayroll.days_worked + lastPayroll.days_absent)) * 100 - lastPayroll.late_count * 5))
    : null;

  const getGrade = (score: number) => {
    if (score >= 95) return { grade: 'A+', color: 'text-success' };
    if (score >= 85) return { grade: 'A', color: 'text-success' };
    if (score >= 75) return { grade: 'B', color: 'text-primary' };
    if (score >= 60) return { grade: 'C', color: 'text-warning' };
    return { grade: 'D', color: 'text-destructive' };
  };

  // Filter teams by period
  const weekTeams = teams.filter(t => {
    if (!t.start_date) return t.status === 'active';
    const start = new Date(t.start_date);
    const end = t.end_date ? new Date(t.end_date) : new Date('2099-12-31');
    return start <= weekEnd && end >= weekStart;
  });
  const monthTeams = teams.filter(t => {
    if (!t.start_date) return t.status === 'active';
    const start = new Date(t.start_date);
    const end = t.end_date ? new Date(t.end_date) : new Date('2099-12-31');
    return start <= monthEnd && end >= monthStart;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/workers')} className="mb-0">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux travailleurs
      </Button>

      {/* Worker header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              {worker.photo_url ? <AvatarImage src={worker.photo_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {worker.first_name[0]}{worker.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{worker.first_name} {worker.last_name}</h1>
              <p className="text-muted-foreground">{worker.position}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>
                  {worker.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant="outline">{CONTRACT_LABELS[worker.contract_type] || worker.contract_type}</Badge>
                <Badge variant="outline">{Number(worker.base_salary).toLocaleString('fr-FR')} FCFA</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Embauché le {format(new Date(worker.hire_date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <CalendarDays className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{daysWorkedWeek}</p>
            <p className="text-xs text-muted-foreground">Jours cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{daysWorkedMonth}</p>
            <p className="text-xs text-muted-foreground">Jours ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalMissionsCompleted}</p>
            <p className="text-xs text-muted-foreground">Missions terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            {reliabilityScore !== null ? (
              <>
                <Award className={`w-6 h-6 mx-auto mb-1 ${getGrade(reliabilityScore).color}`} />
                <p className={`text-2xl font-bold ${getGrade(reliabilityScore).color}`}>{getGrade(reliabilityScore).grade}</p>
                <p className="text-xs text-muted-foreground">Fiabilité ({reliabilityScore}%)</p>
              </>
            ) : (
              <>
                <Award className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">Fiabilité</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="missions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="teams">Équipes</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
        </TabsList>

        {/* MISSIONS TAB */}
        <TabsContent value="missions" className="space-y-4">
          {/* Active missions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Missions actives ({missions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {missions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune mission en cours</p>
              ) : (
                <div className="space-y-3">
                  {missions.map(m => (
                    <div key={m.id} className="p-3 rounded-lg border hover:bg-secondary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{m.title}</p>
                          {m.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[m.priority] || ''}`}>
                          {m.priority}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                        {m.mission_date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(new Date(m.mission_date), 'dd/MM/yyyy')}</span>}
                        {m.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.start_time.slice(0, 5)}</span>}
                      </div>
                      {m.latitude && m.longitude && (
                        <a href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> Voir sur la carte
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed missions */}
          {completedMissions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" /> Missions terminées ({completedMissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedMissions.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.location}</p>
                      </div>
                      {m.mission_date && <span className="text-xs text-muted-foreground shrink-0">{format(new Date(m.mission_date), 'dd/MM')}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work proofs */}
          {workProofs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  📷 Preuves de travail ({workProofs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {workProofs.slice(0, 6).map(p => (
                    <div key={p.id} className="space-y-1">
                      <img src={p.photo_url} alt="Preuve" className="w-full h-24 object-cover rounded-lg border" />
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{p.proof_type === 'before' ? 'Avant' : 'Après'}</Badge>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(p.completed_at), 'dd/MM HH:mm')}</span>
                      </div>
                      {p.notes && <p className="text-[10px] text-muted-foreground line-clamp-1">{p.notes}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TEAMS TAB */}
        <TabsContent value="teams" className="space-y-4">
          {/* This week's teams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Équipes de la semaine
                <Badge variant="outline" className="ml-auto text-xs">
                  {format(weekStart, 'dd/MM')} — {format(weekEnd, 'dd/MM')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune équipe cette semaine</p>
              ) : weekTeams.map(t => (
                <TeamCard key={t.id} team={t} members={teamMembers[t.id] || []} />
              ))}
            </CardContent>
          </Card>

          {/* This month's teams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Équipes du mois
                <Badge variant="outline" className="ml-auto text-xs">
                  {format(monthStart, 'MMMM yyyy', { locale: fr })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune équipe ce mois</p>
              ) : monthTeams.map(t => (
                <TeamCard key={t.id} team={t} members={teamMembers[t.id] || []} />
              ))}
            </CardContent>
          </Card>

          {/* All teams */}
          {teams.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Toutes les équipes ({teams.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map(t => (
                    <TeamCard key={t.id} team={t} members={teamMembers[t.id] || []} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Historique de pointage (30 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun pointage enregistré</p>
              ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {timeEntries.map(entry => {
                    const typeLabel: Record<string, string> = {
                      arrival: '🟢 Arrivée', break_start: '⏸ Pause', break_end: '▶ Reprise',
                      departure: '🔴 Départ', photo: '📷 Photo',
                    };
                    return (
                      <div key={entry.id} className="flex items-center gap-3 text-sm py-2 px-3 rounded-lg bg-secondary/30">
                        <span className="font-medium whitespace-nowrap">{typeLabel[entry.entry_type] || entry.entry_type}</span>
                        <span className="text-muted-foreground text-xs truncate flex-1">{entry.notes}</span>
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {format(new Date(entry.timestamp), 'dd/MM HH:mm')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVOLUTION TAB */}
        <TabsContent value="evolution" className="space-y-4">
          {payroll.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p>Pas encore de données de paie pour afficher l'évolution.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Monthly evolution cards */}
              {payroll.map(p => (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{p.month_year}</span>
                      <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                        {p.status === 'paid' ? 'Payé' : p.status === 'approved' ? 'Approuvé' : 'Brouillon'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Jours travaillés</p>
                        <p className="font-semibold">{p.days_worked} jours</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Heures</p>
                        <p className="font-semibold">{Number(p.hours_worked).toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Missions</p>
                        <p className="font-semibold">{p.missions_completed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Retards</p>
                        <p className={`font-semibold ${p.late_count > 0 ? 'text-warning' : ''}`}>{p.late_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Absences</p>
                        <p className={`font-semibold ${p.days_absent > 0 ? 'text-destructive' : ''}`}>{p.days_absent}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Prime perf.</p>
                        <p className="font-semibold text-success">{Number(p.performance_bonus).toLocaleString('fr-FR')} F</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Salaire net</span>
                      <span className="text-lg font-bold text-foreground">{Number(p.net_salary).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    {/* Attendance rate */}
                    {(p.days_worked + p.days_absent) > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Taux de présence</span>
                          <span className="font-medium">{Math.round((p.days_worked / (p.days_worked + p.days_absent)) * 100)}%</span>
                        </div>
                        <Progress value={(p.days_worked / (p.days_worked + p.days_absent)) * 100} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component for team cards
function TeamCard({ team, members }: { team: TeamInfo; members: TeamMember[] }) {
  return (
    <div className="p-3 rounded-lg border mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">{team.name}</h4>
        <div className="flex gap-1.5">
          <Badge variant="outline" className="text-[10px]">{team.team_type}</Badge>
          <Badge variant={team.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
            {team.status === 'active' ? 'Active' : 'Terminée'}
          </Badge>
        </div>
      </div>
      {team.zone && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3" /> {team.zone}{team.site_name ? ` — ${team.site_name}` : ''}
        </p>
      )}
      {team.leader_name && (
        <p className="text-xs flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Chef : <strong>{team.leader_name}</strong>
        </p>
      )}
      {team.start_date && (
        <p className="text-xs text-muted-foreground mb-2">
          {format(new Date(team.start_date), 'dd/MM/yyyy')} → {team.end_date ? format(new Date(team.end_date), 'dd/MM/yyyy') : 'En cours'}
        </p>
      )}
      {members.length > 0 && (
        <div className="space-y-1 pt-1 border-t">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-xs py-0.5">
              {m.is_leader && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              <span className={m.is_leader ? 'font-medium' : ''}>{m.worker_name}</span>
              <span className="text-muted-foreground">— {m.worker_role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
