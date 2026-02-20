import { Smartphone, Download, Wifi, WifiOff, Star, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import SEO from "@/components/SEO";

export default function InstallApp() {
  const { canInstall, isInstalled, isOnline, promptInstall } = usePWA();

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);

  return (
    <>
      <SEO
        title="Installer SpeedWork – Application Mobile"
        description="Installez SpeedWork sur votre téléphone pour accéder à vos factures et devis même sans connexion internet."
      />
      <PublicNavbar />

      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 mb-6">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            SpeedWork sur votre téléphone
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Installez l'application pour un accès instantané, même sans connexion internet.
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm mb-10">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-success font-medium">Connecté</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-destructive font-medium">Hors ligne</span>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { icon: Zap, title: "Accès instantané", desc: "Ouvrez SpeedWork depuis votre écran d'accueil en un tap" },
              { icon: WifiOff, title: "Mode hors ligne", desc: "Consultez vos documents et données même sans connexion" },
              { icon: Star, title: "Expérience native", desc: "Interface plein écran sans barre de navigation du navigateur" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 rounded-xl border border-border bg-card text-left">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Install CTA */}
          {isInstalled ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-success font-semibold">
                <CheckCircle className="w-5 h-5" />
                Application déjà installée !
              </div>
              <p className="text-sm text-muted-foreground">
                Ouvrez SpeedWork depuis votre écran d'accueil.
              </p>
            </div>
          ) : canInstall ? (
            <div className="flex flex-col items-center gap-3">
              <Button size="lg" onClick={promptInstall} className="px-8">
                <Download className="w-5 h-5 mr-2" />
                Installer SpeedWork
              </Button>
              <p className="text-xs text-muted-foreground">
                Gratuit · Aucun store requis · Fonctionne sur Android et iPhone
              </p>
            </div>
          ) : isIOS && isSafari ? (
            <div className="bg-muted rounded-xl p-6 text-left">
              <p className="font-semibold text-foreground mb-3">Comment installer sur iPhone :</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Appuyez sur le bouton <strong>Partager</strong> (icône carré avec flèche) en bas de Safari
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Appuyez sur <strong>Ajouter</strong> en haut à droite
                </li>
              </ol>
            </div>
          ) : isIOS ? (
            <div className="bg-muted rounded-xl p-5">
              <p className="text-sm text-muted-foreground">
                Pour installer sur iPhone, ouvrez cette page dans <strong>Safari</strong> puis utilisez le menu Partager → Sur l'écran d'accueil.
              </p>
            </div>
          ) : (
            <div className="bg-muted rounded-xl p-5">
              <p className="text-sm text-muted-foreground">
                Pour installer l'application, ouvrez ce site dans Chrome ou Edge sur votre téléphone Android, puis appuyez sur le menu du navigateur → <strong>Ajouter à l'écran d'accueil</strong>.
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
