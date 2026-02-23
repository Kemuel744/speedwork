import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import promoHero from '@/assets/promo-hero.webp';

const painPoints = [
  'Créez devis & factures PDF en 1 clic',
  'Suivi automatique des paiements clients',
  'Bilans & rapports générés par IA',
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              +500 entrepreneurs nous font confiance
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
              Gérez devis, factures et rapports{' '}
              <span className="text-primary">sans prise de tête</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              SpeedWork remplace vos cahiers, calculatrices et fichiers Excel. 
              PME, freelances et entrepreneurs en Afrique créent leurs documents professionnels 
              en moins de 2 minutes — et pilotent leur activité en temps réel.
            </p>

            <ul className="mt-6 space-y-3">
              {painPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" asChild className="h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  Créer mon premier devis gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base">
                <Link to="/fonctionnalites">Voir les fonctionnalités</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ Essai gratuit 3 jours &nbsp;·&nbsp; ✓ Aucune carte requise &nbsp;·&nbsp; ✓ Franc CFA natif
            </p>
          </div>
          <div className="relative hidden lg:block">
            <img
              src={promoHero}
              alt="SpeedWork – Logiciel de facturation en ligne pour PME et freelances en Afrique"
              className="w-full rounded-2xl shadow-2xl aspect-[2/3]"
              width={1024}
              height={1536}
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
