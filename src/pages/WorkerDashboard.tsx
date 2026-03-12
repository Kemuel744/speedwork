import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Clock, MapPin, Users, Star, Play, LogOut as LogOutIcon,
  Camera, CalendarDays, CheckCircle, AlertCircle, Navigation, Coffee,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkerProfile {
  id: string; first_name: string; last_name: string; phone: string;
  position: string; photo_url: string | null; base_salary: number;
  contract_type: string; status: string;
}

interface TeamInfo {
  id: string; name: string; zone: string; site_name: string;
  leader_name: string; leader_phone: string; status: string;
  latitude: number | null; longitude: number | null;
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
  mission_id: string | null; notes: string; photo_url: string | null;
}

const ENTRY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  arrival: { label: 'Arrivée', icon: <Play className="w-4 h-4" />, color: 'text-success' },
  break_start: { label: 'Début pause', icon: <Coffee className="w-4 h-4" />, color: 'text-warning' },
  break_end: { label: 'Fin pause', icon: <Play className="w-4 h-4" />, color: 'text-primary' },
  departure: { label: 'Départ', icon: <LogOutIcon className="w-4 h-4" />, color: 'text-destructive' },
};

const PRIORITY_COLORS: Record<string, string> = {
  basse: 'bg-muted text-muted-foreground',
  normale: 'bg-primary/10 text-primary',
  haute: 'bg-warning/10 text-warning',
  urgente: 'bg-destructive/10 text-destructive',
};

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoNotes, setPhotoNotes] = useState('');
  const [proofType, setProofType] = useState<'before' | 'after'>('before');
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [checkInMessage, setCheckInMessage] = useState('');

  // Maximum allowed distance in meters between worker and mission location
  const MAX_CHECKIN_DISTANCE = 500; // 500 meters

  /** Haversine formula: returns distance in meters between two GPS points */
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fetchData = useCallback(async () => {
    if (!user) return;

    // 1. Find worker profile linked to current user
    const { data: workerData } = await (supabase as any)
      .from('workers').select('*').eq('linked_user_id', user.id).single();

    if (!workerData) {
      setLoading(false);
      return;
    }
    setWorker(workerData);

    // 2. Find teams this worker belongs to
    const { data: memberData } = await supabase
      .from('team_members').select('team_id').eq('worker_id', workerData.id);

    const teamIds = (memberData || []).map((m: any) => m.team_id);

    if (teamIds.length > 0) {
      const [teamsRes, membersRes] = await Promise.all([
        supabase.from('teams').select('*').in('id', teamIds),
        supabase.from('team_members').select('*').in('team_id', teamIds),
      ]);
      if (teamsRes.data) setTeams(teamsRes.data as TeamInfo[]);
      if (membersRes.data) setTeamMembers(membersRes.data as TeamMember[]);
    }

    // 3. Find missions assigned to this worker or their teams
    const { data: missionsData } = await supabase.from('missions').select('*')
      .or(`assigned_worker_id.eq.${workerData.id}${teamIds.length > 0 ? `,assigned_team_id.in.(${teamIds.join(',')})` : ''}`)
      .in('status', ['open', 'in_progress'])
      .order('mission_date', { ascending: true });
    if (missionsData) setMissions(missionsData as Mission[]);

    // 4. Today's time entries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: entries } = await (supabase as any)
      .from('time_entries').select('*')
      .eq('worker_id', workerData.id)
      .gte('timestamp', todayStart.toISOString())
      .order('timestamp', { ascending: true });
    if (entries) setTodayEntries(entries);

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10000 }
      );
    });
  };

  /**
   * Validates GPS proximity for mission check-in.
   * Returns { ok, gps, distance?, message? }
   */
  const validateMissionCheckIn = async (missionId: string): Promise<{
    ok: boolean; gps: { lat: number; lng: number } | null; distance?: number; message?: string;
  }> => {
    const mission = missions.find(m => m.id === missionId);

    // If mission has no GPS coordinates, allow check-in with just GPS capture
    if (!mission?.latitude || !mission?.longitude) {
      const gps = await getGPS();
      return { ok: true, gps, message: 'Mission sans coordonnées GPS — pointage libre' };
    }

    // GPS is mandatory for missions with coordinates
    const gps = await getGPS();
    if (!gps) {
      return { ok: false, gps: null, message: '📍 Position GPS requise. Activez la géolocalisation sur votre appareil et réessayez.' };
    }

    const distance = haversineDistance(gps.lat, gps.lng, mission.latitude, mission.longitude);

    if (distance > MAX_CHECKIN_DISTANCE) {
      return {
        ok: false, gps, distance,
        message: `🚫 Vous êtes à ${Math.round(distance)}m du lieu de mission (max: ${MAX_CHECKIN_DISTANCE}m). Rapprochez-vous du chantier pour pointer.`,
      };
    }

    return { ok: true, gps, distance, message: `✅ Position validée — ${Math.round(distance)}m du lieu de mission` };
  };

  const recordEntry = async (type: string, missionId?: string) => {
    if (!worker || !user) return;

    const targetMissionId = missionId || activeMissionId || null;

    // For arrival entries linked to a mission, validate GPS proximity
    if (type === 'arrival' && targetMissionId) {
      setCheckInStatus('checking');
      setCheckInMessage('Vérification de votre position...');

      const validation = await validateMissionCheckIn(targetMissionId);

      if (!validation.ok) {
        setCheckInStatus('error');
        setCheckInMessage(validation.message || 'Erreur de validation');
        // Auto-clear after 8 seconds
        setTimeout(() => { setCheckInStatus('idle'); setCheckInMessage(''); }, 8000);
        return;
      }

      // GPS validated — proceed
      const { error } = await (supabase as any).from('time_entries').insert({
        worker_id: worker.id,
        user_id: user.id,
        mission_id: targetMissionId,
        entry_type: type,
        latitude: validation.gps?.lat || null,
        longitude: validation.gps?.lng || null,
        notes: `Check-in validé — ${validation.distance ? Math.round(validation.distance) + 'm du site' : 'GPS libre'}`,
      });
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        setCheckInStatus('idle');
        return;
      }

      setCheckInStatus('success');
      setCheckInMessage(validation.message || 'Pointage validé');
      toast({ title: 'Mission démarrée ✓', description: validation.message });
      setTimeout(() => { setCheckInStatus('idle'); setCheckInMessage(''); }, 5000);
      fetchData();
      return;
    }

    // For non-mission entries or non-arrival, just record with GPS
    const gps = await getGPS();
    const { error } = await (supabase as any).from('time_entries').insert({
      worker_id: worker.id,
      user_id: user.id,
      mission_id: targetMissionId,
      entry_type: type,
      latitude: gps?.lat || null,
      longitude: gps?.lng || null,
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    const label = ENTRY_LABELS[type]?.label || type;
    toast({ title: `${label} enregistré ✓`, description: `${format(new Date(), 'HH:mm', { locale: fr })} — Position GPS ${gps ? 'capturée' : 'indisponible'}` });
    fetchData();
  };

  const uploadWorkPhoto = async () => {
    if (!photoFile || !worker || !user) return;
    setUploading(true);
    try {
      const ext = photoFile.name.split('.').pop();
      const path = `${user.id}/${worker.id}_${Date.now()}_${proofType}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('work-proofs').upload(path, photoFile);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('work-proofs').getPublicUrl(path);
      const gps = await getGPS();

      // Save as work_proof with proof_type and mission link
      await (supabase as any).from('work_proofs').insert({
        task_id: null, // No task, linked via mission
        user_id: user.id,
        mission_id: activeMissionId || null,
        photo_url: urlData.publicUrl,
        proof_type: proofType,
        notes: photoNotes,
        latitude: gps?.lat || null,
        longitude: gps?.lng || null,
      });

      // Also record in time_entries for timeline
      await (supabase as any).from('time_entries').insert({
        worker_id: worker.id,
        user_id: user.id,
        mission_id: activeMissionId || null,
        entry_type: 'photo',
        photo_url: urlData.publicUrl,
        notes: `[${proofType === 'before' ? 'AVANT' : 'APRÈS'}] ${photoNotes}`,
        latitude: gps?.lat || null,
        longitude: gps?.lng || null,
      });

      toast({ title: `Photo ${proofType === 'before' ? 'AVANT' : 'APRÈS'} envoyée ✓` });
      setPhotoOpen(false);
      setPhotoFile(null);
      setPhotoNotes('');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const lastEntryType = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1].entry_type : null;

  const canDoAction = (type: string) => {
    if (!lastEntryType) return type === 'arrival';
    if (lastEntryType === 'departure') return type === 'arrival';
    if (lastEntryType === 'arrival' || lastEntryType === 'break_end') return ['break_start', 'departure'].includes(type);
    if (lastEntryType === 'break_start') return type === 'break_end';
    return false;
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!worker) return (
    <div className="p-4 lg:p-6">
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Dashboard non disponible</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Votre compte n'est pas encore lié à un profil travailleur. Demandez à votre responsable de lier votre compte.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const currentTeam = teams[0];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
      {/* Worker header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {worker.photo_url ? <AvatarImage src={worker.photo_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {worker.first_name[0]}{worker.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{worker.first_name} {worker.last_name}</h1>
              <p className="text-sm text-muted-foreground">{worker.position}</p>
              <Badge variant={worker.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                {worker.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions - Pointage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Pointage du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => recordEntry('arrival')}
              disabled={!canDoAction('arrival')}
              className="h-14 flex flex-col gap-1"
              variant={canDoAction('arrival') ? 'default' : 'outline'}
            >
              <Play className="w-5 h-5" />
              <span className="text-xs">Arrivée</span>
            </Button>
            <Button
              onClick={() => recordEntry(lastEntryType === 'break_start' ? 'break_end' : 'break_start')}
              disabled={!canDoAction('break_start') && !canDoAction('break_end')}
              variant="outline"
              className="h-14 flex flex-col gap-1"
            >
              <Coffee className="w-5 h-5" />
              <span className="text-xs">{lastEntryType === 'break_start' ? 'Fin pause' : 'Pause'}</span>
            </Button>
            <Button
              onClick={() => recordEntry('departure')}
              disabled={!canDoAction('departure')}
              variant="outline"
              className="h-14 flex flex-col gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="text-xs">Départ</span>
            </Button>
            <Button
              onClick={() => setPhotoOpen(true)}
              variant="outline"
              className="h-14 flex flex-col gap-1"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Photo travail</span>
            </Button>
          </div>

          {/* Today's timeline */}
          {todayEntries.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historique du jour</p>
              <div className="space-y-1.5">
                {todayEntries.map(entry => {
                  const info = ENTRY_LABELS[entry.entry_type] || { label: entry.entry_type, icon: <CheckCircle className="w-4 h-4" />, color: 'text-foreground' };
                  return (
                    <div key={entry.id} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg bg-secondary/30">
                      <span className={info.color}>{info.icon}</span>
                      <span className="font-medium">{info.label}</span>
                      <span className="text-muted-foreground ml-auto">{format(new Date(entry.timestamp), 'HH:mm')}</span>
                      {entry.photo_url && <Camera className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current team */}
      {currentTeam && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Mon équipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{currentTeam.name}</h3>
              <Badge variant={currentTeam.status === 'active' ? 'default' : 'secondary'}>
                {currentTeam.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {currentTeam.zone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{currentTeam.zone}{currentTeam.site_name ? ` — ${currentTeam.site_name}` : ''}</span>
              </div>
            )}
            {currentTeam.leader_name && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                <span>Chef : <strong>{currentTeam.leader_name}</strong></span>
                {currentTeam.leader_phone && <span className="text-muted-foreground">({currentTeam.leader_phone})</span>}
              </div>
            )}

            {/* Team members */}
            {teamMembers.filter(m => m.worker_name !== `${worker.first_name} ${worker.last_name}`).length > 0 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Membres</p>
                {teamMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-sm py-1">
                    {m.is_leader && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                    <span className={m.is_leader ? 'font-medium' : ''}>{m.worker_name}</span>
                    <span className="text-muted-foreground text-xs">— {m.worker_role}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Map link */}
            {currentTeam.latitude && currentTeam.longitude && (
              <a
                href={`https://www.google.com/maps?q=${currentTeam.latitude},${currentTeam.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline pt-1"
              >
                <Navigation className="w-4 h-4" /> Voir le lieu de travail sur la carte
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Missions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Mes missions ({missions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {missions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune mission assignée</p>
          ) : (
            <div className="space-y-3">
              {missions.map(m => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${activeMissionId === m.id ? 'border-primary bg-primary/5' : 'hover:bg-secondary/30'}`}
                  onClick={() => setActiveMissionId(activeMissionId === m.id ? null : m.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      {m.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.description}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[m.priority] || ''}`}>
                      {m.priority}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                    {m.mission_date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(new Date(m.mission_date), 'dd/MM/yyyy')}</span>}
                    {m.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.start_time.slice(0, 5)}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.estimated_duration_hours}h</span>
                  </div>
                  {m.latitude && m.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <Navigation className="w-3 h-3" /> Voir sur la carte
                    </a>
                  )}
                  {activeMissionId === m.id && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      {/* Check-in status feedback */}
                      {checkInStatus !== 'idle' && (
                        <div className={`text-xs rounded-lg px-3 py-2 flex items-start gap-2 ${
                          checkInStatus === 'checking' ? 'bg-primary/10 text-primary' :
                          checkInStatus === 'success' ? 'bg-success/10 text-success' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {checkInStatus === 'checking' && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current shrink-0 mt-0.5" />}
                          {checkInStatus === 'success' && <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                          {checkInStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                          <span>{checkInMessage}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs w-full"
                        disabled={checkInStatus === 'checking'}
                        onClick={(e) => { e.stopPropagation(); recordEntry('arrival', m.id); }}
                      >
                        {checkInStatus === 'checking' ? (
                          <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" /> Vérification GPS...</>
                        ) : (
                          <><Play className="w-3 h-3 mr-1" /> Démarrer mission</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo upload dialog */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Photo de travail</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {photoFile ? (
                <div className="space-y-2">
                  <img src={URL.createObjectURL(photoFile)} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <p className="text-sm text-muted-foreground">{photoFile.name}</p>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2 block">
                  <Camera className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Prendre ou choisir une photo</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea value={photoNotes} onChange={e => setPhotoNotes(e.target.value)} placeholder="Décrivez le travail effectué..." />
            </div>
            <Button onClick={uploadWorkPhoto} className="w-full" disabled={!photoFile || uploading}>
              {uploading ? 'Envoi en cours...' : 'Envoyer la photo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
