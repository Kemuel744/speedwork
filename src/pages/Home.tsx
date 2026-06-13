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
const InventoryExpressSection = lazyWithRetry(() => import('@/components/home/InventoryExpressSection'));
const InventoryBenefitsSection = lazyWithRetry(() => import('@/components/home/InventoryBenefitsSection'));
const OfflineSyncSection = lazyWithRetry(() => import('@/components/home/OfflineSyncSection'));
const ReportsShowcaseSection = lazyWithRetry(() => import('@/components/home/ReportsShowcaseSection'));
const SocialProofSection = lazyWithRetry(() => import('@/components/home/SocialProofSection'));
const PositioningSection = lazyWithRetry(() => import('@/components/home/PositioningSection'));
const ScrollReveal = lazyWithRetry(() => import('@/components/home/ScrollReveal'));

const SectionFallback = () => <div className="py-20" />;

export default function Home() {
  const { t } = useLanguage();
  useAdSense();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SpeedWork – Solution d'inventaire et de gestion de stock pour commerces africains"
        description="Effectuez vos inventaires en quelques minutes, détectez automatiquement les écarts de stock et gardez le contrôle total de votre commerce. Conçu pour boutiques, dépôts et pharmacies en Afrique."
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
                "text": "SpeedWork est la solution d'inventaire intelligent et de gestion de stock conçue pour les commerces africains : boutiques, alimentations, dépôts, pharmacies, quincailleries et grossistes."
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
              "name": "Comment SpeedWork aide à réduire les pertes de stock ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SpeedWork compare automatiquement le stock théorique au stock réel après chaque inventaire, identifie les produits manquants, en surplus ou périmés, et génère un rapport PDF signé pour la traçabilité."
              }
            }
          ]
        }}
      />
      <PublicNavbar />

      <HeroSection />

      <Suspense fallback={<SectionFallback />}>
        <ProblemSection />
        <InventoryExpressSection />
        <InventoryBenefitsSection />
        <OfflineSyncSection />
        <ReportsShowcaseSection />
        <SocialProofSection />
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
                  <Link to="/inventaire">
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
