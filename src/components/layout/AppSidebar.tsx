import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FileText, FilePlus, FileCheck, User, Settings,
  LogOut, Zap, ChevronLeft, Menu, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import speedworkLogo from '@/assets/logo.png';

const adminNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Factures', to: '/documents?type=invoice', icon: FileText },
  { label: 'Devis', to: '/documents?type=quote', icon: FileCheck },
  { label: 'Nouvelle Facture', to: '/create/invoice', icon: FilePlus },
  { label: 'Nouveau Devis', to: '/create/quote', icon: FilePlus },
];

const clientNav = [
  { label: 'Mon espace', to: '/client', icon: LayoutDashboard },
  { label: 'Mes Factures', to: '/documents?type=invoice', icon: FileText },
  { label: 'Mes Devis', to: '/documents?type=quote', icon: FileCheck },
];

const bottomNav = [
  { label: 'Profil', to: '/profile', icon: User },
  { label: 'Paramètres', to: '/settings', icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = user?.role === 'admin' ? adminNav : clientNav;

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
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!collapsed && <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">Menu</p>}
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border px-2 py-4 space-y-1">
          {bottomNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
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
