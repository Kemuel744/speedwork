import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, TrendingUp, Wallet, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientRow {
  user_id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  country: string;
  city: string;
  account_type: string;
  created_at: string;
  current_plan: string | null;
  subscription_status: string | null;
  subscription_end: string | null;
  pos_revenue: number;
  pos_sales_count: number;
  invoiced_revenue: number;
  invoices_count: number;
  paid_invoices_revenue: number;
  total_revenue: number;
}

const planLabels: Record<string, { label: string; className: string }> = {
  monthly:    { label: 'Starter',    className: 'bg-primary/10 text-primary border-primary/20' },
  annual:     { label: 'Business',   className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  enterprise: { label: 'Pro',        className: 'bg-violet-500/10 text-violet-700 border-violet-500/20' },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function AdminClients() {
  const { displayAmount } = useCurrency();
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['admin-clients-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_clients_overview' as never);
      if (error) throw error;
      return (data || []) as unknown as ClientRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.email, c.full_name, c.company_name, c.phone, c.country, c.city]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const stats = useMemo(() => {
    const totalRevenue = clients.reduce((s, c) => s + Number(c.total_revenue || 0), 0);
    const totalPos = clients.reduce((s, c) => s + Number(c.pos_revenue || 0), 0);
    const totalInvoiced = clients.reduce((s, c) => s + Number(c.paid_invoices_revenue || 0), 0);
    const activeClients = clients.filter((c) => Number(c.total_revenue || 0) > 0).length;
    return { totalRevenue, totalPos, totalInvoiced, activeClients, count: clients.length };
  }, [clients]);

  const exportCSV = () => {
    const header = [
      'Inscription', 'Nom', 'Entreprise', 'Email', 'Téléphone', 'Pays', 'Ville',
      'Type de compte', 'Plan', 'Statut abonnement',
      'CA caisse', 'Ventes caisse', 'CA factures payées', 'Factures émises', 'CA total',
    ];
    const rows = filtered.map((c) => [
      formatDate(c.created_at), c.full_name, c.company_name, c.email, c.phone, c.country, c.city,
      c.account_type, c.current_plan || '—', c.subscription_status || '—',
      c.pos_revenue, c.pos_sales_count, c.paid_invoices_revenue, c.invoices_count, c.total_revenue,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-speedwork-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" aria-hidden="true" />
            Clients & chiffre d'affaires
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tous les inscrits du site avec leur plan d'abonnement et leur chiffre d'affaires.
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!filtered.length} className="gap-2">
          <Download className="w-4 h-4" aria-hidden="true" />
          Exporter CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-4 h-4" aria-hidden="true" /> Inscrits
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeClients} avec activité</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-4 h-4" aria-hidden="true" /> CA total
            </div>
            <p className="text-2xl font-bold text-foreground">{displayAmount(stats.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Caisse + factures payées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="w-4 h-4" aria-hidden="true" /> CA caisse
            </div>
            <p className="text-2xl font-bold text-foreground">{displayAmount(stats.totalPos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="w-4 h-4" aria-hidden="true" /> Factures payées
            </div>
            <p className="text-2xl font-bold text-foreground">{displayAmount(stats.totalInvoiced)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des inscrits</CardTitle>
          <CardDescription>
            Filtrez par nom, entreprise, email, téléphone ou ville.
          </CardDescription>
          <div className="relative mt-3 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="pl-9"
              aria-label="Rechercher un client"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Chargement…
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">
              Erreur : {(error as Error).message}
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun client trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Localisation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">CA caisse</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Factures payées</TableHead>
                    <TableHead className="text-right">CA total</TableHead>
                    <TableHead className="hidden lg:table-cell">Inscrit le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const plan = c.current_plan ? planLabels[c.current_plan] : null;
                    return (
                      <TableRow key={c.user_id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {c.company_name || c.full_name || c.email}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                          {c.phone && (
                            <div className="text-xs text-muted-foreground">{c.phone}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          {plan ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className={plan.className}>{plan.label}</Badge>
                              <div className="text-xs text-muted-foreground capitalize">
                                {c.subscription_status || '—'}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Sans abonnement</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium text-foreground">{displayAmount(Number(c.pos_revenue))}</div>
                          <div className="text-xs text-muted-foreground">{c.pos_sales_count} ventes</div>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <div className="font-medium text-foreground">{displayAmount(Number(c.paid_invoices_revenue))}</div>
                          <div className="text-xs text-muted-foreground">{c.invoices_count} fact.</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {displayAmount(Number(c.total_revenue))}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(c.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}