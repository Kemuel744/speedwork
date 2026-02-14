import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Building2, CreditCard, Users, TrendingUp, Ban, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  company: string;
  email: string;
  plan: 'monthly' | 'annual';
  status: 'active' | 'expired' | 'suspended';
  paymentMethod: string;
  startDate: string;
  endDate: string;
  amount: number;
  accessCode: string;
}

const mockSubscriptions: Subscription[] = [
  { id: '1', company: 'TechCorp SARL', email: 'admin@techcorp.cm', plan: 'annual', status: 'active', paymentMethod: 'MTN Mobile Money', startDate: '2026-01-15', endDate: '2027-01-15', amount: 36000, accessCode: 'A7X2K9' },
  { id: '2', company: 'DigiServices', email: 'contact@digiservices.cm', plan: 'monthly', status: 'active', paymentMethod: 'Airtel Money', startDate: '2026-02-01', endDate: '2026-03-01', amount: 5000, accessCode: 'B3M8P1' },
  { id: '3', company: 'AfriBuild SA', email: 'info@afribuild.cm', plan: 'annual', status: 'expired', paymentMethod: 'Orange Money', startDate: '2025-02-10', endDate: '2026-02-10', amount: 36000, accessCode: 'C5N4Q7' },
  { id: '4', company: 'LogiTrans', email: 'admin@logitrans.cm', plan: 'monthly', status: 'suspended', paymentMethod: 'MTN Mobile Money', startDate: '2026-01-20', endDate: '2026-02-20', amount: 5000, accessCode: 'D9R1W6' },
  { id: '5', company: 'MediPlus Clinic', email: 'finance@mediplus.cm', plan: 'annual', status: 'active', paymentMethod: 'Carte Bancaire', startDate: '2026-01-05', endDate: '2027-01-05', amount: 36000, accessCode: 'E2T5Y8' },
  { id: '6', company: 'EduSmart Academy', email: 'dir@edusmart.cm', plan: 'monthly', status: 'active', paymentMethod: 'MTN Mobile Money', startDate: '2026-02-10', endDate: '2026-03-10', amount: 5000, accessCode: 'F6U3Z0' },
];

const statusConfig = {
  active: { label: 'Actif', variant: 'default' as const, className: 'bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20' },
  expired: { label: 'Expiré', variant: 'outline' as const, className: 'bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/20' },
  suspended: { label: 'Suspendu', variant: 'destructive' as const, className: 'bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20' },
};

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.company.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
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

  const handleSuspend = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'suspended' as const } : s));
    toast({ title: 'Abonnement suspendu', description: "L'abonnement a été suspendu avec succès." });
  };

  const handleReactivate = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'active' as const } : s));
    toast({ title: 'Abonnement réactivé', description: "L'abonnement a été réactivé avec succès." });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des abonnements</h1>
        <p className="text-muted-foreground text-sm mt-1">Suivez et gérez les abonnements de toutes les entreprises</p>
      </div>

      {/* Stats */}
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

      {/* Filters */}
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
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
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
                {filtered.map(sub => {
                  const sc = statusConfig[sub.status];
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{sub.company}</p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">{sub.plan === 'monthly' ? 'Mensuel' : 'Annuel'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={sc.className}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{sub.paymentMethod}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{new Date(sub.endDate).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSub(sub)}><Eye className="w-4 h-4" /></Button>
                          {sub.status === 'active' ? (
                            <Button variant="ghost" size="icon" onClick={() => handleSuspend(sub.id)} className="text-destructive hover:text-destructive"><Ban className="w-4 h-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => handleReactivate(sub.id)} className="text-emerald-600 hover:text-emerald-700"><RefreshCw className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun abonnement trouvé</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'abonnement</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-3 text-sm">
              {[
                ['Entreprise', selectedSub.company],
                ['Email', selectedSub.email],
                ['Plan', selectedSub.plan === 'monthly' ? 'Mensuel — 5 000 FCFA/mois' : 'Annuel — 3 000 FCFA/mois'],
                ['Montant', `${selectedSub.amount.toLocaleString()} FCFA`],
                ['Paiement', selectedSub.paymentMethod],
                ['Début', new Date(selectedSub.startDate).toLocaleDateString('fr-FR')],
                ['Expiration', new Date(selectedSub.endDate).toLocaleDateString('fr-FR')],
                ["Code d'accès", selectedSub.accessCode],
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
