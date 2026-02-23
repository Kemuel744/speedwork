import { TrendingUp, FileText, Users, Clock } from 'lucide-react';

const stats = [
  { icon: FileText, value: '10 000+', label: 'Documents générés' },
  { icon: Users, value: '500+', label: 'Entrepreneurs actifs' },
  { icon: TrendingUp, value: '98%', label: 'Taux de satisfaction' },
  { icon: Clock, value: '< 2 min', label: 'Pour créer un document' },
];

const testimonials = [
  {
    name: 'Aminata D.',
    role: 'Gérante, Boutique Mode – Brazzaville',
    text: 'SpeedWork m\'a fait gagner un temps fou. Mes factures sont professionnelles et prêtes en 2 minutes. Un vrai outil de pilotage financier !',
  },
  {
    name: 'Patrick M.',
    role: 'Directeur, BTP Services – Congo',
    text: 'Enfin une solution digitale adaptée aux entreprises africaines. La facturation en Franc CFA et l\'export PDF sont parfaits.',
  },
  {
    name: 'Chantal K.',
    role: 'Freelance IT – Afrique centrale',
    text: 'Simple, efficace, abordable. L\'outil idéal pour la facturation freelance. Je recommande à tous les indépendants.',
  },
];

export default function SocialProofSection() {
  return (
    <>
      {/* Stats */}
      <section className="border-y border-border/50 bg-secondary/30 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <s.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Pourquoi les entreprises choisissent SpeedWork
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Des centaines d'entrepreneurs en Afrique centrale font confiance à SpeedWork pour leur gestion quotidienne.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary text-lg">★</span>
                  ))}
                </div>
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
    </>
  );
}
