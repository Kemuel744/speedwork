import React, { useState, useMemo, useCallback } from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, FileCheck, Users,
  Plus, Trash2, Download, Printer, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Target,
  Calendar, Package, AlertTriangle, ArrowRightLeft, Lock, Crown,
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
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import FieldReportsList from '@/components/reports/FieldReportsList';

const EXPENSE_CATEGORIES = [
  { value: 'salaires', label: 'Salaires', color: 'hsl(var(--chart-1))' },
  { value: 'fournitures', label: 'Fournitures', color: 'hsl(var(--chart-2))' },
  { value: 'transport', label: 'Transport', color: 'hsl(var(--chart-3))' },
  { value: 'charges', label: 'Charges fixes', color: 'hsl(var(--chart-4))' },
  { value: 'marketing', label: 'Marketing', color: 'hsl(var(--chart-5))' },
  { value: 'stock', label: 'Achats stock', color: 'hsl(var(--primary))' },
  { value: 'other', label: 'Autres', color: 'hsl(var(--muted-foreground))' },
];

type Period = 'day' | 'week' | 'month' | 'year';

interface Expense { id: string; category: string; description: string; amount: number; expense_date: string; }
interface Product { id: string; name: string; description: string; unit_price: number; quantity_in_stock: number; alert_threshold: number; category: string; }
interface StockMovement { id: string; product_id: string; movement_type: string; quantity: number; reason: string; created_at: string; }

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
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{value}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {trend !== undefined && (
            <span className={`flex items-center text-xs font-semibold ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
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

function ProGate({ children, hasAccess, label }: { children: React.ReactNode; hasAccess: boolean; label: string }) {
  if (hasAccess) return <>{children}</>;
  return (
    <Card className="relative overflow-hidden border-dashed border-2 border-primary/20">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Cette fonctionnalité est réservée aux abonnés Pro. Souscrivez pour débloquer l'accès complet.</p>
        <Link to="/tarifs">
          <Button size="sm" className="gap-1.5"><Crown className="w-4 h-4" />Passer au Pro</Button>
        </Link>
      </div>
      <div className="pointer-events-none select-none opacity-30">{children}</div>
    </Card>
  );
}

export default function Reports() {
  const { documents } = useDocuments();
  const { user } = useAuth();
  const { toast } = useToast();
  const trialStatus = useTrialStatus();
  const { displayAmount, displayCurrency } = useCurrency();
  const currency = displayCurrency;

  const isAdmin = user?.role === 'admin';
  const hasProAccess = isAdmin || (!trialStatus.trialExpired && !trialStatus.isLoading);

  const [period, setPeriod] = useState<Period>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [expenseForm, setExpenseForm] = useState({ category: 'other', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd') });
  const [productForm, setProductForm] = useState({ name: '', description: '', unit_price: '', quantity_in_stock: '', alert_threshold: '5', category: 'general' });
  const [movementForm, setMovementForm] = useState({ product_id: '', movement_type: 'entry', quantity: '', reason: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data
  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [expRes, prodRes, movRes] = await Promise.all([
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('products').select('*').order('name'),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
    ]);
    if (expRes.data) setExpenses(expRes.data.map((e: any) => ({ id: e.id, category: e.category, description: e.description, amount: Number(e.amount), expense_date: e.expense_date })));
    if (prodRes.data) setProducts(prodRes.data.map((p: any) => ({ id: p.id, name: p.name, description: p.description, unit_price: Number(p.unit_price), quantity_in_stock: p.quantity_in_stock, alert_threshold: p.alert_threshold, category: p.category })));
    if (movRes.data) setMovements(movRes.data.map((m: any) => ({ id: m.id, product_id: m.product_id, movement_type: m.movement_type, quantity: m.quantity, reason: m.reason, created_at: m.created_at })));
  }, [user]);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  const range = useMemo(() => getDateRange(period), [period]);
  const prevRange = useMemo(() => {
    const ref = period === 'month' ? subMonths(new Date(), 1) : new Date();
    return getDateRange(period, ref);
  }, [period]);

  const inRange = useCallback((dateStr: string) => {
    try { return isWithinInterval(parseISO(dateStr), { start: range.start, end: range.end }); } catch { return false; }
  }, [range]);

  const inPrevRange = useCallback((dateStr: string) => {
    try { return isWithinInterval(parseISO(dateStr), { start: prevRange.start, end: prevRange.end }); } catch { return false; }
  }, [prevRange]);

  // Stats
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

    const quoteClients = new Set(periodQuotes.map(q => q.client.email));
    const invoiceClients = new Set(periodInvoices.map(i => i.client.email));
    const convertedClients = [...quoteClients].filter(c => invoiceClients.has(c));
    const conversionRate = quoteClients.size > 0 ? (convertedClients.length / quoteClients.size) * 100 : 0;

    const prevInvoices = invoices.filter(d => inPrevRange(d.date));
    const prevRevenue = prevInvoices.reduce((s, d) => s + d.total, 0);
    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const periodExpenses = expenses.filter(e => inRange(e.expense_date));
    const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const prevExpenses = expenses.filter(e => inPrevRange(e.expense_date)).reduce((s, e) => s + e.amount, 0);
    const expenseTrend = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    const netProfit = totalPaid - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    const clientMap = new Map<string, { name: string; total: number; count: number }>();
    periodInvoices.forEach(d => {
      const existing = clientMap.get(d.client.email) || { name: d.client.name, total: 0, count: 0 };
      existing.total += d.total; existing.count += 1;
      clientMap.set(d.client.email, existing);
    });
    const topClients = [...clientMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
      name: cat.label,
      value: periodExpenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
      color: cat.color,
    })).filter(e => e.value > 0);

    // Stock stats
    const lowStockProducts = products.filter(p => p.quantity_in_stock <= p.alert_threshold);
    const totalStockValue = products.reduce((s, p) => s + (p.unit_price * p.quantity_in_stock), 0);

    return {
      totalRevenue, totalPaid, totalUnpaid, totalQuotes,
      invoiceCount: periodInvoices.length, quoteCount: periodQuotes.length,
      paidCount: paidInvoices.length, unpaidCount: unpaidInvoices.length,
      conversionRate, revenueTrend, totalExpenses, expenseTrend,
      netProfit, grossMargin, topClients, expenseByCategory, periodExpenses,
      lowStockProducts, totalStockValue,
    };
  }, [documents, expenses, products, inRange, inPrevRange]);

  // Chart data
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d); const end = endOfMonth(d);
      const mi = documents.filter(doc => doc.type === 'invoice' && (() => { try { return isWithinInterval(parseISO(doc.date), { start, end }); } catch { return false; } })());
      const me = expenses.filter(e => { try { return isWithinInterval(parseISO(e.expense_date), { start, end }); } catch { return false; } });
      months.push({
        month: format(d, 'MMM', { locale: fr }),
        revenus: mi.filter(d => d.status === 'paid').reduce((s, d) => s + d.total, 0),
        depenses: me.reduce((s, e) => s + e.amount, 0),
        factures: mi.reduce((s, d) => s + d.total, 0),
      });
    }
    return months;
  }, [documents, expenses]);

  // CRUD
  const addExpense = async () => {
    if (!user || !expenseForm.description || !expenseForm.amount) return;
    const { error } = await supabase.from('expenses').insert({ user_id: user.id, category: expenseForm.category, description: expenseForm.description, amount: parseFloat(expenseForm.amount), expense_date: expenseForm.expense_date } as any);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Dépense ajoutée' });
    setExpenseForm({ category: 'other', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd') });
    setDialogOpen(false); fetchAll();
  };

  const deleteExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); fetchAll(); };

  const addProduct = async () => {
    if (!user || !productForm.name) return;
    const { error } = await supabase.from('products').insert({ user_id: user.id, name: productForm.name, description: productForm.description, unit_price: parseFloat(productForm.unit_price) || 0, quantity_in_stock: parseInt(productForm.quantity_in_stock) || 0, alert_threshold: parseInt(productForm.alert_threshold) || 5, category: productForm.category } as any);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Produit ajouté' });
    setProductForm({ name: '', description: '', unit_price: '', quantity_in_stock: '', alert_threshold: '5', category: 'general' });
    setProductDialogOpen(false); fetchAll();
  };

  const deleteProduct = async (id: string) => { await supabase.from('products').delete().eq('id', id); fetchAll(); };

  const addMovement = async () => {
    if (!user || !movementForm.product_id || !movementForm.quantity) return;
    const qty = parseInt(movementForm.quantity);
    const { error } = await supabase.from('stock_movements').insert({ user_id: user.id, product_id: movementForm.product_id, movement_type: movementForm.movement_type, quantity: qty, reason: movementForm.reason } as any);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    // Update product stock
    const product = products.find(p => p.id === movementForm.product_id);
    if (product) {
      const delta = movementForm.movement_type === 'entry' ? qty : movementForm.movement_type === 'exit' ? -qty : qty;
      await supabase.from('products').update({ quantity_in_stock: product.quantity_in_stock + delta } as any).eq('id', product.id);
    }
    toast({ title: 'Mouvement enregistré' });
    setMovementForm({ product_id: '', movement_type: 'entry', quantity: '', reason: '' });
    setMovementDialogOpen(false); fetchAll();
  };

  const exportCSV = () => {
    const rows = [['Type', 'Date', 'Description', 'Montant', 'Catégorie']];
    documents.filter(d => inRange(d.date)).forEach(d => rows.push([d.type, d.date, d.number + ' - ' + d.client.name, String(d.total), d.status]));
    stats.periodExpenses.forEach(e => rows.push(['depense', e.expense_date, e.description, String(-e.amount), e.category]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rapport-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  };

  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            Rapports & Analyse
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Suivi détaillé de votre performance financière</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          {hasProAccess && (
            <>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />CSV</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Imprimer</Button>
            </>
          )}
        </div>
      </div>

      {/* KPIs - always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard icon={DollarSign} label="Chiffre d'affaires" value={displayAmount(stats.totalRevenue, currency)} trend={stats.revenueTrend} color="bg-primary/10 text-primary" />
        <StatCard icon={TrendingUp} label="Encaissé" value={displayAmount(stats.totalPaid, currency)} sub={`${stats.paidCount} facture(s)`} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={TrendingDown} label="Impayées" value={displayAmount(stats.totalUnpaid, currency)} sub={`${stats.unpaidCount} facture(s)`} color="bg-destructive/10 text-destructive" />
        <StatCard icon={Wallet} label="Bénéfice net" value={displayAmount(stats.netProfit, currency)} sub={`Marge: ${stats.grossMargin.toFixed(1)}%`} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard icon={FileText} label="Factures émises" value={String(stats.invoiceCount)} color="bg-primary/10 text-primary" />
        <StatCard icon={FileCheck} label="Devis créés" value={String(stats.quoteCount)} sub={displayAmount(stats.totalQuotes, currency)} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard icon={Target} label="Conversion" value={`${stats.conversionRate.toFixed(0)}%`} sub="Devis → Facture" color="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
        <StatCard icon={Package} label="Valeur du stock" value={displayAmount(stats.totalStockValue, currency)} sub={`${products.length} produit(s)`} color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" />
      </div>

      {/* Low stock alert */}
      {hasProAccess && stats.lowStockProducts.length > 0 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Alerte stock bas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.lowStockProducts.map(p => `${p.name} (${p.quantity_in_stock} restant)`).join(' · ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="field-reports">
            <FileText className="w-3.5 h-3.5 mr-1" />Rapports terrain
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="w-3.5 h-3.5 mr-1" />Stock
            {!hasProAccess && <Lock className="w-3 h-3 ml-1 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenus vs Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => displayAmount(v, currency)} />
                    <Area type="monotone" dataKey="revenus" stroke="hsl(var(--chart-1))" fill="url(#revGrad)" strokeWidth={2} name="Revenus" />
                    <Area type="monotone" dataKey="depenses" stroke="hsl(var(--destructive))" fill="url(#depGrad)" strokeWidth={2} name="Dépenses" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Volume de facturation</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => displayAmount(v, currency)} />
                    <Bar dataKey="factures" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Montant facturé" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Pie */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Répartition des dépenses</CardTitle></CardHeader>
              <CardContent>
                {stats.expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={stats.expenseByCategory} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {stats.expenseByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => displayAmount(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Aucune dépense enregistrée</div>
                )}
              </CardContent>
            </Card>

            {/* Profitability */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Indicateurs de rentabilité</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <span className="text-sm font-medium">Chiffre d'affaires brut</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{displayAmount(stats.totalRevenue, currency)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <span className="text-sm font-medium">Total dépenses</span>
                  <span className="font-bold text-destructive">- {displayAmount(stats.totalExpenses, currency)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-sm font-bold">Bénéfice net</span>
                    <span className={`font-bold text-lg ${stats.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{displayAmount(stats.netProfit, currency)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <span className="text-sm font-medium">Marge brute</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{stats.grossMargin.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des dépenses</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Ajouter</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Description</Label><Input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Achat fournitures" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Montant ({currency})</Label><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
                    <div><Label>Date</Label><Input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
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
                  <thead><tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Catégorie</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Montant</th>
                    <th className="text-right p-3 font-medium text-muted-foreground"></th>
                  </tr></thead>
                  <tbody>
                    {stats.periodExpenses.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune dépense pour cette période</td></tr>
                    ) : stats.periodExpenses.map(e => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.value === e.category);
                      return (
                        <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3">{format(parseISO(e.expense_date), 'dd/MM/yyyy')}</td>
                          <td className="p-3"><Badge variant="secondary" className="text-xs">{cat?.label || e.category}</Badge></td>
                          <td className="p-3">{e.description}</td>
                          <td className="p-3 text-right font-semibold text-destructive">{displayAmount(e.amount, currency)}</td>
                          <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => deleteExpense(e.id)}><Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" /></Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {stats.periodExpenses.length > 0 && (
                    <tfoot><tr className="bg-muted/30"><td colSpan={3} className="p-3 font-semibold">Total</td><td className="p-3 text-right font-bold text-destructive">{displayAmount(stats.totalExpenses, currency)}</td><td></td></tr></tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Reports */}
        <TabsContent value="field-reports">
          <FieldReportsList />
        </TabsContent>

        {/* Stock Tab - Pro only */}
        <TabsContent value="stock">
          <ProGate hasAccess={hasProAccess} label="Gestion de Stock">
            <div className="space-y-6">
              {/* Products */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Catalogue Produits</h2>
                  <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nouveau produit</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Ajouter un produit</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div><Label>Nom</Label><Input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Ciment CPA 45" /></div>
                        <div><Label>Description</Label><Input value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Optionnel" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Prix unitaire ({currency})</Label><Input type="number" value={productForm.unit_price} onChange={e => setProductForm(f => ({ ...f, unit_price: e.target.value }))} /></div>
                          <div><Label>Quantité initiale</Label><Input type="number" value={productForm.quantity_in_stock} onChange={e => setProductForm(f => ({ ...f, quantity_in_stock: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Seuil d'alerte</Label><Input type="number" value={productForm.alert_threshold} onChange={e => setProductForm(f => ({ ...f, alert_threshold: e.target.value }))} /></div>
                          <div><Label>Catégorie</Label><Input value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} placeholder="general" /></div>
                        </div>
                        <Button className="w-full" onClick={addProduct}>Enregistrer</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.length === 0 ? (
                    <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">Aucun produit enregistré</CardContent></Card>
                  ) : products.map(p => (
                    <Card key={p.id} className={`transition-shadow hover:shadow-md ${p.quantity_in_stock <= p.alert_threshold ? 'border-amber-500/40' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Prix unitaire</p>
                            <p className="font-bold text-sm">{displayAmount(p.unit_price, currency)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">En stock</p>
                            <Badge variant={p.quantity_in_stock <= p.alert_threshold ? 'destructive' : 'secondary'} className="text-xs font-bold">
                              {p.quantity_in_stock}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Stock movements */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-primary" />Mouvements de stock</h2>
                  <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Mouvement</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Enregistrer un mouvement</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label>Produit</Label>
                          <Select value={movementForm.product_id} onValueChange={(v) => setMovementForm(f => ({ ...f, product_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.quantity_in_stock})</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select value={movementForm.movement_type} onValueChange={(v) => setMovementForm(f => ({ ...f, movement_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entry">Entrée</SelectItem>
                              <SelectItem value="exit">Sortie</SelectItem>
                              <SelectItem value="adjustment">Ajustement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Quantité</Label><Input type="number" value={movementForm.quantity} onChange={e => setMovementForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                          <div><Label>Motif</Label><Input value={movementForm.reason} onChange={e => setMovementForm(f => ({ ...f, reason: e.target.value }))} placeholder="Optionnel" /></div>
                        </div>
                        <Button className="w-full" onClick={addMovement}>Enregistrer</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Produit</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Quantité</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Motif</th>
                        </tr></thead>
                        <tbody>
                          {movements.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun mouvement enregistré</td></tr>
                          ) : movements.slice(0, 20).map(m => {
                            const prod = products.find(p => p.id === m.product_id);
                            return (
                              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="p-3">{format(parseISO(m.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                <td className="p-3 font-medium">{prod?.name || '—'}</td>
                                <td className="p-3">
                                  <Badge variant={m.movement_type === 'entry' ? 'default' : m.movement_type === 'exit' ? 'destructive' : 'secondary'} className="text-xs">
                                    {m.movement_type === 'entry' ? 'Entrée' : m.movement_type === 'exit' ? 'Sortie' : 'Ajustement'}
                                  </Badge>
                                </td>
                                <td className={`p-3 text-right font-semibold ${m.movement_type === 'entry' ? 'text-emerald-600 dark:text-emerald-400' : m.movement_type === 'exit' ? 'text-destructive' : 'text-foreground'}`}>
                                  {m.movement_type === 'entry' ? '+' : m.movement_type === 'exit' ? '-' : ''}{m.quantity}
                                </td>
                                <td className="p-3 text-muted-foreground">{m.reason || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ProGate>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Performance par client</CardTitle>
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
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{displayAmount(client.total, currency)}</p>
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
