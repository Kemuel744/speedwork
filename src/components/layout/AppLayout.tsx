import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaff } from '@/contexts/StaffContext';
import AppSidebar from './AppSidebar';
import ChatBot from '@/components/chat/ChatBot';
import NotificationBell from '@/components/NotificationBell';
import SyncStatusIndicator from '@/components/SyncStatus';
import LocationSwitcher from '@/components/layout/LocationSwitcher';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const { staff } = useStaff();
  // Sur mobile (<1024px) la sidebar est cachée par défaut (collapsed=true).
  // Sur desktop, elle est ouverte. Évite que la sidebar masque le contenu sur mobile au chargement.
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : true
  );

  // Resynchronise lors du redimensionnement (ex: rotation tablette)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  // Si un employé est connecté via PIN dans l'Espace employé,
  // il ne doit PAS pouvoir naviguer dans le reste du site (sidebar admin, etc.).
  // On le renvoie systématiquement vers /staff.
  if (staff) return <Navigate to="/staff" replace />;

  // Block non-admin users from accessing admin routes
  if (user.role !== 'admin' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      
      <header className={cn(
        "fixed top-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-30 flex items-center gap-2 px-3 sm:px-4 lg:px-6 transition-all duration-300",
        collapsed ? "left-0 lg:left-16" : "left-0 lg:left-64"
      )}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors shrink-0"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 min-w-0">
          <LocationSwitcher />
          <SyncStatusIndicator />
          <NotificationBell />
          <div className="text-right hidden sm:block min-w-0 max-w-[140px]">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">{user.name.charAt(0)}</span>
          </div>
        </div>
      </header>

      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <Outlet />
      </main>

      <ChatBot />
    </div>
  );
}
