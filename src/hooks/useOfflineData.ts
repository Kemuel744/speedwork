// Hook for offline-capable data queries with automatic cache

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { putAll, getAll, putOne, deleteOne as deleteFromCache, setLastSync, type StoreName } from '@/lib/offlineDb';
import { queueMutation } from '@/lib/syncQueue';

interface UseOfflineDataOptions {
  table: StoreName;
  filterColumn?: string;
  filterValue?: string;
  orderBy?: string;
  ascending?: boolean;
  enabled?: boolean;
}

export function useOfflineData<T extends { id?: string }>({
  table,
  filterColumn,
  filterValue,
  orderBy = 'created_at',
  ascending = false,
  enabled = true,
}: UseOfflineDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);

    try {
      if (navigator.onLine) {
        // Fetch from server
        let query = (supabase as any).from(table).select('*');
        if (filterColumn && filterValue) {
          query = query.eq(filterColumn, filterValue);
        }
        query = query.order(orderBy, { ascending });

        const { data: serverData, error: serverError } = await query;

        if (serverError) throw serverError;

        // Cache locally
        await putAll(table, serverData);
        await setLastSync(table);
        setData(serverData as T[]);
      } else {
        // Read from cache
        const cached = await getAll<T>(table);
        // Apply client-side filter if needed
        let filtered = cached;
        if (filterColumn && filterValue) {
          filtered = cached.filter((item: any) => item[filterColumn] === filterValue);
        }
        // Sort
        filtered.sort((a: any, b: any) => {
          const aVal = a[orderBy] ?? '';
          const bVal = b[orderBy] ?? '';
          return ascending
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });
        setData(filtered);
      }
    } catch (err: any) {
      console.warn(`[Offline] Failed to fetch ${table}, falling back to cache:`, err.message);
      // Fallback to cache
      try {
        const cached = await getAll<T>(table);
        let filtered = cached;
        if (filterColumn && filterValue) {
          filtered = cached.filter((item: any) => item[filterColumn] === filterValue);
        }
        setData(filtered);
      } catch {
        setError('Impossible de charger les données');
      }
    } finally {
      setLoading(false);
    }
  }, [table, filterColumn, filterValue, orderBy, ascending, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for online/offline changes to refetch
  useEffect(() => {
    const handleOnline = () => fetchData();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData]);

  const offlineInsert = useCallback(
    async (item: Partial<T> & Record<string, any>) => {
      const id = item.id || crypto.randomUUID();
      const newItem = { ...item, id } as T & Record<string, any>;

      // Optimistically update UI
      setData(prev => [newItem, ...prev]);

      // Cache locally
      await putOne(table, newItem);

      if (navigator.onLine) {
        const { error } = await (supabase as any).from(table).insert(newItem);
        if (error) {
          console.error('[Offline] Insert failed, queuing:', error);
          await queueMutation(table, 'insert', newItem);
        }
      } else {
        await queueMutation(table, 'insert', newItem);
      }

      return newItem;
    },
    [table]
  );

  const offlineUpdate = useCallback(
    async (id: string, updates: Partial<T> & Record<string, any>) => {
      // Optimistically update UI
      setData(prev => prev.map(item => ((item as any).id === id ? { ...item, ...updates } : item)));

      // Update cache
      const existing = data.find((item: any) => item.id === id);
      if (existing) {
        await putOne(table, { ...existing, ...updates });
      }

      if (navigator.onLine) {
        const { error } = await (supabase as any).from(table).update(updates).eq('id', id);
        if (error) {
          console.error('[Offline] Update failed, queuing:', error);
          await queueMutation(table, 'update', updates, id);
        }
      } else {
        await queueMutation(table, 'update', updates, id);
      }
    },
    [table, data]
  );

  const offlineDelete = useCallback(
    async (id: string) => {
      // Optimistically update UI
      setData(prev => prev.filter((item: any) => item.id !== id));

      // Remove from cache
      await deleteFromCache(table, id);

      if (navigator.onLine) {
        const { error } = await (supabase.from(table) as any).delete().eq('id', id);
        if (error) {
          console.error('[Offline] Delete failed, queuing:', error);
          await queueMutation(table, 'delete', {}, id);
        }
      } else {
        await queueMutation(table, 'delete', {}, id);
      }
    },
    [table]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert: offlineInsert,
    update: offlineUpdate,
    remove: offlineDelete,
  };
}
