import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Settings
    'settings.title': 'Paramètres',
    'settings.company': 'Informations entreprise',
    'settings.logo': "Logo de l'entreprise",
    'settings.noLogo': 'Aucun logo',
    'settings.chooseFile': 'Choisir un fichier',
    'settings.companyName': "Nom de l'entreprise",
    'settings.email': 'Email',
    'settings.phone': 'Téléphone',
    'settings.address': 'Adresse',
    'settings.description': "Description de l'entreprise",
    'settings.descriptionHint': 'facultatif',
    'settings.descriptionPlaceholder': 'Brève description de votre activité (apparaît sur vos factures et devis)',
    'settings.banking': 'Informations bancaires',
    'settings.bankName': 'Banque',
    'settings.bankNamePlaceholder': 'Nom de la banque',
    'settings.billing': 'Facturation',
    'settings.defaultTax': 'TVA par défaut (%)',
    'settings.currency': 'Devise',
    'settings.save': 'Enregistrer',
    'settings.saved': 'Paramètres enregistrés',
    'settings.logoUpdated': 'Logo mis à jour',
    'settings.logoTooLarge': 'Le fichier est trop volumineux (max 2 Mo)',
    'settings.appearance': 'Apparence et langue',
    'settings.theme': 'Thème',
    'settings.themeLight': 'Clair',
    'settings.themeDark': 'Sombre',
    'settings.themeSystem': 'Système',
    'settings.language': 'Langue',

    // Sidebar
    'nav.dashboard': 'Tableau de bord',
    'nav.documents': 'Documents',
    'nav.clients': 'Clients',
    'nav.teams': 'Équipes',
    'nav.workers': 'Ouvriers',
    'nav.missions': 'Missions',
    'nav.attendance': 'Pointage',
    'nav.payroll': 'Paie',
    'nav.reports': 'Rapports',
    'nav.messages': 'Messages',
    'nav.settings': 'Paramètres',
    'nav.profile': 'Profil',
    'nav.reminders': 'Rappels',
    'nav.analytics': 'Analytique',
    'nav.reliability': 'Fiabilité',
    'nav.missionsMap': 'Carte missions',
    'nav.annualReview': 'Bilan annuel',
    'nav.guide': 'Guide',
    'nav.logout': 'Déconnexion',

    // Common
    'common.search': 'Rechercher',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.loading': 'Chargement...',
    'common.noData': 'Aucune donnée',
  },
  en: {
    // Settings
    'settings.title': 'Settings',
    'settings.company': 'Company Information',
    'settings.logo': 'Company Logo',
    'settings.noLogo': 'No logo',
    'settings.chooseFile': 'Choose file',
    'settings.companyName': 'Company Name',
    'settings.email': 'Email',
    'settings.phone': 'Phone',
    'settings.address': 'Address',
    'settings.description': 'Company Description',
    'settings.descriptionHint': 'optional',
    'settings.descriptionPlaceholder': 'Brief description of your business (appears on your invoices and quotes)',
    'settings.banking': 'Banking Information',
    'settings.bankName': 'Bank',
    'settings.bankNamePlaceholder': 'Bank name',
    'settings.billing': 'Billing',
    'settings.defaultTax': 'Default Tax (%)',
    'settings.currency': 'Currency',
    'settings.save': 'Save',
    'settings.saved': 'Settings saved',
    'settings.logoUpdated': 'Logo updated',
    'settings.logoTooLarge': 'File is too large (max 2 MB)',
    'settings.appearance': 'Appearance & Language',
    'settings.theme': 'Theme',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.themeSystem': 'System',
    'settings.language': 'Language',

    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.documents': 'Documents',
    'nav.clients': 'Clients',
    'nav.teams': 'Teams',
    'nav.workers': 'Workers',
    'nav.missions': 'Missions',
    'nav.attendance': 'Attendance',
    'nav.payroll': 'Payroll',
    'nav.reports': 'Reports',
    'nav.messages': 'Messages',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.reminders': 'Reminders',
    'nav.analytics': 'Analytics',
    'nav.reliability': 'Reliability',
    'nav.missionsMap': 'Missions Map',
    'nav.annualReview': 'Annual Review',
    'nav.guide': 'Guide',
    'nav.logout': 'Logout',

    // Common
    'common.search': 'Search',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
  },
};

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
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
