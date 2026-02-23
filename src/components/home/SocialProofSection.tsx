import { TrendingUp, FileText, Users, Receipt } from 'lucide-react';

const stats = [
  { icon: Users, value: '+120', label: 'Entreprises inscrites' },
  { icon: FileText, value: '+3 500', label: 'Devis générés' },
  { icon: Receipt, value: '+2 000', label: 'Factures créées' },
  { icon: TrendingUp, value: '98%', label: 'Satisfaction utilisateur' },
];

const testimonials = [
  {
    name: 'Entrepreneur',
    role: 'Brazzaville',
    text: 'Avant SpeedWork, je faisais tout à la main. Aujourd\'hui je gagne au moins 5 heures par semaine.',
  },
  {
    name: 'Freelance',
    role: 'Pointe-Noire',
    text: 'Simple, rapide et professionnel. Mes factures sont propres et automatiques.',
  },
];

export default function SocialProofSection() {
  return (
    <>
      {/* Stats */}
      <section className="border-y border-border/50 bg-secondary/30 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-10">
            SpeedWork en chiffres
          </h2>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">
            Ce que disent nos utilisateurs
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">— {t.name}, {t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
