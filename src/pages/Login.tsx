import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import speedworkLogo from '@/assets/logo.png';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

export default function Login() {
  const { user, login, register, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/dashboard' : '/client', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const result = await register(email, password, name);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de l\'inscription');
          setLoading(false);
          return;
        }
        if (result.needsConfirmation) {
          toast.success('Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception.');
          setIsRegister(false);
          setLoading(false);
          return;
        }
        toast.success('Compte créé avec succès !');
      } else {
        const result = await login(email, password);
        if (!result.success) {
          toast.error(result.error || 'Email ou mot de passe incorrect');
          setLoading(false);
          return;
        }
        toast.success('Connexion réussie !');
      }
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
        title="Connexion"
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
          <h1 className="text-4xl font-bold mb-4 leading-tight">Gérez vos factures et devis en toute simplicité</h1>
          <p className="text-primary-foreground/80 text-lg">
            Une solution professionnelle pour créer, suivre et gérer tous vos documents commerciaux.
          </p>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={speedworkLogo} alt="SpeedWork" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">SpeedWork</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isRegister ? 'Créer un compte' : 'Bienvenue'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isRegister ? 'Remplissez les informations ci-dessous' : 'Connectez-vous à votre espace'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Mon Entreprise SARL" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary hover:underline"
            >
              {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
            </button>
            <div>
              <Link to="/subscription" className="text-sm text-muted-foreground hover:underline">
                Voir les abonnements
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
