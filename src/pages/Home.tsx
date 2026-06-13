import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { useAdSense } from '@/hooks/useAdSense';
import AdSenseSlot from '@/components/blog/AdSenseSlot';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import HeroSection from '@/components/home/HeroSection';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Wraps a dynamic import so that a stale-chunk failure (common after a deploy
 * or HMR rebuild) triggers exactly one full reload instead of a blank screen.
 */
function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = '__lovable_chunk_reloaded__';
      if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        // Return a never-resolving promise to keep Suspense up until reload.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

const ProblemSection = lazyWithRetry(() => import('@/components/home/ProblemSection'));
const PowerFeaturesSection = lazyWithRetry(() => import('@/components/home/PowerFeaturesSection'));
const SolutionSection = lazyWithRetry(() => import('@/components/home/SolutionSection'));
const SocialProofSection = lazyWithRetry(() => import('@/components/home/SocialProofSection'));
const SimplicitySection = lazyWithRetry(() => import('@/components/home/SimplicitySection'));
const BenefitsSection = lazyWithRetry(() => import('@/components/home/BenefitsSection'));
const PositioningSection = lazyWithRetry(() => import('@/components/home/PositioningSection'));
const WhySpeedWorkSection = lazyWithRetry(() => import('@/components/home/WhySpeedWorkSection'));
const ScrollReveal = lazyWithRetry(() => import('@/components/home/ScrollReveal'));

const SectionFallback = () => <div className="py-20" />;

export default function Home() {
  const { t } = useLanguage();
  useAdSense();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SpeedWork – Logiciel de gestion pour boutiques, dépôts et pharmacies en Afrique"
        description="Caisse POS, gestion de stock, scanner QR, reçus professionnels et mode hors ligne. Le logiciel simple et puissant pour gérer votre boutique ou pharmacie en Afrique."
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
                "text": "SpeedWork est un logiciel de gestion de boutique tout-en-un pour les commerces, dépôts et pharmacies en Afrique. Il permet de gérer les ventes (POS), le stock, les codes QR et les reçus professionnels."
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
                "text": "SpeedWork propose une caisse POS complète, la gestion de stock avec alertes, le scanner de codes QR, la génération de reçus professionnels, l'historique des ventes, les statistiques et le mode hors ligne."
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

      <AdSenseSlot slot="home-bottom" className="mt-6" />
      <PublicFooter />
    </div>
  );
}
