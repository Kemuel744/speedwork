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
import { useLanguage } from '@/contexts/LanguageContext';

type AccountType = 'enterprise' | 'freelance' | 'pme' | 'ong';

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  onSwitchToLogin: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

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
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [direction, setDirection] = useState(1);

  const accountTypes: { value: AccountType; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'enterprise', label: t('register.typeEnterprise'), icon: <Building2 className="w-6 h-6" />, desc: t('register.typeEnterpriseDesc') },
    { value: 'freelance', label: t('register.typeFreelance'), icon: <User className="w-6 h-6" />, desc: t('register.typeFreelanceDesc') },
    { value: 'pme', label: t('register.typePme'), icon: <Briefcase className="w-6 h-6" />, desc: t('register.typePmeDesc') },
    { value: 'ong', label: t('register.typeOng'), icon: <Heart className="w-6 h-6" />, desc: t('register.typeOngDesc') },
  ];

  const sectors = [
    { value: 'BTP', label: t('register.sectorBTP') },
    { value: 'Agriculture', label: t('register.sectorAgriculture') },
    { value: 'Logistique', label: t('register.sectorLogistics') },
    { value: 'Nettoyage / Assainissement', label: t('register.sectorCleaning') },
    { value: 'Transport', label: t('register.sectorTransport') },
    { value: 'Autre', label: t('register.sectorOther') },
  ];
  const employeeCounts = ['1-10', '11-50', '51-200', '200+'];
  const professions = [
    { value: 'Maçon', label: t('register.profMason') },
    { value: 'Électricien', label: t('register.profElectrician') },
    { value: 'Soudeur', label: t('register.profWelder') },
    { value: "Conducteur d'engins", label: t('register.profOperator') },
    { value: 'Technicien', label: t('register.profTechnician') },
    { value: 'Autre', label: t('register.profOther') },
  ];
  const availabilities = [
    { value: 'Temps plein', label: t('register.availFullTime') },
    { value: 'Missions ponctuelles', label: t('register.availMissions') },
    { value: 'Freelance', label: t('register.availFreelance') },
  ];

  const stepLabels = [t('register.stepType'), t('register.stepInfo'), t('register.stepDetails'), t('register.stepSecurity')];

  const update = useCallback((field: keyof FormData, value: string | boolean) => {
    setData(d => ({ ...d, [field]: value }));
    setErrors(e => { const { [field]: _, ...rest } = e; return rest; });
  }, []);

  const isEnterprise = data.accountType === 'enterprise' || data.accountType === 'pme' || data.accountType === 'ong';
  const progress = ((step + 1) / 4) * 100;

  const validateStep = (): boolean => {
    const step1Schema = z.object({ accountType: z.string().min(1) });
    const step2Schema = z.object({
      fullName: z.string().trim().min(2, t('register.nameRequired')).max(100),
      email: z.string().trim().email(t('register.emailInvalid')).max(255),
      phone: z.string().trim().min(6, t('register.phoneRequired')).max(20),
      country: z.string().trim().min(2, t('register.countryRequired')).max(60),
      city: z.string().trim().min(2, t('register.cityRequired')).max(60),
      address: z.string().trim().max(200).optional(),
    });
    const step3EntSchema = z.object({
      companyName: z.string().trim().min(2, t('register.companyRequired')).max(100),
      sector: z.string().min(1, t('register.sectorRequired')),
      employeeCount: z.string().min(1, t('register.employeeRequired')),
      website: z.string().max(200).optional(),
    });
    const step3FreelanceSchema = z.object({
      profession: z.string().min(1, t('register.professionRequired')),
      experienceYears: z.string().min(1, t('register.experienceRequired')),
      skills: z.string().trim().min(2, t('register.skillsRequired')).max(500),
      availability: z.string().min(1, t('register.availabilityRequired')),
    });
    const step4Schema = z.object({
      password: z.string().min(6, t('register.pwMin')),
      confirmPassword: z.string().min(6, t('register.pwConfirm')),
      acceptTerms: z.literal(true, { errorMap: () => ({ message: t('register.termsRequired') }) }),
    }).refine(d => d.password === d.confirmPassword, { message: t('register.pwMismatch'), path: ['confirmPassword'] });

    let result: z.SafeParseReturnType<any, any>;
    if (step === 0) result = step1Schema.safeParse({ accountType: data.accountType });
    else if (step === 1) result = step2Schema.safeParse(data);
    else if (step === 2) {
      result = isEnterprise ? step3EntSchema.safeParse(data) : step3FreelanceSchema.safeParse(data);
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

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));
  const goNext = () => { setDirection(1); next(); };
  const goPrev = () => { setDirection(-1); prev(); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const displayName = isEnterprise ? data.companyName : data.fullName;
      const result = await onRegister(data.email, data.password, displayName);
      if (!result.success) {
        toast.error(result.error || t('register.errorGeneric'));
        setLoading(false);
        return;
      }

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
        toast.success(t('register.emailSent'));
      } else {
        toast.success(t('register.success'));
      }
    } catch {
      toast.error(t('register.genericError'));
    }
    setLoading(false);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

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
                <h2 className="text-xl font-bold text-foreground">{t('register.stepType')}</h2>
                <p className="text-sm text-muted-foreground">{t('register.selectType')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {accountTypes.map(at => (
                  <button
                    key={at.value}
                    type="button"
                    onClick={() => update('accountType', at.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      data.accountType === at.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className={`mb-2 ${data.accountType === at.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {at.icon}
                    </div>
                    <p className="font-semibold text-sm text-foreground">{at.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{at.desc}</p>
                  </button>
                ))}
              </div>
              <FieldError message={errors.accountType && t('register.selectTypeError')} />
            </div>
          )}

          {/* Step 1: General Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('register.mainInfo')}</h2>
                <p className="text-sm text-muted-foreground">{t('register.mainInfoDesc')}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">{t('register.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="fullName" value={data.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jean Dupont" className="pl-10" />
                  </div>
                  <FieldError message={errors.fullName} />
                </div>
                <div>
                  <Label htmlFor="email">{t('register.proEmail')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com" className="pl-10" />
                  </div>
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <Label htmlFor="phone">{t('register.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+225 07 00 00 00" className="pl-10" />
                  </div>
                  <FieldError message={errors.phone} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="country">{t('register.country')}</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="country" value={data.country} onChange={e => update('country', e.target.value)} placeholder="Congo" className="pl-10" />
                    </div>
                    <FieldError message={errors.country} />
                  </div>
                  <div>
                    <Label htmlFor="city">{t('register.city')}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="city" value={data.city} onChange={e => update('city', e.target.value)} placeholder="Brazzaville" className="pl-10" />
                    </div>
                    <FieldError message={errors.city} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">{t('register.fullAddress')} <span className="text-muted-foreground">({t('register.optional')})</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="address" value={data.address} onChange={e => update('address', e.target.value)} placeholder="..." className="pl-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Enterprise */}
          {step === 2 && isEnterprise && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('register.enterpriseInfo')}</h2>
                <p className="text-sm text-muted-foreground">{t('register.enterpriseInfoDesc')}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyName">{t('register.companyName')}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="companyName" value={data.companyName} onChange={e => update('companyName', e.target.value)} placeholder="My Company SARL" className="pl-10" />
                  </div>
                  <FieldError message={errors.companyName} />
                </div>
                <div>
                  <Label>{t('register.sector')}</Label>
                  <Select value={data.sector} onValueChange={v => update('sector', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder={t('register.selectSector')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.sector} />
                </div>
                <div>
                  <Label>{t('register.employeeCount')}</Label>
                  <Select value={data.employeeCount} onValueChange={v => update('employeeCount', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder={t('register.select')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {employeeCounts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.employeeCount} />
                </div>
                <div>
                  <Label htmlFor="website">{t('register.website')} <span className="text-muted-foreground">({t('register.optional')})</span></Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="website" value={data.website} onChange={e => update('website', e.target.value)} placeholder="https://mycompany.com" className="pl-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Freelance */}
          {step === 2 && !isEnterprise && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('register.freelanceInfo')}</h2>
                <p className="text-sm text-muted-foreground">{t('register.freelanceInfoDesc')}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t('register.profession')}</Label>
                  <Select value={data.profession} onValueChange={v => update('profession', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder={t('register.selectProfession')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.profession} />
                </div>
                <div>
                  <Label htmlFor="experienceYears">{t('register.experience')}</Label>
                  <Input id="experienceYears" value={data.experienceYears} onChange={e => update('experienceYears', e.target.value)} placeholder="Ex: 5" />
                  <FieldError message={errors.experienceYears} />
                </div>
                <div>
                  <Label htmlFor="skills">{t('register.skills')}</Label>
                  <Input id="skills" value={data.skills} onChange={e => update('skills', e.target.value)} placeholder={t('register.skillsPlaceholder')} />
                  <FieldError message={errors.skills} />
                </div>
                <div>
                  <Label>{t('register.availability')}</Label>
                  <Select value={data.availability} onValueChange={v => update('availability', v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder={t('register.select')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availabilities.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
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
                <h2 className="text-xl font-bold text-foreground">{t('register.securityTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('register.securityDesc')}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="password">{t('register.password')}</Label>
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
                  <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
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
                      {data.password.length < 6 ? t('register.pwTooShort') : data.password.length < 8 ? t('register.pwWeak') : data.password.length < 12 ? t('register.pwMedium') : t('register.pwStrong')}
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
                    {t('register.acceptTerms')} <span className="text-primary underline">{t('register.terms')}</span> {t('register.and')} <span className="text-primary underline">{t('register.privacy')}</span>.
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
            {t('register.back')}
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" onClick={goNext} className="flex-1">
            {t('common.continue')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} className="flex-1" disabled={loading}>
            {loading ? t('register.creating') : t('register.createAccount')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        {t('register.accountFooter')}
      </p>

      <div className="text-center mt-4">
        <button type="button" onClick={onSwitchToLogin} className="text-sm text-primary hover:underline">
          {t('register.hasAccount')}
        </button>
      </div>
    </div>
  );
}
