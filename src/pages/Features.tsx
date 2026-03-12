import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText, FileCheck, Users, Download, BarChart3, Shield,
  Bell, Repeat, Calculator, ArrowRight, Zap, Globe, Lock,
  Smartphone, TrendingUp, Cloud
} from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import promoRevolution from '@/assets/promo-revolution.png';
import PublicFooter from '@/components/PublicFooter';
import mockupInvoice from '@/assets/mockup-invoice.png';
import mockupQuote from '@/assets/mockup-quote.png';

const categories = [
  {
    title: 'Générateur de factures professionnel',
    icon: FileText,
    features: [
      'Génération PDF automatique au format A4',
      'Logo personnalisé et positionnement flexible',
      'Numérotation automatique des factures',
      'Calcul automatique TVA et retenue à la source',
      'Téléchargement et impression instantanés',
      'Statuts : Brouillon, En attente, Payée, Impayée',
    ],
  },
  {
    title: 'Création de devis automatique',
    icon: FileCheck,
    features: [
      'Création rapide avec les mêmes outils que la facture',
      'Conversion devis → facture en 1 clic',
      'Suivi des statuts (Accepté, Refusé, En attente)',
      'Date d\'expiration configurable',
      'Export PDF identique aux factures',
    ],
  },
  {
    title: 'Gestion d\'équipes & RH',
    icon: Users,
    features: [
      'Création d\'équipes dynamiques par chantier ou projet',
      'Assignation de chef d\'équipe avec rôle dédié',
      'Géolocalisation des équipes sur carte interactive',
      'Gestion des membres : ajout, retrait, transfert',
      'Suivi du statut des équipes (Active, En pause, Terminée)',
    ],
  },
  {
    title: 'Missions terrain géolocalisées',
    icon: MapPin,
    features: [
      'Création de missions avec localisation GPS précise',
      'Assignation à un travailleur ou une équipe entière',
      'Carte interactive avec marqueurs colorés par statut',
      'Suivi en temps réel de l\'avancement des missions',
      'Gestion des priorités (Haute, Moyenne, Basse)',
      'Historique complet des missions par travailleur',
    ],
  },
  {
    title: 'Pointage & Présence intelligent',
    icon: Clock,
    features: [
      'Check-in/check-out avec validation GPS (< 500m)',
      'Détection automatique des retards et absences',
      'Preuves photo de travail (avant/après)',
      'Historique de présence par travailleur',
      'Gestion des pauses et heures supplémentaires',
    ],
  },
  {
    title: 'Analyse de productivité',
    icon: TrendingUp,
    features: [
      'Dashboard KPI : missions terminées, taux de présence',
      'Graphiques interactifs d\'évolution par période',
      'Rendement par équipe et par travailleur',
      'Carte de productivité géographique',
      'Export des rapports analytiques',
    ],
  },
  {
    title: 'Scores de fiabilité des travailleurs',
    icon: Shield,
    features: [
      'Score automatique basé sur 4 critères pondérés',
      'Ponctualité (30%), Missions (25%), Qualité (20%), Présence (25%)',
      'Classement et notation (A+ à F) de chaque travailleur',
      'Filtrage par période (1, 3, 6 ou 12 mois)',
      'Identification des top performers et travailleurs à surveiller',
    ],
  },
  {
    title: 'Calcul de paie automatique',
    icon: Calculator,
    features: [
      'Calcul du salaire basé sur les jours/heures travaillés',
      'Primes de mission et de performance automatiques',
      'Pénalités retard et absence intégrées',
      'Fiche de paie détaillée par travailleur',
      'Export et historique mensuel complet',
    ],
  },
  {
    title: 'Gestion clients simplifiée',
    icon: Users,
    features: [
      'Fiche client complète (nom, email, téléphone, adresse)',
      'Historique complet des documents par client',
      'Suivi des paiements clients et montants facturés',
      'Recherche et filtrage rapide',
    ],
  },
  {
    title: 'Dashboard financier intelligent',
    icon: BarChart3,
    features: [
      'Chiffre d\'affaires mensuel en graphique analytique',
      'Suivi des factures payées et impayées en temps réel',
      'Gestion des dépenses et gains centralisée',
      'Convertisseur de devises intégré',
    ],
  },
  {
    title: 'Automatisation des relances',
    icon: Bell,
    features: [
      'Détection automatique des factures en retard',
      'Relances email paramétrables',
      'Historique des relances envoyées',
      'Assistant IA pour rédiger les messages',
    ],
  },
  {
    title: 'Facturation en Franc CFA (XAF)',
    icon: Globe,
    features: [
      'Support natif du FCFA (XOF/XAF)',
      'Convertisseur de devises en temps réel',
      'Taux de change actualisés automatiquement',
      'Solution adaptée au marché africain',
    ],
  },
  {
    title: 'Bilan annuel automatique par IA',
    icon: Calculator,
    features: [
      'Génération d\'un bilan complet par intelligence artificielle',
      'Analyse des tendances de revenus et performance financière',
      'Détail mensuel : factures émises, encaissées, taux de recouvrement',
      'Recommandations IA pour l\'optimisation des revenus',
    ],
  },
  {
    title: 'Rapports d\'intervention terrain',
    icon: FileText,
    features: [
      'Documentation complète des activités de terrain',
      'Capture de photos avec légendes individuelles',
      'Génération PDF professionnelle avec identité visuelle',
      'Suivi des observations et recommandations par intervention',
    ],
  },
];

const techHighlights = [
  { icon: Cloud, label: 'Plateforme de facturation cloud' },
  { icon: Smartphone, label: 'Application web responsive' },
  { icon: Lock, label: 'SaaS sécurisé' },
  { icon: TrendingUp, label: 'Logiciel de gestion scalable' },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Fonctionnalités – Logiciel de Facturation & Gestion de Devis"
        description="Découvrez les fonctionnalités de SpeedWork : générateur de factures professionnel, création de devis automatique, dashboard financier intelligent, automatisation des relances, gestion clients simplifiée. Solution SaaS pour PME et freelances en Afrique."
        path="/fonctionnalites"
      />
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                SaaS de facturation • Gestion intelligente
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                Des outils <span className="text-primary">puissants</span> pour la gestion financière PME
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Outil de comptabilité simplifiée avec automatisation avancée. Tout ce qu'il faut pour gérer votre facturation, vos devis et vos clients de manière professionnelle.
              </p>
              <Button size="lg" asChild className="mt-8 h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="hidden lg:block">
              <img
                src={promoRevolution}
                alt="SpeedWork – Innovation technologique en Afrique, logiciel de facturation"
                className="w-full rounded-2xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tech highlights bar */}
      <section className="border-b border-border/50 bg-secondary/30 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {techHighlights.map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <t.icon className="w-4 h-4 text-primary" />
                <span className="font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document showcase */}
      <section className="py-16 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Factures personnalisées PDF & devis professionnels
            </h2>
            <p className="mt-2 text-muted-foreground">
              Génération PDF A4 au rendu professionnel, prêts à envoyer à vos clients
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-3 shadow-lg">
              <img src={mockupInvoice} alt="Facture professionnelle PDF – Logiciel de facturation en ligne" className="w-full rounded-lg" loading="lazy" />
              <p className="text-center text-sm font-medium text-foreground mt-3 mb-1">Facture professionnelle</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-3 shadow-lg">
              <img src={mockupQuote} alt="Devis professionnel – Application de gestion de devis" className="w-full rounded-lg" loading="lazy" />
              <p className="text-center text-sm font-medium text-foreground mt-3 mb-1">Devis professionnel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Toutes les fonctionnalités pour votre productivité entrepreneuriale
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Solution de gestion administrative complète : de la création de devis à l'automatisation des factures, en passant par le suivi des paiements clients.
            </p>
          </div>
          <div className="space-y-16">
            {categories.map((cat, i) => (
              <div
                key={cat.title}
                className={`flex flex-col lg:flex-row gap-8 items-start ${
                  i % 2 !== 0 ? 'lg:flex-row-reverse' : ''
                }`}
              >
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
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold">Prêt à optimiser votre gestion financière ?</h2>
          <p className="mt-3 text-primary-foreground/80">
            Essayez gratuitement pendant 3 jours. Logiciel de facturation au Congo, solution digitale en Afrique centrale.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8 h-13 px-8 text-base font-semibold">
            <Link to="/tarifs">
              Voir les tarifs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
