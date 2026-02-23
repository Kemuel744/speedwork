import { Check } from 'lucide-react';

const solutions = [
  'Création rapide de devis professionnels',
  'Conversion automatique devis → facture',
  'Calcul automatique des totaux',
  'Suivi des paiements en temps réel',
  'Gestion des clients et historique',
  'Rapports journaliers, mensuels et annuels',
];

export default function SolutionSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Tout votre business, au même endroit
        </h2>
        <ul className="mt-10 grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {solutions.map((s) => (
            <li key={s} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-foreground font-medium">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
