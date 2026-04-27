import { Package, Warehouse, Users, Store } from 'lucide-react';
import { planLimits, planLimitLabels, type PlanId } from '@/lib/planLimits';

interface PlanLimitsTableProps {
  planId: PlanId;
  /** 'card' = compact for plan cards, 'detail' = airier for admin dialog */
  variant?: 'card' | 'detail';
}

const icons = {
  products: Package,
  depots: Warehouse,
  users: Users,
  pos: Store,
} as const;

export default function PlanLimitsTable({ planId, variant = 'card' }: PlanLimitsTableProps) {
  const limits = planLimits[planId];
  const rows = (Object.keys(planLimitLabels) as Array<keyof typeof planLimitLabels>).map((key) => ({
    key,
    label: planLimitLabels[key],
    value: limits[key],
    Icon: icons[key],
  }));

  const isCard = variant === 'card';

  return (
    <div
      className={`rounded-xl border border-border bg-secondary/40 ${isCard ? 'p-3' : 'p-4'} text-sm`}
      role="table"
      aria-label="Limites du plan"
    >
      <ul className="divide-y divide-border">
        {rows.map(({ key, label, value, Icon }) => (
          <li
            key={key}
            className={`flex items-center justify-between gap-3 ${isCard ? 'py-1.5' : 'py-2'}`}
            role="row"
          >
            <span className="flex items-center gap-2 text-muted-foreground" role="rowheader">
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </span>
            <span className="font-medium text-foreground text-right" role="cell">
              {value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}