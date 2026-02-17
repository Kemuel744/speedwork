import React, { useState, useMemo, useCallback } from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatAmount } from '@/lib/currencies';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, FileCheck, Users, PieChart as PieChartIcon,
  Plus, Trash2, Download, Printer, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Target,
  Filter, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const EXPENSE_CATEGORIES = [
  { value: 'salaires', label: 'Salaires', color: 'hsl(var(--chart-1))' },
  { value: 'fournitures', label: 'Fournitures', color: 'hsl(var(--chart-2))' },
  { value: 'transport', label: 'Transport', color: 'hsl(var(--chart-3))' },
  { value: 'charges', label: 'Charges fixes', color: 'hsl(var(--chart-4))' },
  { value: 'marketing', label: 'Marketing', color: 'hsl(var(--chart-5))' },
  { value: 'other', label: 'Autres', color: 'hsl(var(--muted-foreground))' },
];

const COLORS = EXPENSE_CATEGORIES.map(c => c.color);

type Period = 'day' | 'week' | 'month' | 'year';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
}

function getDateRange(period: Period, refDate: Date = new Date()) {
  switch (period) {
    case 'day': return { start: refDate, end: refDate };
    case 'week': return { start: startOfWeek(refDate, { locale: fr }), end: endOfWeek(refDate, { locale: fr }) };
    case 'month': return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    case 'year': return { start: startOfYear(refDate), end: endOfYear(refDate) };
  }
}

function StatCard({ icon: Icon, label, value, sub, trend, color }: { icon: any; label: string; value: string; sub?: string; trend?: number; color: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {trend !== undefined && (
            <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { documents } = useDocuments();
  const { company } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = company.currency || 'XOF';

  const [period, setPeriod] = useState<Period>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'other', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd') });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoadingExpenses(true);
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (!error && data) setExpenses(data.map((e: any) => ({ id: e.id, category: e.category, description: e.description, amount: Number(e.amount), expense_date: e.expense_date })));
    setLoadingExpenses(false);
  }, [user]);

  React.useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Filtered data by period
  const range = useMemo(() => getDateRange(period), [period]);
  const prevRange = useMemo(() => {
    const ref = period === 'month' ? subMonths(new Date(), 1) : new Date();
    return getDateRange(period, ref);
  }, [period]);

  const inRange = useCallback((dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, { start: range.start, end: range.end });
    } catch { return false; }
  }, [range]);

  const inPrevRange = useCallback((dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, { start: prevRange.start, end: prevRange.end });
    } catch { return false; }
  }, [prevRange]);

  // Document stats
  const stats = useMemo(() => {
    const invoices = documents.filter(d => d.type === 'invoice');
    const quotes = documents.filter(d => d.type === 'quote');
    const periodInvoices = invoices.filter(d => inRange(d.date));
    const periodQuotes = quotes.filter(d => inRange(d.date));
    const paidInvoices = periodInvoices.filter(d => d.status === 'paid');
    const unpaidInvoices = periodInvoices.filter(d => d.status === 'unpaid' || d.status === 'pending');

    const totalRevenue = periodInvoices.reduce((s, d) => s + d.total, 0);
    const totalPaid = paidInvoices.reduce((s, d) => s + d.total, 0);
    const totalUnpaid = unpaidInvoices.reduce((s, d) => s + d.total, 0);
    const totalQuotes = periodQuotes.reduce((s, d) => s + d.total, 0);

    // Conversion rate: quotes that became invoices (simplified: invoices with same client)
    const quoteClients = new Set(periodQuotes.map(q => q.client.email));
    const invoiceClients = new Set(periodInvoices.map(i => i.client.email));
    const convertedClients = [...quoteClients].filter(c => invoiceClients.has(c));
    const conversionRate = quoteClients.size > 0 ? (convertedClients.length / quoteClients.size) * 100 : 0;

    // Previous period for trends
    const prevInvoices = invoices.filter(d => inPrevRange(d.date));
    const prevRevenue = prevInvoices.reduce((s, d) => s + d.total, 0);
    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Expenses
    const periodExpenses = expenses.filter(e => inRange(e.expense_date));
    const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const prevExpenses = expenses.filter(e => inPrevRange(e.expense_date)).reduce((s, e) => s + e.amount, 0);
    const expenseTrend = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    const netProfit = totalPaid - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    // Client performance
    const clientMap = new Map<string, { name: string; total: number; count: number }>();
    periodInvoices.forEach(d => {
      const existing = clientMap.get(d.client.email) || { name: d.client.name, total: 0, count: 0 };
      existing.total += d.total;
      existing.count += 1;
      clientMap.set(d.client.email, existing);
    });
    const topClients = [...clientMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    // Expense breakdown
    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
      name: cat.label,
      value: periodExpenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    })).filter(e => e.value > 0);

    return {
      totalRevenue, totalPaid, totalUnpaid, totalQuotes,
      invoiceCount: periodInvoices.length, quoteCount: periodQuotes.length,
      paidCount: paidInvoices.length, unpaidCount: unpaidInvoices.length,
      conversionRate, revenueTrend, totalExpenses, expenseTrend,
      netProfit, grossMargin, topClients, expenseByCategory, periodExpenses,
    };
  }, [documents, expenses, inRange, inPrevRange]);

  // Monthly chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthInvoices = documents.filter(doc => doc.type === 'invoice' && (() => { try { return isWithinInterval(parseISO(doc.date), { start, end }); } catch { return false; } })());
      const monthExpenses = expenses.filter(e => { try { return isWithinInterval(parseISO(e.expense_date), { start, end }); } catch { return false; } });
      months.push({
        month: format(d, 'MMM', { locale: fr }),
        revenus: monthInvoices.filter(d => d.status === 'paid').reduce((s, d) => s + d.total, 0),
        depenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
        factures: monthInvoices.reduce((s, d) => s + d.total, 0),
      });
    }
    return months;
  }, [documents, expenses]);

  // Add expense
  const addExpense = async () => {
    if (!user || !expenseForm.description || !expenseForm.amount) return;
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      expense_date: expenseForm.expense_date,
    } as any);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dépense ajoutée' });
      setExpenseForm({ category: 'other', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd') });
      setDialogOpen(false);
      fetchExpenses();
    }
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  // Export CSV
  const exportCSV = () => {
    const rows = [['Type', 'Date', 'Description', 'Montant', 'Catégorie']];
    documents.filter(d => inRange(d.date)).forEach(d => rows.push([d.type, d.date, d.number + ' - ' + d.client.name, String(d.total), d.status]));
    stats.periodExpenses.forEach(e => rows.push(['depense', e.expense_date, e.description, String(-e.amount), e.category]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handlePrint = () => window.print();

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Rapports & Analyse Financière
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi détaillé de votre performance financière</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" />Imprimer</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={DollarSign} label="Chiffre d'affaires" value={formatAmount(stats.totalRevenue, currency)} trend={stats.revenueTrend} color="bg-primary/10 text-primary" />
        <StatCard icon={TrendingUp} label="Encaissé" value={formatAmount(stats.totalPaid, currency)} sub={`${stats.paidCount} facture(s)`} color="bg-success/10 text-success" />
        <StatCard icon={TrendingDown} label="Impayées" value={formatAmount(stats.totalUnpaid, currency)} sub={`${stats.unpaidCount} facture(s)`} color="bg-destructive/10 text-destructive" />
        <StatCard icon={Wallet} label="Bénéfice net" value={formatAmount(stats.netProfit, currency)} sub={`Marge: ${stats.grossMargin.toFixed(1)}%`} color="bg-accent/10 text-accent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={FileText} label="Factures émises" value={String(stats.invoiceCount)} color="bg-primary/10 text-primary" />
        <StatCard icon={FileCheck} label="Devis créés" value={String(stats.quoteCount)} sub={formatAmount(stats.totalQuotes, currency)} color="bg-chart-2/10 text-chart-2" />
        <StatCard icon={Target} label="Conversion" value={`${stats.conversionRate.toFixed(0)}%`} sub="Devis → Facture" color="bg-chart-3/10 text-chart-3" />
        <StatCard icon={TrendingDown} label="Total dépenses" value={formatAmount(stats.totalExpenses, currency)} trend={stats.expenseTrend} color="bg-chart-4/10 text-chart-4" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenus vs Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatAmount(v, currency)} />
                    <Area type="monotone" dataKey="revenus" stroke="hsl(var(--success))" fill="url(#revGrad)" strokeWidth={2} name="Revenus" />
                    <Area type="monotone" dataKey="depenses" stroke="hsl(var(--destructive))" fill="url(#depGrad)" strokeWidth={2} name="Dépenses" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Factures */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Factures émises</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatAmount(v, currency)} />
                    <Bar dataKey="factures" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Montant facturé" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Répartition des dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={stats.expenseByCategory} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {stats.expenseByCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatAmount(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    Aucune dépense enregistrée
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profitability */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Indicateurs de rentabilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-success/5 border border-success/10">
                    <span className="text-sm font-medium">Chiffre d'affaires brut</span>
                    <span className="font-bold text-success">{formatAmount(stats.totalRevenue, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <span className="text-sm font-medium">Total dépenses</span>
                    <span className="font-bold text-destructive">- {formatAmount(stats.totalExpenses, currency)}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-sm font-bold">Bénéfice net</span>
                      <span className={`font-bold text-lg ${stats.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatAmount(stats.netProfit, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-accent/5 border border-accent/10">
                    <span className="text-sm font-medium">Marge brute</span>
                    <span className="font-bold text-accent">{stats.grossMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des dépenses</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle dépense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Achat fournitures bureau" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Montant ({currency})</Label>
                      <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={addExpense}>Enregistrer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Catégorie</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Montant</th>
                      <th className="text-right p-3 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.periodExpenses.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune dépense pour cette période</td></tr>
                    ) : (
                      stats.periodExpenses.map(e => {
                        const cat = EXPENSE_CATEGORIES.find(c => c.value === e.category);
                        return (
                          <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-3">{format(parseISO(e.expense_date), 'dd/MM/yyyy')}</td>
                            <td className="p-3"><Badge variant="secondary" className="text-xs">{cat?.label || e.category}</Badge></td>
                            <td className="p-3 text-foreground">{e.description}</td>
                            <td className="p-3 text-right font-semibold text-destructive">{formatAmount(e.amount, currency)}</td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => deleteExpense(e.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {stats.periodExpenses.length > 0 && (
                    <tfoot>
                      <tr className="bg-muted/30">
                        <td colSpan={3} className="p-3 font-semibold">Total</td>
                        <td className="p-3 text-right font-bold text-destructive">{formatAmount(stats.totalExpenses, currency)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />Performance par client
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topClients.length > 0 ? (
                <div className="space-y-3">
                  {stats.topClients.map((client, i) => {
                    const pct = stats.totalRevenue > 0 ? (client.total / stats.totalRevenue) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatAmount(client.total, currency)}</p>
                          <p className="text-xs text-muted-foreground">{client.count} facture(s)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">Aucune donnée client pour cette période</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
