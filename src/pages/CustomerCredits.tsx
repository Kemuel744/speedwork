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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Plus, Users, Wallet, Phone, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface Customer {
  id: string; name: string; phone: string; email: string; city: string; address: string;
  credit_limit: number; current_balance: number; notes: string; is_active: boolean;
}
interface Credit {
  id: string; number: string; customer_id: string; sale_id: string | null;
  initial_amount: number; remaining_amount: number; due_date: string | null;
  status: 'open' | 'partial' | 'paid' | 'overdue' | 'cancelled'; notes: string; created_at: string;
}

const statusMeta: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  open: { label: 'Ouvert', variant: 'outline' },
  partial: { label: 'Partiel', variant: 'secondary' },
  paid: { label: 'Payé', variant: 'default' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulé', variant: 'outline' },
};

export default function CustomerCredits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [tab, setTab] = useState('credits');

  // Customer form
  const [custOpen, setCustOpen] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [cName, setCName] = useState(''); const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState(''); const [cCity, setCCity] = useState('');
  const [cAddress, setCAddress] = useState(''); const [cLimit, setCLimit] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Credit form
  const [creOpen, setCreOpen] = useState(false);
  const [crCustomer, setCrCustomer] = useState('');
  const [crAmount, setCrAmount] = useState('');
  const [crDue, setCrDue] = useState('');
  const [crNotes, setCrNotes] = useState('');

  // Payment form
  const [payCredit, setPayCredit] = useState<Credit | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [c, cr] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('customer_credits').select('*').order('created_at', { ascending: false }),
    ]);
    if (c.data) setCustomers(c.data as Customer[]);
    if (cr.data) setCredits(cr.data as Credit[]);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetCust = () => {
    setEditCust(null);
    setCName(''); setCPhone(''); setCEmail(''); setCCity(''); setCAddress(''); setCLimit(''); setCNotes('');
  };

  const openEditCust = (c: Customer) => {
    setEditCust(c);
    setCName(c.name); setCPhone(c.phone); setCEmail(c.email); setCCity(c.city);
    setCAddress(c.address); setCLimit(String(c.credit_limit || '')); setCNotes(c.notes);
    setCustOpen(true);
  };

  const saveCust = async () => {
    if (!user || !cName.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    const payload = {
      user_id: user.id, name: cName.trim(), phone: cPhone, email: cEmail,
      city: cCity, address: cAddress, credit_limit: Number(cLimit) || 0, notes: cNotes,
    };
    if (editCust) {
      await supabase.from('customers').update(payload as never).eq('id', editCust.id);
      toast({ title: 'Client mis à jour' });
    } else {
      await supabase.from('customers').insert(payload as never);
      toast({ title: 'Client créé' });
    }
    setCustOpen(false); resetCust(); fetchAll();
  };

  const removeCust = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    await supabase.from('customers').delete().eq('id', id);
    fetchAll();
  };

  const createCredit = async () => {
    if (!user || !crCustomer || !crAmount) { toast({ title: 'Champs requis', variant: 'destructive' }); return; }
    const amount = Number(crAmount);
    if (amount <= 0) { toast({ title: 'Montant invalide', variant: 'destructive' }); return; }
    const { data: numData } = await supabase.rpc('generate_credit_number', { _user_id: user.id });
    const number = numData || `CR-${Date.now()}`;
    const { error } = await supabase.from('customer_credits').insert({
      user_id: user.id, number, customer_id: crCustomer,
      initial_amount: amount, remaining_amount: amount,
      due_date: crDue || null, notes: crNotes, status: 'open',
    } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Crédit ${number} créé` });
    setCreOpen(false); setCrCustomer(''); setCrAmount(''); setCrDue(''); setCrNotes('');
    fetchAll();
  };

  const recordPayment = async () => {
    if (!user || !payCredit) return;
    const amount = Number(payAmount);
    if (amount <= 0 || amount > payCredit.remaining_amount) {
      toast({ title: 'Montant invalide', description: `Max: ${displayAmount(payCredit.remaining_amount)}`, variant: 'destructive' });
      return;
    }
    const { data: sess } = await supabase.from('cash_sessions').select('id').eq('status', 'open').maybeSingle();
    const { error } = await supabase.from('customer_credit_payments').insert({
      user_id: user.id, credit_id: payCredit.id, amount, payment_method: payMethod,
      session_id: sess?.id || null, notes: payNotes,
    } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Paiement enregistré' });
    setPayCredit(null); setPayAmount(''); setPayMethod('cash'); setPayNotes('');
    fetchAll();
  };

  const totalDebt = customers.reduce((s, c) => s + Number(c.current_balance || 0), 0);
  const openCredits = credits.filter(c => c.status !== 'paid' && c.status !== 'cancelled');

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            Crédit clients & dettes
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Gérez vos clients à crédit et suivez leurs remboursements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Dette totale</p>
              <p className="text-2xl font-bold text-destructive">{displayAmount(totalDebt)}</p>
            </div>
            <Wallet className="w-8 h-8 text-destructive/30" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Crédits ouverts</p>
              <p className="text-2xl font-bold">{openCredits.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500/30" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Clients</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary/30" />
          </div>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="credits">Crédits ({credits.length})</TabsTrigger>
            <TabsTrigger value="customers">Clients ({customers.length})</TabsTrigger>
          </TabsList>
          {tab === 'credits' ? (
            <Dialog open={creOpen} onOpenChange={setCreOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={customers.length === 0}><Plus className="w-4 h-4 mr-1.5" />Nouveau crédit</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Enregistrer un crédit</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Client *</Label>
                    <Select value={crCustomer} onValueChange={setCrCustomer}>
                      <SelectTrigger><SelectValue placeholder="Choisir un client" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.phone && ` (${c.phone})`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Montant dû *</Label>
                    <Input type="number" min="0" value={crAmount} onChange={e => setCrAmount(e.target.value)} />
                  </div>
                  <div>
                    <Label>Échéance</Label>
                    <Input type="date" value={crDue} onChange={e => setCrDue(e.target.value)} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea rows={2} value={crNotes} onChange={e => setCrNotes(e.target.value)} />
                  </div>
                  <Button onClick={createCredit} className="w-full">Enregistrer</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={custOpen} onOpenChange={(v) => { setCustOpen(v); if (!v) resetCust(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Nouveau client</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editCust ? 'Modifier' : 'Nouveau'} client</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nom *</Label><Input value={cName} onChange={e => setCName(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Téléphone</Label><Input value={cPhone} onChange={e => setCPhone(e.target.value)} /></div>
                    <div><Label>Email</Label><Input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Ville</Label><Input value={cCity} onChange={e => setCCity(e.target.value)} /></div>
                    <div><Label>Plafond crédit</Label><Input type="number" min="0" value={cLimit} onChange={e => setCLimit(e.target.value)} /></div>
                  </div>
                  <div><Label>Adresse</Label><Input value={cAddress} onChange={e => setCAddress(e.target.value)} /></div>
                  <div><Label>Notes</Label><Textarea rows={2} value={cNotes} onChange={e => setCNotes(e.target.value)} /></div>
                  <Button onClick={saveCust} className="w-full">{editCust ? 'Mettre à jour' : 'Créer'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="credits" className="mt-0">
          {credits.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun crédit</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {credits.map(cr => {
                const cust = customers.find(c => c.id === cr.customer_id);
                const meta = statusMeta[cr.status] || statusMeta.open;
                const isOverdue = cr.due_date && new Date(cr.due_date) < new Date() && cr.remaining_amount > 0;
                return (
                  <Card key={cr.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-semibold">{cr.number}</span>
                            <Badge variant={isOverdue ? 'destructive' : meta.variant} className="text-xs">
                              {isOverdue ? 'En retard' : meta.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-1">{cust?.name || '?'}</p>
                          <p className="text-xs text-muted-foreground">
                            Initial: {displayAmount(Number(cr.initial_amount))} • Reste: <span className="font-bold text-destructive">{displayAmount(Number(cr.remaining_amount))}</span>
                            {cr.due_date && ` • Échéance ${new Date(cr.due_date).toLocaleDateString('fr-FR')}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {cr.remaining_amount > 0 && cr.status !== 'cancelled' && (
                            <Button size="sm" onClick={() => { setPayCredit(cr); setPayAmount(String(cr.remaining_amount)); }}>
                              <Wallet className="w-3.5 h-3.5 mr-1" />Encaisser
                            </Button>
                          )}
                          {cr.status === 'paid' && <CheckCircle2 className="w-5 h-5 text-green-600 self-center" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="mt-0">
          {customers.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun client. Créez-en un pour commencer.</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customers.map(c => (
                <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditCust(c)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{c.name}</p>
                        {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{c.phone}</p>}
                        {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Solde dû</p>
                        <p className={`font-bold ${Number(c.current_balance) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {displayAmount(Number(c.current_balance))}
                        </p>
                      </div>
                    </div>
                    {c.credit_limit > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Plafond : {displayAmount(c.credit_limit)}
                      </p>
                    )}
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeCust(c.id); }}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!payCredit} onOpenChange={(v) => !v && setPayCredit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Encaisser — {payCredit?.number}</DialogTitle></DialogHeader>
          {payCredit && (
            <div className="space-y-3">
              <div className="bg-muted/40 p-3 rounded-lg text-sm">
                <div className="flex justify-between"><span>Montant restant dû</span>
                  <span className="font-bold text-destructive">{displayAmount(Number(payCredit.remaining_amount))}</span>
                </div>
              </div>
              <div>
                <Label>Montant encaissé *</Label>
                <Input type="number" min="0" max={payCredit.remaining_amount} value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank">Virement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={payNotes} onChange={e => setPayNotes(e.target.value)} /></div>
              <Button onClick={recordPayment} className="w-full">Valider le paiement</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}