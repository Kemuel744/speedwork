import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import { useAdSense } from '@/hooks/useAdSense';
import AdSenseSlot from '@/components/blog/AdSenseSlot';
import PublicFooter from '@/components/PublicFooter';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Lightbulb, Shield, Zap, Heart, CheckCircle2, TrendingUp, Clock, BarChart3, Users } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/home/ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function About() {
  const { t } = useLanguage();
  useAdSense();

  const values = [
    { icon: Lightbulb, title: t('about.valueInnovation'), desc: t('about.valueInnovationDesc') },
    { icon: Zap, title: t('about.valueSimplicity'), desc: t('about.valueSimplicityDesc') },
    { icon: Target, title: t('about.valueImpact'), desc: t('about.valueImpactDesc') },
    { icon: Shield, title: t('about.valueReliability'), desc: t('about.valueReliabilityDesc') },
    { icon: Heart, title: t('about.valueAccessibility'), desc: t('about.valueAccessibilityDesc') },
  ];

  const differentiators = [
    t('about.diff1'),
    t('about.diff2'),
    t('about.diff3'),
    t('about.diff4'),
    t('about.diff5'),
  ];

  const impacts = [
    { icon: Clock, label: t('about.impact1') },
    { icon: Shield, label: t('about.impact2') },
    { icon: BarChart3, label: t('about.impact3') },
    { icon: TrendingUp, label: t('about.impact4') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('about.seoTitle')}
        description={t('about.seoDesc')}
        path="/a-propos"
      />
      <PublicNavbar />

      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              {t('about.heroTitle')}
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-primary font-semibold">
              {t('about.heroSubtitle')}
            </p>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t('about.heroIntro')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Mission */}
      <ScrollReveal>
        <section className="py-16 sm:py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-primary rounded-full" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">{t('about.missionLabel')}</h2>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t('about.missionTitle')}</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{t('about.missionP1')}</p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{t('about.missionP2')}</p>
          </div>
        </section>
      </ScrollReveal>

      {/* 3. Problem */}
      <ScrollReveal>
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t('about.problemTitle')}</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{t('about.problemIntro')}</p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {[t('about.problem1'), t('about.problem2'), t('about.problem3'), t('about.problem4')].map((p, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                  <span className="text-destructive font-bold text-lg mt-0.5">.</span>
                  <p className="text-foreground">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 4. Solution */}
      <ScrollReveal>
        <section className="py-16 sm:py-20 bg-primary/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t('about.solutionTitle')}</h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{t('about.solutionP1')}</p>
            <div className="mt-8 grid sm:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: t('about.solAuto'), desc: t('about.solAutoDesc') },
                { icon: Users, title: t('about.solCentral'), desc: t('about.solCentralDesc') },
                { icon: BarChart3, title: t('about.solRealtime'), desc: t('about.solRealtimeDesc') },
              ].map((s, i) => (
                <div key={i} className="bg-background rounded-xl p-6 border border-border shadow-sm text-center">
                  <s.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 5. Vision */}
      <ScrollReveal>
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t('about.visionTitle')}</h2>
            <p className="mt-6 text-xl text-primary font-semibold">{t('about.visionStatement')}</p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">{t('about.visionP1')}</p>
          </div>
        </section>
      </ScrollReveal>

      {/* 6. Values */}
      <ScrollReveal>
        <section className="py-16 sm:py-20 bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">{t('about.valuesTitle')}</h2>
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.08}>
              {values.map((v, i) => (
                <StaggerItem key={i}>
                  <div className="bg-background rounded-xl p-6 border border-border h-full">
                    <v.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* 7. Why choose us */}
      <ScrollReveal>
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">{t('about.whyTitle')}</h2>
            <div className="space-y-4">
              {differentiators.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <p className="text-foreground text-lg">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 8. Impact */}
      <ScrollReveal>
        <section className="py-16 sm:py-20 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12">{t('about.impactTitle')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {impacts.map((imp, i) => (
                <div key={i} className="flex flex-col items-center gap-3 p-6 bg-background rounded-xl border border-border">
                  <imp.icon className="w-10 h-10 text-primary" />
                  <p className="font-semibold text-foreground text-center">{imp.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 9. CTA */}
      <ScrollReveal>
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{t('about.ctaTitle')}</h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">{t('about.ctaSubtitle')}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  {t('about.ctaButton')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">{t('about.ctaContact')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <PublicFooter />
    </div>
  );
}
