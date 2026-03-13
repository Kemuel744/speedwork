import { Clock, ShieldCheck, Award, Eye, TrendingUp, Smartphone } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BenefitsSection() {
  const { t } = useLanguage();

  const benefits = [
    { icon: Clock, title: t('benefits.b1.title'), text: t('benefits.b1.text') },
    { icon: ShieldCheck, title: t('benefits.b2.title'), text: t('benefits.b2.text') },
    { icon: Award, title: t('benefits.b3.title'), text: t('benefits.b3.text') },
    { icon: Eye, title: t('benefits.b4.title'), text: t('benefits.b4.text') },
    { icon: TrendingUp, title: t('benefits.b5.title'), text: t('benefits.b5.text') },
    { icon: Smartphone, title: t('benefits.b6.title'), text: t('benefits.b6.text') },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('benefits.title')}
          </h2>
        </ScrollReveal>
        <StaggerContainer className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 h-full">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <b.icon className="w-7 h-7" />
                </div>
                <p className="text-foreground font-bold text-sm">{b.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{b.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
