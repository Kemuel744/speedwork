import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppLocation {
  id: string;
  name: string;
  location_type: 'shop' | 'warehouse';
  address: string;
  city: string;
  phone: string;
  manager_name: string;
  is_default: boolean;
  is_active: boolean;
  notes: string;
}

interface Ctx {
  locations: AppLocation[];
  currentLocationId: string | null;
  setCurrentLocationId: (id: string | null) => void;
  currentLocation: AppLocation | null;
  refresh: () => Promise<void>;
}

const LocationContext = createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = 'speedwork_current_location';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [currentLocationId, setCurrentId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const refresh = useCallback(async () => {
    if (!user) return setLocations([]);
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');
    if (data) setLocations(data as AppLocation[]);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-select default if no current selection
  useEffect(() => {
    if (!currentLocationId && locations.length > 0) {
      const def = locations.find(l => l.is_default) || locations[0];
      setCurrentId(def.id);
    }
  }, [locations, currentLocationId]);

  const setCurrentLocationId = (id: string | null) => {
    setCurrentId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const currentLocation = locations.find(l => l.id === currentLocationId) || null;

  return (
    <LocationContext.Provider value={{ locations, currentLocationId, setCurrentLocationId, currentLocation, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocations must be used within LocationProvider');
  return ctx;
}
