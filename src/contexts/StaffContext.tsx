import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface StaffSession {
  employee_id: string;
  full_name: string;
  role: string;
  permissions: Record<string, any>;
  unlocked_at: number;
}

interface StaffContextType {
  staff: StaffSession | null;
  setStaff: (s: StaffSession | null) => void;
  lock: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);
const STORAGE_KEY = 'speedwork_staff_session';
// Auto-lock after 8 hours
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaffState] = useState<StaffSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StaffSession;
      if (Date.now() - parsed.unlocked_at > MAX_AGE_MS) return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const setStaff = useCallback((s: StaffSession | null) => {
    setStaffState(s);
    if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const lock = useCallback(() => {
    setStaffState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!staff) return;
    const remaining = MAX_AGE_MS - (Date.now() - staff.unlocked_at);
    if (remaining <= 0) { lock(); return; }
    const t = setTimeout(lock, remaining);
    return () => clearTimeout(t);
  }, [staff, lock]);

  return (
    <StaffContext.Provider value={{ staff, setStaff, lock }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used inside StaffProvider');
  return ctx;
}