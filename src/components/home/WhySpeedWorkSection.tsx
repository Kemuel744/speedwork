import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import promoComparison from '@/assets/promo-comparison.webp';

const benefits = [
  'Fini les factures manuscrites et les erreurs de calcul',
  'Vos devis se convertissent en facture en 1 clic',
  'Dashboard avec revenus, impayés et tendances en temps réel',
  'Bilans annuels générés automatiquement par IA',
  'Application responsive, accessible partout sur mobile',
  'Support natif du Franc CFA (XAF) et multi-devises',
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
              SpeedWork est la solution conçue pour les réalités du marché africain. 
              Remplacez les cahiers et les tableurs par une plateforme professionnelle qui travaille pour vous.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
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
