import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function EnterpriseGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') { setHasAccess(true); return; }

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
              <h2 className="text-2xl font-bold text-foreground">{t('enterprise.title')}</h2>
              <p className="text-muted-foreground">
                {t('enterprise.desc')}
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
            <Button onClick={() => navigate('/client')} className="gap-2">
              {t('enterprise.cta')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
