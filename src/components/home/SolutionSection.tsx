import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';

const solutions = [
  'Création de devis et factures PDF professionnels',
  'Gestion complète des équipes et travailleurs',
  'Missions géolocalisées avec carte interactive',
  'Pointage de présence avec preuves photo',
  'Analyse de productivité et rendement par équipe',
  'Scores de fiabilité calculés automatiquement',
  'Paie automatique avec primes et pénalités',
  'Bilans financiers générés par intelligence artificielle',
];

export default function SolutionSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Tout votre business, au même endroit
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Remplacez vos 10 outils différents par une seule plateforme qui centralise 
            toute la gestion de votre entreprise.
          </p>
        </ScrollReveal>
        <StaggerContainer className="mt-10 grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {solutions.map((s) => (
            <StaggerItem key={s}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-foreground font-medium text-sm">{s}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <ScrollReveal delay={0.2}>
          <Button size="lg" asChild className="mt-10 h-13 px-8 text-base font-semibold">
            <Link to="/fonctionnalites">
              Voir toutes les fonctionnalités
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
