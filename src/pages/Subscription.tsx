import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, ArrowRight, Smartphone, Zap, CheckCircle2 } from 'lucide-react';
import speedworkLogo from '@/assets/logo.png';
import mtnLogo from '@/assets/mtn-momo.png';
import airtelLogo from '@/assets/airtel-money.png';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import PublicNavbar from '@/components/PublicNavbar';
import { supabase } from '@/integrations/supabase/client';

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
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 15000,
    period: '/mois',
    description: '1 admin + 3 collaborateurs',
    features: [
      'Tout le plan Annuel',
      '3 collaborateurs avec leurs postes',
      'Messagerie interne sécurisée',
      'Partage de documents en équipe',
      'Gestion centralisée des accès',
    ],
    icon: Crown,
    popular: false,
  },
];

const depositMethods = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    number: '06 444 6047',
    logo: mtnLogo,
    bgClass: 'bg-[#003366]',
    borderClass: 'border-[#ffcc00]',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    number: '05 303 9818',
    logo: airtelLogo,
    bgClass: 'bg-white',
    borderClass: 'border-red-500',
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<'plan' | 'deposit' | 'form' | 'done'>('plan');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Client info form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setStep('deposit');
  };

  const handleDepositDone = () => {
    if (!selectedMethod) {
      toast.error('Veuillez sélectionner votre moyen de dépôt');
      return;
    }
    setStep('form');
  };

  const handleSubmitRequest = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error('Veuillez entrer un email valide');
      return;
    }

    setSubmitting(true);
    try {
      const plan = plans.find(p => p.id === selectedPlan);
      const amount = selectedPlan === 'annual' ? (plan?.totalPrice ?? 36000) : (plan?.price ?? (selectedPlan === 'enterprise' ? 15000 : 5000));
      const method = depositMethods.find(m => m.id === selectedMethod);

      // Send notification to admin via edge function
      const { error } = await supabase.functions.invoke('notify-subscription-request', {
        body: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          plan: selectedPlan,
          amount,
          payment_method: method?.name || selectedMethod,
          deposit_number: method?.number || '',
        },
      });

      if (error) {
        console.error('Notification error:', error);
        toast.error('Erreur lors de l\'envoi. Réessayez.');
        return;
      }

      setStep('done');
      toast.success('Demande envoyée avec succès !');
    } catch {
      toast.error('Erreur de connexion. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <PublicNavbar />
      <SEO
        title="Tarifs – Abonnement Facturation"
        description="Choisissez votre abonnement SpeedWork : factures et devis illimités à partir de 3 000 FCFA/mois. Paiement par Mobile Money."
        path="/tarifs"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Combien coûte SpeedWork ?",
            "acceptedAnswer": { "@type": "Answer", "text": "SpeedWork propose deux formules : un abonnement mensuel à 5 000 FCFA/mois et un abonnement annuel à 3 000 FCFA/mois (soit 36 000 FCFA/an), vous permettant d'économiser 40%." }
          },
          {
            "@type": "Question",
            "name": "Quels moyens de paiement sont acceptés ?",
            "acceptedAnswer": { "@type": "Answer", "text": "Nous acceptons MTN Mobile Money et Airtel Money. Effectuez votre dépôt et recevez votre clé d'activation." }
          },
          {
            "@type": "Question",
            "name": "Comment accéder à mon compte après le paiement ?",
            "acceptedAnswer": { "@type": "Answer", "text": "Après votre dépôt, remplissez le formulaire avec vos informations. Notre équipe vous enverra votre clé d'activation par téléphone ou email." }
          }
        ]
      }) }} />

      {/* Success Screen */}
      {step === 'done' ? (
        <div className="flex items-center justify-center min-h-[80vh] px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Demande envoyée !</h2>
            <p className="text-muted-foreground mb-6">
              Votre demande d'activation a été transmise à notre équipe. Vous recevrez votre <strong>clé d'activation</strong> par téléphone ou email dans les plus brefs délais.
            </p>
            <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom</span>
                <span className="font-medium text-foreground">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-medium text-foreground">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">{selectedPlan === 'annual' ? 'Annuel' : selectedPlan === 'enterprise' ? 'Entreprise' : 'Mensuel'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/access-code')} className="w-full h-11 font-semibold">
                J'ai déjà ma clé d'activation <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      ) : (
      <>
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
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 text-sm">
          {[
            { key: 'plan', label: '1. Plan' },
            { key: 'deposit', label: '2. Dépôt' },
            { key: 'form', label: '3. Informations' },
          ].map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === s.key
                  ? 'bg-primary text-primary-foreground'
                  : ['plan', 'deposit', 'form'].indexOf(step) > ['plan', 'deposit', 'form'].indexOf(s.key)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-secondary text-muted-foreground'
              }`}>
                {s.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Plans */}
        {step === 'plan' && (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <button
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 border-border bg-card hover:border-primary/40 hover:shadow-md`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4">
                      Populaire — Économisez {plan.savings}
                    </Badge>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary text-foreground">
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
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Deposit Instructions */}
        {step === 'deposit' && selectedPlan && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Effectuez votre dépôt
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setStep('plan'); setSelectedPlan(null); }}>
                ← Changer de plan
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Plan sélectionné : <strong>{selectedPlan === 'annual' ? 'Annuel — 36 000 FCFA' : selectedPlan === 'enterprise' ? 'Entreprise — 15 000 FCFA/mois' : 'Mensuel — 5 000 FCFA'}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Envoyez le montant à l'un des numéros ci-dessous, puis cliquez sur "J'ai effectué le dépôt".
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {depositMethods.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => setSelectedMethod(dm.id)}
                  className={`rounded-2xl border-2 p-5 transition-all flex flex-col items-center gap-3 ${
                    selectedMethod === dm.id
                      ? `${dm.borderClass} border-2 shadow-lg scale-[1.02]`
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <img src={dm.logo} alt={dm.name} className="h-14 w-auto object-contain" />
                  <div className="text-center">
                    <p className="font-bold text-foreground text-sm">{dm.name}</p>
                    <p className="text-2xl font-mono font-bold text-primary tracking-wider mt-1">{dm.number}</p>
                  </div>
                  {selectedMethod === dm.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Important</p>
              <p>Envoyez exactement <strong>{selectedPlan === 'annual' ? '36 000' : selectedPlan === 'enterprise' ? '15 000' : '5 000'} FCFA</strong> au numéro indiqué. Après le dépôt, remplissez le formulaire ci-dessous pour recevoir votre clé d'activation.</p>
            </div>

            <Button
              onClick={handleDepositDone}
              disabled={!selectedMethod}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              J'ai effectué le dépôt <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Client Info Form */}
        {step === 'form' && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-bold text-foreground text-lg mb-1">Vos informations</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Remplissez vos coordonnées pour recevoir votre clé d'activation.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom et prénom</label>
                <Input
                  placeholder="Ex: Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="Ex: jean@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Numéro de téléphone</label>
                <Input
                  type="tel"
                  placeholder="Ex: 06 XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('deposit')} className="flex-1">
                ← Retour
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={submitting || !fullName.trim() || !email.trim() || !phone.trim()}
                className="flex-[2] h-12 text-base font-semibold"
                size="lg"
              >
                {submitting ? 'Envoi en cours...' : (
                  <>Envoyer ma demande <ArrowRight className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Already have a code */}
        <div className="text-center pb-12">
          <button
            onClick={() => navigate('/access-code')}
            className="text-sm text-primary hover:underline"
          >
            Vous avez déjà une clé d'activation ? Cliquez ici
          </button>
        </div>
      </div>
      </>
      )}
    </main>
  );
}
