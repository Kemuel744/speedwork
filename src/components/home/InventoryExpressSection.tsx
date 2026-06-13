import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  TrendingDown,
  PackageMinus,
  PackagePlus,
  FileText,
  History,
  Signature,
  ArrowRight,
  Zap,
} from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Comptage physique rapide',
    text: 'Comptez facilement tous les produits présents en magasin, depuis votre smartphone.',
  },
  {
    icon: TrendingDown,
    title: 'Écart automatique',
    text: 'Comparez automatiquement le stock théorique au stock réellement compté.',
  },
  {
    icon: PackageMinus,
    title: 'Produits manquants',
    text: "Identifiez immédiatement les produits disparus, volés ou mal saisis.",
  },
  {
    icon: PackagePlus,
    title: 'Produits en surplus',
    text: 'Détectez les erreurs de saisie, les retours non enregistrés et les excédents.',
  },
  {
    icon: FileText,
    title: 'Rapport PDF',
    text: "Générez un rapport d'inventaire professionnel, prêt à imprimer ou à partager.",
  },
  {
    icon: History,
    title: 'Historique des inventaires',
    text: 'Retrouvez tous les inventaires précédents et suivez vos écarts dans le temps.',
  },
  {
    icon: Signature,
    title: 'Signature du responsable',
    text: 'Validez et tracez chaque inventaire avec une signature et un horodatage.',
  },
];

export default function InventoryExpressSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-5">
              <Zap className="w-4 h-4" />
              INVENTAIRE EXPRESS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Le moyen le plus rapide de réaliser vos inventaires
              <span className="text-primary"> et de détecter les pertes</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Comptez, comparez, validez. SpeedWork transforme l'inventaire en une opération de quelques
              minutes — même avec des milliers de références.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-13 px-8 text-base font-semibold w-full sm:w-auto">
                <Link to="/inventaire">
                  Lancer un inventaire
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 px-8 text-base w-full sm:w-auto">
                <Link to="/fonctionnalites">Voir une démonstration</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group h-full rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}