import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import promoComparison from '@/assets/promo-comparison.webp';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WhySpeedWorkSection() {
  const { t } = useLanguage();

  const benefits = [
    t('why.1'), t('why.2'), t('why.3'), t('why.4'),
    t('why.5'), t('why.6'), t('why.7'), t('why.8'),
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <ScrollReveal direction="left">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t('why.title1')}{' '}
              <span className="text-primary">{t('why.title2')}</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('why.subtitle')}
            </p>
            <ul className="mt-8 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="mt-8 h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                {t('why.cta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.15}>
            <img
              src={promoComparison}
              alt="Digitalisation des commerces – Avant/après avec SpeedWork"
              className="w-full rounded-2xl shadow-xl object-cover aspect-[4/5] md:aspect-[3/4] lg:aspect-[2/3]"
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
