import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { planQuotas, planNames, type PlanId } from '@/lib/planLimits';

interface Props {
  userId: string;
  planId: PlanId;
}

interface UsageRow {
  key: 'products' | 'depots' | 'users' | 'pos';
  label: string;
  used: number;
  cap: number | null;
  /** for "depots" the cap is exact-allowed (e.g. 0 for Starter) */
  exceeded: boolean;
}

async function fetchCount(table: 'products' | 'cash_registers', userId: string) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function fetchDepotsCount(userId: string) {
  // "Depot" = locations of type 'depot' or 'warehouse'
  const { count, error } = await supabase
    .from('locations')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId)
    .in('location_type', ['depot', 'warehouse']);
  if (error) throw error;
  return count ?? 0;
}

async function fetchTeamMembersCount(userId: string) {
  // Owner + organization members. We approximate "users" as 1 (owner) + members.
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  if (!org?.id) return 1;
  const { count } = await supabase
    .from('organization_members')
    .select('id', { head: true, count: 'exact' })
    .eq('organization_id', org.id);
  return 1 + (count ?? 0);
}

export default function PlanLimitsCheck({ userId, planId }: Props) {
  const quotas = planQuotas[planId];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['plan-usage', userId],
    queryFn: async () => {
      const [products, depots, pos, users] = await Promise.all([
        fetchCount('products', userId),
        fetchDepotsCount(userId),
        fetchCount('cash_registers', userId),
        fetchTeamMembersCount(userId),
      ]);
      return { products, depots, pos, users };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-xl bg-secondary/40 border border-border">
        <Loader2 className="w-4 h-4 animate-spin" />
        Vérification de la conformité aux limites…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-sm text-muted-foreground p-3 rounded-xl bg-secondary/40 border border-border">
        Impossible de récupérer l'usage actuel.
      </div>
    );
  }

  const rows: UsageRow[] = [
    {
      key: 'products',
      label: 'Produits',
      used: data.products,
      cap: quotas.maxProducts,
      exceeded: quotas.maxProducts !== null && data.products > quotas.maxProducts,
    },
    {
      key: 'depots',
      label: 'Dépôts',
      used: data.depots,
      cap: quotas.maxDepots,
      exceeded: data.depots > quotas.maxDepots,
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      used: data.users,
      cap: quotas.maxUsers,
      exceeded: quotas.maxUsers !== null && data.users > quotas.maxUsers,
    },
    {
      key: 'pos',
      label: 'Points de vente',
      used: data.pos,
      cap: quotas.maxPos,
      exceeded: quotas.maxPos !== null && data.pos > quotas.maxPos,
    },
  ];

  const mismatches = rows.filter((r) => r.exceeded);
  const ok = mismatches.length === 0;

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        ok
          ? 'border-emerald-200 bg-emerald-500/5'
          : 'border-amber-300 bg-amber-500/10'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2 mb-2">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
        )}
        <p className={`font-semibold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
          {ok
            ? `Conforme aux limites du plan ${planNames[planId]}.`
            : `Dépassement détecté pour le plan ${planNames[planId]}.`}
        </p>
      </div>

      <ul className="divide-y divide-border/60">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between py-1.5">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={`font-medium ${r.exceeded ? 'text-amber-700' : 'text-foreground'}`}>
              {r.used} / {r.cap === null ? '∞' : r.cap}
              {r.exceeded && <span className="ml-2 text-xs">⚠ hors plan</span>}
            </span>
          </li>
        ))}
      </ul>

      {!ok && (
        <p className="mt-2 text-xs text-amber-700">
          Ce client utilise plus que ce que son plan autorise. Envisagez une montée de plan ou un ajustement.
        </p>
      )}
    </div>
  );
}