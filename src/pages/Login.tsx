import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login, register, user } = useAuth();
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
        await register(email, password, name);
        toast.success('Compte créé avec succès !');
      } else {
        const ok = await login(email, password);
        if (!ok) {
          toast.error('Email ou mot de passe incorrect');
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

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
        <div className="relative z-10 text-primary-foreground max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">SpeedWork</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Gérez vos factures et devis en toute simplicité</h1>
          <p className="text-primary-foreground/80 text-lg">
            Une solution professionnelle pour créer, suivre et gérer tous vos documents commerciaux.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
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
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Marie Dupont" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary hover:underline"
            >
              {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
            </button>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-secondary border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Comptes de démo :</p>
            <p className="text-xs text-muted-foreground">Admin : <span className="text-foreground font-medium">admin@speedwork.com</span></p>
            <p className="text-xs text-muted-foreground">Client : <span className="text-foreground font-medium">client@example.com</span></p>
            <p className="text-xs text-muted-foreground mt-1">Mot de passe : n'importe lequel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
