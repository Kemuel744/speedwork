import { Monitor, Globe, Sparkles, Clock } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SimplicitySection() {
  const { t } = useLanguage();

  const points = [
    { icon: Monitor, text: t('simplicity.1') },
    { icon: Globe, text: t('simplicity.2') },
    { icon: Sparkles, text: t('simplicity.3') },
    { icon: Clock, text: t('simplicity.4') },
  ];

  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('simplicity.title')}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {t('simplicity.subtitle')}
          </p>
        </ScrollReveal>
        <StaggerContainer className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {points.map((p) => (
            <StaggerItem key={p.text}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col items-center gap-4 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <p.icon className="w-6 h-6" />
                </div>
                <p className="text-foreground font-medium text-sm">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
