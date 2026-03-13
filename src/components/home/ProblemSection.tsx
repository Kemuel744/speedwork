import { AlertTriangle } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProblemSection() {
  const { t } = useLanguage();

  const problems = [
    t('problem.1'), t('problem.2'), t('problem.3'),
    t('problem.4'), t('problem.5'), t('problem.6'),
  ];

  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('problem.title')}
          </h2>
        </ScrollReveal>
        <StaggerContainer className="mt-10 grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {problems.map((p) => (
            <StaggerItem key={p}>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-5">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <span className="text-foreground font-medium text-sm">{p}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <ScrollReveal delay={0.3}>
          <p className="mt-10 text-lg text-primary font-semibold">
            {t('problem.cta')}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
