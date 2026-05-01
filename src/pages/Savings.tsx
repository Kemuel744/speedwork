import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, TrendingUp, Wallet, Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';

type DepositType = 'business_savings' | 'personal_withdrawal';

interface Deposit {
  id: string;
  amount: number;
  deposit_date: string;
  deposit_type: DepositType;
  bank: string | null;
  note: string | null;
  created_at: string;
}

interface Summary {
  revenue: number;
  purchases: number;
  expenses: number;
  returns: number;
  total_profit: number;
  total_deposits: number;
  business_savings: number;
  personal_withdrawals: number;
  available_profit: number;
}

const TYPE_LABEL: Record<DepositType, string> = {
  business_savings: 'Épargne entreprise',
  personal_withdrawal: 'Retrait personnel',
};

export default function Savings() {
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    const v = localStorage.getItem('savings_goal');
    return v ? Number(v) : 0;
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deposit | null>(null);
  const [form, setForm] = useState({
    amount: '',
    deposit_date: new Date().toISOString().slice(0, 10),
    deposit_type: 'business_savings' as DepositType,
    bank: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: dep, error: e1 }, { data: sum, error: e2 }] = await Promise.all([
      supabase.from('deposits').select('*').order('deposit_date', { ascending: false }),
      supabase.rpc('get_savings_summary', { _start: null, _end: null }),
    ]);
    if (e1) toast({ title: 'Erreur', description: e1.message, variant: 'destructive' });
    else setDeposits((dep as Deposit[]) || []);
    if (e2) toast({ title: 'Erreur', description: e2.message, variant: 'destructive' });
    else if (sum && typeof sum === 'object') setSummary(sum as unknown as Summary);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      amount: '',
      deposit_date: new Date().toISOString().slice(0, 10),
      deposit_type: 'business_savings',
      bank: '',
      note: '',
    });
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (d: Deposit) => {
    setEditing(d);
    setForm({
      amount: String(d.amount),
      deposit_date: d.deposit_date,
      deposit_type: d.deposit_type,
      bank: d.bank ?? '',
      note: d.note ?? '',
    });
    setOpen(true);
  };

  const available = summary?.available_profit ?? 0;

  const handleSubmit = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) {
      toast({ title: 'Montant invalide', variant: 'destructive' });
      return;
    }
    // Bénéfice disponible recalculé sans le dépôt en cours d'édition
    const adjustedAvailable = available + (editing ? Number(editing.amount) : 0);
    if (amt > adjustedAvailable) {
      toast({
        title: 'Montant supérieur au bénéfice disponible',
        description: `Disponible : ${displayAmount(adjustedAvailable)}`,
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const payload = {
      user_id: user.id,
      amount: amt,
      deposit_date: form.deposit_date,
      deposit_type: form.deposit_type,
      bank: form.bank.trim() || null,
      note: form.note.trim() || null,
    };

    const { error } = editing
      ? await supabase.from('deposits').update(payload).eq('id', editing.id)
      : await supabase.from('deposits').insert(payload);

    setSubmitting(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing ? 'Dépôt modifié' : 'Dépôt enregistré' });
    setOpen(false);
    resetForm();
    loadAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce dépôt ?')) return;
    const { error } = await supabase.from('deposits').delete().eq('id', id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Dépôt supprimé' });
    loadAll();
  };

  const filtered = useMemo(() => {
    return deposits.filter(d => {
      if (filterFrom && d.deposit_date < filterFrom) return false;
      if (filterTo && d.deposit_date > filterTo) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${d.bank ?? ''} ${d.note ?? ''} ${TYPE_LABEL[d.deposit_type]}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [deposits, search, filterFrom, filterTo]);

  const goalProgress = savingsGoal > 0 ? Math.min(100, ((summary?.business_savings ?? 0) / savingsGoal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bénéfice total</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayAmount(summary?.total_profit ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ventes − dépenses − achats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total épargné</CardTitle>
            <PiggyBank className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayAmount(summary?.total_deposits ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Entreprise : {displayAmount(summary?.business_savings ?? 0)} · Perso : {displayAmount(summary?.personal_withdrawals ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bénéfice disponible</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${available < 0 ? 'text-destructive' : ''}`}>
              {displayAmount(available)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Reste à épargner ou dépenser</p>
          </CardContent>
        </Card>
      </div>

      {available < 0 && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Vos dépôts dépassent votre bénéfice. Vérifiez vos enregistrements.</span>
        </div>
      )}

      {/* Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objectif d'épargne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Label htmlFor="goal">Objectif (montant)</Label>
              <Input
                id="goal"
                type="number"
                min="0"
                value={savingsGoal || ''}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setSavingsGoal(v);
                  localStorage.setItem('savings_goal', String(v));
                }}
                placeholder="Ex: 1000000"
              />
            </div>
            <div className="text-sm text-muted-foreground sm:pb-2">
              {savingsGoal > 0
                ? `${displayAmount(summary?.business_savings ?? 0)} / ${displayAmount(savingsGoal)}`
                : 'Définissez un objectif'}
            </div>
          </div>
          {savingsGoal > 0 && (
            <div>
              <Progress value={goalProgress} />
              <p className="text-xs text-muted-foreground mt-1">{goalProgress.toFixed(1)}% atteint</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (banque, note, type)"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="sm:w-40" />
          <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="sm:w-40" />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau dépôt
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun dépôt</TableCell></TableRow>
              ) : filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.deposit_date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="font-medium">{displayAmount(Number(d.amount))}</TableCell>
                  <TableCell>
                    <Badge variant={d.deposit_type === 'business_savings' ? 'default' : 'secondary'}>
                      {TYPE_LABEL[d.deposit_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{d.bank || '—'}</TableCell>
                  <TableCell className="max-w-xs truncate">{d.note || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(d)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le dépôt' : 'Nouveau dépôt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount">Montant *</Label>
              <Input id="amount" type="number" min="0" step="any" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">
                Bénéfice disponible : {displayAmount(available + (editing ? Number(editing.amount) : 0))}
              </p>
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={form.deposit_date}
                onChange={(e) => setForm({ ...form, deposit_date: e.target.value })} />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={form.deposit_type} onValueChange={(v) => setForm({ ...form, deposit_type: v as DepositType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_savings">Épargne entreprise</SelectItem>
                  <SelectItem value="personal_withdrawal">Retrait personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bank">Banque</Label>
              <Input id="bank" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })}
                placeholder="Ex: Ecobank, UBA…" />
            </div>
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Enregistrement…' : editing ? 'Modifier' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
