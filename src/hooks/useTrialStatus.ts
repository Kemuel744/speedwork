import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TrialStatus {
  isInTrial: boolean;
  trialExpired: boolean;
  daysRemaining: number;
  docsUsed: number;
  docsLimit: number;
  canCreateDocument: boolean;
  isLoading: boolean;
}

const TRIAL_DAYS = 3;
const TRIAL_DOCS_LIMIT = 4;

export function useTrialStatus(): TrialStatus {
  const { user } = useAuth();
  const [trialStart, setTrialStart] = useState<string | null>(null);
  const [docsUsed, setDocsUsed] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchTrialData() {
      const [profileRes, subRes, docsRes] = await Promise.all([
        supabase.from('profiles').select('trial_start, trial_docs_used').eq('user_id', user!.id).single(),
        supabase.rpc('get_my_subscription'),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ]);

      if (profileRes.data) {
        setTrialStart(profileRes.data.trial_start);
        setDocsUsed(docsRes.count ?? profileRes.data.trial_docs_used ?? 0);
      }

      const activeSub = (subRes.data as any[])?.find((s: any) => s.status === 'active');
      setHasSubscription(!!activeSub);
      setIsLoading(false);
    }

    fetchTrialData();
  }, [user]);

  if (isLoading || !user) {
    return { isInTrial: false, trialExpired: false, daysRemaining: 0, docsUsed: 0, docsLimit: TRIAL_DOCS_LIMIT, canCreateDocument: false, isLoading };
  }

  // Admins bypass trial
  if (user.role === 'admin') {
    return { isInTrial: false, trialExpired: false, daysRemaining: 0, docsUsed, docsLimit: TRIAL_DOCS_LIMIT, canCreateDocument: true, isLoading: false };
  }

  // Active subscription bypasses trial
  if (hasSubscription) {
    return { isInTrial: false, trialExpired: false, daysRemaining: 0, docsUsed, docsLimit: TRIAL_DOCS_LIMIT, canCreateDocument: true, isLoading: false };
  }

  // Calculate trial status
  const start = trialStart ? new Date(trialStart) : new Date();
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const daysPassed = diffMs / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.ceil(TRIAL_DAYS - daysPassed));

  const timeExpired = daysPassed >= TRIAL_DAYS;
  const docsExhausted = docsUsed >= TRIAL_DOCS_LIMIT;
  const trialExpired = timeExpired || docsExhausted;

  return {
    isInTrial: !trialExpired,
    trialExpired,
    daysRemaining,
    docsUsed,
    docsLimit: TRIAL_DOCS_LIMIT,
    canCreateDocument: !trialExpired,
    isLoading: false,
  };
}
