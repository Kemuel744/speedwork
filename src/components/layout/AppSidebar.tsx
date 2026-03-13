import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FileText, User, Settings,
  LogOut, ChevronLeft, Users, CreditCard, BarChart3, Bell, PieChart, MessageCircle, BookOpen, Newspaper,
  HardHat, ClipboardCheck, MapPin, TrendingUp, Briefcase, Timer, Calculator, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import speedworkLogo from '@/assets/logo.webp';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Documents', to: '/documents', icon: FileText },
      { label: 'Clients', to: '/clients', icon: Users },
    ],
  },
  {
    title: 'Terrain',
    items: [
      { label: 'Travailleurs', to: '/workers', icon: Users },
      { label: 'Équipes', to: '/teams', icon: HardHat },
      { label: 'Missions', to: '/missions', icon: Briefcase },
      { label: 'Carte missions', to: '/missions-map', icon: MapPin },
      { label: 'Tâches & Preuves', to: '/work-tasks', icon: ClipboardCheck },
      { label: 'Pointage', to: '/attendance', icon: Timer },
    ],
  },
  {
    title: 'Performance',
    items: [
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Productivité', to: '/productivity', icon: TrendingUp },
      { label: 'Fiabilité', to: '/reliability', icon: Shield },
      { label: 'Salaires', to: '/payroll', icon: Calculator },
      { label: 'Bilan Annuel', to: '/annual-review', icon: PieChart },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messagerie', to: '/messages', icon: MessageCircle },
      { label: 'Relances', to: '/reminders', icon: Bell },
      { label: 'Rapports', to: '/reports', icon: PieChart },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Gestion Clients', to: '/admin/clients', icon: Users },
      { label: 'Abonnements', to: '/admin/subscriptions', icon: CreditCard },
      { label: 'Blog', to: '/admin/blog', icon: Newspaper },
    ],
  },
];

const clientSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Mon espace', to: '/client', icon: LayoutDashboard },
      { label: 'Mon Dashboard', to: '/worker-dashboard', icon: HardHat },
      { label: 'Documents', to: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Terrain',
    items: [
      { label: 'Travailleurs', to: '/workers', icon: Users },
      { label: 'Équipes', to: '/teams', icon: HardHat },
      { label: 'Missions', to: '/missions', icon: Briefcase },
      { label: 'Tâches & Preuves', to: '/work-tasks', icon: ClipboardCheck },
      { label: 'Pointage', to: '/attendance', icon: Timer },
      { label: 'Salaires', to: '/payroll', icon: Calculator },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messagerie', to: '/messages', icon: MessageCircle },
      { label: 'Mon Équipe', to: '/team', icon: Users },
      { label: 'Rapports', to: '/reports', icon: PieChart },
      { label: 'Bilan Annuel', to: '/annual-review', icon: BarChart3 },
    ],
  },
];

const bottomNav: NavItem[] = [
  { label: 'Profil', to: '/profile', icon: User },
  { label: 'Paramètres', to: '/settings', icon: Settings },
  { label: 'Guide', to: '/guide', icon: BookOpen },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sections = user?.role === 'admin' ? adminSections : clientSections;

  const isActive = (to: string) => {
    const [path] = to.split('?');
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-0 lg:w-16 overflow-hidden lg:overflow-visible" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <img src={speedworkLogo} alt="SpeedWork" className="h-9 w-auto shrink-0" />
          {!collapsed && <span className="font-bold text-lg tracking-tight text-sidebar-accent-foreground">SpeedWork</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {sections.map((section, sIdx) => (
            <div key={section.title}>
              {sIdx > 0 && <div className="my-2 mx-3 border-t border-sidebar-border" />}
              {!collapsed && (
                <p className="px-3 mb-1.5 mt-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {section.title}
                </p>
              )}
              {section.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
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
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
          {bottomNav.map(item => (
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
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse button - desktop only */}
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
