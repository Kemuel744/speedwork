import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, ArrowRight, Smartphone, Zap } from 'lucide-react';
import speedworkLogo from '@/assets/logo.png';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const plans = [
  {
    id: 'monthly',
    name: 'Mensuel',
    price: 5000,
    period: '/mois',
    description: 'Idéal pour démarrer',
    features: [
      'Factures & devis illimités',
      'Gestion des clients',
      'Export PDF',
      'Signature électronique',
      'Support par email',
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: 'annual',
    name: 'Annuel',
    price: 3000,
    period: '/mois',
    totalPrice: 36000,
    description: 'Économisez 24 000 FCFA/an',
    features: [
      'Tout le plan Mensuel',
      'Tableau de bord avancé',
      'Multi-utilisateurs',
      'Support prioritaire',
      'Mises à jour en avant-première',
    ],
    icon: Crown,
    popular: true,
    savings: '40%',
  },
];

const paymentMethods = [
  { id: 'mtn', name: 'MTN Mobile Money', color: 'bg-yellow-500' },
  { id: 'airtel', name: 'Airtel Money', color: 'bg-red-500' },
  { id: 'orange', name: 'Orange Money', color: 'bg-orange-500' },
  { id: 'card', name: 'Carte bancaire', color: 'bg-primary' },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    if (!selectedPlan || !selectedPayment) {
      toast.error('Veuillez sélectionner un plan et un moyen de paiement');
      return;
    }
    setProcessing(true);
    // Simulate CinetPay payment initiation
    setTimeout(() => {
      setProcessing(false);
      toast.success('Paiement initié ! Vous recevrez votre code d\'accès par SMS/email.');
      navigate('/access-code');
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Abonnement – Facturation en Ligne"
        description="Choisissez votre abonnement SpeedWork : factures et devis illimités à partir de 3 000 FCFA/mois. Paiement par Mobile Money ou carte bancaire."
        path="/subscription"
      />
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={speedworkLogo} alt="SpeedWork" className="h-10 w-auto" />
            <span className="text-2xl font-bold">SpeedWork</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Choisissez votre abonnement</h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Gérez vos factures et devis professionnellement. Commencez dès aujourd'hui.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-card shadow-lg shadow-primary/10 scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4">
                    Populaire — Économisez {plan.savings}
                  </Badge>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-foreground">
                    {plan.price.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">FCFA{plan.period}</span>
                  {plan.totalPrice && (
                    <p className="text-xs text-muted-foreground mt-1">
                      soit {plan.totalPrice.toLocaleString('fr-FR')} FCFA/an
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Payment Methods */}
        {selectedPlan && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Moyen de paiement
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Choisissez votre mode de paiement préféré</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPayment(pm.id)}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all text-sm font-medium ${
                    selectedPayment === pm.id
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${pm.color}`} />
                  {pm.name}
                </button>
              ))}
            </div>

            <Button
              onClick={handlePayment}
              disabled={!selectedPayment || processing}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {processing ? (
                'Traitement en cours...'
              ) : (
                <>
                  Payer {plans.find(p => p.id === selectedPlan)?.price.toLocaleString('fr-FR')} FCFA
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Paiement sécurisé via CinetPay. Un code d'accès vous sera envoyé après confirmation.
            </p>
          </div>
        )}

        {/* Already have a code */}
        <div className="text-center pb-12">
          <button
            onClick={() => navigate('/access-code')}
            className="text-sm text-primary hover:underline"
          >
            Vous avez déjà un code d'accès ? Cliquez ici
          </button>
        </div>
      </div>
    </main>
  );
}
