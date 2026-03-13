import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, X, Sun, Moon, Monitor, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { currencies } from '@/lib/currencies';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { company, updateCompany } = useCompany();
  const { refreshRates } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.logoTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateCompany({ logo: ev.target?.result as string });
      toast.success(t('settings.logoUpdated'));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('settings.saved'));
  };

  const themeOptions = [
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
    { value: 'system', label: t('settings.themeSystem'), icon: Monitor },
  ];

  return (
    <div className="page-container">
      <h1 className="section-title mb-6">{t('settings.title')}</h1>
      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

        {/* Appearance & Language */}
        <div className="stat-card space-y-5">
          <h3 className="font-semibold text-foreground">{t('settings.appearance')}</h3>

          {/* Theme */}
          <div className="space-y-2">
            <Label>{t('settings.theme')}</Label>
            <div className="flex gap-2">
              {themeOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      theme === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {t('settings.language')}
            </Label>
            <div className="flex gap-2">
              {[
                { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
                { code: 'en' as const, label: 'English', flag: '🇬🇧' },
              ].map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    language === lang.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">{t('settings.company')}</h3>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>{t('settings.logo')}</Label>
            <div className="flex items-center gap-4">
              {company.logo ? (
                <div className="relative">
                  <img src={company.logo} alt="Logo" className="h-16 w-auto rounded-lg border border-border object-contain" />
                  <button
                    type="button"
                    onClick={() => updateCompany({ logo: undefined })}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  {t('settings.noLogo')}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />{t('settings.chooseFile')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('settings.companyName')}</Label>
              <Input value={company.name} onChange={e => updateCompany({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.email')}</Label>
              <Input value={company.email} onChange={e => updateCompany({ email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.phone')}</Label>
              <Input value={company.phone} onChange={e => updateCompany({ phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.address')}</Label>
              <Input value={company.address} onChange={e => updateCompany({ address: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.description')} <span className="text-muted-foreground text-xs">({t('settings.descriptionHint')})</span></Label>
            <Textarea
              value={company.description || ''}
              onChange={e => updateCompany({ description: e.target.value })}
              placeholder={t('settings.descriptionPlaceholder')}
              rows={2}
            />
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">{t('settings.banking')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>{t('settings.bankName')}</Label>
              <Input value={company.bankName || ''} onChange={e => updateCompany({ bankName: e.target.value })} placeholder={t('settings.bankNamePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN</Label>
              <Input value={company.iban || ''} onChange={e => updateCompany({ iban: e.target.value })} placeholder="FR76 XXXX XXXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>BIC</Label>
              <Input value={company.bic || ''} onChange={e => updateCompany({ bic: e.target.value })} placeholder="BNPAFRPP" />
            </div>
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground">{t('settings.billing')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div className="space-y-1.5">
              <Label>{t('settings.defaultTax')}</Label>
              <Input type="number" value={company.defaultTaxRate} onChange={e => updateCompany({ defaultTaxRate: Number(e.target.value) })} min={0} max={100} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.currency')}</Label>
              <Select value={company.currency || 'EUR'} onValueChange={v => { updateCompany({ currency: v }); refreshRates(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit"><Save className="w-4 h-4 mr-2" />{t('settings.save')}</Button>
        </div>
      </form>
    </div>
  );
}
