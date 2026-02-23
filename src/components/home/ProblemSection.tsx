import { AlertTriangle } from 'lucide-react';

const problems = [
  'Des calculs manuels sur Excel ?',
  'Des factures mal organisées ?',
  'Des paiements non suivis ?',
  'Une gestion floue de vos revenus et dépenses ?',
];

export default function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Vous perdez encore du temps avec :
        </h2>
        <ul className="mt-10 grid sm:grid-cols-2 gap-5 text-left max-w-2xl mx-auto">
          {problems.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-5">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <span className="text-foreground font-medium">{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-lg text-primary font-semibold">
          👉 SpeedWork centralise tout dans une seule plateforme simple et intuitive.
        </p>
      </div>
    </section>
  );
}
