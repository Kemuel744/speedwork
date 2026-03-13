import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Lock, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const ENTERPRISE_TRIAL_DAYS = 3;

export default function EnterpriseGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialAccess, setIsTrialAccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') { setHasAccess(true); return; }

    async function checkAccess() {
      const [subRes, profileRes] = await Promise.all([
        supabase.rpc('get_my_subscription'),
        supabase.from('profiles').select('trial_start').eq('user_id', user!.id).single(),
      ]);

      // Check active enterprise subscription
      const activeSub = (subRes.data as any[])?.find(
        (s: any) => s.status === 'active' && s.plan === 'enterprise'
      );
      if (activeSub) {
        setHasAccess(true);
        return;
      }

      // Check enterprise trial (3 days from account creation)
      if (profileRes.data?.trial_start) {
        const start = new Date(profileRes.data.trial_start);
        const now = new Date();
        const daysPassed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const remaining = Math.max(0, Math.ceil(ENTERPRISE_TRIAL_DAYS - daysPassed));
        if (remaining > 0) {
          setTrialDaysLeft(remaining);
          setIsTrialAccess(true);
          setHasAccess(true);
          return;
        }
      }

      setHasAccess(false);
    }
    checkAccess();
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
              <h2 className="text-2xl font-bold text-foreground">{t('enterprise.title')}</h2>
              <p className="text-muted-foreground">
                {t('enterprise.trial_ended')}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3 text-left">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{t('enterprise.plan')}</p>
                  <p className="text-sm text-muted-foreground">{t('enterprise.price')}</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground text-left space-y-1 ml-8">
                <li>• {t('enterprise.feat1')}</li>
                <li>• {t('enterprise.feat2')}</li>
                <li>• {t('enterprise.feat3')}</li>
                <li>• {t('enterprise.feat4')}</li>
                <li>• {t('enterprise.feat5')}</li>
                <li>• {t('enterprise.feat6')}</li>
              </ul>
            </div>
            <Button onClick={() => navigate('/subscription')} className="gap-2">
              {t('enterprise.cta')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {isTrialAccess && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mx-4 mt-4 mb-0 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <span className="text-sm text-foreground">
                <strong>{t('enterprise.trial_badge')}</strong> — {trialDaysLeft} {t('enterprise.trial_days_left')}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/subscription')} className="text-xs">
              {t('enterprise.subscribe_now')}
            </Button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
