import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText, Users, BarChart3, Shield, Zap, ArrowRight,
  Globe, Bell, Calculator, Repeat
} from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import HeroSection from '@/components/home/HeroSection';
import SocialProofSection from '@/components/home/SocialProofSection';
import WhySpeedWorkSection from '@/components/home/WhySpeedWorkSection';
import mockupInvoice from '@/assets/mockup-invoice.png';
import mockupQuote from '@/assets/mockup-quote.png';

const features = [
  { icon: FileText, title: 'Factures PDF professionnelles', desc: 'Génération automatique au format A4 avec numérotation, calcul TVA et retenue à la source.' },
  { icon: Repeat, title: 'Devis convertibles en 1 clic', desc: 'Créez vos devis en quelques clics et transformez-les en facture instantanément.' },
  { icon: Users, title: 'Gestion clients centralisée', desc: 'Centralisez contacts, historique et montants facturés par client.' },
  { icon: BarChart3, title: 'Dashboard financier intelligent', desc: 'Suivi des revenus, factures impayées et statistiques en temps réel.' },
  { icon: Bell, title: 'Relances automatiques', desc: 'Détection des retards avec relances email et assistant IA intégré.' },
  { icon: Globe, title: 'Facturation en Franc CFA', desc: 'Support natif XAF/XOF avec convertisseur et taux de change actualisés.' },
  { icon: Calculator, title: 'Bilan annuel par IA', desc: 'Analyse automatique des revenus, tendances et recommandations.' },
  { icon: Shield, title: 'Sécurité cloud', desc: 'Authentification sécurisée et protection avancée de vos données.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Logiciel de Facturation en Ligne – Devis & Factures Pro"
        description="SpeedWork : logiciel de facturation en ligne pour PME, freelances et entrepreneurs en Afrique. Créez devis et factures PDF en 1 clic, pilotez vos revenus. Essai gratuit."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Qu'est-ce que SpeedWork ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SpeedWork est un logiciel de facturation en ligne conçu pour les PME, freelances et entrepreneurs en Afrique. Il permet de créer des factures et devis professionnels en PDF, de gérer ses clients et de suivre ses revenus via un dashboard financier intelligent."
              }
            },
            {
              "@type": "Question",
              "name": "SpeedWork supporte-t-il le Franc CFA (XAF) ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Oui, SpeedWork offre un support natif du Franc CFA (XAF) avec un convertisseur de devises intégré et des taux de change actualisés."
              }
            },
            {
              "@type": "Question",
              "name": "Comment créer une facture avec SpeedWork ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Créez votre compte gratuitement, ajoutez vos clients, puis générez vos factures en quelques clics avec numérotation automatique, calcul de TVA et export PDF."
              }
            },
            {
              "@type": "Question",
              "name": "SpeedWork est-il gratuit ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SpeedWork propose un essai gratuit de 3 jours sans carte bancaire. Des abonnements sont disponibles à partir de 3 000 FCFA/mois."
              }
            },
            {
              "@type": "Question",
              "name": "SpeedWork fonctionne-t-il sur mobile ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Oui, SpeedWork est une application web responsive qui fonctionne sur tous les appareils sans installation."
              }
            }
          ]
        }}
      />
      <PublicNavbar />

      {/* Hero */}
      <HeroSection />

      {/* Social Proof - Stats + Testimonials */}
      <SocialProofSection />

      {/* Document Mockups */}
      <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Factures & devis au rendu professionnel
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Vos documents PDF A4 sont générés avec votre logo, vos couleurs et vos coordonnées. Prêts à envoyer à vos clients.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="group rounded-2xl overflow-hidden border border-border/60 bg-card p-4 hover:shadow-xl transition-all duration-300">
              <img
                src={mockupInvoice}
                alt="Générateur de factures professionnel – Export PDF A4"
                className="w-full rounded-lg group-hover:scale-[1.02] transition-transform duration-300 aspect-[3/4]"
                width={768}
                height={1024}
                loading="lazy"
              />
              <div className="mt-4 text-center">
                <h3 className="font-semibold text-foreground text-lg">Facture professionnelle</h3>
                <p className="text-sm text-muted-foreground mt-1">Numérotation automatique, calcul TVA et retenue à la source</p>
              </div>
            </div>
            <div className="group rounded-2xl overflow-hidden border border-border/60 bg-card p-4 hover:shadow-xl transition-all duration-300">
              <img
                src={mockupQuote}
                alt="Application de gestion de devis – Création automatique"
                className="w-full rounded-lg group-hover:scale-[1.02] transition-transform duration-300 aspect-[3/4]"
                width={768}
                height={1024}
                loading="lazy"
              />
              <div className="mt-4 text-center">
                <h3 className="font-semibold text-foreground text-lg">Devis élégant</h3>
                <p className="text-sm text-muted-foreground mt-1">Conversion en facture en 1 clic</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Tout ce qu'il faut pour piloter votre activité
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Un outil complet de gestion financière avec automatisation avancée.
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

      {/* Why SpeedWork - Comparison */}
      <WhySpeedWorkSection />

      {/* How it works */}
      <section className="py-20 bg-secondary/30 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Démarrez en 3 étapes simples</h2>
            <p className="mt-4 text-lg text-muted-foreground">Commencez à facturer en moins de 5 minutes</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Créez votre compte', desc: 'Inscription gratuite, accès immédiat à votre espace.' },
              { step: '2', title: 'Ajoutez vos clients', desc: 'Renseignez les coordonnées une seule fois.' },
              { step: '3', title: 'Facturez & pilotez', desc: 'Créez vos documents et suivez vos revenus en temps réel.' },
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

      {/* Final CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Rejoignez des centaines d'entrepreneurs africains qui utilisent SpeedWork pour créer leurs documents professionnels et piloter leur activité.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                Essayer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/60">
            3 jours gratuits • Sans engagement • Aucune carte requise
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
