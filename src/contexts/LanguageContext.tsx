import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '@/lib/translations';
import type { Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string): string => {
    return translations[language][key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback safe: évite l'écran blanc si le Provider est manquant
    // (ex: HMR désynchronisé, composant rendu hors arbre, tests isolés).
    if (typeof console !== 'undefined') {
      console.warn('[useLanguage] Provider manquant — fallback FR utilisé.');
    }
    return {
      language: 'fr' as Language,
      setLanguage: () => {},
      t: (key: string) => translations.fr?.[key] ?? key,
    };
  }
  return ctx;
}
