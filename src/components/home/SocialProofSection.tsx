import { FileText, Users, MapPin, Shield } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';

const stats = [
  { icon: Users, value: '+120', label: 'Entreprises actives' },
  { icon: FileText, value: '+5 500', label: 'Documents générés' },
  { icon: MapPin, value: '+800', label: 'Missions suivies' },
  { icon: Shield, value: '96%', label: 'Taux de fiabilité' },
];

const testimonials = [
  { name: 'Directeur BTP', role: 'Brazzaville', text: 'Avant SpeedWork, on gérait 50 ouvriers sur papier. Maintenant je vois tout en temps réel : présences, missions, productivité. On a gagné 10h par semaine.' },
  { name: 'Freelance Designer', role: 'Pointe-Noire', text: 'Mes factures sont professionnelles, mes relances automatiques, et le bilan IA en fin d\'année m\'a bluffé. C\'est l\'outil que j\'attendais.' },
  { name: 'Gérant PME', role: 'Dolisie', text: 'La carte des missions et les scores de fiabilité ont transformé ma façon de gérer mes équipes terrain. Indispensable.' },
];

export default function SocialProofSection() {
  return (
    <>
      {/* Stats */}
      <section className="border-y border-border/50 bg-secondary/30 py-12">
        <StaggerContainer className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <s.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ils pilotent leur entreprise avec SpeedWork
            </h2>
          </ScrollReveal>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <div className="rounded-2xl border border-border/60 bg-card p-6 h-full">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-primary text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-foreground text-sm">— {t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
