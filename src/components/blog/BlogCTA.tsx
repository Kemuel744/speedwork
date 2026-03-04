import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function BlogCTA() {
  return (
    <div className="my-10 p-6 md:p-8 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border text-center">
      <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="text-xl font-bold text-foreground mb-2">
        Méthode manuelle vs SpeedWork
      </h3>
      <div className="grid sm:grid-cols-2 gap-4 text-sm text-left my-6">
        <div className="p-4 rounded-lg bg-destructive/10">
          <p className="font-semibold text-destructive mb-2">❌ Sans SpeedWork</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Calculs manuels sur Excel</li>
            <li>• Factures non professionnelles</li>
            <li>• Suivi de paiement inexistant</li>
            <li>• Perte de temps considérable</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-success/10">
          <p className="font-semibold text-[hsl(var(--success))] mb-2">✅ Avec SpeedWork</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Devis & factures en 2 minutes</li>
            <li>• Documents professionnels</li>
            <li>• Suivi des paiements en temps réel</li>
            <li>• Rapports automatiques</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link to="/login">Essai gratuit</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/fonctionnalites">En savoir plus</Link>
        </Button>
      </div>
    </div>
  );
}
