import { Monitor, Smartphone, Globe, Sparkles, Wifi, Clock } from 'lucide-react';

const points = [
  { icon: Monitor, text: 'Fonctionne sur ordinateur, tablette et mobile' },
  { icon: Globe, text: 'Adapté aux réalités des entreprises africaines' },
  { icon: Sparkles, text: 'Interface intuitive, aucune formation requise' },
  { icon: Clock, text: 'Opérationnel en moins de 5 minutes' },
];

export default function SimplicitySection() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Simple à utiliser, puissant à l'intérieur
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Pas besoin d'être un expert en technologie. SpeedWork est conçu pour être utilisé 
          par n'importe qui, dès le premier jour.
        </p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
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
