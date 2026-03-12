import { Clock, ShieldCheck, Award, Eye, TrendingUp, Smartphone, Zap } from 'lucide-react';

const benefits = [
  { icon: Clock, title: 'Gain de temps', text: 'Automatisez la facturation, la paie et les rapports' },
  { icon: ShieldCheck, title: 'Zéro erreur', text: 'Calculs automatiques, plus de fautes manuelles' },
  { icon: Award, title: 'Image pro', text: 'Documents PDF au rendu professionnel' },
  { icon: Eye, title: 'Visibilité totale', text: 'Dashboard financier et carte temps réel' },
  { icon: TrendingUp, title: 'Performance', text: 'Scores de fiabilité et analytics avancés' },
  { icon: Smartphone, title: 'Mobile-first', text: 'Accessible partout, même sur le terrain' },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Ce que vous gagnez avec SpeedWork
        </h2>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <b.icon className="w-7 h-7" />
              </div>
              <p className="text-foreground font-bold text-sm">{b.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
