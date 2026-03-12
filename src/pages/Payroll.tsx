import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator, DollarSign, Clock, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Loader2, Award, Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PayrollRecord {
  id: string;
  worker_id: string;
  month_year: string;
  base_salary: number;
  hours_worked: number;
  days_worked: number;
  days_absent: number;
  late_count: number;
  missions_completed: number;
  mission_bonus: number;
  performance_bonus: number;
  late_penalty: number;
  absence_penalty: number;
  gross_salary: number;
  net_salary: number;
  notes: string;
  status: string;
}

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  base_salary: number;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  validated: { label: 'Validé', variant: 'default' },
  paid: { label: 'Payé', variant: 'default' },
};

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(d, 'yyyy-MM');
    const label = format(d, 'MMMM yyyy', { locale: fr });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export default function Payroll() {
  const { user, session } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [editBonuses, setEditBonuses] = useState<{ id: string; mission_bonus: number; performance_bonus: number; late_penalty: number; absence_penalty: number } | null>(null);
  const monthOptions = getMonthOptions();

  const workerMap = new Map(workers.map(w => [w.id, w]));

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [pRes, wRes] = await Promise.all([
      (supabase as any).from('payroll').select('*').eq('month_year', selectedMonth).order('net_salary', { ascending: false }),
      supabase.from('workers').select('id, first_name, last_name, position, base_salary').eq('status', 'active').order('first_name'),
    ]);
    if (pRes.data) setPayrolls(pRes.data);
    if (wRes.data) setWorkers(wRes.data as Worker[]);
    setLoading(false);
  }, [user, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calculatePayroll = async () => {
    if (!session?.access_token) return;
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-payroll', {
        body: { month_year: selectedMonth },
      });
      if (error) throw error;
      toast({ title: `Calcul terminé`, description: `${data.count} fiches de paie générées` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erreur de calcul', description: err.message, variant: 'destructive' });
    } finally {
      setCalculating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from('payroll').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Statut mis à jour : ${STATUS_MAP[status]?.label}` });
    fetchData();
  };

  const saveAdjustments = async () => {
    if (!editBonuses) return;
    const { id, mission_bonus, performance_bonus, late_penalty, absence_penalty } = editBonuses;
    const record = payrolls.find(p => p.id === id);
    if (!record) return;

    const gross = record.base_salary + mission_bonus + performance_bonus;
    const net = Math.max(0, gross - late_penalty - absence_penalty);

    const { error } = await (supabase as any).from('payroll').update({
      mission_bonus, performance_bonus, late_penalty, absence_penalty,
      gross_salary: gross, net_salary: net,
    }).eq('id', id);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Ajustements enregistrés' });
    setEditBonuses(null);
    fetchData();
  };

  // Summary stats
  const totalNet = payrolls.reduce((s, p) => s + p.net_salary, 0);
  const totalBonuses = payrolls.reduce((s, p) => s + p.mission_bonus + p.performance_bonus, 0);
  const totalPenalties = payrolls.reduce((s, p) => s + p.late_penalty + p.absence_penalty, 0);
  const avgHours = payrolls.length > 0 ? payrolls.reduce((s, p) => s + p.hours_worked, 0) / payrolls.length : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" /> Calcul des salaires
          </h1>
          <p className="text-muted-foreground">Résumé mensuel automatique par travailleur</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={calculatePayroll} disabled={calculating}>
            {calculating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
            {calculating ? 'Calcul...' : 'Calculer'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalNet.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">FCFA net total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalBonuses.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">FCFA primes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalPenalties.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">FCFA pénalités</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{avgHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Heures moy./travailleur</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : payrolls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Users className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Aucune fiche de paie pour ce mois.</p>
            <p className="text-sm text-muted-foreground">Cliquez sur "Calculer" pour générer les fiches automatiquement.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Travailleur</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Heures</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Jours</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Missions</TableHead>
                    <TableHead className="text-right text-green-600">Primes</TableHead>
                    <TableHead className="text-right text-destructive">Pénalités</TableHead>
                    <TableHead className="text-right font-bold">Net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map(p => {
                    const w = workerMap.get(p.worker_id);
                    const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.draft;
                    return (
                      <TableRow key={p.id} className="hover:bg-secondary/30">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{w ? `${w.first_name} ${w.last_name}` : '—'}</p>
                            <p className="text-xs text-muted-foreground">{w?.position}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{p.base_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm hidden sm:table-cell">{p.hours_worked.toFixed(1)}h</TableCell>
                        <TableCell className="text-right text-sm hidden sm:table-cell">
                          {p.days_worked}j
                          {p.days_absent > 0 && <span className="text-destructive text-xs ml-1">(-{p.days_absent})</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm hidden md:table-cell">{p.missions_completed}</TableCell>
                        <TableCell className="text-right text-sm text-green-600">
                          +{(p.mission_bonus + p.performance_bonus).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-destructive">
                          {(p.late_penalty + p.absence_penalty) > 0 ? `-${(p.late_penalty + p.absence_penalty).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">{p.net_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setDetailRecord(p)}>Détails</Button>
                            {p.status === 'draft' && (
                              <Button size="sm" variant="ghost" onClick={() => setEditBonuses({
                                id: p.id, mission_bonus: p.mission_bonus,
                                performance_bonus: p.performance_bonus,
                                late_penalty: p.late_penalty, absence_penalty: p.absence_penalty,
                              })}>Ajuster</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fiche de paie détaillée</DialogTitle>
          </DialogHeader>
          {detailRecord && (() => {
            const w = workerMap.get(detailRecord.worker_id);
            const monthLabel = monthOptions.find(o => o.value === detailRecord.month_year)?.label || detailRecord.month_year;
            return (
              <div className="space-y-4">
                <div className="text-center pb-2 border-b">
                  <p className="font-bold text-lg">{w ? `${w.first_name} ${w.last_name}` : '—'}</p>
                  <p className="text-sm text-muted-foreground">{w?.position} — {monthLabel}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Salaire de base</span><span>{detailRecord.base_salary.toLocaleString()} FCFA</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Heures travaillées</span><span>{detailRecord.hours_worked.toFixed(1)}h</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Jours travaillés</span><span>{detailRecord.days_worked}j</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Absences</span><span className={detailRecord.days_absent > 0 ? 'text-destructive' : ''}>{detailRecord.days_absent}j</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Retards</span><span className={detailRecord.late_count > 0 ? 'text-destructive' : ''}>{detailRecord.late_count}x</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Missions terminées</span><span>{detailRecord.missions_completed}</span></div>
                </div>

                <div className="border-t pt-2 space-y-1.5 text-sm">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Primes</p>
                  <div className="flex justify-between text-green-600">
                    <span>Prime missions</span><span>+{detailRecord.mission_bonus.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Prime performance</span><span>+{detailRecord.performance_bonus.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="border-t pt-2 space-y-1.5 text-sm">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Pénalités</p>
                  <div className="flex justify-between text-destructive">
                    <span>Retards ({detailRecord.late_count}x)</span><span>-{detailRecord.late_penalty.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Absences ({detailRecord.days_absent}j)</span><span>-{detailRecord.absence_penalty.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salaire brut</span>
                    <span>{detailRecord.gross_salary.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Salaire net</span>
                    <span className="text-primary">{detailRecord.net_salary.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Status actions */}
                <div className="flex gap-2 pt-2">
                  {detailRecord.status === 'draft' && (
                    <Button onClick={() => { updateStatus(detailRecord.id, 'validated'); setDetailRecord(null); }} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" /> Valider
                    </Button>
                  )}
                  {detailRecord.status === 'validated' && (
                    <Button onClick={() => { updateStatus(detailRecord.id, 'paid'); setDetailRecord(null); }} className="flex-1">
                      <DollarSign className="w-4 h-4 mr-2" /> Marquer payé
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit bonuses/penalties dialog */}
      <Dialog open={!!editBonuses} onOpenChange={() => setEditBonuses(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajuster primes & pénalités</DialogTitle></DialogHeader>
          {editBonuses && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-green-600 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Prime missions</Label>
                  <Input type="number" value={editBonuses.mission_bonus} onChange={e => setEditBonuses({ ...editBonuses, mission_bonus: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-green-600 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Prime performance</Label>
                  <Input type="number" value={editBonuses.performance_bonus} onChange={e => setEditBonuses({ ...editBonuses, performance_bonus: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-destructive flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Pénalité retard</Label>
                  <Input type="number" value={editBonuses.late_penalty} onChange={e => setEditBonuses({ ...editBonuses, late_penalty: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-destructive flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Pénalité absences</Label>
                  <Input type="number" value={editBonuses.absence_penalty} onChange={e => setEditBonuses({ ...editBonuses, absence_penalty: Number(e.target.value) })} />
                </div>
              </div>
              <Button onClick={saveAdjustments} className="w-full">Enregistrer les ajustements</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
