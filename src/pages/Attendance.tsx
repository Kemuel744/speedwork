import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Clock, MapPin, Users, Play, Coffee, LogOut as LogOutIcon,
  CalendarDays, CheckCircle, Navigation, Search, BarChart3, Timer,
} from 'lucide-react';
import { format, parseISO, differenceInMinutes, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeEntry {
  id: string;
  worker_id: string;
  mission_id: string | null;
  user_id: string;
  entry_type: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  photo_url: string | null;
}

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  base_salary: number;
}

interface Mission {
  id: string;
  title: string;
}

interface DaySummary {
  workerId: string;
  workerName: string;
  position: string;
  date: string;
  arrival: string | null;
  departure: string | null;
  totalMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  missionTitle: string | null;
  entries: TimeEntry[];
  gpsPoints: { lat: number; lng: number; type: string; time: string }[];
}

const ENTRY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  arrival: { icon: <Play className="w-3.5 h-3.5" />, label: 'Arrivée', color: 'text-green-600' },
  break_start: { icon: <Coffee className="w-3.5 h-3.5" />, label: 'Pause', color: 'text-amber-500' },
  break_end: { icon: <Play className="w-3.5 h-3.5" />, label: 'Reprise', color: 'text-blue-500' },
  departure: { icon: <LogOutIcon className="w-3.5 h-3.5" />, label: 'Départ', color: 'text-red-500' },
  photo: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Photo', color: 'text-muted-foreground' },
};

function formatMinutes(mins: number): string {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`;
}

export default function Attendance() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workerFilter, setWorkerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailEntries, setDetailEntries] = useState<TimeEntry[] | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom': {
        const d = new Date(customDate);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
    }
  }, [period, customDate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [wRes, eRes, mRes] = await Promise.all([
      supabase.from('workers').select('id, first_name, last_name, position, base_salary').order('first_name'),
      (supabase as any).from('time_entries').select('*')
        .gte('timestamp', dateRange.start.toISOString())
        .lte('timestamp', dateRange.end.toISOString())
        .order('timestamp', { ascending: true }),
      supabase.from('missions').select('id, title'),
    ]);

    if (wRes.data) setWorkers(wRes.data as Worker[]);
    if (eRes.data) setEntries(eRes.data as TimeEntry[]);
    if (mRes.data) setMissions(mRes.data as Mission[]);
    setLoading(false);
  }, [user, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const missionMap = useMemo(() => {
    const map: Record<string, string> = {};
    missions.forEach(m => { map[m.id] = m.title; });
    return map;
  }, [missions]);

  const workerMap = useMemo(() => {
    const map: Record<string, Worker> = {};
    workers.forEach(w => { map[w.id] = w; });
    return map;
  }, [workers]);

  // Build day summaries grouped by worker + date
  const summaries = useMemo((): DaySummary[] => {
    const grouped: Record<string, TimeEntry[]> = {};
    
    entries.filter(e => e.entry_type !== 'photo').forEach(e => {
      const dateKey = format(parseISO(e.timestamp), 'yyyy-MM-dd');
      const key = `${e.worker_id}_${dateKey}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    return Object.entries(grouped).map(([key, dayEntries]) => {
      const [workerId, date] = key.split('_');
      const w = workerMap[workerId];
      const sorted = dayEntries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      const arrival = sorted.find(e => e.entry_type === 'arrival');
      const departure = sorted.find(e => e.entry_type === 'departure');

      let totalMinutes = 0;
      let breakMinutes = 0;

      if (arrival && departure) {
        totalMinutes = differenceInMinutes(parseISO(departure.timestamp), parseISO(arrival.timestamp));
      }

      // Calculate break time
      let breakStart: Date | null = null;
      sorted.forEach(e => {
        if (e.entry_type === 'break_start') breakStart = parseISO(e.timestamp);
        if (e.entry_type === 'break_end' && breakStart) {
          breakMinutes += differenceInMinutes(parseISO(e.timestamp), breakStart);
          breakStart = null;
        }
      });

      const netMinutes = Math.max(0, totalMinutes - breakMinutes);
      const missionId = sorted.find(e => e.mission_id)?.mission_id;
      const gpsPoints = sorted
        .filter(e => e.latitude && e.longitude)
        .map(e => ({ lat: e.latitude!, lng: e.longitude!, type: e.entry_type, time: format(parseISO(e.timestamp), 'HH:mm') }));

      return {
        workerId,
        workerName: w ? `${w.first_name} ${w.last_name}` : workerId.slice(0, 8),
        position: w?.position || '',
        date,
        arrival: arrival ? format(parseISO(arrival.timestamp), 'HH:mm') : null,
        departure: departure ? format(parseISO(departure.timestamp), 'HH:mm') : null,
        totalMinutes,
        breakMinutes,
        netMinutes,
        missionTitle: missionId ? missionMap[missionId] || null : null,
        entries: sorted,
        gpsPoints,
      };
    }).sort((a, b) => b.date.localeCompare(a.date) || a.workerName.localeCompare(b.workerName));
  }, [entries, workerMap, missionMap]);

  const filtered = useMemo(() => {
    return summaries.filter(s => {
      if (workerFilter !== 'all' && s.workerId !== workerFilter) return false;
      if (search && !s.workerName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [summaries, workerFilter, search]);

  // Totals
  const totalNet = filtered.reduce((sum, s) => sum + s.netMinutes, 0);
  const totalBreak = filtered.reduce((sum, s) => sum + s.breakMinutes, 0);
  const uniqueWorkers = new Set(filtered.map(s => s.workerId)).size;

  // Salary estimation
  const salaryEstimate = useMemo(() => {
    const byWorker: Record<string, { name: string; hours: number; baseSalary: number }> = {};
    filtered.forEach(s => {
      const w = workerMap[s.workerId];
      if (!byWorker[s.workerId]) {
        byWorker[s.workerId] = { name: s.workerName, hours: 0, baseSalary: w?.base_salary || 0 };
      }
      byWorker[s.workerId].hours += s.netMinutes / 60;
    });
    return Object.values(byWorker);
  }, [filtered, workerMap]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Pointage intelligent
        </h1>
        <p className="text-muted-foreground">Suivi des pointages terrain avec GPS et calcul des heures</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-1.5">
          {(['today', 'week', 'month', 'custom'] as const).map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
            >
              {p === 'today' ? "Aujourd'hui" : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Date'}
            </Button>
          ))}
        </div>
        {period === 'custom' && (
          <Input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-40" />
        )}
        <Select value={workerFilter} onValueChange={setWorkerFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tous les travailleurs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les travailleurs</SelectItem>
            {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.first_name} {w.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{uniqueWorkers}</p>
            <p className="text-xs text-muted-foreground">Travailleurs pointés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Timer className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatMinutes(totalNet)}</p>
            <p className="text-xs text-muted-foreground">Heures nettes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Coffee className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatMinutes(totalBreak)}</p>
            <p className="text-xs text-muted-foreground">Temps de pause</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Journées pointées</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun pointage trouvé pour cette période</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Travailleur</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Arrivée</TableHead>
                    <TableHead>Départ</TableHead>
                    <TableHead>Pause</TableHead>
                    <TableHead>Heures nettes</TableHead>
                    <TableHead className="hidden md:table-cell">Mission</TableHead>
                    <TableHead className="hidden md:table-cell">GPS</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, i) => (
                    <TableRow key={i} className="hover:bg-secondary/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.workerName}</p>
                          <p className="text-xs text-muted-foreground">{s.position}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {format(new Date(s.date), 'dd MMM', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {s.arrival ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 text-xs">{s.arrival}</Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {s.departure ? (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 text-xs">{s.departure}</Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">{s.breakMinutes > 0 ? formatMinutes(s.breakMinutes) : '—'}</TableCell>
                      <TableCell>
                        <span className={`font-semibold text-sm ${s.netMinutes >= 480 ? 'text-green-600' : s.netMinutes > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {formatMinutes(s.netMinutes)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[120px] truncate">
                        {s.missionTitle || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {s.gpsPoints.length > 0 ? (
                          <a
                            href={`https://www.google.com/maps?q=${s.gpsPoints[0].lat},${s.gpsPoints[0].lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <MapPin className="w-3 h-3" /> {s.gpsPoints.length} pts
                          </a>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setDetailEntries(s.entries)}>
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary estimation */}
      {salaryEstimate.length > 0 && period !== 'today' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Estimation salariale ({period === 'week' ? 'semaine' : 'mois'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salaryEstimate.map((w, i) => {
                const hourlyRate = w.baseSalary > 0 ? w.baseSalary / 176 : 0; // ~22 jours × 8h
                const estimated = Math.round(hourlyRate * w.hours);
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.hours.toFixed(1)}h travaillées</p>
                    </div>
                    {w.baseSalary > 0 ? (
                      <div className="text-right">
                        <p className="font-semibold text-sm">{estimated.toLocaleString()} FCFA</p>
                        <p className="text-xs text-muted-foreground">Base: {w.baseSalary.toLocaleString()} FCFA/mois</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Salaire non défini</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailEntries} onOpenChange={() => setDetailEntries(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Détail des pointages</DialogTitle></DialogHeader>
          {detailEntries && (
            <div className="space-y-2">
              {detailEntries.map(e => {
                const info = ENTRY_ICONS[e.entry_type] || { icon: <CheckCircle className="w-3.5 h-3.5" />, label: e.entry_type, color: 'text-foreground' };
                return (
                  <div key={e.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/30">
                    <span className={info.color}>{info.icon}</span>
                    <span className="font-medium text-sm">{info.label}</span>
                    <span className="text-sm text-muted-foreground ml-auto">{format(parseISO(e.timestamp), 'HH:mm:ss')}</span>
                    {e.latitude && e.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-primary"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
              {detailEntries[0]?.notes && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">{detailEntries[0].notes}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
