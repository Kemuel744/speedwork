export type PlanId = 'monthly' | 'annual' | 'enterprise';

export interface PlanLimits {
  products: string;
  depots: string;
  users: string;
  pos: string;
}

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