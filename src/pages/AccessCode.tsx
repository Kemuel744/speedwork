import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import speedworkLogo from '@/assets/logo.webp';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AccessCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (code.length < 6) {
      toast.error('Veuillez entrer un code à 6 chiffres');
      return;
    }

    if (attempts >= 5) {
      toast.error('Trop de tentatives. Réessayez plus tard.');
      return;
    }

    setLoading(true);
    setAttempts((prev) => prev + 1);

    try {
      const { data, error } = await supabase.functions.invoke('verify-access-code', {
        body: { code },
      });

      if (error || !data?.valid) {
        const message = data?.error || 'Code invalide ou expiré.';
        toast.error(message);
        setCode('');
        return;
      }

      toast.success('Code validé ! Bienvenue sur SpeedWork.');
      navigate('/login');
    } catch {
      toast.error('Erreur de connexion. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={speedworkLogo} alt="SpeedWork" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">SpeedWork</span>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Entrez votre code d'accès</h1>
          <p className="text-muted-foreground text-sm">
            Saisissez le code à 6 chiffres reçu après votre paiement par SMS ou email.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length < 6 || loading || attempts >= 5}
            className="w-full h-11 font-semibold"
          >
            {loading ? 'Vérification...' : 'Activer mon compte'}
          </Button>

          {attempts >= 5 && (
            <p className="text-xs text-destructive text-center mt-3">
              Nombre maximum de tentatives atteint. Réessayez plus tard.
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center mt-4">
            Vous n'avez pas reçu de code ? Vérifiez vos SMS ou contactez le support.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6">
          <button
            onClick={() => navigate('/subscription')}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux abonnements
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-muted-foreground hover:underline"
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
