import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase, MapPin, Clock, Camera, Users, CheckCircle,
  ArrowRight, Sparkles, Shield, Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface WorkerProfile {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  photo_url: string | null;
  contract_type: string;
  base_salary: number;
}

const STEPS = [
  { id: 'welcome', title: 'Bienvenue' },
  { id: 'features', title: 'Fonctionnalités' },
  { id: 'permissions', title: 'Autorisations' },
  { id: 'ready', title: 'C\'est parti !' },
];

const FEATURES = [
  { icon: Clock, title: 'Pointage intelligent', description: 'Enregistrez vos arrivées, pauses et départs avec géolocalisation automatique.' },
  { icon: MapPin, title: 'Missions géolocalisées', description: 'Consultez vos missions avec itinéraire GPS vers le chantier.' },
  { icon: Camera, title: 'Preuves de travail', description: 'Prenez des photos avant/après pour documenter votre progression.' },
  { icon: Users, title: 'Équipe en temps réel', description: 'Voyez votre équipe, le chef d\'équipe et les membres assignés.' },
];

export default function WorkerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('workers')
      .select('id, first_name, last_name, position, photo_url, contract_type, base_salary')
      .eq('linked_user_id', user.id)
      .single()
      .then(({ data }: any) => {
        if (data) setWorker(data);
        setLoading(false);
      });
  }, [user]);

  const completeOnboarding = async () => {
    if (!worker) return;
    setCompleting(true);
    await (supabase as any)
      .from('workers')
      .update({ onboarding_completed: true })
      .eq('id', worker.id);
    toast({ title: '🎉 Bienvenue !', description: 'Votre espace de travail est prêt.' });
    navigate('/worker-dashboard', { replace: true });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-2 rounded-full transition-all duration-300 ${
              i <= step ? 'w-8 bg-primary' : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>

              <h1 className="text-3xl font-bold text-foreground">
                Bienvenue{worker ? `, ${worker.first_name}` : ''} !
              </h1>
              <p className="text-muted-foreground text-lg">
                Votre responsable vous a invité à rejoindre SpeedWork. Découvrons ensemble votre espace de travail.
              </p>

              {worker && (
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14">
                        {worker.photo_url && <AvatarImage src={worker.photo_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {worker.first_name[0]}{worker.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">
                          {worker.first_name} {worker.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{worker.position}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {worker.contract_type === 'cdi' ? 'CDI' :
                           worker.contract_type === 'cdd' ? 'CDD' :
                           worker.contract_type === 'freelance' ? 'Freelance' :
                           worker.contract_type === 'stage' ? 'Stage' : worker.contract_type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button size="lg" className="w-full gap-2" onClick={() => setStep(1)}>
                Découvrir <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Features */}
          {step === 1 && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6"
            >
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-foreground">Vos outils au quotidien</h2>
                <p className="text-muted-foreground mt-1">
                  Tout ce dont vous avez besoin sur votre mobile
                </p>
              </div>

              <div className="space-y-3">
                {FEATURES.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardContent className="flex items-start gap-3 py-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <feat.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{feat.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{feat.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Retour</Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(2)}>
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Permissions */}
          {step === 2 && (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6"
            >
              <div className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-foreground">Autorisations recommandées</h2>
                <p className="text-muted-foreground mt-1">
                  Pour profiter pleinement de l'application
                </p>
              </div>

              <div className="space-y-3">
                <PermissionCard
                  icon={MapPin}
                  title="Géolocalisation"
                  description="Pour le pointage sur site et la validation GPS des missions"
                  onRequest={() => {
                    navigator.geolocation?.getCurrentPosition(
                      () => toast({ title: '✅ GPS activé' }),
                      () => toast({ title: '⚠️ GPS refusé', description: 'Vous pourrez l\'activer plus tard', variant: 'destructive' })
                    );
                  }}
                />
                <PermissionCard
                  icon={Bell}
                  title="Notifications"
                  description="Pour recevoir les alertes de nouvelles missions et rappels"
                  onRequest={() => {
                    if ('Notification' in window) {
                      Notification.requestPermission().then(p =>
                        toast({ title: p === 'granted' ? '✅ Notifications activées' : '⚠️ Notifications refusées' })
                      );
                    }
                  }}
                />
                <PermissionCard
                  icon={Camera}
                  title="Caméra"
                  description="Pour prendre les photos de preuves de travail"
                  onRequest={() => {
                    navigator.mediaDevices?.getUserMedia({ video: true })
                      .then(s => { s.getTracks().forEach(t => t.stop()); toast({ title: '✅ Caméra activée' }); })
                      .catch(() => toast({ title: '⚠️ Caméra refusée', variant: 'destructive' }));
                  }}
                />
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Ces autorisations sont facultatives et peuvent être modifiées dans les paramètres de votre appareil.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Retour</Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                  Suivant <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle className="w-20 h-20 text-primary mx-auto" />
              </motion.div>

              <h2 className="text-3xl font-bold text-foreground">Vous êtes prêt !</h2>
              <p className="text-muted-foreground text-lg">
                Votre espace de travail est configuré. Commencez à pointer, consultez vos missions et collaborez avec votre équipe.
              </p>

              <div className="grid grid-cols-3 gap-3 py-4">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium text-foreground">Pointage</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <MapPin className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium text-foreground">Missions</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium text-foreground">Équipe</p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={completeOnboarding}
                disabled={completing}
              >
                {completing ? 'Chargement...' : 'Accéder à mon espace'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PermissionCard({ icon: Icon, title, description, onRequest }: {
  icon: React.ElementType;
  title: string;
  description: string;
  onRequest: () => void;
}) {
  const [granted, setGranted] = useState(false);
  return (
    <Card className={granted ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          size="sm"
          variant={granted ? 'outline' : 'default'}
          onClick={() => { onRequest(); setGranted(true); }}
          disabled={granted}
          className="shrink-0"
        >
          {granted ? '✓' : 'Activer'}
        </Button>
      </CardContent>
    </Card>
  );
}
