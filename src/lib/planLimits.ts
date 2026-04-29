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
  maxDepots: number | null;
  maxUsers: number | null;
  maxPos: number | null;
}

export const planQuotas: Record<PlanId, PlanQuotas> = {
  monthly:    { maxProducts: 500,  maxDepots: 0, maxUsers: 1,    maxPos: 1 },
  annual:     { maxProducts: 2000, maxDepots: 1, maxUsers: 3,    maxPos: 1 },
  enterprise: { maxProducts: null, maxDepots: null, maxUsers: null, maxPos: null },
};

/** Source of truth — used on public pricing cards AND admin screens. */
export const planLimits: Record<PlanId, PlanLimits> = {
  monthly: {
    products: "Jusqu'à 500",
    depots: 'Aucun',
    users: '1 utilisateur',
    pos: '1 point de vente',
  },
  annual: {
    products: "Jusqu'à 2 000",
    depots: '1 dépôt',
    users: "Jusqu'à 3 utilisateurs",
    pos: '1 point de vente',
  },
  enterprise: {
    products: 'Illimités',
    depots: 'Illimités',
    users: 'Illimités',
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