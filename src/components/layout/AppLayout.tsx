import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from './AppSidebar';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      
      {/* Header */}
      <header className={cn(
        "fixed top-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-30 flex items-center px-4 lg:px-6 transition-all duration-300",
        collapsed ? "left-0 lg:left-16" : "left-0 lg:left-64"
      )}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{user.name.charAt(0)}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <Outlet />
      </main>
    </div>
  );
}
