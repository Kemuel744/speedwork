import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('profile.saved'));
  };

  return (
    <div className="page-container">
      <h1 className="section-title mb-6">{t('profile.title')}</h1>
      <form onSubmit={handleSave} className="stat-card max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('profile.name')}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('profile.email')}</Label>
            <Input value={email} disabled className="opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label>{t('profile.phone')}</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('profile.address')}</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit"><Save className="w-4 h-4 mr-2" />{t('common.save')}</Button>
        </div>
      </form>
    </div>
  );
}
