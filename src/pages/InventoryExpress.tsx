import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardCheck, Zap, ScanLine, FileText, Signature } from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import HeroDashboardMockup from '@/components/home/HeroDashboardMockup';
import InventoryExpressSection from '@/components/home/InventoryExpressSection';
import ReportsShowcaseSection from '@/components/home/ReportsShowcaseSection';

export default function InventoryExpress() {
  const steps = [
    { icon: ScanLine, title: '1. Scannez ou comptez', text: 'Parcourez votre boutique et scannez chaque produit avec votre smartphone, ou saisissez la quantité réelle.' },
    { icon: ClipboardCheck, title: '2. Comparez', text: 'SpeedWork compare automatiquement vos quantités au stock théorique et identifie chaque écart.' },
    { icon: FileText, title: '3. Validez & signez', text: "Générez le rapport PDF, signez-le et conservez l'historique pour la traçabilité." },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Inventaire Express – Solution d'inventaire intelligent pour commerces africains"
        description="Effectuez vos inventaires en quelques minutes, détectez les écarts de stock, les vols et les ruptures. Inventaire physique rapide, rapports PDF, signature et historique."
        path="/inventaire"
      />
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Zap className="w-4 h-4" />
              Inventaire Express
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
              Maîtrisez votre stock.{' '}
              <span className="text-primary">Réduisez vos pertes.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              La solution d'inventaire intelligent conçue pour les boutiques, dépôts, pharmacies et
              grossistes en Afrique. Comptez, comparez, validez — en quelques minutes.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="h-13 px-8 text-base font-semibold w-full sm:w-auto">
                <Link to="/tarifs">
                  Démarrer un inventaire gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 px-8 text-base w-full sm:w-auto">
                <Link to="/contact">Demander une démo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ Essai gratuit 3 jours · ✓ Aucune carte requise · ✓ Franc CFA natif
            </p>
          </div>
          <div>
            <HeroDashboardMockup />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 sm:py-20 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Trois étapes pour un inventaire fiable
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {steps.map((s) => (
              <div key={s.title} className="rounded-2xl bg-card border border-border/60 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InventoryExpressSection />
      <ReportsShowcaseSection />

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Signature className="w-10 h-10 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Découvrez aujourd'hui les produits qui disparaissent dans votre commerce.
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Ne perdez plus d'argent à cause des écarts de stock. Commencez votre premier inventaire avec
            SpeedWork.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                Essayer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}