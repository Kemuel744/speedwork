import { Clock, ShieldCheck, Award, Eye, TrendingUp } from 'lucide-react';

const benefits = [
  { icon: Clock, text: 'Plus de temps' },
  { icon: ShieldCheck, text: "Moins d'erreurs" },
  { icon: Award, text: 'Une image professionnelle' },
  { icon: Eye, text: 'Une vision claire de vos finances' },
  { icon: TrendingUp, text: 'Une croissance maîtrisée' },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Ce que vous gagnez
        </h2>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {benefits.map((b) => (
            <div key={b.text} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <b.icon className="w-7 h-7" />
              </div>
              <p className="text-foreground font-semibold text-sm">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
