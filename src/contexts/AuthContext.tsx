import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: 'admin' | 'client') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('speedwork_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('speedwork_user', JSON.stringify(found));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  const register = useCallback(async (email: string, _password: string, name: string, role: 'admin' | 'client' = 'client') => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const newUser: User = { id: crypto.randomUUID(), email, name, role };
    setUser(newUser);
    localStorage.setItem('speedwork_user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('speedwork_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
