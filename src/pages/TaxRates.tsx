import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Percent, Save } from 'lucide-react';

interface TaxRate {
  id: string; name: string; rate: number; is_default: boolean; is_active: boolean;
}

export default function TaxRates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', rate: 0, is_default: false, is_active: true });

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('tax_rates').select('*').eq('user_id', user.id).order('rate');
    setRates((data as TaxRate[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!user || !form.name.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    if (form.is_default) {
      await supabase.from('tax_rates').update({ is_default: false }).eq('user_id', user.id);
    }
    const { error } = await supabase.from('tax_rates').insert({ ...form, user_id: user.id });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Taux enregistré' });
      setOpen(false); setForm({ name: '', rate: 0, is_default: false, is_active: true });
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce taux ?')) return;
    await supabase.from('tax_rates').delete().eq('id', id);
    load();
  };

  const toggleActive = async (r: TaxRate) => {
    await supabase.from('tax_rates').update({ is_active: !r.is_active }).eq('id', r.id);
    load();
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Taux de TVA</h1>
          <p className="text-muted-foreground text-sm">Configurez les taux applicables à vos ventes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nouveau taux</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau taux de TVA</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom (ex: TVA standard, Exonéré)</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Taux (%)</Label>
                <Input type="number" step="0.01" value={form.rate}
                  onChange={e => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Taux par défaut</Label>
                <Switch checked={form.is_default} onCheckedChange={v => setForm({ ...form, is_default: v })} />
              </div>
              <Button onClick={save} className="w-full"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rates.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{r.name}</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">{r.rate}%</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {r.is_default && <Badge>Par défaut</Badge>}
                  <Badge variant={r.is_active ? 'default' : 'outline'}>{r.is_active ? 'Actif' : 'Inactif'}</Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => toggleActive(r)} className="flex-1">
                  {r.is_active ? 'Désactiver' : 'Activer'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rates.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun taux de TVA configuré. Cliquez sur "Nouveau taux" pour commencer.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}