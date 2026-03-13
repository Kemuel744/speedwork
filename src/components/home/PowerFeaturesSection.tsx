import { Link } from 'react-router-dom';
import {
  FileText, Users, MapPin, BarChart3, Shield, Clock,
  Calculator, Bell, Globe,
} from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PowerFeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: FileText, titleKey: 'power.f1.title', descKey: 'power.f1.desc', color: 'text-blue-600 bg-blue-500/10', link: '/fonctionnalites' },
    { icon: Users, titleKey: 'power.f2.title', descKey: 'power.f2.desc', color: 'text-emerald-600 bg-emerald-500/10', link: '/fonctionnalites' },
    { icon: MapPin, titleKey: 'power.f3.title', descKey: 'power.f3.desc', color: 'text-orange-600 bg-orange-500/10', link: '/fonctionnalites' },
    { icon: Clock, titleKey: 'power.f4.title', descKey: 'power.f4.desc', color: 'text-violet-600 bg-violet-500/10', link: '/fonctionnalites' },
    { icon: BarChart3, titleKey: 'power.f5.title', descKey: 'power.f5.desc', color: 'text-pink-600 bg-pink-500/10', link: '/fonctionnalites' },
    { icon: Shield, titleKey: 'power.f6.title', descKey: 'power.f6.desc', color: 'text-amber-600 bg-amber-500/10', link: '/fonctionnalites' },
    { icon: Calculator, titleKey: 'power.f7.title', descKey: 'power.f7.desc', color: 'text-cyan-600 bg-cyan-500/10', link: '/fonctionnalites' },
    { icon: Bell, titleKey: 'power.f8.title', descKey: 'power.f8.desc', color: 'text-red-600 bg-red-500/10', link: '/fonctionnalites' },
    { icon: Globe, titleKey: 'power.f9.title', descKey: 'power.f9.desc', color: 'text-teal-600 bg-teal-500/10', link: '/fonctionnalites' },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('power.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('power.subtitle')}
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.08}>
          {features.map((f) => (
            <StaggerItem key={f.titleKey}>
              <Link
                to={f.link}
                className="group rounded-2xl border border-border/60 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 block h-full"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {t(f.titleKey)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(f.descKey)}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
