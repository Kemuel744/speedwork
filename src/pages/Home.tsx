import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import HeroSection from '@/components/home/HeroSection';
import { useLanguage } from '@/contexts/LanguageContext';

// Lazy-load below-fold sections to reduce initial JS
const ProblemSection = lazy(() => import('@/components/home/ProblemSection'));
const PowerFeaturesSection = lazy(() => import('@/components/home/PowerFeaturesSection'));
const SolutionSection = lazy(() => import('@/components/home/SolutionSection'));
const SocialProofSection = lazy(() => import('@/components/home/SocialProofSection'));
const SimplicitySection = lazy(() => import('@/components/home/SimplicitySection'));
const BenefitsSection = lazy(() => import('@/components/home/BenefitsSection'));
const PositioningSection = lazy(() => import('@/components/home/PositioningSection'));
const WhySpeedWorkSection = lazy(() => import('@/components/home/WhySpeedWorkSection'));
const ScrollReveal = lazy(() => import('@/components/home/ScrollReveal'));

const SectionFallback = () => <div className="py-20" />;

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SpeedWork – Gestion d'entreprise tout-en-un pour PME en Afrique"
        description="Facturation, gestion d'équipes, missions terrain, analyse de productivité et scores de fiabilité. La plateforme complète pour piloter votre entreprise en Afrique."
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
                "text": "SpeedWork est une plateforme de gestion d'entreprise tout-en-un pour les PME en Afrique. Elle permet de gérer la facturation, les équipes, les missions terrain, le pointage, la productivité et les scores de fiabilité des travailleurs."
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
              "name": "Quelles fonctionnalités propose SpeedWork ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SpeedWork propose 9 modules : facturation et devis, gestion d'équipes, missions terrain géolocalisées, pointage de présence, analyse de productivité, scores de fiabilité, paie automatique, bilans IA et relances automatiques."
              }
            }
          ]
        }}
      />
      <PublicNavbar />

      <HeroSection />

      <Suspense fallback={<SectionFallback />}>
        <ProblemSection />
        <PowerFeaturesSection />
        <SolutionSection />
        <SocialProofSection />
        <WhySpeedWorkSection />
        <SimplicitySection />
        <BenefitsSection />
        <PositioningSection />

        {/* CTA Final */}
        <ScrollReveal>
          <section className="py-20 bg-primary text-primary-foreground">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {t('homeCta.title')}
              </h2>
              <p className="mt-4 text-primary-foreground/80 text-lg">
                {t('homeCta.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
                  <Link to="/tarifs">
                    {t('homeCta.button')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 px-6 sm:px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/login">{t('homeCta.login')}</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/60">
                {t('homeCta.trial')}
              </p>
            </div>
          </section>
        </ScrollReveal>
      </Suspense>

      <PublicFooter />
    </div>
  );
}
