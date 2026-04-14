import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Store, Package, QrCode, BarChart3, Receipt, Wifi,
  ArrowRight, Zap, Cloud, Lock,
  Smartphone,
} from 'lucide-react';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import promoRevolution from '@/assets/promo-revolution.png';
import PublicFooter from '@/components/PublicFooter';
import { motion } from 'framer-motion';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/home/ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Features() {
  const { t, language } = useLanguage();

  const categories = language === 'en' ? [
    { title: 'Smart POS Checkout', icon: Store, features: ['Intuitive shopping cart with product search', 'Automatic total and change calculation', 'Add products via QR code scanner', 'Professional receipt with company branding', 'Receipt reprint from sales history', 'Works offline — syncs when back online'] },
    { title: 'Complete Stock Management', icon: Package, features: ['Real-time product tracking', 'Low stock alerts with configurable thresholds', 'Stock movements history (in/out)', 'Downloadable PDF inventory', 'Product categories for organization', 'Batch stock updates'] },
    { title: 'QR Code Scanner', icon: QrCode, features: ['Instant product addition via camera scan', 'Generate QR codes for each product', 'Print QR code labels', 'Works with any smartphone camera', 'Speeds up checkout process'] },
    { title: 'Professional Receipts', icon: Receipt, features: ['Auto-generated with company logo', 'Unique receipt numbering', 'Complete item details and totals', 'Reprint any receipt from history', '80mm thermal printer format', 'Download as image'] },
    { title: 'Sales Statistics', icon: BarChart3, features: ['Daily, weekly and monthly revenue charts', 'Top selling products identification', 'Sales trends and patterns', 'Revenue comparison by period', 'Product performance analytics'] },
    { title: 'Offline Mode', icon: Wifi, features: ['Full POS functionality without Internet', 'Local data storage with IndexedDB', 'Automatic sync when connection returns', 'No data loss during outages', 'Works on mobile and tablet'] },
  ] : [
    { title: 'Caisse POS intelligente', icon: Store, features: ['Panier d\'achat intuitif avec recherche de produits', 'Calcul automatique du total et de la monnaie', 'Ajout de produits via scanner QR', 'Reçu professionnel avec identité visuelle', 'Réimpression depuis l\'historique des ventes', 'Fonctionne hors ligne — synchronise au retour'] },
    { title: 'Gestion de stock complète', icon: Package, features: ['Suivi des produits en temps réel', 'Alertes de stock bas avec seuils configurables', 'Historique des mouvements de stock (entrée/sortie)', 'Inventaire PDF téléchargeable', 'Catégories de produits pour l\'organisation', 'Mises à jour de stock par lot'] },
    { title: 'Scanner de codes QR', icon: QrCode, features: ['Ajout instantané de produit via scan caméra', 'Génération de codes QR pour chaque produit', 'Impression d\'étiquettes QR', 'Fonctionne avec n\'importe quelle caméra', 'Accélère le processus de vente'] },
    { title: 'Reçus professionnels', icon: Receipt, features: ['Générés automatiquement avec le logo', 'Numérotation unique des reçus', 'Détails complets des articles et totaux', 'Réimpression depuis l\'historique', 'Format imprimante thermique 80mm', 'Téléchargement en image'] },
    { title: 'Statistiques de ventes', icon: BarChart3, features: ['Graphiques du CA journalier, hebdo et mensuel', 'Identification des produits les plus vendus', 'Tendances et patterns de vente', 'Comparaison de revenus par période', 'Analytiques de performance produit'] },
    { title: 'Mode hors ligne', icon: Wifi, features: ['Caisse POS complète sans Internet', 'Stockage local des données avec IndexedDB', 'Synchronisation automatique au retour du réseau', 'Aucune perte de données pendant les coupures', 'Fonctionne sur mobile et tablette'] },
  ];

  const techHighlights = [
    { icon: Cloud, label: t('features.techCloud') },
    { icon: Smartphone, label: t('features.techMobile') },
    { icon: Lock, label: t('features.techSecure') },
    { icon: Wifi, label: t('features.techScalable') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Fonctionnalités – Logiciel de gestion de boutique et pharmacie"
        description="Découvrez les fonctionnalités de SpeedWork : caisse POS, gestion de stock, scanner QR, reçus professionnels et mode hors ligne pour boutiques et pharmacies."
        path="/fonctionnalites"
      />
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                {t('features.heroBadge')}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                {t('features.heroTitle1')} <span className="text-primary">{t('features.heroTitle2')}</span> {t('features.heroTitle3')}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                {t('features.heroSubtitle')}
              </p>
              <Button size="lg" asChild className="mt-8 h-13 px-8 text-base font-semibold">
                <Link to="/tarifs">
                  {t('features.heroCta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              <img
                src={promoRevolution}
                alt="SpeedWork – Logiciel de gestion de boutique en Afrique"
                className="w-full rounded-2xl shadow-2xl"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech highlights bar */}
      <section className="border-b border-border/50 bg-secondary/30 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <StaggerContainer className="flex flex-wrap items-center justify-center gap-8" stagger={0.08}>
            {techHighlights.map((th) => (
              <StaggerItem key={th.label}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <th.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{th.label}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t('features.allTitle')}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {t('features.allSubtitle')}
            </p>
          </ScrollReveal>
          <div className="space-y-16">
            {categories.map((cat, i) => (
              <ScrollReveal key={cat.title} direction={i % 2 === 0 ? "left" : "right"}>
                <div className={`flex flex-col lg:flex-row gap-8 items-start ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="lg:w-1/3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <cat.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{cat.title}</h3>
                  </div>
                  <div className="lg:w-2/3">
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {cat.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal>
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold">{t('features.ctaTitle')}</h2>
            <p className="mt-3 text-primary-foreground/80">
              {t('features.ctaSubtitle')}
            </p>
            <Button size="lg" variant="secondary" asChild className="mt-8 h-13 px-8 text-base font-semibold">
              <Link to="/tarifs">
                {t('features.ctaButton')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      <PublicFooter />
    </div>
  );
}
