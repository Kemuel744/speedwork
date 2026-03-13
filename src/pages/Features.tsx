import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText, FileCheck, Users, BarChart3, Shield,
  Bell, Calculator, ArrowRight, Zap, Globe, Lock,
  Smartphone, TrendingUp, Cloud, MapPin, Clock
} from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import promoRevolution from '@/assets/promo-revolution.png';
import PublicFooter from '@/components/PublicFooter';
import mockupInvoice from '@/assets/mockup-invoice.png';
import mockupQuote from '@/assets/mockup-quote.png';
import { motion } from 'framer-motion';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/home/ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Features() {
  const { t, language } = useLanguage();

  const categories = language === 'en' ? [
    { title: 'Professional Invoice Generator', icon: FileText, features: ['Automatic A4 PDF generation', 'Custom logo with flexible positioning', 'Auto-numbering of invoices', 'Automatic VAT and withholding calculation', 'Instant download and print', 'Statuses: Draft, Pending, Paid, Unpaid'] },
    { title: 'Automatic Quote Creation', icon: FileCheck, features: ['Quick creation with same tools as invoices', 'Quote → Invoice conversion in 1 click', 'Status tracking (Accepted, Rejected, Pending)', 'Configurable expiry date', 'Same PDF export as invoices'] },
    { title: 'Team & HR Management', icon: Users, features: ['Dynamic teams by project or site', 'Team leader assignment with dedicated role', 'Team geolocation on interactive map', 'Member management: add, remove, transfer', 'Team status tracking (Active, Paused, Completed)'] },
    { title: 'Geolocated Field Missions', icon: MapPin, features: ['Mission creation with precise GPS location', 'Assignment to worker or entire team', 'Interactive map with color-coded status markers', 'Real-time mission progress tracking', 'Priority management (High, Medium, Low)', 'Complete mission history per worker'] },
    { title: 'Smart Attendance & Tracking', icon: Clock, features: ['GPS-validated check-in/check-out (< 500m)', 'Automatic delay and absence detection', 'Photo proof of work (before/after)', 'Attendance history per worker', 'Break and overtime management'] },
    { title: 'Productivity Analysis', icon: TrendingUp, features: ['KPI dashboard: completed missions, attendance rate', 'Interactive performance charts by period', 'Team and worker performance metrics', 'Geographic productivity map', 'Analytical report export'] },
    { title: 'Worker Reliability Scores', icon: Shield, features: ['Automatic score based on 4 weighted criteria', 'Punctuality (30%), Missions (25%), Quality (20%), Attendance (25%)', 'Ranking and grading (A+ to F) per worker', 'Period filtering (1, 3, 6 or 12 months)', 'Top performers and at-risk workers identification'] },
    { title: 'Automatic Payroll Calculation', icon: Calculator, features: ['Salary calculation based on days/hours worked', 'Automatic mission and performance bonuses', 'Integrated delay and absence penalties', 'Detailed payslip per worker', 'Complete monthly export and history'] },
    { title: 'Simplified Client Management', icon: Users, features: ['Complete client profile (name, email, phone, address)', 'Full document history per client', 'Client payment tracking and invoiced amounts', 'Quick search and filtering'] },
    { title: 'Smart Financial Dashboard', icon: BarChart3, features: ['Monthly revenue analytics chart', 'Real-time paid and unpaid invoice tracking', 'Centralized expense and income management', 'Built-in currency converter'] },
    { title: 'Automated Reminders', icon: Bell, features: ['Automatic detection of overdue invoices', 'Configurable email reminders', 'Sent reminders history', 'AI assistant for drafting messages'] },
    { title: 'CFA Franc Invoicing (XAF)', icon: Globe, features: ['Native FCFA support (XOF/XAF)', 'Real-time currency converter', 'Automatically updated exchange rates', 'Solution adapted to African market'] },
    { title: 'AI Annual Review', icon: Calculator, features: ['AI-generated comprehensive review', 'Revenue and financial performance trend analysis', 'Monthly detail: invoices issued, collected, collection rate', 'AI recommendations for revenue optimization'] },
    { title: 'Field Intervention Reports', icon: FileText, features: ['Complete field activity documentation', 'Photo capture with individual captions', 'Professional PDF generation with branding', 'Observations and recommendations tracking per intervention'] },
  ] : [
    { title: 'Générateur de factures professionnel', icon: FileText, features: ['Génération PDF automatique au format A4', 'Logo personnalisé et positionnement flexible', 'Numérotation automatique des factures', 'Calcul automatique TVA et retenue à la source', 'Téléchargement et impression instantanés', 'Statuts : Brouillon, En attente, Payée, Impayée'] },
    { title: 'Création de devis automatique', icon: FileCheck, features: ['Création rapide avec les mêmes outils que la facture', 'Conversion devis → facture en 1 clic', 'Suivi des statuts (Accepté, Refusé, En attente)', 'Date d\'expiration configurable', 'Export PDF identique aux factures'] },
    { title: 'Gestion d\'équipes & RH', icon: Users, features: ['Création d\'équipes dynamiques par chantier ou projet', 'Assignation de chef d\'équipe avec rôle dédié', 'Géolocalisation des équipes sur carte interactive', 'Gestion des membres : ajout, retrait, transfert', 'Suivi du statut des équipes (Active, En pause, Terminée)'] },
    { title: 'Missions terrain géolocalisées', icon: MapPin, features: ['Création de missions avec localisation GPS précise', 'Assignation à un travailleur ou une équipe entière', 'Carte interactive avec marqueurs colorés par statut', 'Suivi en temps réel de l\'avancement des missions', 'Gestion des priorités (Haute, Moyenne, Basse)', 'Historique complet des missions par travailleur'] },
    { title: 'Pointage & Présence intelligent', icon: Clock, features: ['Check-in/check-out avec validation GPS (< 500m)', 'Détection automatique des retards et absences', 'Preuves photo de travail (avant/après)', 'Historique de présence par travailleur', 'Gestion des pauses et heures supplémentaires'] },
    { title: 'Analyse de productivité', icon: TrendingUp, features: ['Dashboard KPI : missions terminées, taux de présence', 'Graphiques interactifs d\'évolution par période', 'Rendement par équipe et par travailleur', 'Carte de productivité géographique', 'Export des rapports analytiques'] },
    { title: 'Scores de fiabilité des travailleurs', icon: Shield, features: ['Score automatique basé sur 4 critères pondérés', 'Ponctualité (30%), Missions (25%), Qualité (20%), Présence (25%)', 'Classement et notation (A+ à F) de chaque travailleur', 'Filtrage par période (1, 3, 6 ou 12 mois)', 'Identification des top performers et travailleurs à surveiller'] },
    { title: 'Calcul de paie automatique', icon: Calculator, features: ['Calcul du salaire basé sur les jours/heures travaillés', 'Primes de mission et de performance automatiques', 'Pénalités retard et absence intégrées', 'Fiche de paie détaillée par travailleur', 'Export et historique mensuel complet'] },
    { title: 'Gestion clients simplifiée', icon: Users, features: ['Fiche client complète (nom, email, téléphone, adresse)', 'Historique complet des documents par client', 'Suivi des paiements clients et montants facturés', 'Recherche et filtrage rapide'] },
    { title: 'Dashboard financier intelligent', icon: BarChart3, features: ['Chiffre d\'affaires mensuel en graphique analytique', 'Suivi des factures payées et impayées en temps réel', 'Gestion des dépenses et gains centralisée', 'Convertisseur de devises intégré'] },
    { title: 'Automatisation des relances', icon: Bell, features: ['Détection automatique des factures en retard', 'Relances email paramétrables', 'Historique des relances envoyées', 'Assistant IA pour rédiger les messages'] },
    { title: 'Facturation en Franc CFA (XAF)', icon: Globe, features: ['Support natif du FCFA (XOF/XAF)', 'Convertisseur de devises en temps réel', 'Taux de change actualisés automatiquement', 'Solution adaptée au marché africain'] },
    { title: 'Bilan annuel automatique par IA', icon: Calculator, features: ['Génération d\'un bilan complet par intelligence artificielle', 'Analyse des tendances de revenus et performance financière', 'Détail mensuel : factures émises, encaissées, taux de recouvrement', 'Recommandations IA pour l\'optimisation des revenus'] },
    { title: 'Rapports d\'intervention terrain', icon: FileText, features: ['Documentation complète des activités de terrain', 'Capture de photos avec légendes individuelles', 'Génération PDF professionnelle avec identité visuelle', 'Suivi des observations et recommandations par intervention'] },
  ];

  const techHighlights = [
    { icon: Cloud, label: t('features.techCloud') },
    { icon: Smartphone, label: t('features.techMobile') },
    { icon: Lock, label: t('features.techSecure') },
    { icon: TrendingUp, label: t('features.techScalable') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Fonctionnalités – Logiciel de Facturation & Gestion de Devis"
        description="Découvrez les fonctionnalités de SpeedWork : générateur de factures professionnel, création de devis automatique, dashboard financier intelligent."
        path="/fonctionnalites"
      />
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                {t('features.heroBadge')}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                {t('features.heroTitle1')} <span className="text-primary">{t('features.heroTitle2')}</span> {t('features.heroTitle3')}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                {t('features.heroSubtitle')}
              </p>
              <Button size="lg" asChild className="mt-8 h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  {t('features.heroCta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              <img
                src={promoRevolution}
                alt="SpeedWork – Innovation technologique en Afrique"
                className="w-full rounded-2xl shadow-2xl"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech highlights bar */}
      <section className="border-b border-border/50 bg-secondary/30 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <StaggerContainer className="flex flex-wrap items-center justify-center gap-8" stagger={0.08}>
            {techHighlights.map((th) => (
              <StaggerItem key={th.label}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <th.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{th.label}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Document showcase */}
      <section className="py-16 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('features.docShowcaseTitle')}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t('features.docShowcaseSubtitle')}
            </p>
          </ScrollReveal>
          <StaggerContainer className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <StaggerItem>
              <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-3 shadow-lg">
                <img src={mockupInvoice} alt={t('features.invoiceLabel')} className="w-full rounded-lg" loading="lazy" />
                <p className="text-center text-sm font-medium text-foreground mt-3 mb-1">{t('features.invoiceLabel')}</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-3 shadow-lg">
                <img src={mockupQuote} alt={t('features.quoteLabel')} className="w-full rounded-lg" loading="lazy" />
                <p className="text-center text-sm font-medium text-foreground mt-3 mb-1">{t('features.quoteLabel')}</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t('features.allTitle')}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {t('features.allSubtitle')}
            </p>
          </ScrollReveal>
          <div className="space-y-16">
            {categories.map((cat, i) => (
              <ScrollReveal key={cat.title} direction={i % 2 === 0 ? "left" : "right"}>
                <div className={`flex flex-col lg:flex-row gap-8 items-start ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="lg:w-1/3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <cat.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{cat.title}</h3>
                  </div>
                  <div className="lg:w-2/3">
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {cat.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal>
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold">{t('features.ctaTitle')}</h2>
            <p className="mt-3 text-primary-foreground/80">
              {t('features.ctaSubtitle')}
            </p>
            <Button size="lg" variant="secondary" asChild className="mt-8 h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                {t('features.ctaButton')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      <PublicFooter />
    </div>
  );
}
