import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Award, Gift, Users, Sparkles, TrendingUp, Plus, Save, Star } from 'lucide-react';

interface Program {
  id: string; name: string; description: string;
  points_per_currency: number; currency_per_point: number;
  spend_threshold: number; min_redemption_points: number;
  max_redemption_pct: number; expiry_months: number; is_active: boolean;
}
interface Customer {
  id: string; name: string; phone: string; loyalty_points: number; lifetime_points: number; lifetime_spent: number;
}
interface Txn {
  id: string; customer_id: string; transaction_type: string; points: number; description: string; created_at: string;
}

const txnLabels: Record<string, { label: string; color: string }> = {
  earn: { label: 'Gain', color: 'text-green-600' },
  redeem: { label: 'Utilisation', color: 'text-orange-600' },
  adjust: { label: 'Ajustement', color: 'text-blue-600' },
  expire: { label: 'Expiration', color: 'text-muted-foreground' },
};

export default function Loyalty() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const [program, setProgram] = useState<Program | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);

  // form
  const [name, setName] = useState('Programme Fidélité');
  const [desc, setDesc] = useState('');
  const [ppc, setPpc] = useState('1');
  const [cpp, setCpp] = useState('1');
  const [threshold, setThreshold] = useState('100');
  const [minRedeem, setMinRedeem] = useState('50');
  const [maxPct, setMaxPct] = useState('50');
  const [expiry, setExpiry] = useState('12');
  const [active, setActive] = useState(true);

  // adjust modal
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjCustomer, setAdjCustomer] = useState('');
  const [adjPoints, setAdjPoints] = useState('');
  const [adjType, setAdjType] = useState<'earn' | 'adjust' | 'redeem'>('earn');
  const [adjDesc, setAdjDesc] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [pg, cs, tx] = await Promise.all([
      supabase.from('loyalty_programs').select('*').limit(1).maybeSingle(),
      supabase.from('customers').select('id,name,phone,loyalty_points,lifetime_points,lifetime_spent').order('loyalty_points', { ascending: false }),
      supabase.from('loyalty_transactions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (pg.data) {
      const p = pg.data as Program;
      setProgram(p);
      setName(p.name); setDesc(p.description);
      setPpc(String(p.points_per_currency)); setCpp(String(p.currency_per_point));
      setThreshold(String(p.spend_threshold)); setMinRedeem(String(p.min_redemption_points));
      setMaxPct(String(p.max_redemption_pct)); setExpiry(String(p.expiry_months));
      setActive(p.is_active);
    }
    if (cs.data) setCustomers(cs.data as Customer[]);
    if (tx.data) setTxns(tx.data as Txn[]);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveProgram = async () => {
    if (!user) return;
    const payload = {
      user_id: user.id, name: name.trim() || 'Programme Fidélité', description: desc,
      points_per_currency: Number(ppc) || 1, currency_per_point: Number(cpp) || 1,
      spend_threshold: Number(threshold) || 1, min_redemption_points: Number(minRedeem) || 0,
      max_redemption_pct: Math.min(100, Number(maxPct) || 0), expiry_months: Number(expiry) || 0,
      is_active: active,
    };
    if (program) {
      await supabase.from('loyalty_programs').update(payload as never).eq('id', program.id);
    } else {
      await supabase.from('loyalty_programs').insert(payload as never);
    }
    toast({ title: 'Programme enregistré' });
    fetchAll();
  };

  const adjustPoints = async () => {
    if (!user || !adjCustomer || !adjPoints) { toast({ title: 'Champs requis', variant: 'destructive' }); return; }
    const pts = Number(adjPoints);
    if (pts === 0) return;
    const { error } = await supabase.from('loyalty_transactions').insert({
      user_id: user.id, customer_id: adjCustomer,
      transaction_type: adjType, points: adjType === 'redeem' ? -Math.abs(pts) : pts,
      description: adjDesc || `Ajustement manuel`,
    } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Points ajustés' });
    setAdjOpen(false); setAdjCustomer(''); setAdjPoints(''); setAdjDesc(''); setAdjType('earn');
    fetchAll();
  };

  const totalPoints = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0);
  const topCustomers = customers.slice(0, 5);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            Programme de fidélité
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Récompensez vos clients réguliers et augmentez leur panier moyen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Points en circulation</p>
              <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
            </div>
            <Sparkles className="w-8 h-8 text-primary/30" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Valeur estimée</p>
              <p className="text-2xl font-bold">{displayAmount(totalPoints * (Number(cpp) || 1))}</p>
            </div>
            <Gift className="w-8 h-8 text-orange-500/30" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Membres actifs</p>
              <p className="text-2xl font-bold">{customers.filter(c => c.loyalty_points > 0).length}</p>
            </div>
            <Users className="w-8 h-8 text-primary/30" />
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Configuration</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Programme actif</p>
                  <p className="text-xs text-muted-foreground">Les points sont attribués automatiquement à chaque vente</p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
              <div><Label>Nom du programme</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Affichée sur les tickets…" /></div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Points gagnés</Label>
                  <Input type="number" min="0" step="0.1" value={ppc} onChange={e => setPpc(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Points par tranche dépensée</p>
                </div>
                <div>
                  <Label className="text-xs">Tranche (en devise)</Label>
                  <Input type="number" min="1" value={threshold} onChange={e => setThreshold(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ex: 100 = 1 pt par 100</p>
                </div>
              </div>

              <div>
                <Label className="text-xs">Valeur d'un point (en devise)</Label>
                <Input type="number" min="0" step="0.01" value={cpp} onChange={e => setCpp(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-0.5">Combien vaut 1 point en remise</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Min. utilisation</Label><Input type="number" min="0" value={minRedeem} onChange={e => setMinRedeem(e.target.value)} /></div>
                <div><Label className="text-xs">Max % panier</Label><Input type="number" min="0" max="100" value={maxPct} onChange={e => setMaxPct(e.target.value)} /></div>
                <div><Label className="text-xs">Expire (mois)</Label><Input type="number" min="0" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">📊 Aperçu</p>
                <p className="text-xs text-muted-foreground">
                  Pour {displayAmount(Number(threshold) || 1)} dépensés : <strong className="text-foreground">{ppc} pt(s)</strong><br />
                  {minRedeem} pts = {displayAmount(Number(minRedeem) * (Number(cpp) || 1))} de remise
                </p>
              </div>

              <Button onClick={saveProgram} className="w-full"><Save className="w-4 h-4 mr-1.5" />Enregistrer</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Top 5 clients</h2>
                <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={customers.length === 0}><Plus className="w-3.5 h-3.5 mr-1" />Ajuster</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Ajuster les points</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Client *</Label>
                        <Select value={adjCustomer} onValueChange={setAdjCustomer}>
                          <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                          <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.loyalty_points} pts)</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={adjType} onValueChange={(v) => setAdjType(v as typeof adjType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="earn">Ajouter (gain)</SelectItem>
                            <SelectItem value="redeem">Retirer (utilisation)</SelectItem>
                            <SelectItem value="adjust">Correction manuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Points *</Label>
                        <Input type="number" min="0" value={adjPoints} onChange={e => setAdjPoints(e.target.value)} />
                      </div>
                      <div><Label>Motif</Label><Textarea rows={2} value={adjDesc} onChange={e => setAdjDesc(e.target.value)} /></div>
                      <Button onClick={adjustPoints} className="w-full">Valider</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun client</p>
              ) : (
                <div className="space-y-2">
                  {topCustomers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">Total : {c.lifetime_points} pts</p>
                      </div>
                      <Badge variant="secondary" className="font-mono">{c.loyalty_points}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold mb-3">Dernières transactions</h2>
              {txns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {txns.slice(0, 10).map(t => {
                    const meta = txnLabels[t.transaction_type] || txnLabels.adjust;
                    const cust = customers.find(c => c.id === t.customer_id);
                    return (
                      <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{cust?.name || '?'}</p>
                          <p className="text-[11px] text-muted-foreground">{meta.label} • {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <span className={`font-bold font-mono ${meta.color}`}>{t.points > 0 ? '+' : ''}{t.points}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}