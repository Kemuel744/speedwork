import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Users, BarChart3, Download, Shield, Zap, ArrowRight, Check } from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import speedworkLogo from '@/assets/logo.png';

const features = [
  { icon: FileText, title: 'Factures & Devis', desc: 'Créez des documents professionnels en quelques clics avec numérotation automatique.' },
  { icon: Users, title: 'Gestion Clients', desc: 'Centralisez vos contacts, suivez l\'historique et les montants facturés.' },
  { icon: Download, title: 'Export PDF', desc: 'Téléchargez vos documents au format PDF A4, prêts à envoyer.' },
  { icon: BarChart3, title: 'Tableau de bord', desc: 'Suivez vos revenus, factures impayées et statistiques en temps réel.' },
  { icon: Shield, title: 'Signature numérique', desc: 'Ajoutez votre signature et le titre du signataire sur chaque document.' },
  { icon: Zap, title: 'Rapide & Simple', desc: 'Interface intuitive conçue pour les entrepreneurs africains.' },
];

const testimonials = [
  { name: 'Aminata D.', role: 'Gérante, Boutique Mode', text: 'SpeedWork m\'a fait gagner un temps fou. Mes factures sont professionnelles et prêtes en 2 minutes.' },
  { name: 'Patrick M.', role: 'Directeur, BTP Services', text: 'Enfin un outil adapté à nos réalités. Le paiement Mobile Money et l\'export PDF sont parfaits.' },
  { name: 'Chantal K.', role: 'Freelance IT', text: 'Simple, efficace, abordable. Je recommande à tous les indépendants.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Facturation & Devis pour Entreprises Africaines"
        description="Créez vos factures et devis professionnels en moins de 2 minutes. Solution simple et abordable pour entrepreneurs, PME et freelancers en Afrique."
        path="/"
      />
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Simple • Rapide • Professionnel
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
              Créez vos factures et devis{' '}
              <span className="text-primary">en moins de 2 minutes</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              La solution simple et professionnelle pour gérer vos factures, devis et clients. 
              Conçu pour les entrepreneurs, PME et freelancers en Afrique.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  Créer un compte gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base">
                <Link to="/fonctionnalites">Voir les fonctionnalités</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Essai gratuit de 3 jours • Aucune carte requise
            </p>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-y border-border/50 bg-secondary/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Utilisé par des entrepreneurs et PME à travers l'Afrique
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground/60">
            {['BTP', 'Commerce', 'Informatique', 'Freelance', 'Services'].map((s) => (
              <span key={s} className="text-sm font-semibold tracking-wider uppercase">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Tout ce qu'il vous faut</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Des outils puissants et simples pour gérer votre activité au quotidien.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border/60 bg-card p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/fonctionnalites">
                Toutes les fonctionnalités
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/30 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Comment ça marche ?</h2>
            <p className="mt-4 text-lg text-muted-foreground">3 étapes simples pour démarrer</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Créez votre compte', desc: 'Inscrivez-vous en quelques secondes et accédez à votre espace.' },
              { step: '2', title: 'Ajoutez vos clients', desc: 'Renseignez vos clients et leurs coordonnées une seule fois.' },
              { step: '3', title: 'Facturez', desc: 'Créez, envoyez et suivez vos factures et devis en temps réel.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Ce que disent nos utilisateurs</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Prêt à professionnaliser votre facturation ?</h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Rejoignez des centaines d'entrepreneurs qui utilisent SpeedWork pour gérer leur activité.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={speedworkLogo} alt="SpeedWork" className="h-6 w-auto" />
              <span className="font-semibold text-foreground">SpeedWork</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</Link>
              <Link to="/tarifs" className="hover:text-foreground transition-colors">Tarifs</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Connexion</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2025 SpeedWork. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
