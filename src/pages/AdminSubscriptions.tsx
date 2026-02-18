import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Building2, CreditCard, Users, TrendingUp, Ban, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type SubscriptionRow = Tables<'subscriptions'>;

interface SubscriptionWithProfile extends SubscriptionRow {
  profiles: { company_name: string; email: string } | null;
}

const paymentMethodLabels: Record<string, string> = {
  mtn_mobile_money: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
  orange_money: 'Orange Money',
  bank_card: 'Carte Bancaire',
};

const statusConfig = {
  active: { label: 'Actif', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20' },
  expired: { label: 'Expiré', className: 'bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/20' },
  suspended: { label: 'Suspendu', className: 'bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20' },
};

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<SubscriptionWithProfile | null>(null);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profiles!subscriptions_user_id_fkey(company_name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback: join manually if FK doesn't exist
        if (error.message.includes('relationship')) {
          const { data: subs, error: subErr } = await supabase
            .from('subscriptions')
            .select('*')
            .order('created_at', { ascending: false });
          if (subErr) throw subErr;

          const userIds = [...new Set((subs || []).map(s => s.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, company_name, email')
            .in('user_id', userIds);

          const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
          return (subs || []).map(s => ({
            ...s,
            profiles: profileMap.get(s.user_id) ? { company_name: profileMap.get(s.user_id)!.company_name, email: profileMap.get(s.user_id)!.email } : null,
          })) as SubscriptionWithProfile[];
        }
        throw error;
      }

      return (data || []) as unknown as SubscriptionWithProfile[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      const { error } = await supabase.from('subscriptions').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast({
        title: status === 'suspended' ? 'Abonnement suspendu' : 'Abonnement réactivé',
        description: status === 'suspended' ? "L'abonnement a été suspendu." : "L'abonnement a été réactivé.",
      });
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de mettre à jour le statut.', variant: 'destructive' }),
  });

  const filtered = subscriptions.filter(s => {
    const company = s.profiles?.company_name || '';
    const email = s.profiles?.email || '';
    const matchSearch = company.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchPlan = filterPlan === 'all' || s.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    revenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0),
    annual: subscriptions.filter(s => s.plan === 'annual' && s.status === 'active').length,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des abonnements</h1>
        <p className="text-muted-foreground text-sm mt-1">Suivez et gérez les abonnements de toutes les entreprises</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total entreprises', value: stats.total, icon: Building2, color: 'text-primary' },
          { label: 'Abonnements actifs', value: stats.active, icon: Users, color: 'text-emerald-600' },
          { label: 'Revenus actifs', value: `${stats.revenue.toLocaleString()} FCFA`, icon: CreditCard, color: 'text-amber-600' },
          { label: 'Plans annuels', value: stats.annual, icon: TrendingUp, color: 'text-blue-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-secondary">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Abonnements</CardTitle>
          <CardDescription>{filtered.length} entreprise{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher une entreprise..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="annual">Annuel</SelectItem>
                <SelectItem value="enterprise">Entreprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Entreprise</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Paiement</TableHead>
                  <TableHead className="hidden md:table-cell">Expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun abonnement trouvé</TableCell></TableRow>
                ) : filtered.map(sub => {
                  const sc = statusConfig[sub.status];
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{sub.profiles?.company_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{sub.profiles?.email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">{sub.plan === 'monthly' ? 'Mensuel' : sub.plan === 'enterprise' ? 'Entreprise' : 'Annuel'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={sc.className}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{paymentMethodLabels[sub.payment_method] || sub.payment_method}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{new Date(sub.end_date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSub(sub)}><Eye className="w-4 h-4" /></Button>
                          {sub.status === 'active' ? (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: sub.id, status: 'suspended' })} className="text-destructive hover:text-destructive"><Ban className="w-4 h-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: sub.id, status: 'active' })} className="text-emerald-600 hover:text-emerald-700"><RefreshCw className="w-4 h-4" /></Button>
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

      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'abonnement</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-3 text-sm">
              {[
                ['Entreprise', selectedSub.profiles?.company_name || '—'],
                ['Email', selectedSub.profiles?.email || '—'],
                ['Plan', selectedSub.plan === 'monthly' ? 'Mensuel — 5 000 FCFA/mois' : selectedSub.plan === 'enterprise' ? 'Entreprise — 15 000 FCFA/mois' : 'Annuel — 3 000 FCFA/mois'],
                ['Montant', `${selectedSub.amount.toLocaleString()} FCFA`],
                ['Paiement', paymentMethodLabels[selectedSub.payment_method] || selectedSub.payment_method],
                ['Début', new Date(selectedSub.start_date).toLocaleDateString('fr-FR')],
                ['Expiration', new Date(selectedSub.end_date).toLocaleDateString('fr-FR')],
                ["Code d'accès", selectedSub.access_code],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Statut</span>
                <Badge className={statusConfig[selectedSub.status].className}>{statusConfig[selectedSub.status].label}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSub(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
