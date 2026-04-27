export type PlanId = 'monthly' | 'annual' | 'enterprise';

export interface PlanLimits {
  products: string;
  depots: string;
  users: string;
  pos: string;
}

/**
 * Numeric thresholds derived from the human-readable limits above.
 * `null` means "no enforced cap" (e.g. unlimited users on Business/Pro).
 * Use these for compliance checks (e.g. AdminSubscriptions mismatch panel).
 */
export interface PlanQuotas {
  maxProducts: number | null;
  maxDepots: number;
  maxUsers: number | null;
  maxPos: number | null;
}

export const planQuotas: Record<PlanId, PlanQuotas> = {
  monthly:    { maxProducts: 750,  maxDepots: 0, maxUsers: 1,    maxPos: 1 },
  annual:     { maxProducts: 1000, maxDepots: 1, maxUsers: null, maxPos: 1 },
  enterprise: { maxProducts: null, maxDepots: 2, maxUsers: null, maxPos: null },
};

/** Source of truth — used on public pricing cards AND admin screens. */
export const planLimits: Record<PlanId, PlanLimits> = {
  monthly: {
    products: "Jusqu'à 750",
    depots: 'Aucun',
    users: '1 utilisateur',
    pos: '1 point de vente',
  },
  annual: {
    products: '750 à 1 000',
    depots: '1 dépôt',
    users: 'Plusieurs utilisateurs',
    pos: '1 point de vente',
  },
  enterprise: {
    products: 'Plus de 1 000',
    depots: '2 dépôts',
    users: 'Plusieurs utilisateurs',
    pos: 'Multi-points de vente',
  },
};

export const planLimitLabels = {
  products: 'Produits',
  depots: 'Dépôts',
  users: 'Utilisateurs',
  pos: 'Points de vente',
} as const;

export const planNames: Record<PlanId, string> = {
  monthly: 'Starter',
  annual: 'Business',
  enterprise: 'Pro',
};