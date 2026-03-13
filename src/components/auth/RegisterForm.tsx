import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, User, Briefcase, Heart,
  Mail, Phone, MapPin, Globe, Lock, Eye, EyeOff,
  ArrowRight, ArrowLeft, Check, AlertCircle,
  Factory, Users, Wrench, Clock, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

type AccountType = 'enterprise' | 'freelance' | 'pme' | 'ong';

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  onSwitchToLogin: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const accountTypes: { value: AccountType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'enterprise', label: 'Entreprise', icon: <Building2 className="w-6 h-6" />, desc: 'Société établie avec des employés' },
  { value: 'freelance', label: 'Freelance', icon: <User className="w-6 h-6" />, desc: 'Travailleur indépendant' },
  { value: 'pme', label: 'PME / Startup', icon: <Briefcase className="w-6 h-6" />, desc: 'Petite ou moyenne entreprise' },
  { value: 'ong', label: 'Organisation / ONG', icon: <Heart className="w-6 h-6" />, desc: 'Organisation non gouvernementale' },
];

const sectors = ['BTP', 'Agriculture', 'Logistique', 'Nettoyage / Assainissement', 'Transport', 'Autre'];
const employeeCounts = ['1-10', '11-50', '51-200', '200+'];
const professions = ['Maçon', 'Électricien', 'Soudeur', "Conducteur d'engins", 'Technicien', 'Autre'];
const availabilities = ['Temps plein', 'Missions ponctuelles', 'Freelance'];

const stepLabels = ['Type de compte', 'Informations', 'Détails', 'Sécurité'];

// Validation schemas per step
const step1Schema = z.object({ accountType: z.string().min(1) });
const step2Schema = z.object({
  fullName: z.string().trim().min(2, 'Nom requis (min 2 caractères)').max(100),
  email: z.string().trim().email('Email invalide').max(255),
  phone: z.string().trim().min(6, 'Numéro requis').max(20),
  country: z.string().trim().min(2, 'Pays requis').max(60),
  city: z.string().trim().min(2, 'Ville requise').max(60),
  address: z.string().trim().max(200).optional(),
});
const step3EntSchema = z.object({
  companyName: z.string().trim().min(2, "Nom d'entreprise requis").max(100),
  sector: z.string().min(1, "Secteur requis"),
  employeeCount: z.string().min(1, "Nombre d'employés requis"),
  website: z.string().max(200).optional(),
});
const step3FreelanceSchema = z.object({
  profession: z.string().min(1, 'Profession requise'),
  experienceYears: z.string().min(1, "Années d'expérience requises"),
  skills: z.string().trim().min(2, 'Compétences requises').max(500),
  availability: z.string().min(1, 'Disponibilité requise'),
});
const step4Schema = z.object({
  password: z.string().min(6, 'Min 6 caractères'),
  confirmPassword: z.string().min(6, 'Confirmez le mot de passe'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions' }) }),
}).refine(d => d.password === d.confirmPassword, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] });

interface FormData {
  accountType: AccountType;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  companyName: string;
  sector: string;
  employeeCount: string;
  website: string;
  profession: string;
  experienceYears: string;
  skills: string;
  availability: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const initialData: FormData = {
  accountType: '' as AccountType,
  fullName: '', email: '', phone: '', country: '', city: '', address: '',
  companyName: '', sector: '', employeeCount: '', website: '',
  profession: '', experienceYears: '', skills: '', availability: '',
  password: '', confirmPassword: '', acceptTerms: false,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}

export default function RegisterForm({ onRegister, onSwitchToLogin, loading, setLoading }: RegisterFormProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = useCallback((field: keyof FormData, value: string | boolean) => {
    setData(d => ({ ...d, [field]: value }));
    setErrors(e => {
      const { [field]: _, ...rest } = e;
      return rest;
    });
  }, []);

  const isEnterprise = data.accountType === 'enterprise' || data.accountType === 'pme' || data.accountType === 'ong';
  const progress = ((step + 1) / 4) * 100;

  const validateStep = (): boolean => {
    let result: z.SafeParseReturnType<any, any>;
    if (step === 0) result = step1Schema.safeParse({ accountType: data.accountType });
    else if (step === 1) result = step2Schema.safeParse(data);
    else if (step === 2) {
      result = isEnterprise
        ? step3EntSchema.safeParse(data)
        : step3FreelanceSchema.safeParse(data);
    } else {
      result = step4Schema.safeParse(data);
    }

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        const key = e.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 3));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const displayName = isEnterprise ? data.companyName : data.fullName;
      const result = await onRegister(data.email, data.password, displayName);
      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      // Update profile with extra fields
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          full_name: data.fullName,
          company_name: isEnterprise ? data.companyName : data.fullName,
          phone: data.phone,
          address: data.address,
          account_type: data.accountType,
          country: data.country,
          city: data.city,
          sector: data.sector,
          employee_count: data.employeeCount,
          website: data.website,
          profession: data.profession,
          experience_years: data.experienceYears,
          skills: data.skills,
          availability: data.availability,
        } as any).eq('user_id', user.id);
      }

      if (result.needsConfirmation) {
        toast.success('Un email de confirmation vous a été envoyé.');
      } else {
        toast.success('Compte créé avec succès !');
      }
    } catch {
      toast.error('Une erreur est survenue');
    }
    setLoading(false);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);
  const goNext = () => { setDirection(1); next(); };
  const goPrev = () => { setDirection(-1); prev(); };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {/* Step 0: Account Type */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Type de compte</h2>
                <p className="text-sm text-muted-foreground">Sélectionnez le type qui correspond à votre activité</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {accountTypes.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('accountType', t.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      data.accountType === t.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className={`mb-2 ${data.accountType === t.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {t.icon}
                    </div>
                    <p className="font-semibold text-sm text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
              <FieldError message={errors.accountType && 'Veuillez sélectionner un type de compte'} />
            </div>
          )}

          {/* Step 1: General Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Informations principales</h2>
                <p className="text-sm text-muted-foreground">Renseignez vos coordonnées</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="fullName" value={data.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jean Dupont" className="pl-10" />
                  </div>
                  <FieldError message={errors.fullName} />
                </div>
                <div>
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="vous@entreprise.com" className="pl-10" />
                  </div>
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+225 07 00 00 00" className="pl-10" />
                  </div>
                  <FieldError message={errors.phone} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="country" value={data.country} onChange={e => update('country', e.target.value)} placeholder="Côte d'Ivoire" className="pl-10" />
                    </div>
                    <FieldError message={errors.country} />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="city" value={data.city} onChange={e => update('city', e.target.value)} placeholder="Abidjan" className="pl-10" />
                    </div>
                    <FieldError message={errors.city} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Adresse complète <span className="text-muted-foreground">(optionnel)</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="address" value={data.address} onChange={e => update('address', e.target.value)} placeholder="Rue, quartier..." className="pl-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Specific Info */}
          {step === 2 && isEnterprise && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Informations entreprise</h2>
                <p className="text-sm text-muted-foreground">Détails sur votre organisation</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="companyName" value={data.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Mon Entreprise SARL" className="pl-10" />
                  </div>
                  <FieldError message={errors.companyName} />
                </div>
                <div>
                  <Label>Secteur d'activité</Label>
                  <Select value={data.sector} onValueChange={v => update('sector', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Sélectionner un secteur" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.sector} />
                </div>
                <div>
                  <Label>Nombre d'employés</Label>
                  <Select value={data.employeeCount} onValueChange={v => update('employeeCount', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Sélectionner" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {employeeCounts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.employeeCount} />
                </div>
                <div>
                  <Label htmlFor="website">Site web <span className="text-muted-foreground">(optionnel)</span></Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="website" value={data.website} onChange={e => update('website', e.target.value)} placeholder="https://monentreprise.com" className="pl-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && !isEnterprise && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Informations freelance</h2>
                <p className="text-sm text-muted-foreground">Détails sur votre profil professionnel</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Profession</Label>
                  <Select value={data.profession} onValueChange={v => update('profession', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Sélectionner votre métier" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.profession} />
                </div>
                <div>
                  <Label htmlFor="experienceYears">Années d'expérience</Label>
                  <Input id="experienceYears" value={data.experienceYears} onChange={e => update('experienceYears', e.target.value)} placeholder="Ex: 5" />
                  <FieldError message={errors.experienceYears} />
                </div>
                <div>
                  <Label htmlFor="skills">Compétences principales</Label>
                  <Input id="skills" value={data.skills} onChange={e => update('skills', e.target.value)} placeholder="Ex: Soudure, électricité industrielle..." />
                  <FieldError message={errors.skills} />
                </div>
                <div>
                  <Label>Disponibilité</Label>
                  <Select value={data.availability} onValueChange={v => update('availability', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Sélectionner" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availabilities.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.availability} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Security */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Sécurité du compte</h2>
                <p className="text-sm text-muted-foreground">Créez un mot de passe sécurisé</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={data.password}
                      onChange={e => update('password', e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError message={errors.password} />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={data.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError message={errors.confirmPassword} />
                </div>

                {/* Password strength indicator */}
                {data.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          data.password.length >= i * 3 ? (
                            data.password.length >= 12 ? 'bg-green-500' :
                            data.password.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'
                          ) : 'bg-muted'
                        }`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.password.length < 6 ? 'Trop court' : data.password.length < 8 ? 'Faible' : data.password.length < 12 ? 'Moyen' : 'Fort'}
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={data.acceptTerms}
                    onCheckedChange={v => update('acceptTerms', !!v)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    J'accepte les <span className="text-primary underline">conditions d'utilisation</span> et la <span className="text-primary underline">politique de confidentialité</span>.
                  </label>
                </div>
                <FieldError message={errors.acceptTerms} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goPrev} className="flex-1" disabled={loading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" onClick={goNext} className="flex-1">
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} className="flex-1" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        En créant un compte, vous pourrez gérer vos équipes, missions et paiements sur SpeedWork.
      </p>

      <div className="text-center mt-4">
        <button type="button" onClick={onSwitchToLogin} className="text-sm text-primary hover:underline">
          Déjà un compte ? Se connecter
        </button>
      </div>
    </div>
  );
}
