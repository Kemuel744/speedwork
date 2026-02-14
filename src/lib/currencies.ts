export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (BCEAO)', locale: 'fr-FR' },
  { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (BEAC)', locale: 'fr-FR' },
  { code: 'USD', symbol: '$', name: 'Dollar US', locale: 'en-US' },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling', locale: 'en-GB' },
  { code: 'MAD', symbol: 'MAD', name: 'Dirham marocain', locale: 'fr-MA' },
  { code: 'TND', symbol: 'TND', name: 'Dinar tunisien', locale: 'fr-TN' },
  { code: 'GNF', symbol: 'GNF', name: 'Franc guinéen', locale: 'fr-GN' },
];

export function getCurrency(code: string): Currency {
  return currencies.find(c => c.code === code) || currencies[0];
}

export function formatAmount(amount: number, currencyCode: string): string {
  const cur = getCurrency(currencyCode);
  return `${amount.toLocaleString(cur.locale)} ${cur.symbol}`;
}
