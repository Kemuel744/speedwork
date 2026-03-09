import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const activeIcon = new L.Icon({
  iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface Team {
  id: string; name: string; zone: string; site_name: string; status: string;
  leader_name: string; latitude: number | null; longitude: number | null;
  member_count?: number;
}

export default function TeamsMap() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: teamsData } = await supabase.from('teams').select('*').order('name');
      if (teamsData) {
        // Get member counts
        const withCounts = await Promise.all(
          (teamsData as Team[]).map(async (t) => {
            const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', t.id);
            return { ...t, member_count: count || 0 };
          })
        );
        setTeams(withCounts);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = teams.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status === 'active';
    if (filter === 'inactive') return t.status === 'inactive';
    if (filter === 'located') return t.latitude !== null && t.longitude !== null;
    return true;
  });

  const locatedTeams = filtered.filter(t => t.latitude && t.longitude);
  const defaultCenter: [number, number] = locatedTeams.length > 0
    ? [locatedTeams[0].latitude!, locatedTeams[0].longitude!]
    : [-4.2634, 15.2429]; // Brazzaville

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carte des équipes</h1>
          <p className="text-muted-foreground">Visualisez vos équipes terrain sur la carte</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="inactive">Inactives</SelectItem>
              <SelectItem value="located">Géolocalisées</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/teams"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Liste</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-primary">{teams.length}</p><p className="text-sm text-muted-foreground">Équipes total</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{teams.filter(t => t.status === 'active').length}</p><p className="text-sm text-muted-foreground">Actives</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-blue-600">{locatedTeams.length}</p><p className="text-sm text-muted-foreground">Géolocalisées</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer center={defaultCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locatedTeams.map(team => (
                  <Marker key={team.id} position={[team.latitude!, team.longitude!]} icon={activeIcon}>
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-bold">{team.name}</p>
                        {team.zone && <p><MapPin className="w-3 h-3 inline mr-1" />{team.zone}</p>}
                        {team.leader_name && <p><Users className="w-3 h-3 inline mr-1" />Chef : {team.leader_name}</p>}
                        <p>{team.member_count} membre(s)</p>
                        <Link to={`/teams/${team.id}`} className="text-primary underline text-xs">Voir détails</Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {locatedTeams.length === 0 && !loading && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          Aucune équipe géolocalisée. Ajoutez des coordonnées GPS lors de la création de vos équipes pour les voir sur la carte.
        </CardContent></Card>
      )}
    </div>
  );
}
