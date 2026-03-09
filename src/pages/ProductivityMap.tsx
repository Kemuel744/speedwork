import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ZoneStats {
  zone: string;
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  rate: number;
  lat?: number;
  lng?: number;
}

const COLORS = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' };

export default function ProductivityMap() {
  const [zones, setZones] = useState<ZoneStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data: tasks } = await supabase.from('work_tasks').select('*');
      const { data: proofsData } = await supabase.from('work_proofs').select('latitude, longitude, task_id');

      if (tasks) {
        setTotalTasks(tasks.length);
        setCompletedTasks(tasks.filter((t: any) => t.status === 'completed').length);

        // Group by zone
        const zoneMap: Record<string, ZoneStats> = {};
        tasks.forEach((t: any) => {
          const z = t.zone || 'Non assignée';
          if (!zoneMap[z]) zoneMap[z] = { zone: z, total: 0, completed: 0, pending: 0, inProgress: 0, rate: 0 };
          zoneMap[z].total++;
          if (t.status === 'completed') zoneMap[z].completed++;
          else if (t.status === 'in_progress') zoneMap[z].inProgress++;
          else zoneMap[z].pending++;
        });

        // Assign GPS from proofs
        if (proofsData) {
          proofsData.forEach((p: any) => {
            if (p.latitude && p.longitude) {
              const task = tasks.find((t: any) => t.id === p.task_id);
              if (task) {
                const z = (task as any).zone || 'Non assignée';
                if (zoneMap[z] && !zoneMap[z].lat) {
                  zoneMap[z].lat = p.latitude;
                  zoneMap[z].lng = p.longitude;
                }
              }
            }
          });
        }

        Object.values(zoneMap).forEach(z => { z.rate = z.total > 0 ? Math.round((z.completed / z.total) * 100) : 0; });
        setZones(Object.values(zoneMap).sort((a, b) => b.total - a.total));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const getColor = (rate: number) => rate >= 70 ? COLORS.high : rate >= 40 ? COLORS.medium : COLORS.low;
  const getLevel = (rate: number) => rate >= 70 ? 'Élevée' : rate >= 40 ? 'Moyenne' : 'Faible';
  const getIcon = (rate: number) => rate >= 70 ? <TrendingUp className="w-4 h-4" /> : rate >= 40 ? <Minus className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;

  const globalRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const locatedZones = zones.filter(z => z.lat && z.lng);
  const defaultCenter: [number, number] = locatedZones.length > 0 ? [locatedZones[0].lat!, locatedZones[0].lng!] : [-4.2634, 15.2429];

  const pieData = [
    { name: 'Terminées', value: completedTasks, color: COLORS.high },
    { name: 'En cours', value: totalTasks - completedTasks - zones.reduce((s, z) => s + z.pending, 0), color: COLORS.medium },
    { name: 'En attente', value: zones.reduce((s, z) => s + z.pending, 0), color: COLORS.low },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carte de productivité</h1>
        <p className="text-muted-foreground">Analysez la performance de vos équipes par zone</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{totalTasks}</p><p className="text-sm text-muted-foreground">Tâches totales</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{completedTasks}</p><p className="text-sm text-muted-foreground">Terminées</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold" style={{ color: getColor(globalRate) }}>{globalRate}%</p><p className="text-sm text-muted-foreground">Taux global</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{zones.length}</p><p className="text-sm text-muted-foreground">Zones</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Carte de productivité</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] rounded-b-lg overflow-hidden">
              <MapContainer center={defaultCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
                {locatedZones.map(z => (
                  <CircleMarker key={z.zone} center={[z.lat!, z.lng!]} radius={Math.max(15, z.total * 3)}
                    pathOptions={{ color: getColor(z.rate), fillColor: getColor(z.rate), fillOpacity: 0.5 }}>
                    <Popup>
                      <div className="text-sm"><p className="font-bold">{z.zone}</p>
                        <p>Productivité : {z.rate}%</p><p>{z.completed}/{z.total} tâches terminées</p></div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Répartition des tâches</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">Aucune donnée</p>}
          </CardContent>
        </Card>
      </div>

      {/* Zones table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Performance par zone</CardTitle></CardHeader>
        <CardContent>
          {zones.length === 0 ? <p className="text-center text-muted-foreground py-6">Aucune zone avec des tâches</p> : (
            <div className="space-y-3">
              {zones.map(z => (
                <div key={z.zone} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(z.rate) }} />
                    <div>
                      <p className="font-medium">{z.zone}</p>
                      <p className="text-xs text-muted-foreground">{z.completed}/{z.total} tâches • {z.inProgress} en cours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getIcon(z.rate)}
                    <Badge variant="outline" style={{ borderColor: getColor(z.rate), color: getColor(z.rate) }}>{z.rate}% — {getLevel(z.rate)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Vert = Productive (≥70%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Orange = Moyenne (40-69%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Rouge = Faible (&lt;40%)</span>
      </div>
    </div>
  );
}
