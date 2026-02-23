import { Monitor, Smartphone, Globe, Sparkles } from 'lucide-react';

const points = [
  { icon: Monitor, text: 'Fonctionne sur ordinateur et mobile' },
  { icon: Globe, text: 'Adapté aux réalités des PME africaines' },
  { icon: Sparkles, text: 'Interface simple, sans jargon compliqué' },
];

export default function SimplicitySection() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Conçu pour l'Afrique
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-6">
          {points.map((p) => (
            <div key={p.text} className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <p.icon className="w-6 h-6" />
              </div>
              <p className="text-foreground font-medium text-sm">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
