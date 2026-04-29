import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { planQuotas, planNames } from '@/lib/planLimits';

type QuotaKey = 'products' | 'depots' | 'users' | 'pos';

/**
 * Returns the current usage and the plan cap for one quota key,
 * plus a boolean indicating if the cap has been reached.
 * `null` cap means "unlimited" for the current plan.
 */
export function usePlanQuota(key: QuotaKey) {
  const { user } = useAuth();
  const { plan } = useCurrentPlan();
  const [used, setUsed] = useState(0);

  const cap =
    key === 'products' ? planQuotas[plan].maxProducts
    : key === 'pos'    ? planQuotas[plan].maxPos
    : key === 'users'  ? planQuotas[plan].maxUsers
    :                    planQuotas[plan].maxDepots;

  useEffect(() => {
    let active = true;
    if (!user) return;
    (async () => {
      let count = 0;
      if (key === 'products') {
        const r = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        count = r.count ?? 0;
      } else if (key === 'pos') {
        const r = await supabase.from('cash_registers').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        count = r.count ?? 0;
      } else if (key === 'users') {
        const r = await supabase.from('employees').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        count = r.count ?? 0;
      } else {
        const r = await supabase.from('locations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('location_type', ['depot', 'warehouse']);
        count = r.count ?? 0;
      }
      if (!active) return;
      // Owner counts as 1 user
      setUsed(count + (key === 'users' ? 1 : 0));
    })();
    return () => { active = false; };
  }, [user, plan, key]);

  const limitReached = cap !== null && used >= cap;
  const planName = planNames[plan];
  return { used, cap, limitReached, planName };
}