import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Proof {
  id: string;
  photo_url: string;
  proof_type: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  completed_at: string;
}

interface MissionProofsProps {
  missionId: string;
}

export default function MissionProofs({ missionId }: MissionProofsProps) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('work_proofs')
        .select('*')
        .eq('mission_id', missionId)
        .order('completed_at', { ascending: true });
      if (data) setProofs(data);
    };
    fetch();
  }, [missionId]);

  if (proofs.length === 0) return null;

  const beforeProofs = proofs.filter(p => p.proof_type === 'before');
  const afterProofs = proofs.filter(p => p.proof_type === 'after');

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Camera className="w-3.5 h-3.5" /> Preuves de travail ({proofs.length})
      </p>

      {beforeProofs.length > 0 && (
        <div>
          <Badge variant="outline" className="mb-1.5 text-xs">Avant intervention ({beforeProofs.length})</Badge>
          <div className="flex gap-2 flex-wrap">
            {beforeProofs.map(p => (
              <div key={p.id} className="relative group cursor-pointer" onClick={() => setSelectedProof(p)}>
                <img src={p.photo_url} alt="Avant" className="w-20 h-20 object-cover rounded-lg border" />
                <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[10px] text-center py-0.5 rounded-b-lg">
                  {format(new Date(p.completed_at), 'dd/MM HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {afterProofs.length > 0 && (
        <div>
          <Badge variant="default" className="mb-1.5 text-xs">Après intervention ({afterProofs.length})</Badge>
          <div className="flex gap-2 flex-wrap">
            {afterProofs.map(p => (
              <div key={p.id} className="relative group cursor-pointer" onClick={() => setSelectedProof(p)}>
                <img src={p.photo_url} alt="Après" className="w-20 h-20 object-cover rounded-lg border" />
                <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[10px] text-center py-0.5 rounded-b-lg">
                  {format(new Date(p.completed_at), 'dd/MM HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full view dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Preuve {selectedProof?.proof_type === 'before' ? 'AVANT' : 'APRÈS'} intervention
            </DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="space-y-3">
              <img src={selectedProof.photo_url} alt="Preuve" className="w-full rounded-lg" />
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>📅 {format(new Date(selectedProof.completed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
                {selectedProof.latitude && selectedProof.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedProof.latitude},${selectedProof.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> Voir la position
                  </a>
                )}
              </div>
              {selectedProof.notes && (
                <p className="text-sm bg-secondary/30 rounded-lg p-3">{selectedProof.notes}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
