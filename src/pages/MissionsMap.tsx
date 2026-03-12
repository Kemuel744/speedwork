import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Briefcase, Users, HardHat, Target, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const createIcon = (color: string) => new L.DivIcon({
  className: '',
  html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const missionIcon = createIcon('#ef4444');
const missionActiveIcon = createIcon('#f59e0b');
const missionCompletedIcon = createIcon('#22c55e');
const teamIcon = createIcon('#3b82f6');

interface Mission {
  id: string; title: string; location: string; status: string; priority: string;
  latitude: number | null; longitude: number | null; salary: number;
  salary_currency: string; mission_date: string | null; workers_needed: number;
  assigned_team_id: string | null; assigned_worker_id: string | null;
}

interface Team {
  id: string; name: string; zone: string; site_name: string; status: string;
  leader_name: string; latitude: number | null; longitude: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouverte', assigned: 'Assignée', in_progress: 'En cours',
  completed: 'Terminée', closed: 'Clôturée', cancelled: 'Annulée',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgente: 'destructive', haute: 'destructive', normale: 'default', basse: 'secondary',
};

export default function MissionsMap() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLayer, setFilterLayer] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [mRes, tRes] = await Promise.all([
        supabase.from('missions').select('id, title, location, status, priority, latitude, longitude, salary, salary_currency, mission_date, workers_needed, assigned_team_id, assigned_worker_id').order('created_at', { ascending: false }),
        supabase.from('teams').select('id, name, zone, site_name, status, leader_name, latitude, longitude'),
      ]);
      if (mRes.data) setMissions(mRes.data as Mission[]);
      if (tRes.data) setTeams(tRes.data as Team[]);
      setLoading(false);
    };
    load();
  }, []);

  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      return true;
    });
  }, [missions, filterStatus]);

  const locatedMissions = filteredMissions.filter(m => m.latitude && m.longitude);
  const locatedTeams = teams.filter(t => t.latitude && t.longitude && t.status === 'active');

  const allPoints = [
    ...locatedMissions.map(m => [m.latitude!, m.longitude!] as [number, number]),
    ...locatedTeams.map(t => [t.latitude!, t.longitude!] as [number, number]),
  ];

  const center: [number, number] = allPoints.length > 0
    ? [
        allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length,
        allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length,
      ]
    : [-4.2634, 15.2429];

  const activeMissions = missions.filter(m => ['open', 'assigned', 'in_progress'].includes(m.status)).length;
  const completedMissions = missions.filter(m => ['completed', 'closed'].includes(m.status)).length;
  const activeTeams = teams.filter(t => t.status === 'active').length;

  const getMissionIcon = (status: string) => {
    if (['completed', 'closed'].includes(status)) return missionCompletedIcon;
    if (['assigned', 'in_progress'].includes(status)) return missionActiveIcon;
    return missionIcon;
  };

  const showMissions = filterLayer === 'all' || filterLayer === 'missions';
  const showTeams = filterLayer === 'all' || filterLayer === 'teams';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Carte des Missions
        </h1>
        <p className="text-muted-foreground">Vue en temps réel des opérations terrain</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Missions actives</p>
              <p className="text-2xl font-bold">{activeMissions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Terminées</p>
              <p className="text-2xl font-bold">{completedMissions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Équipes actives</p>
              <p className="text-2xl font-bold">{activeTeams}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Points sur carte</p>
              <p className="text-2xl font-bold">{locatedMissions.length + locatedTeams.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Statut mission" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="open">Ouvertes</SelectItem>
            <SelectItem value="assigned">Assignées</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
            <SelectItem value="closed">Clôturées</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLayer} onValueChange={setFilterLayer}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Couche" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout afficher</SelectItem>
            <SelectItem value="missions">Missions seules</SelectItem>
            <SelectItem value="teams">Équipes seules</SelectItem>
          </SelectContent>
        </Select>

        {/* Legend */}
        <div className="flex items-center gap-4 ml-auto text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Ouverte</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> En cours</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Terminée</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Équipe</span>
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="h-[550px] rounded-lg overflow-hidden">
              <MapContainer center={center} zoom={allPoints.length > 0 ? 7 : 6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Missions */}
                {showMissions && locatedMissions.map(m => (
                  <Marker key={`m-${m.id}`} position={[m.latitude!, m.longitude!]} icon={getMissionIcon(m.status)}>
                    <Popup>
                      <div className="text-sm space-y-1 min-w-[180px]">
                        <p className="font-bold text-base">{m.title}</p>
                        <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location || 'Non précisé'}</p>
                        <p><span className="font-medium">Statut :</span> {STATUS_LABELS[m.status] || m.status}</p>
                        <p><span className="font-medium">Priorité :</span> {m.priority}</p>
                        <p><span className="font-medium">Salaire :</span> {Number(m.salary).toLocaleString('fr-FR')} {m.salary_currency}</p>
                        {m.mission_date && <p><Clock className="w-3 h-3 inline mr-1" />{m.mission_date}</p>}
                        <p><HardHat className="w-3 h-3 inline mr-1" />{m.workers_needed} travailleur(s) requis</p>
                        <Link to="/missions" className="text-primary underline text-xs block mt-1">Voir les missions</Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Teams with radius */}
                {showTeams && locatedTeams.map(t => (
                  <React.Fragment key={`t-${t.id}`}>
                    <Marker position={[t.latitude!, t.longitude!]} icon={teamIcon}>
                      <Popup>
                        <div className="text-sm space-y-1 min-w-[160px]">
                          <p className="font-bold text-base">{t.name}</p>
                          {t.zone && <p><MapPin className="w-3 h-3 inline mr-1" />{t.zone}</p>}
                          {t.site_name && <p><HardHat className="w-3 h-3 inline mr-1" />Chantier : {t.site_name}</p>}
                          {t.leader_name && <p><Users className="w-3 h-3 inline mr-1" />Chef : {t.leader_name}</p>}
                          <Link to={`/teams/${t.id}`} className="text-primary underline text-xs block mt-1">Détails de l'équipe</Link>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[t.latitude!, t.longitude!]}
                      radius={500}
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }}
                    />
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side list */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Active missions list */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Missions géolocalisées ({locatedMissions.length})
              </h3>
              {locatedMissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune mission avec coordonnées GPS.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {locatedMissions.slice(0, 20).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.location}</p>
                      </div>
                      <Badge variant={(PRIORITY_COLORS[m.priority] as any) || 'default'}>
                        {STATUS_LABELS[m.status] || m.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active teams list */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Équipes sur le terrain ({locatedTeams.length})
              </h3>
              {locatedTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune équipe géolocalisée active.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {locatedTeams.map(t => (
                    <Link key={t.id} to={`/teams/${t.id}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.zone} — {t.site_name}</p>
                      </div>
                      <Badge variant="secondary">{t.leader_name}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
