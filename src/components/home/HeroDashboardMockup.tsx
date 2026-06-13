import { motion } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle2, TrendingDown, ScanLine } from 'lucide-react';

/**
 * Composition UI animée du Hero : tableau de bord d'inventaire
 * (stock théorique vs réel, écarts, alertes, scan QR).
 * Remplace l'illustration photo pour coller au repositionnement "Inventaire".
 */
export default function HeroDashboardMockup() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 sm:p-6 lg:p-8"
      style={{ aspectRatio: '3 / 2' }}
      aria-label="Tableau de bord d'inventaire SpeedWork"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 text-xs sm:text-sm font-semibold text-foreground">
            Inventaire Express · Boutique du Marché
          </span>
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          En direct
        </motion.span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
        {[
          { icon: Package, label: 'Produits', value: '1 248', color: 'text-primary', bg: 'bg-primary/10' },
          { icon: CheckCircle2, label: 'Comptés', value: '1 196', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
          { icon: TrendingDown, label: 'Écart', value: '−52', color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-xl bg-card border border-border/60 p-2.5 sm:p-3"
          >
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-sm sm:text-lg font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Product rows */}
      <div className="space-y-1.5 sm:space-y-2">
        {[
          { name: 'Riz parfumé 25kg', theo: 48, real: 45, diff: -3 },
          { name: 'Huile végétale 5L', theo: 120, real: 120, diff: 0 },
          { name: 'Lait en poudre 900g', theo: 60, real: 52, diff: -8 },
        ].map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.15 }}
            className="flex items-center justify-between rounded-lg bg-card/60 border border-border/40 px-2.5 sm:px-3 py-1.5 sm:py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ScanLine className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium text-foreground truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="text-muted-foreground hidden sm:inline">Théo. {p.theo}</span>
              <span className="text-foreground font-semibold">Réel {p.real}</span>
              <span
                className={`font-bold tabular-nums w-8 text-right ${
                  p.diff === 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                }`}
              >
                {p.diff > 0 ? `+${p.diff}` : p.diff}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.3, type: 'spring', stiffness: 200 }}
        className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 flex items-center gap-2 bg-destructive text-destructive-foreground rounded-xl shadow-lg px-3 py-2 max-w-[200px]"
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <div className="text-[10px] sm:text-xs leading-tight">
          <p className="font-semibold">Rupture imminente</p>
          <p className="opacity-80">3 produits sous le seuil</p>
        </div>
      </motion.div>
    </div>
  );
}