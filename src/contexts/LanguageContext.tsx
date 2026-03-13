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
    'nav.workers': 'Travailleurs',
    'nav.missions': 'Missions',
    'nav.attendance': 'Pointage',
    'nav.payroll': 'Salaires',
    'nav.reports': 'Rapports',
    'nav.messages': 'Messagerie',
    'nav.settings': 'Paramètres',
    'nav.profile': 'Profil',
    'nav.reminders': 'Relances',
    'nav.analytics': 'Analytics',
    'nav.reliability': 'Fiabilité',
    'nav.missionsMap': 'Carte missions',
    'nav.annualReview': 'Bilan Annuel',
    'nav.guide': 'Guide',
    'nav.logout': 'Déconnexion',
    'nav.principal': 'Principal',
    'nav.terrain': 'Terrain',
    'nav.performance': 'Performance',
    'nav.communication': 'Communication',
    'nav.administration': 'Administration',
    'nav.tasksProofs': 'Tâches & Preuves',
    'nav.productivity': 'Productivité',
    'nav.clientMgmt': 'Gestion Clients',
    'nav.subscriptions': 'Abonnements',
    'nav.blog': 'Blog',
    'nav.mySpace': 'Mon espace',
    'nav.myDashboard': 'Mon Dashboard',
    'nav.myTeam': 'Mon Équipe',

    // Common
    'common.search': 'Rechercher',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.loading': 'Chargement...',
    'common.noData': 'Aucune donnée',
    'common.save': 'Enregistrer',
    'common.back': 'Retour',
    'common.actions': 'Actions',
    'common.status': 'Statut',
    'common.date': 'Date',
    'common.total': 'Total',
    'common.name': 'Nom',
    'common.print': 'Imprimer',
    'common.download': 'Télécharger PDF',
    'common.duplicate': 'Dupliquer',
    'common.confirm': 'Confirmer',

    // Statuses
    'status.paid': 'Payée',
    'status.unpaid': 'Impayée',
    'status.pending': 'En attente',
    'status.draft': 'Brouillon',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': "Vue d'ensemble de votre activité",
    'dashboard.invoices': 'Factures',
    'dashboard.quotes': 'Devis',
    'dashboard.revenue': 'Revenus',
    'dashboard.totalCollected': 'Total encaissé',
    'dashboard.unpaid': 'Impayées',
    'dashboard.unpaidCount': '{count} impayée(s)',
    'dashboard.invoiceCount': '{count} facture(s)',
    'dashboard.monthlyRevenue': 'Revenus mensuels',
    'dashboard.recentDocs': 'Derniers documents',
    'dashboard.newInvoice': 'Facture',
    'dashboard.newQuote': 'Devis',

    // Documents
    'documents.title': 'Tous les documents',
    'documents.invoicesTitle': 'Factures',
    'documents.quotesTitle': 'Devis',
    'documents.newInvoice': 'Nouvelle facture',
    'documents.newQuote': 'Nouveau devis',
    'documents.searchPlaceholder': 'Rechercher par nom ou numéro...',
    'documents.oldest': 'Plus ancien',
    'documents.newest': 'Plus récent',
    'documents.allClients': 'Tous les clients',
    'documents.noDocuments': 'Aucun document trouvé',
    'documents.number': 'Numéro',
    'documents.client': 'Client',
    'documents.deleteTitle': 'Supprimer ce document ?',
    'documents.deleteDesc': 'Cette action est irréversible.',
    'documents.duplicated': 'Document dupliqué',
    'documents.deleted': 'Document supprimé',
    'documents.sendEmail': 'Envoyer par email',
    'documents.sendWhatsApp': 'Envoyer par WhatsApp',
    'documents.linkError': 'Erreur lors de la génération du lien',

    // Clients
    'clients.title': 'Clients',
    'clients.count': '{count} client(s) au total',
    'clients.noClients': 'Aucun client trouvé. Créez une facture ou un devis pour ajouter un client.',
    'clients.invoiceCount': '{count} facture(s)',
    'clients.quoteCount': '{count} devis',
    'clients.totalCollected': 'Total encaissé',
    'clients.totalDue': 'Total dû',

    // Profile
    'profile.title': 'Mon Profil',
    'profile.name': 'Nom',
    'profile.email': 'Email',
    'profile.phone': 'Téléphone',
    'profile.address': 'Adresse',
    'profile.saved': 'Profil mis à jour',

    // Document Detail
    'docDetail.convert': 'Convertir en facture',
    'docDetail.remind': 'Relancer',
    'docDetail.sending': 'Envoi...',
    'docDetail.email': 'Email',
    'docDetail.whatsapp': 'WhatsApp',
    'docDetail.pdf': 'PDF',
    'docDetail.print': 'Imprimer',
    'docDetail.edit': 'Modifier',
    'docDetail.notFound': 'Document non trouvé',
    'docDetail.reminderHistory': 'Historique des relances',
    'docDetail.auto': 'Automatique',
    'docDetail.manual': 'Manuelle',
    'docDetail.reminderSent': 'Relance envoyée avec succès',
    'docDetail.reminderError': "Erreur lors de l'envoi de la relance",
    'docDetail.convertedSuccess': 'Devis converti en facture',
    'docDetail.convertError': 'Erreur lors de la conversion',
    'docDetail.invoice': 'Facture',
    'docDetail.quote': 'Devis',

    // Shared Document
    'shared.loading': 'Chargement du document...',
    'shared.notFound': 'Document introuvable',
    'shared.invalidLink': 'Ce lien de partage est invalide ou a expiré.',
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
    'nav.principal': 'Main',
    'nav.terrain': 'Field',
    'nav.performance': 'Performance',
    'nav.communication': 'Communication',
    'nav.administration': 'Administration',
    'nav.tasksProofs': 'Tasks & Proofs',
    'nav.productivity': 'Productivity',
    'nav.clientMgmt': 'Client Management',
    'nav.subscriptions': 'Subscriptions',
    'nav.blog': 'Blog',
    'nav.mySpace': 'My Space',
    'nav.myDashboard': 'My Dashboard',
    'nav.myTeam': 'My Team',

    // Common
    'common.search': 'Search',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.save': 'Save',
    'common.back': 'Back',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.total': 'Total',
    'common.name': 'Name',
    'common.print': 'Print',
    'common.download': 'Download PDF',
    'common.duplicate': 'Duplicate',
    'common.confirm': 'Confirm',

    // Statuses
    'status.paid': 'Paid',
    'status.unpaid': 'Unpaid',
    'status.pending': 'Pending',
    'status.draft': 'Draft',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Overview of your activity',
    'dashboard.invoices': 'Invoices',
    'dashboard.quotes': 'Quotes',
    'dashboard.revenue': 'Revenue',
    'dashboard.totalCollected': 'Total collected',
    'dashboard.unpaid': 'Unpaid',
    'dashboard.unpaidCount': '{count} unpaid',
    'dashboard.invoiceCount': '{count} invoice(s)',
    'dashboard.monthlyRevenue': 'Monthly Revenue',
    'dashboard.recentDocs': 'Recent Documents',
    'dashboard.newInvoice': 'Invoice',
    'dashboard.newQuote': 'Quote',

    // Documents
    'documents.title': 'All Documents',
    'documents.invoicesTitle': 'Invoices',
    'documents.quotesTitle': 'Quotes',
    'documents.newInvoice': 'New Invoice',
    'documents.newQuote': 'New Quote',
    'documents.searchPlaceholder': 'Search by name or number...',
    'documents.oldest': 'Oldest',
    'documents.newest': 'Newest',
    'documents.allClients': 'All clients',
    'documents.noDocuments': 'No documents found',
    'documents.number': 'Number',
    'documents.client': 'Client',
    'documents.deleteTitle': 'Delete this document?',
    'documents.deleteDesc': 'This action cannot be undone.',
    'documents.duplicated': 'Document duplicated',
    'documents.deleted': 'Document deleted',
    'documents.sendEmail': 'Send by email',
    'documents.sendWhatsApp': 'Send by WhatsApp',
    'documents.linkError': 'Error generating link',

    // Clients
    'clients.title': 'Clients',
    'clients.count': '{count} client(s) total',
    'clients.noClients': 'No clients found. Create an invoice or quote to add a client.',
    'clients.invoiceCount': '{count} invoice(s)',
    'clients.quoteCount': '{count} quote(s)',
    'clients.totalCollected': 'Total collected',
    'clients.totalDue': 'Total due',

    // Profile
    'profile.title': 'My Profile',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.address': 'Address',
    'profile.saved': 'Profile updated',

    // Document Detail
    'docDetail.convert': 'Convert to invoice',
    'docDetail.remind': 'Send reminder',
    'docDetail.sending': 'Sending...',
    'docDetail.email': 'Email',
    'docDetail.whatsapp': 'WhatsApp',
    'docDetail.pdf': 'PDF',
    'docDetail.print': 'Print',
    'docDetail.edit': 'Edit',
    'docDetail.notFound': 'Document not found',
    'docDetail.reminderHistory': 'Reminder History',
    'docDetail.auto': 'Automatic',
    'docDetail.manual': 'Manual',
    'docDetail.reminderSent': 'Reminder sent successfully',
    'docDetail.reminderError': 'Error sending reminder',
    'docDetail.convertedSuccess': 'Quote converted to invoice',
    'docDetail.convertError': 'Error during conversion',
    'docDetail.invoice': 'Invoice',
    'docDetail.quote': 'Quote',

    // Shared Document
    'shared.loading': 'Loading document...',
    'shared.notFound': 'Document not found',
    'shared.invalidLink': 'This share link is invalid or has expired.',
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
