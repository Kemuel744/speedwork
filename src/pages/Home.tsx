import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import HeroSection from '@/components/home/HeroSection';
import ProblemSection from '@/components/home/ProblemSection';
import SolutionSection from '@/components/home/SolutionSection';
import SocialProofSection from '@/components/home/SocialProofSection';
import SimplicitySection from '@/components/home/SimplicitySection';
import BenefitsSection from '@/components/home/BenefitsSection';
import PositioningSection from '@/components/home/PositioningSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Logiciel de facturation pour PME en Afrique | Devis et Factures en ligne"
        description="Gérez vos devis, factures et paiements facilement avec SpeedWork. Solution simple et rapide pour PME et freelances en Afrique."
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
                "text": "SpeedWork est un logiciel de facturation en ligne conçu pour les PME, freelances et entrepreneurs en Afrique. Il permet de créer des factures et devis professionnels en PDF, de gérer ses clients et de suivre ses revenus."
              }
            },
            {
              "@type": "Question",
              "name": "SpeedWork est-il gratuit ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SpeedWork propose un essai gratuit de 3 jours sans carte bancaire. Des abonnements sont disponibles à partir de 3 000 FCFA/mois."
              }
            }
          ]
        }}
      />
      <PublicNavbar />

      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <SocialProofSection />
      <SimplicitySection />
      <BenefitsSection />
      <PositioningSection />

      {/* CTA Final */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Prêt à simplifier votre gestion ?
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                Créer mon compte gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/login">Commencer dès maintenant</Link>
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
