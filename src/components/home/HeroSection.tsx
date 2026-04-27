import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store, Package, QrCode, BarChart3, Wifi, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import promoHero from '@/assets/promo-hero-final.png';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  const badges = [
    { icon: Store, label: t('hero.badgePOS') },
    { icon: Package, label: t('hero.badgeStock') },
    { icon: QrCode, label: t('hero.badgeQR') },
    { icon: BarChart3, label: t('hero.badgeStats') },
    { icon: Wifi, label: t('hero.badgeOffline') },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28 relative">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              {t('hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
              {t('hero.title1')}{' '}
              <span className="text-primary">{t('hero.title2')}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <motion.span
                  key={b.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                  className="inline-flex items-center gap-1.5 bg-secondary text-foreground rounded-full px-3 py-1.5 text-xs font-medium border border-border/50"
                >
                  <b.icon className="w-3.5 h-3.5 text-primary" />
                  {b.label}
                </motion.span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" asChild className="h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  {t('hero.tryFree')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base">
                <Link to="/fonctionnalites">{t('hero.discoverFeatures')}</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('hero.trialInfo')}
            </p>
          </motion.div>
          <motion.div
            className="relative hidden md:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <img
              src={promoHero}
              alt="SpeedWork – Logiciel de gestion de boutique, dépôt et pharmacie en Afrique"
              className="w-full rounded-2xl shadow-2xl object-cover aspect-[4/5] md:aspect-[3/4] lg:aspect-[2/3]"
              width={560}
              height={840}
              fetchPriority="high"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
