import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
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
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', supabaseUser.id)
    .single();

  // Fetch role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', supabaseUser.id)
    .single();

  const role = (roleData?.role as 'admin' | 'client') || 'client';

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.company_name || supabaseUser.email || '',
    role,
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
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks with Supabase client
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user).then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
