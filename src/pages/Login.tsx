import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import speedworkLogo from '@/assets/logo-small.webp';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import RegisterForm from '@/components/auth/RegisterForm';

export default function Login() {
  const { user, login, register, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/dashboard' : '/client', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        toast.error(result.error || 'Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }
      toast.success('Connexion réussie !');
    } catch {
      toast.error('Une erreur est survenue');
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex">
      <SEO
        title={isRegister ? "Inscription" : "Connexion"}
        description="Connectez-vous à votre espace SpeedWork pour gérer vos factures et devis professionnels."
        path="/login"
      />
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
        <div className="relative z-10 text-primary-foreground max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <img src={speedworkLogo} alt="SpeedWork" className="h-12 w-auto" />
            <span className="text-2xl font-bold">SpeedWork</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">La plateforme tout-en-un pour piloter votre entreprise</h1>
          <p className="text-primary-foreground/80 text-lg mb-6">
            Rejoignez +120 entreprises qui digitalisent leur gestion avec SpeedWork.
          </p>
          <ul className="space-y-3 text-primary-foreground/90 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              Facturation & devis PDF professionnels en 1 clic
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              Gestion d'équipes, missions terrain & carte interactive
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              Pointage, scores de fiabilité & analyse de productivité
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              Paie automatique & bilans annuels générés par IA
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              Multi-devises avec support natif du Franc CFA
            </li>
          </ul>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={speedworkLogo} alt="SpeedWork" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">SpeedWork</span>
          </div>

          {isRegister ? (
            <RegisterForm
              onRegister={register}
              onSwitchToLogin={() => setIsRegister(false)}
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenue</h2>
              <p className="text-muted-foreground mb-8">Connectez-vous à votre espace</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Chargement...' : 'Se connecter'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Pas de compte ? S'inscrire
                </button>
                <div>
                  <Link to="/subscription" className="text-sm text-muted-foreground hover:underline">
                    Voir les abonnements
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
