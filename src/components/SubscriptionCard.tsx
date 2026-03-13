import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Calendar, AlertTriangle, Sparkles } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionData {
  id: string;
  plan: 'monthly' | 'annual' | 'enterprise';
  status: 'active' | 'expired' | 'suspended';
  start_date: string;
  end_date: string;
  amount: number;
  payment_method: string;
}

const planLabels: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  monthly: { label: 'Mensuel', icon: Zap, color: 'bg-primary/10 text-primary border-primary/20' },
  annual: { label: 'Annuel', icon: Crown, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  enterprise: { label: 'Entreprise', icon: Crown, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
};

const statusLabels: Record<string, { label: string; class: string }> = {
  active: { label: 'Actif', class: 'bg-success/10 text-success border-success/20' },
  expired: { label: 'Expiré', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  suspended: { label: 'Suspendu', class: 'bg-warning/10 text-warning border-warning/20' },
};

export default function SubscriptionCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchSubscription() {
      const { data } = await supabase.rpc('get_my_subscription');
      const sub = (data as SubscriptionData[] | null)?.[0] ?? null;
      setSubscription(sub);
      setIsLoading(false);
    }

    fetchSubscription();
  }, [user]);

  if (isLoading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-6 bg-muted rounded w-1/2 mb-2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="stat-card border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">Aucun abonnement actif</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Souscrivez un abonnement pour accéder à toutes les fonctionnalités.
            </p>
            <Button size="sm" className="mt-3" onClick={() => navigate('/tarifs')}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Voir les offres
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const plan = planLabels[subscription.plan] || planLabels.monthly;
  const status = statusLabels[subscription.status] || statusLabels.active;
  const PlanIcon = plan.icon;

  const startDate = new Date(subscription.start_date);
  const endDate = new Date(subscription.end_date);
  const daysUntilExpiry = differenceInDays(endDate, new Date());
  const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0 && subscription.status === 'active';
  const isExpired = subscription.status === 'expired' || daysUntilExpiry < 0;

  return (
    <div className={`stat-card ${isExpiringSoon ? 'border-warning/50' : isExpired ? 'border-destructive/50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.color.split(' ')[0]}`}>
            <PlanIcon className={`w-5 h-5 ${plan.color.split(' ')[1]}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Mon abonnement</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={`text-xs ${plan.color}`}>
                {plan.label}
              </Badge>
              <Badge variant="outline" className={`text-xs ${status.class}`}>
                {status.label}
              </Badge>
            </div>
          </div>
        </div>
        <span className="text-lg font-bold text-foreground">
          {subscription.amount.toLocaleString('fr-FR')} <span className="text-xs text-muted-foreground font-normal">FCFA</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Activation</p>
            <p className="font-medium text-foreground">{format(startDate, 'dd MMM yyyy', { locale: fr })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Expiration</p>
            <p className={`font-medium ${isExpiringSoon ? 'text-warning' : isExpired ? 'text-destructive' : 'text-foreground'}`}>
              {format(endDate, 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      {isExpiringSoon && (
        <div className="mt-3 flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg p-2.5">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            Votre abonnement expire dans <strong>{daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}</strong>. Renouvelez-le pour ne pas perdre l'accès.
          </p>
          <Button size="sm" variant="outline" className="ml-auto shrink-0 text-xs border-warning text-warning hover:bg-warning/10" onClick={() => navigate('/tarifs')}>
            Renouveler
          </Button>
        </div>
      )}

      {isExpired && (
        <div className="mt-3 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            Votre abonnement a expiré. Renouvelez pour continuer à utiliser SpeedWork.
          </p>
          <Button size="sm" variant="outline" className="ml-auto shrink-0 text-xs border-destructive text-destructive hover:bg-destructive/10" onClick={() => navigate('/tarifs')}>
            Renouveler
          </Button>
        </div>
      )}
    </div>
  );
}
