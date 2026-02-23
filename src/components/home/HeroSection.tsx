import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import promoHero from '@/assets/promo-hero.webp';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
              Le logiciel de facturation simple et puissant pour les{' '}
              <span className="text-primary">PME et freelances en Afrique</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Créez vos devis et factures en quelques clics, suivez vos paiements, 
              gérez vos clients et visualisez vos performances — sans calculatrice et sans complexité.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" asChild className="h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base">
                <Link to="/fonctionnalites">Voir comment ça fonctionne</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ Essai gratuit 3 jours · ✓ Aucune carte requise · ✓ Franc CFA natif
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
