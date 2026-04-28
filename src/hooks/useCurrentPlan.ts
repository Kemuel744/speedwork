import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PlanId } from '@/lib/planLimits';

/**
 * Returns the current active subscription plan for the authenticated user.
 * Falls back to `monthly` (Starter) when no active subscription is found,
 * matching the trial / free tier behavior on the rest of the app.
 * Admins are treated as `enterprise` (no caps).
 */
export function useCurrentPlan(): { plan: PlanId; isLoading: boolean } {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanId>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsLoading(false);
      return;
    }
    if (user.role === 'admin') {
      setPlan('enterprise');
      setIsLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase.rpc('get_my_subscription');
      if (!active) return;
      const sub = (data as any[])?.find((s) => s.status === 'active');
      if (sub?.plan && ['monthly', 'annual', 'enterprise'].includes(sub.plan)) {
        setPlan(sub.plan as PlanId);
      }
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return { plan, isLoading };
}