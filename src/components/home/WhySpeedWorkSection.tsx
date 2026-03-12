import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import promoComparison from '@/assets/promo-comparison.webp';

const benefits = [
  'Fini les factures manuscrites et les erreurs de calcul',
  'Vos devis se convertissent en facture en 1 clic',
  'Dashboard avec revenus, impayés et tendances en temps réel',
  'Carte interactive des missions et équipes terrain',
  'Scores de fiabilité et analyse de productivité automatiques',
  'Paie calculée avec primes, retards et absences',
  'Bilans annuels générés par intelligence artificielle',
  'Application responsive, accessible partout sur mobile',
];

export default function WhySpeedWorkSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Passez de la gestion manuelle à la{' '}
              <span className="text-primary">digitalisation complète</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              SpeedWork est la plateforme tout-en-un conçue pour les réalités du marché africain. 
              Remplacez les cahiers, tableurs et WhatsApp par un outil professionnel qui travaille pour vous.
            </p>
            <ul className="mt-8 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="mt-8 h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                Tester SpeedWork maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <div>
            <img
              src={promoComparison}
              alt="Digitalisation des PME – Avant/après avec SpeedWork"
              className="w-full rounded-2xl shadow-xl aspect-[2/3]"
              width={1024}
              height={1536}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
