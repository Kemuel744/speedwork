import { motion } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Check } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function OfflineSyncSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium mb-4">
            <WifiOff className="w-3.5 h-3.5" />
            Mode hors ligne
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Fonctionne même sans connexion Internet
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            SpeedWork permet aux commerçants de continuer à enregistrer les ventes, gérer les stocks
            et effectuer des inventaires même en zone à faible couverture réseau. Dès que la connexion
            revient, toutes les données se synchronisent automatiquement.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Ventes et inventaires enregistrés localement',
              'Synchronisation automatique au retour du réseau',
              'Aucune perte de données, jamais',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal direction="left">
          <div className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
            {/* Step 1: offline */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Hors ligne</p>
                  <p className="text-xs text-muted-foreground">Vente n°1247 enregistrée localement</p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">12:04</span>
            </div>

            {/* Animated sync arrow */}
            <div className="flex justify-center py-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </div>

            {/* Step 2: synced */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Connexion rétablie</p>
                  <p className="text-xs text-muted-foreground">8 ventes synchronisées avec le cloud</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}