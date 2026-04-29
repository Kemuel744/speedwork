import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { planQuotas, planNames } from '@/lib/planLimits';

type QuotaKey = 'products' | 'depots' | 'users' | 'pos';

const tableFor: Record<QuotaKey, 'products' | 'cash_registers' | 'employees' | 'locations'> = {
  products: 'products',
  pos: 'cash_registers',
  users: 'employees',
  depots: 'locations',
};

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
      const table = tableFor[key];
      let q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      if (key === 'depots') q = q.in('location_type', ['depot', 'warehouse']);
      const { count } = await q;
      if (!active) return;
      // Owner counts as 1 user
      setUsed((count ?? 0) + (key === 'users' ? 1 : 0));
    })();
    return () => { active = false; };
  }, [user, plan, key]);

  const limitReached = cap !== null && used >= cap;
  const planName = planNames[plan];
  return { used, cap, limitReached, planName };
}