import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  isWorker: boolean;
  company?: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(supabaseUser: SupabaseUser): Promise<UserProfile | null> {
  // Fetch profile, role, and worker status in parallel
  const [profileRes, roleRes, workerRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', supabaseUser.id).single(),
    supabase.from('user_roles').select('role').eq('user_id', supabaseUser.id).single(),
    supabase.from('workers').select('id').eq('linked_user_id', supabaseUser.id).limit(1),
  ]);

  const profile = profileRes.data;
  const role = (roleRes.data?.role as 'admin' | 'client') || 'client';
  const isWorker = (workerRes.data && workerRes.data.length > 0) || false;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.company_name || supabaseUser.email || '',
    role,
    isWorker,
    company: profile?.company_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let lastUserId: string | null = null;
    let cancelled = false;

    // Single source of truth: onAuthStateChange fires INITIAL_SESSION on mount,
    // so we don't need a separate getSession() call (which caused duplicate
    // profile fetches and rate-limit 429 loops).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (cancelled) return;
      setSession(newSession);

      const newUserId = newSession?.user?.id ?? null;

      // Skip TOKEN_REFRESHED events for the same user — no need to refetch profile
      if (event === 'TOKEN_REFRESHED' && newUserId === lastUserId) {
        return;
      }

      if (!newSession?.user) {
        lastUserId = null;
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Only refetch profile when user identity actually changes
      if (newUserId === lastUserId && event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') {
        return;
      }

      lastUserId = newUserId;
      // Defer to avoid deadlocks with Supabase client
      setTimeout(async () => {
        if (cancelled) return;
        const profile = await fetchUserProfile(newSession.user);
        if (cancelled) return;
        setUser(profile);
        setIsLoading(false);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { company_name: name },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // If email confirmation is required, user won't have a session yet
    if (data.user && !data.session) {
      return { success: true, needsConfirmation: true };
    }

    // Update profile with company name if session exists
    if (data.user) {
      await supabase.from('profiles').update({ company_name: name }).eq('user_id', data.user.id);
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
