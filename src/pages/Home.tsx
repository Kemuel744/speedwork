import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText, Users, BarChart3, Download, Shield, Zap, ArrowRight, Check,
  Globe, Bell, Calculator, TrendingUp, Smartphone, Lock, Cloud, Repeat
} from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import speedworkLogo from '@/assets/logo.png';
import promoHero from '@/assets/promo-hero.png';
import promoComparison from '@/assets/promo-comparison.png';
import mockupInvoice from '@/assets/mockup-invoice.png';
import mockupQuote from '@/assets/mockup-quote.png';

const features = [
  { icon: FileText, title: 'Générateur de factures professionnel', desc: 'Créez des factures personnalisées PDF au format A4 avec numérotation automatique et calcul TVA intégré.' },
  { icon: Repeat, title: 'Création de devis automatique', desc: 'Générez vos devis en quelques clics et convertissez-les en facture instantanément.' },
  { icon: Users, title: 'Gestion clients simplifiée', desc: 'Centralisez vos contacts, suivez l\'historique et les montants facturés par client.' },
  { icon: BarChart3, title: 'Dashboard financier intelligent', desc: 'Tableau de bord analytique avec suivi des revenus, factures impayées et statistiques en temps réel.' },
  { icon: Bell, title: 'Automatisation des relances', desc: 'Détection automatique des factures en retard avec relances email paramétrables et assistant IA.' },
  { icon: Globe, title: 'Facturation en Franc CFA (XAF)', desc: 'Support natif du FCFA avec convertisseur de devises et taux de change actualisés.' },
  { icon: Calculator, title: 'Bilan annuel automatique', desc: 'Système intelligent de reporting avec analyse IA des revenus, tendances et synthèse clients.' },
  { icon: Shield, title: 'SaaS sécurisé', desc: 'Authentification sécurisée, base de données cloud et protection avancée de vos données.' },
];

const premiumBenefits = [
  'Automatisation avancée de la facturation',
  'Optimisation des revenus et performance financière',
  'Gestion digitale premium de vos documents',
  'Plateforme innovante nouvelle génération',
  'Application web responsive sur tous vos appareils',
  'Interface moderne UI/UX intuitive',
];

const testimonials = [
  { name: 'Aminata D.', role: 'Gérante, Boutique Mode – Brazzaville', text: 'SpeedWork m\'a fait gagner un temps fou. Mes factures sont professionnelles et prêtes en 2 minutes. Un vrai outil de pilotage financier !' },
  { name: 'Patrick M.', role: 'Directeur, BTP Services – Congo', text: 'Enfin une solution digitale adaptée aux entreprises africaines. La facturation en Franc CFA et l\'export PDF sont parfaits.' },
  { name: 'Chantal K.', role: 'Freelance IT – Afrique centrale', text: 'Simple, efficace, abordable. L\'outil idéal pour la facturation freelance. Je recommande à tous les indépendants.' },
];

const sectors = [
  'BTP & Construction', 'Commerce & Retail', 'Informatique & Tech',
  'Freelances & Consultants', 'Services & Prestations', 'Micro-entreprises'
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Logiciel de Facturation en Ligne – Factures & Devis Pro"
        description="SpeedWork : logiciel de facturation en ligne et application de gestion de devis pour PME et freelances en Afrique. Générateur de factures professionnel, dashboard financier intelligent, facturation en Franc CFA. Essai gratuit."
        path="/"
      />
      <PublicNavbar />

      {/* Hero – Core Keywords */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Plateforme de facturation cloud • SaaS B2B
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
                Le logiciel de facturation en ligne{' '}
                <span className="text-primary">nouvelle génération</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Solution professionnelle de gestion de factures, devis et clients. Générateur de factures professionnel avec dashboard financier intelligent. Conçu pour les entrepreneurs, PME et freelances en Afrique.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Button size="lg" asChild className="h-13 px-8 text-base font-semibold">
                  <Link to="/tarifs">
                    Essayer gratuitement
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base">
                  <Link to="/fonctionnalites">Découvrir les fonctionnalités</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Essai gratuit 3 jours • Aucune carte requise • Facturation en Franc CFA
              </p>
            </div>
            <div className="relative hidden lg:block">
              <img
                src={promoHero}
                alt="SpeedWork – Logiciel de facturation en ligne pour PME et freelances en Afrique"
                className="w-full rounded-2xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by – Geo Keywords */}
      <section className="border-y border-border/50 bg-secondary/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Solution digitale utilisée par des entrepreneurs et PME à travers l'Afrique centrale
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground/60">
            {sectors.map((s) => (
              <span key={s} className="text-sm font-semibold tracking-wider uppercase">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Document mockups – Freelance & PME Keywords */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Factures personnalisées PDF & devis professionnels
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Génération PDF A4 avec votre identité de marque. Conversion devis en facture en un clic. L'outil de facturation freelance et PME par excellence.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card p-4 hover:shadow-xl transition-all duration-300">
              <img
                src={mockupInvoice}
                alt="Générateur de factures professionnel – Export PDF A4"
                className="w-full rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
              <div className="mt-4 text-center">
                <h3 className="font-semibold text-foreground text-lg">Facture professionnelle</h3>
                <p className="text-sm text-muted-foreground mt-1">Numérotation automatique, calcul TVA et retenue à la source</p>
              </div>
            </div>
            <div className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card p-4 hover:shadow-xl transition-all duration-300">
              <img
                src={mockupQuote}
                alt="Application de gestion de devis – Création automatique"
                className="w-full rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
              <div className="mt-4 text-center">
                <h3 className="font-semibold text-foreground text-lg">Devis élégant</h3>
                <p className="text-sm text-muted-foreground mt-1">Création de devis automatique, convertible en facture</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid – Core + Tech Keywords */}
      <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Gestion financière PME complète et intelligente
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Un outil de comptabilité simplifiée avec automatisation avancée pour piloter votre activité.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border/60 bg-card p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-base">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/fonctionnalites">
                Toutes les fonctionnalités
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison – Business & Startup Keywords */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Transformation numérique de votre{' '}
                <span className="text-primary">gestion administrative</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Fini les factures manuscrites. Passez à la digitalisation des PME avec une startup fintech africaine qui comprend vos besoins. Gestion intelligente des revenus et productivité entrepreneuriale au rendez-vous.
              </p>
              <ul className="mt-8 space-y-4">
                {premiumBenefits.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" asChild className="mt-8 h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div>
              <img
                src={promoComparison}
                alt="Digitalisation des PME – Avant/après avec SpeedWork"
                className="w-full rounded-2xl shadow-xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/30 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Démarrez en 3 étapes simples</h2>
            <p className="mt-4 text-lg text-muted-foreground">Solution de gestion administrative rapide et intuitive</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Créez votre compte', desc: 'Inscription rapide et accès immédiat à votre plateforme de facturation cloud.' },
              { step: '2', title: 'Ajoutez vos clients', desc: 'Gestion clients simplifiée : renseignez les coordonnées une seule fois.' },
              { step: '3', title: 'Facturez & pilotez', desc: 'Créez vos factures, suivez les paiements clients et consultez votre dashboard financier.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials – Geo Keywords */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Des entrepreneurs africains nous font confiance
            </h2>
            <p className="mt-4 text-muted-foreground">Innovation technologique au service de la productivité entrepreneuriale</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Prêt à digitaliser votre gestion financière ?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Rejoignez des centaines d'entrepreneurs qui utilisent notre logiciel de facturation en ligne pour optimiser leurs revenus et leur productivité.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={speedworkLogo} alt="SpeedWork – Logiciel de facturation au Congo" className="h-6 w-auto" />
              <span className="font-semibold text-foreground">SpeedWork</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</Link>
              <Link to="/tarifs" className="hover:text-foreground transition-colors">Tarifs</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Connexion</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2025 SpeedWork. Startup technologique congolaise.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
