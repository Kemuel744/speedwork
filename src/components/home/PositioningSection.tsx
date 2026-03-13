import { Smartphone, Globe, Zap, Lock } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PositioningSection() {
  const { t } = useLanguage();

  const points = [
    { icon: Globe, label: t('positioning.1'), desc: t('positioning.1d') },
    { icon: Smartphone, label: t('positioning.2'), desc: t('positioning.2d') },
    { icon: Zap, label: t('positioning.3'), desc: t('positioning.3d') },
    { icon: Lock, label: t('positioning.4'), desc: t('positioning.4d') },
  ];

  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('positioning.title')}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t('positioning.subtitle')}
          </p>
        </ScrollReveal>
        <StaggerContainer className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {points.map((p) => (
            <StaggerItem key={p.label}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <p.icon className="w-6 h-6" />
                </div>
                <p className="text-foreground font-semibold text-sm">{p.label}</p>
                <p className="text-muted-foreground text-xs">{p.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
