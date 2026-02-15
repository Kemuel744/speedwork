import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, FileText, AlertTriangle, Sparkles } from 'lucide-react';

export default function TrialBanner() {
  const navigate = useNavigate();
  const { isInTrial, trialExpired, daysRemaining, docsUsed, docsLimit, isLoading } = useTrialStatus();

  if (isLoading) return null;

  // No trial info needed for subscribed users or admins
  if (!isInTrial && !trialExpired) return null;

  if (trialExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">Période d'essai terminée</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Votre essai gratuit est terminé. Souscrivez un abonnement pour continuer à créer des factures et devis.
            </p>
            <Button size="sm" className="mt-3" onClick={() => navigate('/subscription')}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Voir les abonnements
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const docsProgress = (docsUsed / docsLimit) * 100;

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">Essai gratuit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</strong> restant{daysRemaining > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{docsUsed}/{docsLimit}</strong> documents créés
              </span>
            </div>
          </div>
          <Progress value={docsProgress} className="h-1.5 mt-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Profitez de votre essai pour explorer toutes les fonctionnalités.
          </p>
        </div>
      </div>
    </div>
  );
}
