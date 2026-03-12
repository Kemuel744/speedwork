import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  BarChart3, CheckCircle, Clock, Users, AlertTriangle,
  TrendingUp, Award, Target, Timer,
} from 'lucide-react';
import { format, parseISO, differenceInMinutes, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(var(--destructive))',
];

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(d, 'yyyy-MM');
    const label = format(d, 'MMMM yyyy', { locale: fr });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

function formatHours(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
}

function countWorkingDays(year: number, month: number) {
  let count = 0;
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export default function ProductivityAnalytics() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const monthOptions = getMonthOptions();

  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const workingDays = countWorkingDays(year, month);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [mRes, eRes, wRes, tRes, tmRes] = await Promise.all([
      supabase.from('missions').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
      (supabase as any).from('time_entries').select('*').gte('timestamp', startDate.toISOString()).lte('timestamp', endDate.toISOString()).order('timestamp', { ascending: true }),
      supabase.from('workers').select('*').eq('status', 'active'),
      supabase.from('teams').select('*'),
      supabase.from('team_members').select('*'),
    ]);
    if (mRes.data) setMissions(mRes.data);
    if (eRes.data) setTimeEntries(eRes.data);
    if (wRes.data) setWorkers(wRes.data);
    if (tRes.data) setTeams(tRes.data);
    if (tmRes.data) setTeamMembers(tmRes.data);
    setLoading(false);
  }, [user, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // === COMPUTED ANALYTICS ===

  // 1. Missions stats
  const missionStats = useMemo(() => {
    const total = missions.length;
    const completed = missions.filter(m => m.status === 'completed' || m.status === 'closed').length;
    const inProgress = missions.filter(m => m.status === 'in_progress' || m.status === 'open').length;
    return { total, completed, inProgress, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [missions]);

  // 2. Worker performance: hours, days, lates per worker
  const workerPerformance = useMemo(() => {
    const workEntries = timeEntries.filter(e => e.entry_type !== 'photo');
    const byWorker: Record<string, { entries: any[]; name: string; position: string }> = {};

    workers.forEach(w => {
      byWorker[w.id] = { entries: [], name: `${w.first_name} ${w.last_name}`, position: w.position };
    });

    workEntries.forEach(e => {
      if (byWorker[e.worker_id]) byWorker[e.worker_id].entries.push(e);
    });

    return Object.entries(byWorker).map(([workerId, data]) => {
      const dayGroups: Record<string, any[]> = {};
      data.entries.forEach(e => {
        const day = e.timestamp.slice(0, 10);
        if (!dayGroups[day]) dayGroups[day] = [];
        dayGroups[day].push(e);
      });

      let totalMinutes = 0;
      let breakMinutes = 0;
      let lateCount = 0;

      Object.values(dayGroups).forEach(dayEntries => {
        const sorted = dayEntries.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));
        const arrival = sorted.find((e: any) => e.entry_type === 'arrival');
        const departure = sorted.find((e: any) => e.entry_type === 'departure');

        if (arrival && departure) {
          totalMinutes += differenceInMinutes(parseISO(departure.timestamp), parseISO(arrival.timestamp));
          const arrTime = new Date(arrival.timestamp);
          if (arrTime.getHours() > 8 || (arrTime.getHours() === 8 && arrTime.getMinutes() > 15)) lateCount++;
        }

        let bs: Date | null = null;
        sorted.forEach((e: any) => {
          if (e.entry_type === 'break_start') bs = parseISO(e.timestamp);
          if (e.entry_type === 'break_end' && bs) { breakMinutes += differenceInMinutes(parseISO(e.timestamp), bs); bs = null; }
        });
      });

      const netMinutes = Math.max(0, totalMinutes - breakMinutes);
      const daysWorked = Object.keys(dayGroups).length;
      const attendanceRate = workingDays > 0 ? Math.round((daysWorked / workingDays) * 100) : 0;

      // Count completed missions for this worker
      const workerMissions = missions.filter(m =>
        (m.assigned_worker_id === workerId && (m.status === 'completed' || m.status === 'closed'))
      ).length;

      return {
        workerId, name: data.name, position: data.position,
        hoursWorked: Math.round(netMinutes / 60 * 10) / 10,
        daysWorked, lateCount, attendanceRate,
        missionsCompleted: workerMissions, netMinutes,
      };
    }).filter(w => w.daysWorked > 0 || w.missionsCompleted > 0)
      .sort((a, b) => b.hoursWorked - a.hoursWorked);
  }, [timeEntries, workers, missions, workingDays]);

  // 3. Team performance
  const teamPerformance = useMemo(() => {
    return teams.map(team => {
      const members = teamMembers.filter(tm => tm.team_id === team.id);
      const workerIds = members.map(m => m.worker_id).filter(Boolean);
      const teamWorkers = workerPerformance.filter(wp => workerIds.includes(wp.workerId));

      const totalHours = teamWorkers.reduce((s, w) => s + w.hoursWorked, 0);
      const avgAttendance = teamWorkers.length > 0
        ? Math.round(teamWorkers.reduce((s, w) => s + w.attendanceRate, 0) / teamWorkers.length)
        : 0;
      const totalMissions = teamWorkers.reduce((s, w) => s + w.missionsCompleted, 0);
      const totalLates = teamWorkers.reduce((s, w) => s + w.lateCount, 0);

      return {
        name: team.name,
        members: members.length,
        totalHours,
        avgAttendance,
        totalMissions,
        totalLates,
      };
    }).filter(t => t.members > 0).sort((a, b) => b.totalHours - a.totalHours);
  }, [teams, teamMembers, workerPerformance]);

  // 4. Mission status chart data
  const missionChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    missions.forEach(m => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
    const labels: Record<string, string> = { open: 'Ouvertes', in_progress: 'En cours', completed: 'Terminées', closed: 'Fermées' };
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: labels[status] || status, value: count,
    }));
  }, [missions]);

  // 5. Top performers
  const topPerformers = useMemo(() => {
    return [...workerPerformance]
      .sort((a, b) => (b.hoursWorked + b.missionsCompleted * 10) - (a.hoursWorked + a.missionsCompleted * 10))
      .slice(0, 5);
  }, [workerPerformance]);

  // 6. Attendance trend (daily)
  const attendanceTrend = useMemo(() => {
    const dailyCounts: Record<string, number> = {};
    const workEntries = timeEntries.filter(e => e.entry_type === 'arrival');
    workEntries.forEach(e => {
      const day = e.timestamp.slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: format(new Date(date), 'dd/MM'),
        présents: count,
      }));
  }, [timeEntries]);

  // 7. Late distribution
  const lateData = useMemo(() => {
    const total = workerPerformance.reduce((s, w) => s + w.lateCount, 0);
    const onTime = workerPerformance.filter(w => w.lateCount === 0).length;
    const late = workerPerformance.filter(w => w.lateCount > 0).length;
    return { total, onTime, late };
  }, [workerPerformance]);

  // Summary KPIs
  const totalHours = workerPerformance.reduce((s, w) => s + w.hoursWorked, 0);
  const avgAttendance = workerPerformance.length > 0
    ? Math.round(workerPerformance.reduce((s, w) => s + w.attendanceRate, 0) / workerPerformance.length) : 0;
  const totalLates = workerPerformance.reduce((s, w) => s + w.lateCount, 0);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analyse de productivité
          </h1>
          <p className="text-muted-foreground">Vue d'ensemble des performances terrain</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{missionStats.completed}/{missionStats.total}</p>
            <p className="text-xs text-muted-foreground">Missions terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{missionStats.rate}%</p>
            <p className="text-xs text-muted-foreground">Taux complétion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Timer className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalHours.toFixed(0)}h</p>
            <p className="text-xs text-muted-foreground">Heures totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgAttendance}%</p>
            <p className="text-xs text-muted-foreground">Taux de présence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalLates}</p>
            <p className="text-xs text-muted-foreground">Retards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Award className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{workerPerformance.length}</p>
            <p className="text-xs text-muted-foreground">Travailleurs actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Présence quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="présents" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">Aucune donnée</p>}
          </CardContent>
        </Card>

        {/* Mission status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition des missions</CardTitle>
          </CardHeader>
          <CardContent>
            {missionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={missionChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {missionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">Aucune mission</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performers bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Top 5 — Employés les plus performants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topPerformers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="hoursWorked" name="Heures" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="missionsCompleted" name="Missions" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">Aucune donnée</p>}
          </CardContent>
        </Card>

        {/* Team performance radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Rendement par équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={teamPerformance}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Radar name="Heures" dataKey="totalHours" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Radar name="Présence %" dataKey="avgAttendance" stroke="hsl(var(--chart-2, 160 60% 45%))" fill="hsl(var(--chart-2, 160 60% 45%))" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">Aucune équipe</p>}
          </CardContent>
        </Card>
      </div>

      {/* Detailed worker table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Détails par travailleur</CardTitle>
        </CardHeader>
        <CardContent>
          {workerPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Travailleur</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Heures</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right hidden sm:table-cell">Jours</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Présence</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right hidden sm:table-cell">Missions</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Retards</th>
                  </tr>
                </thead>
                <tbody>
                  {workerPerformance.map(w => (
                    <tr key={w.workerId} className="border-b last:border-0 hover:bg-secondary/30">
                      <td className="py-2">
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.position}</p>
                      </td>
                      <td className="py-2 text-right font-medium">{w.hoursWorked}h</td>
                      <td className="py-2 text-right hidden sm:table-cell">{w.daysWorked}j</td>
                      <td className="py-2 text-right">
                        <Badge variant={w.attendanceRate >= 90 ? 'default' : w.attendanceRate >= 70 ? 'secondary' : 'destructive'}>
                          {w.attendanceRate}%
                        </Badge>
                      </td>
                      <td className="py-2 text-right hidden sm:table-cell">{w.missionsCompleted}</td>
                      <td className="py-2 text-right">
                        <span className={w.lateCount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {w.lateCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée pour cette période</p>}
        </CardContent>
      </Card>

      {/* Team summary table */}
      {teamPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Résumé par équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Équipe</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Membres</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Heures</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Présence</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Missions</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Retards</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((t, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-secondary/30">
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="py-2 text-right">{t.members}</td>
                      <td className="py-2 text-right font-medium">{t.totalHours.toFixed(1)}h</td>
                      <td className="py-2 text-right">
                        <Badge variant={t.avgAttendance >= 90 ? 'default' : t.avgAttendance >= 70 ? 'secondary' : 'destructive'}>
                          {t.avgAttendance}%
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{t.totalMissions}</td>
                      <td className="py-2 text-right">
                        <span className={t.totalLates > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>{t.totalLates}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
