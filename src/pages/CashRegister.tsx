import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Plus, Lock, Unlock, ArrowDownToLine, ArrowUpFromLine, Printer, TrendingUp, TrendingDown, Equal } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { printReceipt } from '@/lib/thermalPrint';

interface Session {
  id: string; number: string; opened_at: string; closed_at: string | null;
  opening_amount: number; expected_amount: number; counted_amount: number; difference: number;
  total_sales: number; total_cash_in: number; total_cash_out: number; sales_count: number;
  status: 'open' | 'closed'; opened_by_name: string; closed_by_name: string; notes: string;
}
interface Movement {
  id: string; session_id: string; movement_type: string; amount: number; description: string; created_at: string;
}
interface LiveSale {
  id: string; receipt_number: string; total: number; sale_date: string; payment_method: string; items: any;
}

const movementTypes: Record<string, { label: string; sign: 1 | -1 }> = {
  deposit: { label: 'Dépôt', sign: 1 },
  other_in: { label: 'Autre entrée', sign: 1 },
  expense: { label: 'Dépense', sign: -1 },
  withdrawal: { label: 'Retrait', sign: -1 },
  other_out: { label: 'Autre sortie', sign: -1 },
};

export default function CashRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { displayAmount } = useCurrency();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [liveSales, setLiveSales] = useState<LiveSale[]>([]);
  const [openOpen, setOpenOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [zModal, setZModal] = useState<Session | null>(null);

  const [openingAmount, setOpeningAmount] = useState('');
  const [openedByName, setOpenedByName] = useState('');
  const [countedAmount, setCountedAmount] = useState('');
  const [closedByName, setClosedByName] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [movType, setMovType] = useState('expense');
  const [movAmount, setMovAmount] = useState('');
  const [movDesc, setMovDesc] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data: sess } = await supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false });
    const list = (sess || []) as Session[];
    setSessions(list);
    const open = list.find(s => s.status === 'open') || null;
    setActiveSession(open);
    if (open) {
      const { data: m } = await supabase.from('cash_movements').select('*').eq('session_id', open.id).order('created_at', { ascending: false });
      setMovements((m || []) as Movement[]);
      const { data: s } = await supabase.from('sales').select('id, receipt_number, total, sale_date, payment_method, items')
        .eq('session_id', open.id).order('sale_date', { ascending: false });
      setLiveSales((s || []) as LiveSale[]);
    } else {
      setMovements([]);
      setLiveSales([]);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: refresh when sales/movements come in for the active session
  useEffect(() => {
    if (!user || !activeSession) return;
    const ch = supabase
      .channel(`cash-live-${activeSession.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `session_id=eq.${activeSession.id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_movements', filter: `session_id=eq.${activeSession.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, activeSession, fetchAll]);

  const openSession = async () => {
    if (!user) return;
    const opening = Number(openingAmount) || 0;
    if (opening < 0) { toast({ title: 'Montant invalide', variant: 'destructive' }); return; }
    const { data: numData } = await supabase.rpc('generate_session_number', { _user_id: user.id });
    const number = numData || `CS-${Date.now()}`;
    const { error } = await supabase.from('cash_sessions').insert({
      user_id: user.id, number, opening_amount: opening, opened_by_name: openedByName, status: 'open',
    } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Caisse ouverte (${number})` });
    setOpenOpen(false); setOpeningAmount(''); setOpenedByName('');
    fetchAll();
  };

  const closeSession = async () => {
    if (!activeSession) return;
    const counted = Number(countedAmount) || 0;
    const { data, error } = await supabase.rpc('close_cash_session', {
      _session_id: activeSession.id, _counted_amount: counted,
      _closed_by_name: closedByName, _notes: closeNotes,
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    const res = data as { success: boolean; difference?: number; error?: string };
    if (!res.success) { toast({ title: 'Échec', description: res.error, variant: 'destructive' }); return; }
    toast({
      title: 'Caisse clôturée',
      description: `Écart : ${displayAmount(res.difference || 0)}`,
    });
    setCloseOpen(false); setCountedAmount(''); setClosedByName(''); setCloseNotes('');
    const closed = { ...activeSession, status: 'closed' as const };
    await fetchAll();
    // Refresh and show Z report
    const { data: refreshed } = await supabase.from('cash_sessions').select('*').eq('id', activeSession.id).single();
    if (refreshed) setZModal(refreshed as Session);
  };

  const addMovement = async () => {
    if (!user || !activeSession) return;
    const amount = Number(movAmount) || 0;
    if (amount <= 0) { toast({ title: 'Montant invalide', variant: 'destructive' }); return; }
    const { error } = await supabase.from('cash_movements').insert({
      user_id: user.id, session_id: activeSession.id, movement_type: movType, amount, description: movDesc,
    } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Mouvement enregistré' });
    setMovOpen(false); setMovAmount(''); setMovDesc('');
    fetchAll();
  };

  const printZ = async (s: Session) => {
    const fmt = (n: number) => displayAmount(n);
    await printReceipt({
      kind: 'session',
      title: 'RAPPORT Z — CLÔTURE CAISSE',
      number: s.number,
      date: s.closed_at ? new Date(s.closed_at) : new Date(),
      cashier: s.closed_by_name || s.opened_by_name || undefined,
      summary: [
        { label: 'Ouvert', value: new Date(s.opened_at).toLocaleString('fr-FR') },
        { label: 'Fermé', value: s.closed_at ? new Date(s.closed_at).toLocaleString('fr-FR') : '—' },
        { label: 'Fond d\'ouverture', value: fmt(s.opening_amount) },
        { label: `Ventes espèces (${s.sales_count})`, value: '+' + fmt(s.total_sales) },
        { label: 'Entrées caisse', value: '+' + fmt(s.total_cash_in) },
        { label: 'Sorties caisse', value: '-' + fmt(s.total_cash_out) },
        { label: 'Attendu', value: fmt(s.expected_amount), bold: true },
        { label: 'Compté', value: fmt(s.counted_amount), bold: true },
        { label: 'Écart', value: (s.difference >= 0 ? '+' : '') + fmt(s.difference), bold: true },
      ],
      notes: s.notes || undefined,
      qrPayload: s.number,
    });
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            Caisse journalière
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Ouverture, mouvements, clôture avec écart automatique
          </p>
        </div>
        <div className="flex gap-2">
          {!activeSession ? (
            <Dialog open={openOpen} onOpenChange={setOpenOpen}>
              <DialogTrigger asChild>
                <Button><Unlock className="w-4 h-4 mr-1.5" />Ouvrir la caisse</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Ouverture de caisse</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Fond de caisse initial *</Label>
                    <Input type="number" min="0" placeholder="0" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} />
                  </div>
                  <div>
                    <Label>Caissier</Label>
                    <Input placeholder="Nom du caissier" value={openedByName} onChange={e => setOpenedByName(e.target.value)} />
                  </div>
                  <Button onClick={openSession} className="w-full">Ouvrir</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Dialog open={movOpen} onOpenChange={setMovOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="w-4 h-4 mr-1.5" />Mouvement</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Nouveau mouvement de caisse</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Type *</Label>
                      <Select value={movType} onValueChange={setMovType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(movementTypes).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label} ({v.sign === 1 ? 'entrée' : 'sortie'})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Montant *</Label>
                      <Input type="number" min="0" placeholder="0" value={movAmount} onChange={e => setMovAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea rows={2} placeholder="Motif…" value={movDesc} onChange={e => setMovDesc(e.target.value)} />
                    </div>
                    <Button onClick={addMovement} className="w-full">Enregistrer</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive"><Lock className="w-4 h-4 mr-1.5" />Clôturer</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Clôture de caisse</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Espèces comptées dans le tiroir *</Label>
                      <Input type="number" min="0" placeholder="0" value={countedAmount} onChange={e => setCountedAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Caissier de clôture</Label>
                      <Input placeholder="Nom" value={closedByName} onChange={e => setClosedByName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea rows={2} value={closeNotes} onChange={e => setCloseNotes(e.target.value)} />
                    </div>
                    <Button onClick={closeSession} variant="destructive" className="w-full">Clôturer & imprimer Z</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {activeSession ? (
        <Card className="mb-5 border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Session active</p>
                <p className="font-mono font-bold text-lg">{activeSession.number}</p>
              </div>
              <Badge>Ouverte depuis {new Date(activeSession.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Fond initial</p>
                <p className="font-bold">{displayAmount(activeSession.opening_amount)}</p>
              </div>
              <div className="bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Mouvements</p>
                <p className="font-bold">{movements.length}</p>
              </div>
              <div className="bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDownToLine className="w-3 h-3" />Entrées</p>
                <p className="font-bold text-green-600">+{displayAmount(movements.filter(m => movementTypes[m.movement_type]?.sign === 1).reduce((s, m) => s + Number(m.amount), 0))}</p>
              </div>
              <div className="bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpFromLine className="w-3 h-3" />Sorties</p>
                <p className="font-bold text-red-600">-{displayAmount(movements.filter(m => movementTypes[m.movement_type]?.sign === -1).reduce((s, m) => s + Number(m.amount), 0))}</p>
              </div>
            </div>

            {movements.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Derniers mouvements</p>
                {movements.slice(0, 5).map(m => {
                  const meta = movementTypes[m.movement_type];
                  return (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{meta?.label || m.movement_type}</span>
                        {m.description && <span className="text-muted-foreground ml-2 truncate">— {m.description}</span>}
                      </div>
                      <span className={meta?.sign === 1 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {meta?.sign === 1 ? '+' : '-'}{displayAmount(Number(m.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-5 border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune caisse ouverte. Cliquez sur "Ouvrir la caisse" pour démarrer la journée.</p>
          </CardContent>
        </Card>
      )}

      <h2 className="text-lg font-bold mb-3">Historique des sessions</h2>
      {sessions.filter(s => s.status === 'closed').length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Aucune session clôturée</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sessions.filter(s => s.status === 'closed').map(s => {
            const isPos = s.difference >= 0;
            const isZero = s.difference === 0;
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{s.number}</span>
                        <Badge variant={isZero ? 'default' : isPos ? 'secondary' : 'destructive'} className="text-xs">
                          {isZero ? <><Equal className="w-3 h-3 mr-0.5" />OK</> : isPos ? <><TrendingUp className="w-3 h-3 mr-0.5" />+{displayAmount(s.difference)}</> : <><TrendingDown className="w-3 h-3 mr-0.5" />{displayAmount(s.difference)}</>}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(s.opened_at).toLocaleString('fr-FR')} → {s.closed_at ? new Date(s.closed_at).toLocaleString('fr-FR') : '—'} • {s.sales_count} ventes • {displayAmount(s.total_sales)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => printZ(s)}>
                      <Printer className="w-3.5 h-3.5 mr-1" />Z
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!zModal} onOpenChange={(v) => !v && setZModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Caisse clôturée — {zModal?.number}</DialogTitle></DialogHeader>
          {zModal && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Ventes espèces</span><span className="font-semibold">{displayAmount(zModal.total_sales)} ({zModal.sales_count})</span></div>
              <div className="flex justify-between"><span>Attendu en caisse</span><span className="font-semibold">{displayAmount(zModal.expected_amount)}</span></div>
              <div className="flex justify-between"><span>Compté</span><span className="font-semibold">{displayAmount(zModal.counted_amount)}</span></div>
              <div className={`flex justify-between text-lg font-bold pt-2 border-t ${zModal.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Écart</span><span>{zModal.difference >= 0 ? '+' : ''}{displayAmount(zModal.difference)}</span>
              </div>
              <Button onClick={() => printZ(zModal)} className="w-full mt-3"><Printer className="w-4 h-4 mr-1.5" />Imprimer rapport Z</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}