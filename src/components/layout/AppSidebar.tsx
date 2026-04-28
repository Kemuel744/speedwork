import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard, User, Settings,
  LogOut, ChevronLeft, CreditCard, BarChart3, Bell, MessageCircle, BookOpen, Newspaper,
  Store, Package, History, Truck, FolderTree, Building2, ShoppingCart, ArrowLeftRight, Grid3x3,
  Banknote, Undo2, Wallet, Tag, Award, Calculator, Receipt, Percent, UserCog, Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import speedworkLogo from '@/assets/logo-small.webp';

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    titleKey: 'nav.principal',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard },
      { labelKey: 'nav.shop', to: '/reports', icon: Store },
    ],
  },
  {
    titleKey: 'nav.gestion',
    items: [
      { labelKey: 'nav.products', to: '/inventory', icon: Package },
      { labelKey: 'Catégories', to: '/categories', icon: FolderTree },
      { labelKey: 'Fournisseurs', to: '/suppliers', icon: Truck },
      { labelKey: 'Commandes achat', to: '/purchase-orders', icon: ShoppingCart },
      { labelKey: 'Boutiques & dépôts', to: '/locations', icon: Building2 },
      { labelKey: 'Stock multi-dépôts', to: '/multi-depot-stock', icon: Grid3x3 },
      { labelKey: 'Transferts stock', to: '/stock-transfers', icon: ArrowLeftRight },
      { labelKey: 'nav.salesHistory', to: '/sales-history', icon: History },
      { labelKey: 'nav.statistics', to: '/statistics', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'Finance',
    items: [
      { labelKey: 'Caisse journalière', to: '/cash-register', icon: Banknote },
      { labelKey: 'Retours & remboursements', to: '/returns', icon: Undo2 },
      { labelKey: 'Crédit clients', to: '/customer-credits', icon: Wallet },
      { labelKey: 'Comptabilité', to: '/accounting', icon: Calculator },
      { labelKey: 'Déclaration TVA', to: '/vat-declaration', icon: Receipt },
      { labelKey: 'Taux de TVA', to: '/tax-rates', icon: Percent },
    ],
  },
  {
    titleKey: 'Marketing',
    items: [
      { labelKey: 'Promotions', to: '/promotions', icon: Tag },
      { labelKey: 'Fidélité client', to: '/loyalty', icon: Award },
    ],
  },
  {
    titleKey: 'Équipe',
    items: [
      { labelKey: 'Employés & caissiers', to: '/employees', icon: UserCog },
      { labelKey: 'Étiquettes & codes-barres', to: '/labels', icon: Printer },
      { labelKey: 'Reçus & impression', to: '/receipt-settings', icon: Receipt },
    ],
  },
  {
    titleKey: 'nav.communication',
    items: [
      { labelKey: 'nav.messages', to: '/messages', icon: MessageCircle },
    ],
  },
  {
    titleKey: 'nav.administration',
    items: [
      { labelKey: 'nav.subscriptions', to: '/admin/subscriptions', icon: CreditCard },
      { labelKey: 'nav.blog', to: '/admin/blog', icon: Newspaper },
    ],
  },
];

const clientSections: NavSection[] = [
  {
    titleKey: 'nav.principal',
    items: [
      { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard },
      { labelKey: 'nav.shop', to: '/reports', icon: Store },
    ],
  },
  {
    titleKey: 'nav.gestion',
    items: [
      { labelKey: 'nav.products', to: '/inventory', icon: Package },
      { labelKey: 'Catégories', to: '/categories', icon: FolderTree },
      { labelKey: 'Fournisseurs', to: '/suppliers', icon: Truck },
      { labelKey: 'Commandes achat', to: '/purchase-orders', icon: ShoppingCart },
      { labelKey: 'Boutiques & dépôts', to: '/locations', icon: Building2 },
      { labelKey: 'Stock multi-dépôts', to: '/multi-depot-stock', icon: Grid3x3 },
      { labelKey: 'Transferts stock', to: '/stock-transfers', icon: ArrowLeftRight },
      { labelKey: 'nav.salesHistory', to: '/sales-history', icon: History },
      { labelKey: 'nav.statistics', to: '/statistics', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'Finance',
    items: [
      { labelKey: 'Caisse journalière', to: '/cash-register', icon: Banknote },
      { labelKey: 'Retours & remboursements', to: '/returns', icon: Undo2 },
      { labelKey: 'Crédit clients', to: '/customer-credits', icon: Wallet },
      { labelKey: 'Comptabilité', to: '/accounting', icon: Calculator },
      { labelKey: 'Déclaration TVA', to: '/vat-declaration', icon: Receipt },
      { labelKey: 'Taux de TVA', to: '/tax-rates', icon: Percent },
    ],
  },
  {
    titleKey: 'Marketing',
    items: [
      { labelKey: 'Promotions', to: '/promotions', icon: Tag },
      { labelKey: 'Fidélité client', to: '/loyalty', icon: Award },
    ],
  },
  {
    titleKey: 'Équipe',
    items: [
      { labelKey: 'Employés & caissiers', to: '/employees', icon: UserCog },
      { labelKey: 'Étiquettes & codes-barres', to: '/labels', icon: Printer },
      { labelKey: 'Reçus & impression', to: '/receipt-settings', icon: Receipt },
    ],
  },
  {
    titleKey: 'nav.communication',
    items: [
      { labelKey: 'nav.messages', to: '/messages', icon: MessageCircle },
    ],
  },
];

const bottomNavKeys: NavItem[] = [
  { labelKey: 'nav.profile', to: '/profile', icon: User },
  { labelKey: 'nav.settings', to: '/settings', icon: Settings },
  { labelKey: 'nav.guide', to: '/guide', icon: BookOpen },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const sections = user?.role === 'admin' ? adminSections : clientSections;

  const isActive = (to: string) => {
    const [path] = to.split('?');
    return location.pathname === path;
  };

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-0 lg:w-16 overflow-hidden lg:overflow-visible" : "w-64"
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <img src={speedworkLogo} alt="SpeedWork" className="h-9 w-auto shrink-0" />
          {!collapsed && <span className="font-bold text-lg tracking-tight text-sidebar-accent-foreground">SpeedWork</span>}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {sections.map((section, sIdx) => (
            <div key={section.titleKey}>
              {sIdx > 0 && <div className="my-2 mx-3 border-t border-sidebar-border" />}
              {!collapsed && (
                <p className="px-3 mb-1.5 mt-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {t(section.titleKey)}
                </p>
              )}
              {section.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.to)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
          {bottomNavKeys.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>

        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center shadow-sm hover:bg-secondary transition-colors"
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  );
}
