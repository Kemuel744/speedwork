import { Link } from 'react-router-dom';
import {
  FileText, Users, MapPin, BarChart3, Shield, Clock,
  Calculator, Bell, Globe, FileCheck, Smartphone, TrendingUp
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Facturation & Devis Pro',
    description: 'Créez des factures et devis PDF professionnels en quelques clics. Numérotation automatique, calcul TVA, conversion devis → facture en 1 clic.',
    color: 'text-blue-600 bg-blue-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: Users,
    title: 'Gestion d\'équipes & RH',
    description: 'Organisez vos équipes par chantier, gérez les travailleurs, calculez les salaires automatiquement avec primes et pénalités.',
    color: 'text-emerald-600 bg-emerald-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: MapPin,
    title: 'Missions & Carte terrain',
    description: 'Assignez des missions géolocalisées, suivez leur avancement en temps réel sur une carte interactive avec marqueurs colorés.',
    color: 'text-orange-600 bg-orange-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: Clock,
    title: 'Pointage & Présence',
    description: 'Suivi de présence avec géolocalisation, détection des retards, historique complet et preuves photo de travail.',
    color: 'text-violet-600 bg-violet-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: BarChart3,
    title: 'Analyse de productivité',
    description: 'Dashboard analytique avec KPI, graphiques interactifs : missions terminées, rendement par équipe, taux de présence.',
    color: 'text-pink-600 bg-pink-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: Shield,
    title: 'Scores de fiabilité',
    description: 'Chaque travailleur reçoit un score automatique basé sur sa ponctualité, ses missions, la qualité du travail et sa présence.',
    color: 'text-amber-600 bg-amber-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: Calculator,
    title: 'Bilan annuel par IA',
    description: 'Génération automatique de bilans financiers par intelligence artificielle avec recommandations personnalisées.',
    color: 'text-cyan-600 bg-cyan-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: Bell,
    title: 'Relances automatiques',
    description: 'Détection des factures en retard et envoi de relances email paramétrables. L\'IA rédige vos messages de suivi.',
    color: 'text-red-600 bg-red-500/10',
    link: '/fonctionnalites',
  },
  {
    icon: Globe,
    title: 'Multi-devises & FCFA',
    description: 'Support natif du Franc CFA (XAF/XOF), convertisseur de devises en temps réel. Pensé pour le marché africain.',
    color: 'text-teal-600 bg-teal-500/10',
    link: '/fonctionnalites',
  },
];

export default function PowerFeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            9 modules puissants pour piloter votre entreprise
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            SpeedWork va bien au-delà de la simple facturation. C'est une plateforme complète 
            de gestion d'entreprise conçue pour les réalités du terrain africain.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.link}
              className="group rounded-2xl border border-border/60 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
