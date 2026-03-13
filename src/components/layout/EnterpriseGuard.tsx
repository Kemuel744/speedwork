import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function EnterpriseGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    // Admins always have access
    if (user.role === 'admin') {
      setHasAccess(true);
      return;
    }

    async function checkSubscription() {
      const { data } = await supabase.rpc('get_my_subscription');
      const activeSub = (data as any[])?.find(
        (s: any) => s.status === 'active' && s.plan === 'enterprise'
      );
      setHasAccess(!!activeSub);
    }

    checkSubscription();
  }, [user]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-lg w-full border-primary/20 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Fonctionnalité Entreprise</h2>
              <p className="text-muted-foreground">
                La gestion d'équipes, travailleurs, missions et carte des missions est réservée à l'abonnement <strong>Entreprise</strong>.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3 text-left">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Plan Entreprise</p>
                  <p className="text-sm text-muted-foreground">15 000 FCFA / mois</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground text-left space-y-1 ml-8">
                <li>• Gestion des équipes dynamiques</li>
                <li>• Registre des travailleurs</li>
                <li>• Missions géolocalisées</li>
                <li>• Carte interactive</li>
                <li>• Pointage & paie automatisée</li>
                <li>• 3 collaborateurs inclus</li>
              </ul>
            </div>
            <Button onClick={() => navigate('/client')} className="gap-2">
              Souscrire à l'abonnement Entreprise
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
