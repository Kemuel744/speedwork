import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText, FileCheck, Users, Download, BarChart3, Shield,
  Bell, Repeat, Calculator, ArrowRight, Zap, Globe
} from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import promoRevolution from '@/assets/promo-revolution.png';
import mockupInvoice from '@/assets/mockup-invoice.png';
import mockupQuote from '@/assets/mockup-quote.png';

const categories = [
  {
    title: 'Facturation intelligente',
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
    title: 'Devis professionnel',
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
    title: 'Gestion des clients',
    icon: Users,
    features: [
      'Fiche client complète (nom, email, téléphone, adresse)',
      'Historique complet des documents par client',
      'Montant total facturé par client',
      'Recherche et filtrage rapide',
    ],
  },
  {
    title: 'Tableau de bord',
    icon: BarChart3,
    features: [
      'Chiffre d\'affaires mensuel en graphique',
      'Suivi des factures payées et impayées',
      'Nombre de devis et factures en temps réel',
      'Convertisseur de devises intégré',
    ],
  },
  {
    title: 'Signature & Sécurité',
    icon: Shield,
    features: [
      'Bloc de signature sur chaque document',
      'Titre du signataire personnalisable',
      'Authentification sécurisée avec vérification email',
      'Protection brute-force sur les codes d\'accès',
    ],
  },
  {
    title: 'Relances automatiques',
    icon: Bell,
    features: [
      'Détection automatique des factures en retard',
      'Relances email paramétrables',
      'Historique des relances envoyées',
      'Assistant IA pour rédiger les messages',
    ],
  },
  {
    title: 'Multi-devises',
    icon: Globe,
    features: [
      'Support natif du FCFA (XOF/XAF)',
      'Convertisseur de devises en temps réel',
      'Taux de change actualisés automatiquement',
    ],
  },
  {
    title: 'Bilan annuel',
    icon: Calculator,
    features: [
      'Rapport annuel généré par IA',
      'Analyse des revenus et tendances',
      'Synthèse des clients et documents',
      'Export et consultation rapide',
    ],
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Fonctionnalités – Facturation Professionnelle"
        description="Découvrez toutes les fonctionnalités de SpeedWork : factures, devis, gestion clients, tableau de bord, signature numérique, relances automatiques et plus."
        path="/fonctionnalites"
      />
      <PublicNavbar />

      {/* Hero with promo image */}
      <section className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                Des outils <span className="text-primary">puissants</span> et simples
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Tout ce qu'il faut pour gérer votre facturation, vos devis et vos clients de manière professionnelle.
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
                alt="SpeedWork - La révolution de la facturation" 
                className="w-full rounded-2xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Document showcase */}
      <section className="py-16 border-b border-border/50 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Aperçu de vos documents</h2>
            <p className="mt-2 text-muted-foreground">Factures et devis au rendu professionnel, prêts à envoyer à vos clients</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-3 shadow-lg">
              <img src={mockupInvoice} alt="Aperçu facture SpeedWork" className="w-full rounded-lg" loading="lazy" />
              <p className="text-center text-sm font-medium text-foreground mt-3 mb-1">Facture</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-3 shadow-lg">
              <img src={mockupQuote} alt="Aperçu devis SpeedWork" className="w-full rounded-lg" loading="lazy" />
              <p className="text-center text-sm font-medium text-foreground mt-3 mb-1">Devis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
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
                <h2 className="text-2xl font-bold text-foreground">{cat.title}</h2>
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
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold">Prêt à commencer ?</h2>
          <p className="mt-3 text-primary-foreground/80">
            Essayez gratuitement pendant 3 jours, sans engagement.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8 h-13 px-8 text-base font-semibold">
            <Link to="/tarifs">
              Voir les tarifs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}