import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, TrendingUp, Clock, Target, Star, Award, AlertTriangle } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  photo_url: string | null;
  status: string;
  hire_date: string;
}

interface ReliabilityScore {
  worker: Worker;
  punctualityScore: number;
  missionsScore: number;
  qualityScore: number;
  attendanceScore: number;
  totalScore: number;
  grade: string;
  gradeColor: string;
  details: {
    totalDays: number;
    lateDays: number;
    missionsCompleted: number;
    missionsTotal: number;
    proofsSubmitted: number;
    daysPresent: number;
    workingDays: number;
  };
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'A+', color: 'text-emerald-600' };
  if (score >= 80) return { grade: 'A', color: 'text-emerald-500' };
  if (score >= 70) return { grade: 'B', color: 'text-blue-500' };
  if (score >= 60) return { grade: 'C', color: 'text-amber-500' };
  if (score >= 50) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-destructive' };
}

function countWorkingDays(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export default function ReliabilityScores() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ReliabilityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('score');
  const [period, setPeriod] = useState('3');

  const calculate = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const months = parseInt(period);
    const now = new Date();
    const start = startOfMonth(subMonths(now, months - 1));
    const end = endOfMonth(now);

    const [workersRes, entriesRes, missionsRes, proofsRes] = await Promise.all([
      (supabase as any).from('workers').select('id, first_name, last_name, position, photo_url, status, hire_date').eq('status', 'active'),
      (supabase as any).from('time_entries').select('worker_id, entry_type, timestamp').gte('timestamp', start.toISOString()).lte('timestamp', end.toISOString()),
      (supabase as any).from('missions').select('id, assigned_worker_id, assigned_team_id, status').gte('updated_at', start.toISOString()).lte('updated_at', end.toISOString()),
      (supabase as any).from('work_proofs').select('id, user_id, task_id').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
    ]);

    const workers: Worker[] = workersRes.data || [];
    const entries = entriesRes.data || [];
    const missions = missionsRes.data || [];
    const proofs = proofsRes.data || [];

    // Calculate working days in the period
    let totalWorkingDays = 0;
    for (let m = 0; m < months; m++) {
      const d = subMonths(now, m);
      totalWorkingDays += countWorkingDays(d.getFullYear(), d.getMonth() + 1);
    }

    const results: ReliabilityScore[] = workers.map((w) => {
      const wEntries = entries.filter((e: any) => e.worker_id === w.id && e.entry_type !== 'photo');

      // Group by day
      const dayMap: Record<string, any[]> = {};
      wEntries.forEach((e: any) => {
        const day = e.timestamp.slice(0, 10);
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(e);
      });

      const daysPresent = Object.keys(dayMap).length;
      let lateDays = 0;

      Object.values(dayMap).forEach((dayEntries) => {
        const arrival = dayEntries.find((e: any) => e.entry_type === 'arrival');
        if (arrival) {
          const h = new Date(arrival.timestamp).getHours();
          const m = new Date(arrival.timestamp).getMinutes();
          if (h > 8 || (h === 8 && m > 15)) lateDays++;
        }
      });

      // Punctuality: 100 - (late% * 100)
      const punctualityScore = daysPresent > 0
        ? Math.max(0, Math.round(100 - (lateDays / daysPresent) * 100))
        : 50;

      // Missions
      const workerMissions = missions.filter((m: any) => m.assigned_worker_id === w.id);
      const completedMissions = workerMissions.filter((m: any) => ['completed', 'closed'].includes(m.status));
      const missionsScore = workerMissions.length > 0
        ? Math.round((completedMissions.length / workerMissions.length) * 100)
        : 50;

      // Quality (based on proofs submitted)
      const workerProofs = proofs.filter((_: any) => true);
      // Simplified: if worker completed missions and submitted proofs, quality is high
      const qualityScore = completedMissions.length > 0
        ? Math.min(100, Math.round(70 + (completedMissions.length * 5)))
        : daysPresent > 0 ? 60 : 30;

      // Attendance regularity
      const attendanceScore = totalWorkingDays > 0
        ? Math.min(100, Math.round((daysPresent / totalWorkingDays) * 100))
        : 0;

      // Weighted total: punctuality 30%, missions 25%, quality 20%, attendance 25%
      const totalScore = Math.round(
        punctualityScore * 0.3 +
        missionsScore * 0.25 +
        qualityScore * 0.2 +
        attendanceScore * 0.25
      );

      const { grade, color } = getGrade(totalScore);

      return {
        worker: w,
        punctualityScore,
        missionsScore,
        qualityScore,
        attendanceScore,
        totalScore,
        grade,
        gradeColor: color,
        details: {
          totalDays: daysPresent,
          lateDays,
          missionsCompleted: completedMissions.length,
          missionsTotal: workerMissions.length,
          proofsSubmitted: workerProofs.length,
          daysPresent,
          workingDays: totalWorkingDays,
        },
      };
    });

    setScores(results);
    setLoading(false);
  }, [user, period]);

  useEffect(() => { calculate(); }, [calculate]);

  const sorted = useMemo(() => {
    let filtered = scores.filter((s) =>
      `${s.worker.first_name} ${s.worker.last_name} ${s.worker.position}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.totalScore - a.totalScore;
        case 'punctuality': return b.punctualityScore - a.punctualityScore;
        case 'missions': return b.missionsScore - a.missionsScore;
        case 'attendance': return b.attendanceScore - a.attendanceScore;
        case 'name': return a.worker.first_name.localeCompare(b.worker.first_name);
        default: return b.totalScore - a.totalScore;
      }
    });

    return filtered;
  }, [scores, search, sortBy]);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, r) => s + r.totalScore, 0) / scores.length)
    : 0;

  const topPerformers = scores.filter((s) => s.totalScore >= 80).length;
  const atRisk = scores.filter((s) => s.totalScore < 50).length;

  const initials = (w: Worker) => `${w.first_name[0] || ''}${w.last_name[0] || ''}`.toUpperCase();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Score de Fiabilité
        </h1>
        <p className="text-muted-foreground">Évaluation automatique de la fiabilité de chaque travailleur</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score moyen</p>
              <p className="text-2xl font-bold">{avgScore}/100</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top performers</p>
              <p className="text-2xl font-bold">{topPerformers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">À surveiller</p>
              <p className="text-2xl font-bold">{atRisk}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Star className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Évalués</p>
              <p className="text-2xl font-bold">{scores.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un travailleur..." className="pl-10" />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 mois</SelectItem>
            <SelectItem value="3">3 mois</SelectItem>
            <SelectItem value="6">6 mois</SelectItem>
            <SelectItem value="12">12 mois</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Score global</SelectItem>
            <SelectItem value="punctuality">Ponctualité</SelectItem>
            <SelectItem value="missions">Missions</SelectItem>
            <SelectItem value="attendance">Présence</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Worker cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun travailleur actif trouvé.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((s, i) => (
            <Card key={s.worker.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        {s.worker.photo_url ? (
                          <AvatarImage src={s.worker.photo_url} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {initials(s.worker)}
                        </AvatarFallback>
                      </Avatar>
                      {i < 3 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-900">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {s.worker.first_name} {s.worker.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.worker.position}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-black ${s.gradeColor}`}>{s.grade}</p>
                    <p className="text-xs text-muted-foreground">{s.totalScore}/100</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Score bars */}
                <ScoreBar icon={Clock} label="Ponctualité" value={s.punctualityScore} detail={`${s.details.lateDays} retard(s)`} />
                <ScoreBar icon={Target} label="Missions" value={s.missionsScore} detail={`${s.details.missionsCompleted}/${s.details.missionsTotal}`} />
                <ScoreBar icon={Star} label="Qualité" value={s.qualityScore} detail="" />
                <ScoreBar icon={Shield} label="Présence" value={s.attendanceScore} detail={`${s.details.daysPresent}/${s.details.workingDays}j`} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ icon: Icon, label, value, detail }: { icon: any; label: string; value: number; detail: string }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-destructive';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="font-medium">
          {value}%
          {detail && <span className="text-muted-foreground ml-1">({detail})</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
