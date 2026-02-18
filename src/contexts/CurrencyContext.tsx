import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { formatAmount as rawFormatAmount, getCurrency } from '@/lib/currencies';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  time_last_update?: string;
}

interface CurrencyContextType {
  /** The currently selected display currency (from company settings) */
  displayCurrency: string;
  /** Exchange rates data */
  rates: ExchangeRates | null;
  /** Whether rates are loading */
  loading: boolean;
  /** Format and convert an amount from its original currency to the display currency */
  displayAmount: (amount: number, fromCurrency?: string) => string;
  /** Convert an amount without formatting */
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  /** Last update timestamp */
  lastUpdate: string | null;
  /** Manually refresh rates */
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Cache rates in memory to avoid refetching on every render
let cachedRates: ExchangeRates | null = null;
let cachedBase: string | null = null;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { company } = useCompany();
  const displayCurrency = company.currency || 'XOF';

  const [rates, setRates] = useState<ExchangeRates | null>(cachedRates);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchRates = useCallback(async (base: string = 'EUR') => {
    // Use EUR as base for cross-rate stability
    if (cachedRates && cachedBase === 'EUR') {
      setRates(cachedRates);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exchange-rates', {
        body: { base: 'EUR' },
      });
      if (error) throw error;
      cachedRates = data;
      cachedBase = 'EUR';
      setRates(data);
      setLastUpdate(data?.time_last_update || null);
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch rates on mount
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string, toCurrency?: string): number => {
      const to = toCurrency || displayCurrency;
      if (fromCurrency === to) return amount;
      if (!rates || !rates.rates) return amount;

      const fromRate = rates.rates[fromCurrency];
      const toRate = rates.rates[to];

      if (!fromRate || !toRate) return amount;

      // Cross-rate conversion via EUR base
      const inBase = amount / fromRate;
      return Math.round(inBase * toRate * 100) / 100;
    },
    [rates, displayCurrency],
  );

  const displayAmount = useCallback(
    (amount: number, fromCurrency?: string): string => {
      const from = fromCurrency || displayCurrency;
      const converted = convertAmount(amount, from, displayCurrency);
      return rawFormatAmount(converted, displayCurrency);
    },
    [convertAmount, displayCurrency],
  );

  const refreshRates = useCallback(async () => {
    cachedRates = null;
    cachedBase = null;
    await fetchRates();
  }, [fetchRates]);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, rates, loading, displayAmount, convertAmount, lastUpdate, refreshRates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
