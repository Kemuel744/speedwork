import {
  ShieldAlert,
  EyeOff,
  PackageX,
  Store,
  WifiOff,
  Smartphone,
  Brain,
  Clock,
} from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';

const items = [
  { icon: ShieldAlert, title: 'Réduisez les pertes de stock', text: "Identifiez chaque écart entre le stock théorique et réel pour stopper les fuites de marchandise." },
  { icon: EyeOff, title: 'Détectez les vols internes', text: "L'historique des inventaires révèle les anomalies récurrentes par zone, rayon ou employé." },
  { icon: PackageX, title: 'Évitez les ruptures de stock', text: 'Alertes automatiques dès qu\'un produit passe sous le seuil minimum que vous définissez.' },
  { icon: Store, title: 'Contrôlez plusieurs boutiques', text: 'Suivez en temps réel le stock de chacun de vos dépôts et points de vente depuis un seul écran.' },
  { icon: WifiOff, title: 'Travaillez même sans Internet', text: "L'application continue de fonctionner hors-ligne et synchronise tout dès le retour du réseau." },
  { icon: Smartphone, title: 'Consultez vos données partout', text: 'Tableau de bord accessible sur mobile, tablette et ordinateur — où que vous soyez.' },
  { icon: Brain, title: 'Prenez de meilleures décisions', text: 'Statistiques claires sur les produits qui tournent, ceux qui dorment et ceux qui disparaissent.' },
  { icon: Clock, title: 'Gagnez du temps chaque semaine', text: 'Un inventaire qui prenait une journée se boucle en moins d\'une heure avec SpeedWork.' },
];

export default function InventoryBenefitsSection() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Pourquoi les commerçants choisissent SpeedWork ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Conçu spécialement pour les alimentations, quincailleries, dépôts, pharmacies et grossistes
              en Afrique.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((b) => (
            <StaggerItem key={b.title}>
              <div className="h-full rounded-2xl bg-card border border-border/60 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}