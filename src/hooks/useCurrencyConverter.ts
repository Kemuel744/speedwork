import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  time_last_update: string;
}

export function useCurrencyConverter() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async (base: string = 'EUR') => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('exchange-rates', {
        body: { base },
      });
      if (fnError) throw fnError;
      setRates(data);
      return data as ExchangeRates;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des taux');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const convert = useCallback(
    (amount: number, from: string, to: string): number | null => {
      if (!rates) return null;
      if (from === to) return amount;

      // If base matches `from`, just multiply
      if (rates.base === from && rates.rates[to]) {
        return Math.round(amount * rates.rates[to] * 100) / 100;
      }
      // Cross-rate
      if (rates.rates[from] && rates.rates[to]) {
        return Math.round((amount / rates.rates[from]) * rates.rates[to] * 100) / 100;
      }
      return null;
    },
    [rates],
  );

  return { rates, loading, error, fetchRates, convert };
}
