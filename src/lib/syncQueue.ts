// Offline sync queue - queues mutations when offline and replays when back online

import { supabase } from '@/integrations/supabase/client';
import { putOne, getAll, deleteOne } from './offlineDb';

export interface QueuedMutation {
  queueId: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  id?: string; // For update/delete
  createdAt: number;
  retries: number;
}

type SyncListener = (status: SyncStatus) => void;
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'pending';

let listeners: SyncListener[] = [];

export function onSyncStatusChange(fn: SyncListener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function notifyListeners(status: SyncStatus) {
  listeners.forEach(fn => fn(status));
}

function generateQueueId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function queueMutation(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, any>,
  id?: string
): Promise<void> {
  const mutation: QueuedMutation = {
    queueId: generateQueueId(),
    table,
    operation,
    data,
    id,
    createdAt: Date.now(),
    retries: 0,
  };
  await putOne('sync_queue', mutation);
  notifyListeners('pending');
}

export async function getPendingCount(): Promise<number> {
  const queue = await getAll<QueuedMutation>('sync_queue');
  return queue.length;
}

export async function syncAll(): Promise<{ success: number; failed: number }> {
  const queue = await getAll<QueuedMutation>('sync_queue');
  if (queue.length === 0) {
    notifyListeners('idle');
    return { success: 0, failed: 0 };
  }

  notifyListeners('syncing');
  
  // Sort by creation time
  queue.sort((a, b) => a.createdAt - b.createdAt);

  let success = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      await executeMutation(mutation);
      await deleteOne('sync_queue', mutation.queueId);
      success++;
    } catch (err) {
      console.error('[SyncQueue] Failed to sync mutation:', mutation, err);
      // Increment retry count
      mutation.retries++;
      if (mutation.retries >= 5) {
        // Give up after 5 retries
        await deleteOne('sync_queue', mutation.queueId);
        console.warn('[SyncQueue] Dropped mutation after 5 retries:', mutation);
      } else {
        await putOne('sync_queue', mutation);
      }
      failed++;
    }
  }

  notifyListeners(failed > 0 ? 'error' : 'idle');
  return { success, failed };
}

async function executeMutation(mutation: QueuedMutation): Promise<void> {
  const { table, operation, data, id } = mutation;

  // Type-safe table access via supabase - we use .from() with string
  switch (operation) {
    case 'insert': {
      const { error } = await (supabase as any).from(table).insert(data);
      if (error) throw error;
      break;
    }
    case 'update': {
      if (!id) throw new Error('Update requires an id');
      const { error } = await (supabase as any).from(table).update(data).eq('id', id);
      if (error) throw error;
      break;
    }
    case 'delete': {
      if (!id) throw new Error('Delete requires an id');
      const { error } = await (supabase as any).from(table).delete().eq('id', id);
      if (error) throw error;
      break;
    }
  }
}

// Auto-sync when coming back online
let autoSyncRegistered = false;

export function registerAutoSync() {
  if (autoSyncRegistered) return;
  autoSyncRegistered = true;

  window.addEventListener('online', () => {
    console.log('[SyncQueue] Back online, syncing...');
    syncAll();
  });

  // Also try to sync periodically when online
  setInterval(() => {
    if (navigator.onLine) {
      syncAll();
    }
  }, 30_000); // Every 30 seconds
}
