import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Store, Package, TrendingUp, AlertTriangle, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TrialBanner from '@/components/TrialBanner';
import SubscriptionCard from '@/components/SubscriptionCard';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

interface SaleRow {
  id: string;
  total: number;
  sale_date: string;
  items: any;
  receipt_number: string;
}

interface ProductRow {
  id: string;
  name: string;
  quantity_in_stock: number;
  alert_threshold: number;
  unit_price: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { displayAmount, displayCurrency } = useCurrency();
  const { t } = useLanguage();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [salesRes, productsRes] = await Promise.all([
        supabase.from('sales').select('*').eq('user_id', user.id).order('sale_date', { ascending: false }).limit(500),
        supabase.from('products').select('*').eq('user_id', user.id),
      ]);
      setSales((salesRes.data as SaleRow[]) || []);
      setProducts((productsRes.data as ProductRow[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter(s => s.sale_date.slice(0, 10) === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const lowStockProducts = products.filter(p => p.quantity_in_stock <= p.alert_threshold);

  // Weekly chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const chartData = last7Days.map(day => {
    const daySales = sales.filter(s => s.sale_date.slice(0, 10) === day);
    const revenue = daySales.reduce((sum, s) => sum + Number(s.total), 0);
    const label = new Date(day).toLocaleDateString('fr', { weekday: 'short' });
    return { day: label, revenue };
  });

  // Top products
  const productSalesMap: Record<string, number> = {};
  sales.forEach(s => {
    const items = Array.isArray(s.items) ? s.items : [];
    items.forEach((item: any) => {
      const key = item.product_name || item.name || 'Inconnu';
      productSalesMap[key] = (productSalesMap[key] || 0) + (item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('dashboard.overview')}</p>
        </div>
        <Button asChild>
          <Link to="/reports">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('nav.shop')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      <TrialBanner />
      <div className="mb-6">
        <SubscriptionCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label={t('dashboard.todayRevenue')} value={displayAmount(todayRevenue, displayCurrency)} sub={`${todaySales.length} ${t('dashboard.salesCount')}`} color="bg-primary/10 text-primary" />
        <StatCard icon={Store} label={t('dashboard.totalRevenue')} value={displayAmount(totalRevenue, displayCurrency)} sub={`${sales.length} ${t('dashboard.totalSales')}`} color="bg-success/10 text-success" />
        <StatCard icon={Package} label={t('dashboard.totalProducts')} value={String(products.length)} sub={`${lowStockProducts.length} ${t('dashboard.lowStock')}`} color="bg-accent/10 text-accent" />
        <StatCard icon={AlertTriangle} label={t('dashboard.stockAlerts')} value={String(lowStockProducts.length)} sub={t('dashboard.productsToRestock')} color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">{t('dashboard.weeklyRevenue')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [displayAmount(value, displayCurrency), t('dashboard.revenue')]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          {/* Top products */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">{t('dashboard.topProducts')}</h3>
            <div className="space-y-3">
              {topProducts.length === 0 && <p className="text-sm text-muted-foreground">{t('common.noData')}</p>}
              {topProducts.map(([name, qty], i) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary w-5">{i + 1}.</span>
                    <span className="text-sm text-foreground">{name}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{qty} {t('dashboard.sold')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          {lowStockProducts.length > 0 && (
            <div className="stat-card border-destructive/30">
              <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('dashboard.stockAlerts')}
              </h3>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{p.name}</span>
                    <span className="text-destructive font-semibold">{p.quantity_in_stock} {t('dashboard.remaining')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
