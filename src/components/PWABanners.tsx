import { WifiOff, Wifi, Download, RefreshCw, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const { isOnline } = usePWA();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
    } else {
      // Small delay before hiding to show "reconnected" briefly
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-success/10 border-success/30 text-success"
          : "bg-destructive/10 border-destructive/30 text-destructive"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          Connexion rétablie
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Mode hors ligne – Les données sont mises en cache
        </>
      )}
    </div>
  );
}

export function InstallPWABanner() {
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage to avoid showing again after dismiss
  useEffect(() => {
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!canInstall || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs bg-card border border-border rounded-xl shadow-xl p-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Installer SpeedWork</p>
          <p className="text-xs text-muted-foreground mt-1">
            Accès rapide depuis votre écran d'accueil, fonctionne hors ligne.
          </p>
          <Button size="sm" className="mt-3 w-full" onClick={promptInstall}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Installer l'application
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UpdateAvailableBanner() {
  const { isUpdateAvailable } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-primary/10 border-primary/30 text-primary text-sm font-medium">
      <RefreshCw className="w-4 h-4" />
      Mise à jour disponible –{" "}
      <button
        onClick={() => window.location.reload()}
        className="underline hover:no-underline ml-1"
      >
        Actualiser
      </button>
    </div>
  );
}
