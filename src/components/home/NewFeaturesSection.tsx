import { Link } from 'react-router-dom';
import {
  Sparkles, Globe, PiggyBank, Building2, CreditCard, Gift,
  ScanLine, Brain, MessagesSquare, ArrowRight,
} from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function NewFeaturesSection() {
  const { t } = useLanguage();

  const items = [
    { icon: Globe, titleKey: 'newFeat.marketplace.title', descKey: 'newFeat.marketplace.desc', color: 'text-indigo-600 bg-indigo-500/10' },
    { icon: PiggyBank, titleKey: 'newFeat.savings.title', descKey: 'newFeat.savings.desc', color: 'text-emerald-600 bg-emerald-500/10' },
    { icon: Building2, titleKey: 'newFeat.multidepot.title', descKey: 'newFeat.multidepot.desc', color: 'text-blue-600 bg-blue-500/10' },
    { icon: CreditCard, titleKey: 'newFeat.credits.title', descKey: 'newFeat.credits.desc', color: 'text-amber-600 bg-amber-500/10' },
    { icon: Gift, titleKey: 'newFeat.loyalty.title', descKey: 'newFeat.loyalty.desc', color: 'text-pink-600 bg-pink-500/10' },
    { icon: ScanLine, titleKey: 'newFeat.scanner.title', descKey: 'newFeat.scanner.desc', color: 'text-violet-600 bg-violet-500/10' },
    { icon: Brain, titleKey: 'newFeat.ai.title', descKey: 'newFeat.ai.desc', color: 'text-fuchsia-600 bg-fuchsia-500/10' },
    { icon: MessagesSquare, titleKey: 'newFeat.messages.title', descKey: 'newFeat.messages.desc', color: 'text-teal-600 bg-teal-500/10' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-secondary/30 via-background to-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t('newFeat.badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('newFeat.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('newFeat.subtitle')}
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" stagger={0.06}>
          {items.map((f) => (
            <StaggerItem key={f.titleKey}>
              <div className="group relative rounded-2xl border border-border/60 bg-card p-5 sm:p-6 h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {t('newFeat.newBadge')}
                </span>
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {t(f.titleKey)}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(f.descKey)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-12 text-center">
          <Button size="lg" asChild className="h-12 px-8 text-base font-semibold">
            <Link to="/fonctionnalites">
              {t('newFeat.cta')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
