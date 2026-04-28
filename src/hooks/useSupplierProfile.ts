import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SupplierProfile {
  is_public_supplier: boolean;
  supplier_categories: string[];
  supplier_description: string;
  supplier_delivery_zones: string[];
  supplier_min_order: number;
  supplier_rating: number;
  supplier_orders_count: number;
}

export function useSupplierProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('is_public_supplier,supplier_categories,supplier_description,supplier_delivery_zones,supplier_min_order,supplier_rating,supplier_orders_count')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setProfile(data as SupplierProfile);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const update = async (patch: Partial<SupplierProfile>) => {
    if (!user) return { error: 'no-user' };
    const { error } = await supabase
      .from('profiles')
      .update(patch as never)
      .eq('user_id', user.id);
    if (!error) await fetchProfile();
    return { error: error?.message };
  };

  return { profile, loading, refresh: fetchProfile, update, isPublicSupplier: !!profile?.is_public_supplier };
}