import { FileText, AlertTriangle, PackageX, TrendingUp, History } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';

const reports = [
  { icon: FileText, title: "Rapport d'inventaire PDF", text: 'Document professionnel signé, prêt à archiver ou à présenter à votre comptable.' },
  { icon: AlertTriangle, title: 'Rapport des écarts', text: 'Liste détaillée de tous les produits manquants ou en surplus, avec valeur en FCFA.' },
  { icon: PackageX, title: 'Produits en rupture', text: 'Liste à jour des références à recommander en priorité pour éviter les ventes perdues.' },
  { icon: TrendingUp, title: 'Produits les plus vendus', text: 'Top des produits qui génèrent le plus de chiffre — pour mieux acheter et mieux placer.' },
  { icon: History, title: 'Historique des mouvements', text: 'Traçabilité complète : entrées, sorties, ventes, transferts entre dépôts.' },
];

export default function ReportsShowcaseSection() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Des rapports professionnels en un clic
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Toutes vos données transformées en documents clairs, prêts à imprimer ou à partager.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((r) => (
            <StaggerItem key={r.title}>
              <div className="h-full rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                {/* Mock document preview */}
                <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative border-b border-border/40 flex items-center justify-center">
                  <div className="absolute top-3 left-3 right-3 space-y-1.5">
                    <div className="h-1.5 w-16 rounded-full bg-foreground/15" />
                    <div className="h-1 w-24 rounded-full bg-foreground/10" />
                  </div>
                  <r.icon className="w-10 h-10 text-primary/70" />
                  <div className="absolute bottom-3 left-3 right-3 space-y-1">
                    <div className="h-1 w-full rounded-full bg-foreground/8" />
                    <div className="h-1 w-3/4 rounded-full bg-foreground/8" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{r.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}