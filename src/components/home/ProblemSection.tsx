import { AlertTriangle } from 'lucide-react';

const problems = [
  'Des calculs manuels sur Excel ou sur papier ?',
  'Des équipes sur le terrain sans suivi en temps réel ?',
  'Des factures et paiements mal organisés ?',
  'Aucune visibilité sur la productivité de vos employés ?',
  'Des retards et absences non détectés ?',
  'Pas de bilan financier clair en fin d\'année ?',
];

export default function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30 border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Vous reconnaissez ces problèmes ?
        </h2>
        <ul className="mt-10 grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {problems.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-5">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <span className="text-foreground font-medium text-sm">{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-lg text-primary font-semibold">
          👉 SpeedWork résout tout ça dans une seule plateforme simple et puissante.
        </p>
      </div>
    </section>
  );
}
