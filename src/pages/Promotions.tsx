import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Tag, Plus, Trash2, Percent, Banknote, Zap, Ticket, Copy, Power } from 'lucide-react';

interface Promotion {
  id: string; name: string; description: string;
  promo_type: 'percent' | 'fixed' | 'bogo' | 'flash';
  value: number; min_purchase: number; max_discount: number;
  starts_at: string; ends_at: string | null; apply_to: string;
  usage_limit: number; usage_count: number;
  is_active: boolean; auto_apply: boolean; priority: number;
}
interface PromoCode { id: string; promotion_id: string; code: string; usage_limit: number; usage_count: number; is_active: boolean; }

const typeMeta: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; suffix: string }> = {
  percent: { label: 'Pourcentage', icon: Percent, suffix: '%' },
  fixed: { label: 'Montant fixe', icon: Banknote, suffix: '' },
  bogo: { label: '1 acheté = 1 offert', icon: Tag, suffix: '' },
  flash: { label: 'Vente flash', icon: Zap, suffix: '%' },
};

export default function Promotions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [tab, setTab] = useState('promotions');

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Promotion | null>(null);
  const [name, setName] = useState(''); const [desc, setDesc] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed' | 'bogo' | 'flash'>('percent');
  const [value, setValue] = useState(''); const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [endsAt, setEndsAt] = useState(''); const [autoApply, setAutoApply] = useState(true);
  const [usageLimit, setUsageLimit] = useState('');

  const [codeOpen, setCodeOpen] = useState(false);
  const [codePromoId, setCodePromoId] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [codeLimit, setCodeLimit] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [p, c] = await Promise.all([
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.data) setPromotions(p.data as Promotion[]);
    if (c.data) setCodes(c.data as PromoCode[]);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const reset = () => {
    setEdit(null); setName(''); setDesc(''); setPromoType('percent');
    setValue(''); setMinPurchase(''); setMaxDiscount(''); setEndsAt('');
    setAutoApply(true); setUsageLimit('');
  };

  const openEdit = (p: Promotion) => {
    setEdit(p); setName(p.name); setDesc(p.description);
    setPromoType(p.promo_type); setValue(String(p.value));
    setMinPurchase(String(p.min_purchase || '')); setMaxDiscount(String(p.max_discount || ''));
    setEndsAt(p.ends_at ? p.ends_at.slice(0, 10) : '');
    setAutoApply(p.auto_apply); setUsageLimit(String(p.usage_limit || ''));
    setOpen(true);
  };

  const save = async () => {
    if (!user || !name.trim() || !value) { toast({ title: 'Champs requis', variant: 'destructive' }); return; }
    const payload = {
      user_id: user.id, name: name.trim(), description: desc,
      promo_type: promoType, value: Number(value) || 0,
      min_purchase: Number(minPurchase) || 0, max_discount: Number(maxDiscount) || 0,
      ends_at: endsAt ? new Date(endsAt + 'T23:59:59').toISOString() : null,
      auto_apply: autoApply, usage_limit: Number(usageLimit) || 0, is_active: true,
    };
    if (edit) {
      await supabase.from('promotions').update(payload as never).eq('id', edit.id);
      toast({ title: 'Promotion mise à jour' });
    } else {
      await supabase.from('promotions').insert(payload as never);
      toast({ title: 'Promotion créée' });
    }
    setOpen(false); reset(); fetchAll();
  };

  const toggle = async (p: Promotion) => {
    await supabase.from('promotions').update({ is_active: !p.is_active } as never).eq('id', p.id);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette promotion ?')) return;
    await supabase.from('promotions').delete().eq('id', id);
    fetchAll();
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
    setCodeValue(c);
  };

  const saveCode = async () => {
    if (!user || !codePromoId || !codeValue.trim()) { toast({ title: 'Champs requis', variant: 'destructive' }); return; }
    const { error } = await supabase.from('promo_codes').insert({
      user_id: user.id, promotion_id: codePromoId,
      code: codeValue.trim().toUpperCase(),
      usage_limit: Number(codeLimit) || 0, is_active: true,
    } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Code créé' });
    setCodeOpen(false); setCodePromoId(''); setCodeValue(''); setCodeLimit('');
    fetchAll();
  };

  const removeCode = async (id: string) => {
    if (!confirm('Supprimer ce code ?')) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    fetchAll();
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    toast({ title: 'Code copié' });
  };

  const isExpired = (p: Promotion) => p.ends_at && new Date(p.ends_at) < new Date();

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            Promotions & remises
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Créez des promotions automatiques ou avec code</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="promotions">Promotions ({promotions.length})</TabsTrigger>
            <TabsTrigger value="codes">Codes ({codes.length})</TabsTrigger>
          </TabsList>
          {tab === 'promotions' ? (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Nouvelle promo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{edit ? 'Modifier' : 'Nouvelle'} promotion</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nom *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Soldes janvier" /></div>
                  <div><Label>Description</Label><Textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Type *</Label>
                      <Select value={promoType} onValueChange={(v) => setPromoType(v as typeof promoType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(typeMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valeur * {promoType === 'percent' || promoType === 'flash' ? '(%)' : ''}</Label>
                      <Input type="number" min="0" value={value} onChange={e => setValue(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Achat min</Label><Input type="number" min="0" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} /></div>
                    <div><Label>Remise max</Label><Input type="number" min="0" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Date de fin</Label><Input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></div>
                    <div><Label>Limite usage (0 = illimité)</Label><Input type="number" min="0" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} /></div>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Application automatique</p>
                      <p className="text-xs text-muted-foreground">Sinon, requiert un code promo</p>
                    </div>
                    <Switch checked={autoApply} onCheckedChange={setAutoApply} />
                  </div>
                  <Button onClick={save} className="w-full">{edit ? 'Mettre à jour' : 'Créer'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={promotions.length === 0}><Plus className="w-4 h-4 mr-1.5" />Nouveau code</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Nouveau code promo</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Promotion liée *</Label>
                    <Select value={codePromoId} onValueChange={setCodePromoId}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {promotions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Code *</Label>
                    <div className="flex gap-2">
                      <Input value={codeValue} onChange={e => setCodeValue(e.target.value.toUpperCase())} placeholder="NOEL2026" className="uppercase" />
                      <Button type="button" variant="outline" onClick={generateCode}>Générer</Button>
                    </div>
                  </div>
                  <div><Label>Limite d'utilisation (0 = illimité)</Label><Input type="number" min="0" value={codeLimit} onChange={e => setCodeLimit(e.target.value)} /></div>
                  <Button onClick={saveCode} className="w-full">Créer le code</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="promotions" className="mt-0">
          {promotions.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune promotion. Créez-en une pour booster vos ventes.</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {promotions.map(p => {
                const meta = typeMeta[p.promo_type];
                const Icon = meta?.icon || Tag;
                const expired = isExpired(p);
                return (
                  <Card key={p.id} className={`hover:shadow-md transition-shadow ${!p.is_active || expired ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <p className="font-semibold truncate">{p.name}</p>
                          </div>
                          {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                        </div>
                        <Badge variant={expired ? 'destructive' : p.is_active ? 'default' : 'outline'} className="text-xs shrink-0">
                          {expired ? 'Expirée' : p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2 my-2">
                        <span className="text-2xl font-bold text-primary">
                          -{p.promo_type === 'fixed' ? displayAmount(Number(p.value)) : `${p.value}${meta?.suffix || ''}`}
                        </span>
                        {p.auto_apply ? (
                          <Badge variant="secondary" className="text-xs">Auto</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Sur code</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {p.min_purchase > 0 && <p>Min : {displayAmount(Number(p.min_purchase))}</p>}
                        {p.ends_at && <p>Fin : {new Date(p.ends_at).toLocaleDateString('fr-FR')}</p>}
                        <p>Utilisée : {p.usage_count}{p.usage_limit > 0 && ` / ${p.usage_limit}`}</p>
                      </div>
                      <div className="flex gap-1 mt-3 pt-3 border-t">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>Modifier</Button>
                        <Button size="sm" variant="ghost" onClick={() => toggle(p)}>
                          <Power className={`w-3.5 h-3.5 ${p.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="codes" className="mt-0">
          {codes.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun code promo</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {codes.map(c => {
                const promo = promotions.find(p => p.id === c.promotion_id);
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="bg-primary/10 text-primary font-mono font-bold px-2.5 py-1 rounded text-sm">{c.code}</code>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyCode(c.code)}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {promo?.name || 'Promotion supprimée'} • Utilisé : {c.usage_count}{c.usage_limit > 0 && ` / ${c.usage_limit}`}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeCode(c.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}