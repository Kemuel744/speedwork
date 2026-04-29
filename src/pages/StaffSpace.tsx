import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useStaff } from '@/contexts/StaffContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import {
  Lock, Unlock, ShoppingCart, Package, BarChart3, Wallet,
  Users, ArrowLeftRight, Tag, RotateCcw, LogOut, Store,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  manager: 'Gérant',
  cashier: 'Caissier',
  seller: 'Vendeur',
  stockkeeper: 'Magasinier',
};

interface ActionTile {
  to: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}

function getActionsForRole(role: string, perm: Record<string, any>): ActionTile[] {
  const actions: ActionTile[] = [];

  if (role === 'cashier' || perm.can_open_cash || perm.can_sell) {
    actions.push({
      to: '/cash-register',
      label: 'Ouvrir la caisse',
      desc: 'Démarrer la session du jour',
      icon: Wallet,
      accent: 'from-blue-500 to-blue-600',
    });
    actions.push({
      to: '/finance?tab=cash',
      label: 'Ventes du jour',
      desc: 'Encaisser et imprimer le ticket',
      icon: ShoppingCart,
      accent: 'from-emerald-500 to-emerald-600',
    });
  }

  if (role === 'seller' || perm.can_sell) {
    actions.push({
      to: '/cash-register',
      label: 'Nouvelle vente',
      desc: 'Scanner et encaisser',
      icon: ShoppingCart,
      accent: 'from-emerald-500 to-emerald-600',
    });
  }

  if (role === 'stockkeeper' || perm.can_manage_stock) {
    actions.push({
      to: '/stock?tab=products',
      label: 'Stock produits',
      desc: 'Voir et ajuster les quantités',
      icon: Package,
      accent: 'from-amber-500 to-orange-600',
    });
    actions.push({
      to: '/stock?tab=multi-depot',
      label: 'Stock multi-dépôts',
      desc: 'Vue par boutique',
      icon: Store,
      accent: 'from-indigo-500 to-indigo-600',
    });
    actions.push({
      to: '/stock?tab=transfers',
      label: 'Transferts',
      desc: 'Envoyer du stock',
      icon: ArrowLeftRight,
      accent: 'from-purple-500 to-purple-600',
    });
  }

  if (role === 'manager') {
    actions.push({
      to: '/dashboard',
      label: 'Tableau de bord',
      desc: 'Vue d\'ensemble',
      icon: BarChart3,
      accent: 'from-blue-500 to-indigo-600',
    });
    actions.push({
      to: '/reports',
      label: 'Rapports',
      desc: 'Ventes, stock, statistiques',
      icon: BarChart3,
      accent: 'from-cyan-500 to-blue-600',
    });
    actions.push({
      to: '/employees',
      label: 'Équipe',
      desc: 'Gérer les employés',
      icon: Users,
      accent: 'from-pink-500 to-rose-600',
    });
  }

  if (perm.can_view_reports && role !== 'manager') {
    actions.push({
      to: '/reports',
      label: 'Rapports',
      desc: 'Voir les statistiques',
      icon: BarChart3,
      accent: 'from-cyan-500 to-blue-600',
    });
  }

  if (perm.can_refund) {
    actions.push({
      to: '/finance?tab=returns',
      label: 'Retours',
      desc: 'Enregistrer un retour',
      icon: RotateCcw,
      accent: 'from-orange-500 to-red-500',
    });
  }

  if (perm.can_manage_products) {
    actions.push({
      to: '/stock?tab=labels',
      label: 'Étiquettes',
      desc: 'Imprimer les étiquettes',
      icon: Tag,
      accent: 'from-teal-500 to-emerald-600',
    });
  }

  // Always available: messages-like quick info — none for now
  if (actions.length === 0) {
    actions.push({
      to: '/dashboard',
      label: 'Mon espace',
      desc: 'Aller au tableau de bord',
      icon: BarChart3,
    });
  }

  // dedupe by `to`
  const seen = new Set<string>();
  return actions.filter(a => (seen.has(a.to) ? false : (seen.add(a.to), true)));
}

export default function StaffSpace() {
  const { user } = useAuth();
  const { company } = useCompany();
  const { staff, setStaff, lock } = useStaff();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (code: string) => {
    if (!user) {
      toast({ title: 'Compte boutique requis', description: 'Demande au propriétaire de connecter son compte.', variant: 'destructive' });
      return;
    }
    if (!/^\d{4,6}$/.test(code)) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('verify_employee_pin', { _pin: code });
    setLoading(false);
    setPin('');
    if (error || !(data as any)?.valid) {
      toast({
        title: 'PIN invalide',
        description: (data as any)?.error || error?.message || 'Vérifiez votre code',
        variant: 'destructive',
      });
      return;
    }
    const d = data as any;
    setStaff({
      employee_id: d.employee_id,
      full_name: d.full_name,
      role: d.role,
      permissions: d.permissions || {},
      unlocked_at: Date.now(),
    });
    toast({ title: `Bienvenue ${d.full_name}`, description: ROLE_LABELS[d.role] || d.role });
  };

  // auto-submit when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === 4) submit(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // ---------- LOCKED VIEW ----------
  if (!staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-16 w-auto mx-auto mb-3 object-contain" />
            ) : (
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Store className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{company.name || 'Ma boutique'}</h1>
            <p className="text-sm text-muted-foreground mt-1">Espace employé</p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Saisissez votre code PIN</span>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={pin}
                  onChange={(v) => setPin(v.replace(/\D/g, ''))}
                  disabled={loading}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-14 h-16 text-2xl" />
                    <InputOTPSlot index={1} className="w-14 h-16 text-2xl" />
                    <InputOTPSlot index={2} className="w-14 h-16 text-2xl" />
                    <InputOTPSlot index={3} className="w-14 h-16 text-2xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Le code se trouve sur votre carte d'employé.
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
              Retour à l'espace administrateur
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- UNLOCKED VIEW ----------
  const actions = getActionsForRole(staff.role, staff.permissions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {company.logo ? (
              <img src={company.logo} alt="" className="h-9 w-9 rounded-lg object-contain bg-white border" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{staff.full_name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[staff.role] || staff.role} · {company.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={lock} className="shrink-0">
            <LogOut className="w-4 h-4 mr-1.5" />
            Verrouiller
          </Button>
        </div>
      </header>

      {/* Welcome */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Unlock className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Session ouverte</span>
        </div>
        <h2 className="text-2xl font-bold">Bonjour, {staff.full_name.split(' ')[0]} 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Voici les actions disponibles pour votre rôle.
        </p>
      </div>

      {/* Actions grid */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.to}
                onClick={() => navigate(a.to)}
                className="group text-left rounded-2xl bg-white dark:bg-slate-900 border-2 border-border p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${a.accent || 'from-slate-500 to-slate-600'} shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-base">{a.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Toutes vos actions sont enregistrées sous votre nom.
        </p>
      </div>
    </div>
  );
}