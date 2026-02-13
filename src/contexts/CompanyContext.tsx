import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanyInfo } from '@/types';

interface CompanySettings extends CompanyInfo {
  defaultTaxRate: number;
}

interface CompanyContextType {
  company: CompanySettings;
  updateCompany: (data: Partial<CompanySettings>) => void;
}

const defaultCompany: CompanySettings = {
  name: 'SpeedWork SAS',
  address: '12 Rue de la Paix, 75002 Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@speedwork.com',
  logo: undefined,
  logoPosition: 'left',
  iban: '',
  bic: '',
  bankName: '',
  defaultTaxRate: 20,
};

const STORAGE_KEY = 'speedwork_company';

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultCompany, ...JSON.parse(stored) } : defaultCompany;
    } catch {
      return defaultCompany;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
  }, [company]);

  const updateCompany = (data: Partial<CompanySettings>) => {
    setCompany(prev => ({ ...prev, ...data }));
  };

  return (
    <CompanyContext.Provider value={{ company, updateCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}
